/**
 * Campaign AI Service
 * High-level service for campaign content generation
 */

import { getAIService } from "./AIService";
import { PromptBuilder } from "./prompts";
import {
  AITaskType,
  AIRequest,
  AIResponse,
  CampaignContext,
  ContentGenerationOptions,
  AIProvider,
} from "./types";
import { logger } from "./logger";

export class CampaignAIService {
  private aiService = getAIService();



  /**
   * Generate multiple headline options
   */
  async generateHeadlines(
    topic: string,
    context: CampaignContext,
    count: number = 5
  ): Promise<string[]> {
    const prompt = PromptBuilder.buildHeadlinePrompt(topic, context, count);

    const request: AIRequest = {
      taskType: AITaskType.HEADLINE,
      prompt,
      context,
      maxTokens: 500,
      temperature: 0.9,
    };

    try {
      const response = await this.aiService.generate(request);

      // Parse numbered list
      const headlines = response.content
        .split("\n")
        .filter((line) => line.trim().match(/^\d+\./))
        .map((line) => line.replace(/^\d+\.\s*/, "").trim())
        .filter((line) => line.length > 0);

      return headlines;
    } catch (error) {
      logger.error("Headline generation failed", { error });
      throw error;
    }
  }

  /**
   * Generate CTA button text options
   */
  async generateCTAs(
    campaignGoal: string,
    context: CampaignContext,
    count: number = 10
  ): Promise<string[]> {
    const prompt = PromptBuilder.buildCTAPrompt(campaignGoal, count);

    const request: AIRequest = {
      taskType: AITaskType.CTA_BUTTON,
      prompt,
      context,
      maxTokens: 300,
      temperature: 0.8,
    };

    try {
      const response = await this.aiService.generate(request);

      // Parse numbered list
      const ctas = response.content
        .split("\n")
        .filter((line) => line.trim().match(/^\d+\./))
        .map((line) => line.replace(/^\d+\.\s*/, "").trim())
        .filter((line) => line.length > 0 && line.length <= 20);

      return ctas;
    } catch (error) {
      logger.error("CTA generation failed", { error });
      throw error;
    }
  }

  /**
   * Get targeting suggestions based on campaign description
   */
  async getTargetingSuggestions(
    campaignDescription: string,
    existingContent?: string
  ): Promise<AIResponse> {
    const prompt = PromptBuilder.buildTargetingPrompt(
      campaignDescription,
      existingContent
    );

    const request: AIRequest = {
      taskType: AITaskType.TARGETING_SUGGESTIONS,
      prompt,
      maxTokens: 1000,
      temperature: 0.5,
    };

    try {
      const response = await this.aiService.generate(request);
      return response;
    } catch (error) {
      logger.error("Targeting suggestions failed", { error });
      throw error;
    }
  }

  /**
   * Improve existing content
   */
  async improveContent(
    originalContent: string,
    improvementGoals: string[]
  ): Promise<AIResponse> {
    const prompt = PromptBuilder.buildImprovementPrompt(
      originalContent,
      improvementGoals
    );

    const request: AIRequest = {
      taskType: AITaskType.CONTENT_IMPROVEMENT,
      prompt,
      maxTokens: 1500,
      temperature: 0.7,
    };

    try {
      const response = await this.aiService.generate(request);
      return response;
    } catch (error) {
      logger.error("Content improvement failed", { error });
      throw error;
    }
  }

  /**
   * Translate content to another language
   */
  async translateContent(
    content: string,
    targetLanguage: string,
    context: CampaignContext
  ): Promise<AIResponse> {
    const prompt = PromptBuilder.buildTranslationPrompt(
      content,
      targetLanguage
    );

    const request: AIRequest = {
      taskType: AITaskType.TRANSLATION,
      prompt,
      context,
      maxTokens: 1500,
      temperature: 0.3, // Lower temperature for more accurate translation
    };

    try {
      const response = await this.aiService.generate(request);
      return response;
    } catch (error) {
      logger.error("Translation failed", { error });
      throw error;
    }
  }

  /**
   * Generate channel description
   */
  async generateChannelDescription(
    channelName: string,
    channelTopic: string,
    postingFrequency: string,
    context: CampaignContext
  ): Promise<string> {
    const prompt = PromptBuilder.buildChannelDescriptionPrompt(
      channelName,
      channelTopic,
      postingFrequency
    );

    const request: AIRequest = {
      taskType: AITaskType.CHANNEL_DESCRIPTION,
      prompt,
      context,
      maxTokens: 300,
      temperature: 0.8,
    };

    try {
      const response = await this.aiService.generate(request);
      return response.content.trim();
    } catch (error) {
      logger.error("Channel description generation failed", { error });
      throw error;
    }
  }

  /**
   * Generate content variations for A/B testing
   */
  async generateVariations(
    baseContent: string,
    variationCount: number,
    context: CampaignContext
  ): Promise<string[]> {
    const prompt = PromptBuilder.buildVariationsPrompt(
      baseContent,
      variationCount,
      context
    );

    const request: AIRequest = {
      taskType: AITaskType.AD_COPY,
      prompt,
      context,
      maxTokens: 2000,
      temperature: 0.9,
    };

    try {
      const response = await this.aiService.generate(request);

      // Parse variations
      const variations = response.content
        .split(/Variation \d+:/i)
        .slice(1)
        .map((v) => v.trim())
        .filter((v) => v.length > 0);

      return variations;
    } catch (error) {
      logger.error("Variation generation failed", { error });
      throw error;
    }
  }



  /**
   * Stream content generation (for real-time UI updates)
   */
  async *streamContent(
    request: AIRequest
  ): AsyncGenerator<string, void, unknown> {
    try {
      for await (const chunk of this.aiService.generateStream(request)) {
        yield chunk;
      }
    } catch (error) {
      logger.error("Content streaming failed", { error });
      throw error;
    }
  }

  /**
   * Get AI service health status
   */
  getHealthStatus() {
    return this.aiService.getHealthStatus();
  }

  /**
   * Get available AI providers
   */
  getAvailableProviders() {
    return this.aiService.getAvailableProviders();
  }
}

// Singleton instance
let campaignAIServiceInstance: CampaignAIService | null = null;

export function getCampaignAIService(): CampaignAIService {
  if (!campaignAIServiceInstance) {
    campaignAIServiceInstance = new CampaignAIService();
  }
  return campaignAIServiceInstance;
}
