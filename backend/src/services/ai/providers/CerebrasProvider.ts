/**
 * Cerebras AI Provider
 * Ultra-fast inference powered by Wafer-Scale Engine
 * API: https://inference-docs.cerebras.ai/
 */

import {
  AIProvider,
  AIRequest,
  AIResponse,
  AIError,
  AIErrorCode,
  AITaskType,
  AI_DEFAULTS,
  IAIProvider,
} from "../types";
import { logger } from "../logger";

/**
 * Configuration for Cerebras provider
 */
interface CerebrasConfig {
  apiKeys: string[];
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
}

/**
 * Available Cerebras models with metadata
 */
const CEREBRAS_MODELS = {
  "llama3.1-8b": { tokens: 8192, speed: "fast" },
  "llama-3.3-70b": { tokens: 8192, speed: "medium" },
  "gpt-oss-120b": { tokens: 8192, speed: "slow" },
  "qwen-3-32b": { tokens: 32768, speed: "medium" },
  "qwen-3-235b-a22b-instruct-2507": { tokens: 32768, speed: "slow" },
  "qwen-3-235b-a22b-thinking-2507": { tokens: 32768, speed: "slow" },
  "zai-glm-4.6": { tokens: 8192, speed: "medium" },
} as const;

export class CerebrasProvider implements IAIProvider {
  private readonly apiKeys: string[];
  private currentKeyIndex: number = 0;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly timeout: number;
  private readonly availableModels: readonly string[];

  constructor(config: CerebrasConfig) {
    if (!config.apiKeys || config.apiKeys.length === 0) {
      throw new Error("Cerebras API keys are required");
    }

    this.apiKeys = config.apiKeys;
    this.baseUrl = config.baseUrl || "https://api.cerebras.ai/v1";
    this.defaultModel = config.defaultModel || "llama-3.3-70b";
    this.timeout = config.timeout || AI_DEFAULTS.TIMEOUT_MS;
    this.availableModels = Object.keys(CEREBRAS_MODELS);

    // Validate default model exists
    if (!this.availableModels.includes(this.defaultModel)) {
      logger.warn("Invalid default model, falling back to llama-3.3-70b", {
        providedModel: this.defaultModel,
      });
      this.defaultModel = "llama-3.3-70b";
    }
  }

  /**
   * Get next API key using round-robin
   */
  private getNextApiKey(): string {
    const key = this.apiKeys[this.currentKeyIndex];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    return key;
  }

  /**
   * Generate content using Cerebras API
   */
  async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const apiKey = this.getNextApiKey();

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages: [
            {
              role: "system",
              content: this.getSystemPrompt(request.taskType),
            },
            {
              role: "user",
              content: request.prompt,
            },
          ],
          max_tokens: request.maxTokens || AI_DEFAULTS.MAX_TOKENS,
          temperature: request.temperature || AI_DEFAULTS.TEMPERATURE,
          top_p: 0.9,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        throw this.createError(
          response.status,
          errorData.message || response.statusText
        );
      }

      const data = await response.json() as any;
      const latencyMs = Date.now() - startTime;

      // Validate response structure
      if (!data.choices?.[0]?.message?.content) {
        throw this.createError(
          500,
          "Invalid response structure from Cerebras API"
        );
      }

      logger.info("Cerebras generation successful", {
        model: this.defaultModel,
        latencyMs,
        tokensUsed: data.usage?.total_tokens,
      });

      return {
        content: data.choices[0].message.content,
        provider: AIProvider.CEREBRAS,
        model: this.defaultModel,
        tokensUsed: data.usage?.total_tokens,
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      // Handle abort/timeout
      if (error instanceof Error && error.name === "AbortError") {
        logger.error("Cerebras request timeout", {
          latencyMs,
          timeout: this.timeout,
        });
        throw {
          provider: AIProvider.CEREBRAS,
          error: `Request timeout after ${this.timeout}ms`,
          code: AIErrorCode.TIMEOUT,
          retryable: true,
        } as AIError;
      }

      // Handle AIError (already formatted)
      if (this.isAIError(error)) {
        logger.error("Cerebras generation failed", {
          error: error.error,
          code: error.code,
          latencyMs,
        });
        throw error;
      }

      // Handle generic errors
      logger.error("Cerebras generation failed", {
        error: error instanceof Error ? error.message : String(error),
        latencyMs,
      });

      throw {
        provider: AIProvider.CEREBRAS,
        error: error instanceof Error ? error.message : String(error),
        code: AIErrorCode.PROVIDER_ERROR,
        retryable: true,
      } as AIError;
    }
  }

  /**
   * Create a properly formatted AIError based on HTTP status
   */
  private createError(status: number, message: string): AIError {
    let code: AIErrorCode;
    let retryable = false;

    switch (status) {
      case 401:
      case 403:
        code = AIErrorCode.INVALID_API_KEY;
        break;
      case 429:
        code = AIErrorCode.RATE_LIMIT;
        retryable = true;
        break;
      case 400:
        code = AIErrorCode.INVALID_REQUEST;
        break;
      case 451:
        code = AIErrorCode.CONTENT_FILTER;
        break;
      default:
        code = AIErrorCode.PROVIDER_ERROR;
        retryable = status >= 500;
    }

    return {
      provider: AIProvider.CEREBRAS,
      error: message,
      code,
      retryable,
    };
  }

  /**
   * Type guard for AIError
   */
  private isAIError(error: unknown): error is AIError {
    return (
      typeof error === "object" &&
      error !== null &&
      "provider" in error &&
      "error" in error &&
      "retryable" in error
    );
  }

  /**
   * Get system prompt based on task type
   * Uses AITaskType enum for type safety
   */
  private getSystemPrompt(taskType: AITaskType): string {
    const prompts: Record<string, string> = {
      [AITaskType.AD_COPY]: `You are a creative advertising specialist.
Write persuasive ad copy that captures attention and motivates action.
Keep it concise, benefit-focused, and audience-appropriate.`,

      [AITaskType.HEADLINE]: `You are a headline writing expert.
Create attention-grabbing headlines that are clear, compelling, and under 60 characters.
Focus on benefits and emotional triggers.`,

      [AITaskType.CTA_BUTTON]: `You are a conversion optimization specialist.
Create short, action-oriented button text (2-4 words) that drives clicks.
Use strong verbs and create urgency when appropriate.`,

      [AITaskType.CHANNEL_DESCRIPTION]: `You are a Telegram channel marketing expert.
Write engaging channel descriptions that clearly communicate value and attract subscribers.
Be concise and highlight unique benefits.`,

      [AITaskType.TARGETING_SUGGESTIONS]: `You are a digital marketing strategist.
Analyze the content and suggest optimal targeting parameters including demographics, interests, and behaviors.`,

      [AITaskType.CONTENT_IMPROVEMENT]: `You are a content optimization expert.
Review and improve the provided content for clarity, engagement, and conversion potential.
Maintain the original intent while enhancing effectiveness.`,

      [AITaskType.TRANSLATION]: `You are a professional translator specializing in marketing content.
Translate while preserving tone, style, and persuasive elements.
Adapt cultural references when necessary.`,
    };

    return (
      prompts[taskType] ||
      "You are a helpful AI assistant specialized in advertising and marketing."
    );
  }

  /**
   * Check if provider is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const apiKey = this.apiKeys[0];
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for health check

      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      logger.error("Cerebras health check failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get available models with metadata
   */
  getAvailableModels(): readonly string[] {
    return this.availableModels;
  }

  /**
   * Get model metadata
   */
  getModelInfo(model: string): { tokens: number; speed: string } | null {
    return CEREBRAS_MODELS[model as keyof typeof CEREBRAS_MODELS] || null;
  }

  /**
   * Get current default model
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }
}
