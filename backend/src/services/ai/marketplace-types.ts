/**
 * Marketplace-specific AI Task Types
 * Extends base AI types for LocalBazaar marketplace
 */

/**
 * Marketplace AI task types
 */
export enum MarketplaceAITask {
  // Product Management
  PRODUCT_DESCRIPTION = 'product_description',
  PRODUCT_TITLE = 'product_title',
  PRODUCT_TAGS = 'product_tags',
  PRODUCT_CATEGORIZATION = 'product_categorization',
  
  // Search & Discovery
  SEMANTIC_SEARCH = 'semantic_search',
  SEARCH_QUERY_EXPANSION = 'search_query_expansion',
  PRODUCT_MATCHING = 'product_matching',
  
  // Negotiation
  NEGOTIATION_SUGGESTION = 'negotiation_suggestion',
  PRICE_ANALYSIS = 'price_analysis',
  COUNTER_OFFER = 'counter_offer',
  
  // Fraud Detection
  FRAUD_DETECTION = 'fraud_detection',
  CONTENT_MODERATION = 'content_moderation',
  IMAGE_VERIFICATION = 'image_verification',
  
  // Recommendations
  PRODUCT_RECOMMENDATION = 'product_recommendation',
  SHOP_RECOMMENDATION = 'shop_recommendation',
  CROSS_SELL = 'cross_sell',
  
  // Customer Service
  CHAT_RESPONSE = 'chat_response',
  REVIEW_SUMMARY = 'review_summary',
  FAQ_GENERATION = 'faq_generation',
}

/**
 * Product context for AI requests
 */
export interface ProductContext {
  productName?: string;
  category?: string;
  brand?: string;
  price?: number;
  description?: string;
  specifications?: Record<string, any>;
  images?: string[];
  shopName?: string;
  shopRating?: number;
}

/**
 * Negotiation context
 */
export interface NegotiationContext {
  productId: string;
  productName: string;
  listedPrice: number;
  customerOffer?: number;
  productCost?: number;
  currentStock: number;
  historicalSales: Array<{
    price: number;
    date: Date;
  }>;
  customerProfile: {
    totalOrders: number;
    averageOrderValue: number;
    isLoyal: boolean;
  };
}

/**
 * Search context
 */
export interface SearchContext {
  query: string;
  userId?: string;
  location?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  filters?: Record<string, any>;
}

/**
 * Fraud detection context
 */
export interface FraudContext {
  contentType: 'SHOP' | 'PRODUCT' | 'REVIEW' | 'USER';
  content: string;
  images?: string[];
  userHistory?: {
    accountAge: number;
    previousReports: number;
    verificationStatus: string;
  };
}

/**
 * Recommendation context
 */
export interface RecommendationContext {
  userId: string;
  browsingHistory: string[];
  purchaseHistory: string[];
  preferredCategories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  location: string;
  currentContext?: string;
}
