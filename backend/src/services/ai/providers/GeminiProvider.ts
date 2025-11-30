/**
 * Google Gemini AI Provider
 * Using @google/genai SDK for Gemini 2.0+
 * API: https://ai.google.dev/gemini-api/docs
 */

import { GoogleGenAI } from "@google/genai";
import { AIProvider, AIRequest, AIResponse, AIError } from "../types";
import { logger } from "../logger";

export class GeminiProvider {
  private apiKeys: string[];
  private currentKeyIndex: number = 0;
  private defaultModel: string = "gemini-2.0-flash-exp";
  private availableModels: string[] = [
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
  ];

  constructor(apiKeys: string[]) {
    if (!apiKeys || apiKeys.length === 0) {
      throw new Error("Gemini API keys are required");
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
   * Get Gemini client instance
   */
  private getClient(apiKey: string): GoogleGenAI {
    return new GoogleGenAI({ apiKey });
  }

  /**
   * Generate content using Gemini API
   */
  async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const apiKey = this.getNextApiKey();

    try {
      const ai = this.getClient(apiKey);

      // Build prompt with system instruction
      const systemPrompt = this.getSystemPrompt(request.taskType);
      const fullPrompt = `${systemPrompt}\n\n${request.prompt}`;

      // Add context if provided
      let contextualPrompt = fullPrompt;
      if (request.context) {
        const contextStr = Object.entries(request.context)
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join("\n");
        contextualPrompt = `Context:\n${contextStr}\n\n${fullPrompt}`;
      }

      const response = await ai.models.generateContent({
        model: this.defaultModel,
        contents: contextualPrompt,
        config: {
          temperature: request.temperature || 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: request.maxTokens || 1000,
        },
      });

      const latencyMs = Date.now() - startTime;

      logger.info("Gemini generation successful", {
        model: this.defaultModel,
        latencyMs,
        tokensUsed: response.usageMetadata?.totalTokenCount,
      });

      return {
        content: response.text || "",
        provider: AIProvider.GEMINI,
        model: this.defaultModel,
        tokensUsed: response.usageMetadata?.totalTokenCount,
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      logger.error("Gemini generation failed", {
        error: error instanceof Error ? error.message : String(error),
        latencyMs,
      });

      throw {
        provider: AIProvider.GEMINI,
        error: error instanceof Error ? error.message : String(error),
        retryable: true,
      } as AIError;
    }
  }

  /**
   * Generate content with streaming (for real-time UI updates)
   */
  async *generateStream(
    request: AIRequest
  ): AsyncGenerator<string, void, unknown> {
    const apiKey = this.getNextApiKey();
    const ai = this.getClient(apiKey);

    const systemPrompt = this.getSystemPrompt(request.taskType);
    const fullPrompt = `${systemPrompt}\n\n${request.prompt}`;

    try {
      const response = await ai.models.generateContentStream({
        model: this.defaultModel,
        contents: fullPrompt,
        config: {
          temperature: request.temperature || 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: request.maxTokens || 1000,
        },
      });

      for await (const chunk of response) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error) {
      logger.error("Gemini streaming failed", { error });
      throw error;
    }
  }

  /**
   * Get system prompt based on task type
   */
  private getSystemPrompt(taskType: string): string {
    const prompts: Record<string, string> = {
      ad_copy: `You are a creative advertising specialist.
Your role: Write persuasive ad copy that captures attention.
Guidelines:
- Hook readers in first 5 words
- Highlight unique value proposition
- Use power words and active voice
- Create urgency when appropriate
- Keep sentences short and punchy
- End with clear next step`,

      headline: `You are a headline writing expert.
Your role: Create attention-grabbing headlines.
Guidelines:
- Maximum 60 characters
- Use numbers when relevant
- Create curiosity or urgency
- Be specific and clear
- Avoid clickbait
- Test multiple variations`,

      cta_button: `You are a conversion optimization specialist.
Your role: Create action-oriented button text.
Guidelines:
- 2-4 words maximum
- Start with strong verb
- Create urgency or value
- Be specific about action
- Examples: "Get Started", "Claim Offer", "Learn More"`,

      channel_description: `You are a Telegram channel marketing expert.
Your role: Write engaging channel descriptions.
Guidelines:
- Clearly state channel purpose
- Highlight unique benefits
- Include posting frequency
- Use keywords for discovery
- Keep under 150 characters
- Add relevant emojis`,

      targeting_suggestions: `You are a digital marketing strategist.
Your role: Analyze content and suggest targeting parameters.
Guidelines:
- Identify target demographics
- Suggest relevant categories
- Recommend engagement metrics
- Consider geographic targeting
- Analyze language and tone
- Provide reasoning for suggestions`,

      content_improvement: `You are a content optimization expert.
Your role: Improve content for better performance.
Guidelines:
- Enhance clarity and readability
- Strengthen call-to-action
- Improve emotional appeal
- Optimize length and structure
- Maintain original intent
- Explain improvements made`,

      translation: `You are a professional marketing translator.
Your role: Translate while preserving persuasive power.
Guidelines:
- Maintain tone and style
- Adapt cultural references
- Preserve emotional impact
- Keep formatting intact
- Optimize for target audience
- Note any adaptation decisions`,
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
      const ai = this.getClient(apiKey);
      const response = await ai.models.generateContent({
        model: this.defaultModel,
        contents: "test",
      });
      return !!response.text;
    } catch (error) {
      logger.error("Gemini health check failed", { error });
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
