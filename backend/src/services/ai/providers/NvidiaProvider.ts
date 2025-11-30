/**
 * NVIDIA NIM AI Provider
 * OpenAI-compatible API for NVIDIA models
 * API: https://docs.api.nvidia.com/nim/reference/llm-apis
 */

import { AIProvider, AIRequest, AIResponse, AIError } from "../types";
import { logger } from "../logger";

export class NvidiaProvider {
  private apiKeys: string[];
  private currentKeyIndex: number = 0;
  private baseUrl: string = "https://integrate.api.nvidia.com/v1";
  private defaultModel: string = "meta/llama-3.1-70b-instruct";
  private availableModels: string[] = [
    "meta/llama-3.1-405b-instruct",
    "meta/llama-3.1-70b-instruct",
    "meta/llama-3.1-8b-instruct",
    "mistralai/mistral-large-2-instruct",
    "google/gemma-2-27b-it",
  ];

  constructor(apiKeys: string[]) {
    if (!apiKeys || apiKeys.length === 0) {
      throw new Error("NVIDIA API keys are required");
    }
    this.apiKeys = apiKeys;
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
   * Generate content using NVIDIA NIM API
   */
  async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const apiKey = this.getNextApiKey();

    try {
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
          max_tokens: request.maxTokens || 1000,
          temperature: request.temperature || 0.7,
          top_p: 0.9,
          stream: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json() as any;
        throw new Error(
          `NVIDIA API error: ${error.message || response.statusText}`
        );
      }

      const data = await response.json() as any;
      const latencyMs = Date.now() - startTime;

      logger.info("NVIDIA generation successful", {
        model: this.defaultModel,
        latencyMs,
        tokensUsed: data.usage?.total_tokens,
      });

      return {
        content: data.choices[0].message.content,
        provider: AIProvider.NVIDIA,
        model: this.defaultModel,
        tokensUsed: data.usage?.total_tokens,
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      logger.error("NVIDIA generation failed", {
        error: error instanceof Error ? error.message : String(error),
        latencyMs,
      });

      throw {
        provider: AIProvider.NVIDIA,
        error: error instanceof Error ? error.message : String(error),
        retryable: true,
      } as AIError;
    }
  }

  /**
   * Generate content with streaming
   */
  async *generateStream(
    request: AIRequest
  ): AsyncGenerator<string, void, unknown> {
    const apiKey = this.getNextApiKey();

    try {
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
          max_tokens: request.maxTokens || 1000,
          temperature: request.temperature || 0.7,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`NVIDIA API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) yield content;
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      logger.error("NVIDIA streaming failed", { error });
      throw error;
    }
  }

  /**
   * Get system prompt based on task type
   */
  private getSystemPrompt(taskType: string): string {
    const prompts: Record<string, string> = {
      ad_copy: `You are a creative advertising specialist.
Write persuasive ad copy that drives action.
Focus on: attention-grabbing hooks, benefit-driven messaging, emotional triggers, clear next steps.`,

      headline: `You are a headline writing expert.
Create attention-grabbing headlines under 60 characters.
Focus on: curiosity, urgency, specificity, clarity, emotional appeal.`,

      cta_button: `You are a conversion optimization specialist.
Create short, action-oriented button text (2-4 words).
Focus on: strong verbs, urgency, value, specificity.`,

      channel_description: `You are a Telegram channel marketing expert.
Write engaging channel descriptions that attract subscribers.
Focus on: clear value, unique benefits, posting frequency, relevant keywords.`,

      targeting_suggestions: `You are a digital marketing strategist.
Analyze content and suggest optimal targeting parameters.
Focus on: demographics, interests, behaviors, geographic targeting, engagement metrics.`,

      content_improvement: `You are a content optimization expert.
Improve content for better performance while maintaining intent.
Focus on: clarity, engagement, conversion potential, readability, emotional appeal.`,

      translation: `You are a professional marketing translator.
Translate while preserving persuasive power and cultural relevance.
Focus on: tone preservation, cultural adaptation, emotional impact, formatting.`,
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
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      logger.error("NVIDIA health check failed", { error });
      return false;
    }
  }

  /**
   * Get available models
   */
  getAvailableModels(): string[] {
    return this.availableModels;
  }
}
