/**
 * AI Service Types
 * Common types and interfaces for all AI providers
 */

/**
 * Supported AI providers
 */
export enum AIProvider {
  CEREBRAS = "cerebras",
  GEMINI = "gemini",
  NVIDIA = "nvidia",
}

/**
 * Types of AI tasks supported by the platform
 */
export enum AITaskType {
  AD_COPY = "ad_copy",
  HEADLINE = "headline",
  CTA_BUTTON = "cta_button",
  CHANNEL_DESCRIPTION = "channel_description",
  TARGETING_SUGGESTIONS = "targeting_suggestions",
  CONTENT_IMPROVEMENT = "content_improvement",
  TRANSLATION = "translation",
}

/**
 * Standard error codes for AI operations
 */
export enum AIErrorCode {
  RATE_LIMIT = "RATE_LIMIT",
  INVALID_API_KEY = "INVALID_API_KEY",
  TIMEOUT = "TIMEOUT",
  INVALID_REQUEST = "INVALID_REQUEST",
  PROVIDER_ERROR = "PROVIDER_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  CONTENT_FILTER = "CONTENT_FILTER",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
}

/**
 * Type-safe context for AI requests
 * Use discriminated union based on task type for better type safety
 */
export type AIContext =
  | CampaignContext
  | Record<string, string | number | boolean | string[]>;

/**
 * Request to AI service
 */
export interface AIRequest {
  /** Type of AI task to perform */
  taskType: AITaskType;
  /** Prompt text for the AI */
  prompt: string;
  /** Optional context for the request */
  context?: AIContext;
  /** Maximum tokens to generate (default: 1000) */
  maxTokens?: number;
  /** Temperature for randomness 0-1 (default: 0.7) */
  temperature?: number;
  /** Preferred provider, falls back if unavailable */
  preferredProvider?: AIProvider;
}

/**
 * Response from AI service
 */
export interface AIResponse {
  /** Generated content */
  readonly content: string;
  /** Provider that generated the response */
  readonly provider: AIProvider;
  /** Model used for generation */
  readonly model: string;
  /** Number of tokens used */
  readonly tokensUsed?: number;
  /** Latency in milliseconds */
  readonly latencyMs: number;
  /** Whether response was served from cache */
  readonly cached?: boolean;
}

/**
 * Configuration for an AI provider
 */
export interface AIProviderConfig {
  /** Provider name */
  readonly name: AIProvider;
  /** API keys for the provider (supports rotation) */
  apiKeys: string[];
  /** Base URL for API requests */
  readonly baseUrl: string;
  /** Available models */
  readonly models: string[];
  /** Default model to use */
  defaultModel: string;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Whether provider is enabled */
  enabled: boolean;
}

/**
 * Interface that all AI provider implementations must follow
 */
export interface IAIProvider {
  /** Generate content based on request */
  generate(request: AIRequest): Promise<AIResponse>;
  /** Check if provider is healthy */
  healthCheck(): Promise<boolean>;
  /** Get available models */
  getAvailableModels(): readonly string[];
  /** Optional: Generate content with streaming */
  generateStream?(request: AIRequest): AsyncGenerator<string, void, unknown>;
}

/**
 * Error from AI provider
 */
export interface AIError {
  /** Provider that generated the error */
  readonly provider: AIProvider;
  /** Error message */
  readonly error: string;
  /** Standardized error code */
  readonly code?: AIErrorCode;
  /** Whether the error is retryable */
  readonly retryable: boolean;
}

/**
 * Health status of an AI provider
 */
export interface ProviderHealth {
  /** Provider name */
  readonly provider: AIProvider;
  /** Whether provider is healthy */
  healthy: boolean;
  /** Last health check timestamp */
  lastCheck: Date;
  /** Number of consecutive failures */
  consecutiveFailures: number;
  /** Average latency in milliseconds */
  averageLatency: number;
}

/**
 * Context for campaign-related AI tasks
 */
export interface CampaignContext {
  /** Campaign categories */
  categories?: string[];
  /** Target audience description */
  targetAudience?: string;
  /** Tone of content */
  tone?: "professional" | "casual" | "friendly" | "urgent" | "informative";
  /** Content language */
  language?: string;
  /** Channel type (public/private) */
  channelType?: string;
  /** Campaign budget in cents */
  budget?: number;
  /** Pricing model */
  pricingModel?: "CPM" | "CPC" | "CPA";
}

/**
 * Options for content generation
 */
export interface ContentGenerationOptions {
  /** Include emojis in content */
  includeEmojis?: boolean;
  /** Maximum content length */
  maxLength?: number;
  /** Include hashtags */
  includeHashtags?: boolean;
  /** Include call-to-action */
  callToAction?: boolean;
  /** Output format */
  format?: "text" | "markdown" | "html";
}

/**
 * Default configuration values
 */
export const AI_DEFAULTS = {
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7,
  MAX_RETRIES: 3,
  TIMEOUT_MS: 30000,
  CACHE_TTL_SECONDS: 3600,
} as const;

/**
 * Temperature range validation
 */
export type Temperature = number & { __brand: "Temperature" };

/**
 * Validates temperature is in valid range (0-1)
 */
export function isValidTemperature(value: number): value is Temperature {
  return value >= 0 && value <= 1;
}
