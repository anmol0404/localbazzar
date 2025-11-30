/**
 * Unified AI Service
 * Orchestrates multiple AI providers with round-robin, failover, and queue management
 */

import { CerebrasProvider } from "./providers/CerebrasProvider";
import { GeminiProvider } from "./providers/GeminiProvider";
import { NvidiaProvider } from "./providers/NvidiaProvider";
import {
  AIProvider,
  AIRequest,
  AIResponse,
  AIError,
  ProviderHealth,
  IAIProvider,
} from "./types";
import { logger } from "./logger";

export class AIService {
  private providers: Map<AIProvider, IAIProvider> = new Map();
  private providerHealth: Map<AIProvider, ProviderHealth> = new Map();
  private providerOrder: AIProvider[] = [
    AIProvider.CEREBRAS, // Default: Fastest
    AIProvider.GEMINI, // Fallback 1: Most capable
    AIProvider.NVIDIA, // Fallback 2: Most reliable
  ];
  private currentProviderIndex: number = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeProviders();
    this.startHealthChecks();
  }

  /**
   * Initialize all AI providers from environment variables
   */
  private initializeProviders(): void {
    // Cerebras
    const cerebrasKeys = this.parseApiKeys(process.env.CEREBRAS_API_KEYS);
    if (cerebrasKeys.length > 0) {
      try {
        this.providers.set(
          AIProvider.CEREBRAS,
          new CerebrasProvider({
            apiKeys: cerebrasKeys,
            defaultModel: "llama-3.3-70b",
            timeout: 30000,
          })
        );
        this.providerHealth.set(AIProvider.CEREBRAS, {
          provider: AIProvider.CEREBRAS,
          healthy: true,
          lastCheck: new Date(),
          consecutiveFailures: 0,
          averageLatency: 0,
        });
        logger.info("Cerebras provider initialized", {
          keyCount: cerebrasKeys.length,
        });
      } catch (error) {
        logger.error("Failed to initialize Cerebras", { error });
      }
    }

    // Gemini
    const geminiKeys = this.parseApiKeys(process.env.GEMINI_API_KEYS);
    if (geminiKeys.length > 0) {
      try {
        this.providers.set(AIProvider.GEMINI, new GeminiProvider(geminiKeys));
        this.providerHealth.set(AIProvider.GEMINI, {
          provider: AIProvider.GEMINI,
          healthy: true,
          lastCheck: new Date(),
          consecutiveFailures: 0,
          averageLatency: 0,
        });
        logger.info("Gemini provider initialized", {
          keyCount: geminiKeys.length,
        });
      } catch (error) {
        logger.error("Failed to initialize Gemini", { error });
      }
    }

    // NVIDIA
    const nvidiaKeys = this.parseApiKeys(process.env.NVIDIA_API_KEYS);
    if (nvidiaKeys.length > 0) {
      try {
        this.providers.set(AIProvider.NVIDIA, new NvidiaProvider(nvidiaKeys));
        this.providerHealth.set(AIProvider.NVIDIA, {
          provider: AIProvider.NVIDIA,
          healthy: true,
          lastCheck: new Date(),
          consecutiveFailures: 0,
          averageLatency: 0,
        });
        logger.info("NVIDIA provider initialized", {
          keyCount: nvidiaKeys.length,
        });
      } catch (error) {
        logger.error("Failed to initialize NVIDIA", { error });
      }
    }

    if (this.providers.size === 0) {
      logger.warn("No AI providers initialized - check environment variables");
    }
  }

  /**
   * Parse space-separated API keys from environment variable
   */
  private parseApiKeys(envValue: string | undefined): string[] {
    if (!envValue) return [];
    return envValue
      .split(" ")
      .map((key) => key.trim())
      .filter((key) => key.length > 0);
  }

  /**
   * Generate content with automatic failover
   */
  async generate(request: AIRequest): Promise<AIResponse> {
    const preferredProvider =
      request.preferredProvider || this.getNextProvider();
    const providers = this.getProviderFallbackOrder(preferredProvider);

    let lastError: AIError | null = null;

    for (const providerName of providers) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;

      const health = this.providerHealth.get(providerName);
      if (health && !health.healthy) {
        logger.info("Skipping unhealthy provider", { provider: providerName });
        continue;
      }

      try {
        logger.info("Attempting generation", { provider: providerName });
        const response = await provider.generate(request);

        // Update health metrics
        this.updateHealthMetrics(providerName, true, response.latencyMs);

        return response;
      } catch (error) {
        lastError = error as AIError;
        logger.warn("Provider failed, trying next", {
          provider: providerName,
          error: lastError.error,
        });

        // Update health metrics
        this.updateHealthMetrics(providerName, false, 0);
      }
    }

    // All providers failed
    throw new Error(
      `All AI providers failed. Last error: ${lastError?.error || "Unknown"}`
    );
  }

  /**
   * Generate content with streaming support
   */
  async *generateStream(
    request: AIRequest
  ): AsyncGenerator<string, void, unknown> {
    const preferredProvider = request.preferredProvider || AIProvider.GEMINI;
    const provider = this.providers.get(preferredProvider);

    if (!provider || !provider.generateStream) {
      throw new Error(`Streaming not supported for ${preferredProvider}`);
    }

    try {
      for await (const chunk of provider.generateStream(request)) {
        yield chunk;
      }
    } catch (error) {
      logger.error("Streaming failed", { provider: preferredProvider, error });
      throw error;
    }
  }

  /**
   * Get next provider using round-robin
   */
  private getNextProvider(): AIProvider {
    const availableProviders = Array.from(this.providers.keys()).filter(
      (p) => this.providerHealth.get(p)?.healthy !== false
    );

    if (availableProviders.length === 0) {
      // All providers unhealthy, try first available
      return this.providerOrder[0];
    }

    const provider =
      availableProviders[this.currentProviderIndex % availableProviders.length];
    this.currentProviderIndex++;

    return provider;
  }

  /**
   * Get provider fallback order
   */
  private getProviderFallbackOrder(preferred: AIProvider): AIProvider[] {
    const order = [preferred];
    for (const provider of this.providerOrder) {
      if (provider !== preferred && this.providers.has(provider)) {
        order.push(provider);
      }
    }
    return order;
  }

  /**
   * Update provider health metrics
   */
  private updateHealthMetrics(
    provider: AIProvider,
    success: boolean,
    latency: number
  ): void {
    const health = this.providerHealth.get(provider);
    if (!health) return;

    if (success) {
      health.consecutiveFailures = 0;
      health.healthy = true;
      health.averageLatency = health.averageLatency * 0.8 + latency * 0.2; // Exponential moving average
    } else {
      health.consecutiveFailures++;
      if (health.consecutiveFailures >= 3) {
        health.healthy = false;
        logger.warn("Provider marked as unhealthy", { provider });
      }
    }

    health.lastCheck = new Date();
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    // Check health every 5 minutes
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 5 * 60 * 1000);
  }

  /**
   * Perform health checks on all providers
   */
  private async performHealthChecks(): Promise<void> {
    logger.info("Performing provider health checks");

    for (const [providerName, provider] of this.providers.entries()) {
      try {
        const healthy = await provider.healthCheck();
        const health = this.providerHealth.get(providerName);

        if (health) {
          health.healthy = healthy;
          health.lastCheck = new Date();

          if (healthy && health.consecutiveFailures > 0) {
            health.consecutiveFailures = 0;
            logger.info("Provider recovered", { provider: providerName });
          }
        }
      } catch (error) {
        logger.error("Health check failed", { provider: providerName, error });
      }
    }
  }

  /**
   * Get health status of all providers
   */
  getHealthStatus(): Map<AIProvider, ProviderHealth> {
    return new Map(this.providerHealth);
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Stop health checks (cleanup)
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}
