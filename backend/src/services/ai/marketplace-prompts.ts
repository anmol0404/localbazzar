/**
 * Marketplace AI Prompts
 * Specialized prompts for LocalBazaar marketplace tasks
 */

import { MarketplaceAITask } from './marketplace-types';

export const MARKETPLACE_PROMPTS: Record<MarketplaceAITask, string> = {
  [MarketplaceAITask.NEGOTIATION_SUGGESTION]: `You are a pricing expert for an e-commerce marketplace. Analyze negotiation data and suggest an optimal counter-offer.

Product: {{productName}}
Listed Price: ₹{{listedPrice}}
Customer Offer: ₹{{customerOffer}}
Product Cost: ₹{{productCost}}
Current Stock: {{currentStock}} units

Historical Sales:
{{#each historicalSales}}
- Sold at ₹{{price}} on {{date}}
{{/each}}

Customer Profile:
- Total Orders: {{customerProfile.totalOrders}}
- Average Order Value: ₹{{customerProfile.averageOrderValue}}
- Customer Type: {{#if customerProfile.isLoyal}}Loyal{{else}}New{{/if}}

Provide:
1. Suggested counter-offer price (₹)
2. Acceptance probability (%)
3. Expected profit margin (₹)
4. Brief reasoning (2-3 sentences)

Return JSON:
{
  "suggestedPrice": number,
  "acceptanceProbability": number,
  "profitMargin": number,
  "reasoning": string
}`,

  [MarketplaceAITask.SEMANTIC_SEARCH]: `Convert the user's natural language search query into structured search parameters.

User Query: "{{query}}"
User Location: {{location}}

Understand:
1. Product type/category
2. Key attributes (color, size, brand, etc.)
3. Price range intent
4. Quality/condition expectations
5. Urgency indicators

Return JSON:
{
  "categories": string[],
  "keywords": string[],
  "attributes": Record<string, string>,
  "priceRange": { "min": number, "max": number },
  "sortBy": "relevance" | "price_low" | "price_high" | "newest",
  "filters": Record<string, any>
}`,

  [MarketplaceAITask.FRAUD_DETECTION]: `Analyze this content for potential fraud or spam.

Type: {{contentType}}
Content: {{content}}
User History: {{userHistory}}
Images: {{images}}

Check for:
1. Brand impersonation
2. Unrealistic pricing
3. Stock photos
4. Spam patterns
5. Prohibited items
6. Fake reviews

Return JSON:
{
  "riskScore": number (0-100),
  "flagged": boolean,
  "reasons": string[],
  "action": "approve" | "review" | "block",
  "confidence": number (0-1)
}`,

  [MarketplaceAITask.PRODUCT_RECOMMENDATION]: `Generate personalized product recommendations.

User Profile:
- Browsing History: {{browsingHistory}}
- Purchase History: {{purchaseHistory}}
- Preferred Categories: {{preferredCategories}}
- Price Range: ₹{{priceRange.min}} - ₹{{priceRange.max}}
- Location: {{location}}

Current Context: {{currentContext}}

Recommend 10 products that:
1. Match user preferences
2. Are in stock
3. Have good ratings
4. Are within price range
5. Are available in user's location

Return JSON array of product IDs with relevance scores.`,

  [MarketplaceAITask.PRODUCT_DESCRIPTION]: `Write a compelling product description.

Product: {{productName}}
Category: {{category}}
Brand: {{brand}}
Price: ₹{{price}}
Specifications: {{specifications}}

Create:
1. Attention-grabbing headline
2. Key features (3-5 bullet points)
3. Benefits (2-3 sentences)
4. Call to action

Keep it under 200 words. Focus on benefits, not just features.`,

  [MarketplaceAITask.PRODUCT_TITLE]: `Generate SEO-optimized product titles.

Product: {{productName}}
Category: {{category}}
Brand: {{brand}}
Key Features: {{features}}

Create 5 title variations that:
1. Include brand and category
2. Highlight key features
3. Are under 80 characters
4. Are SEO-friendly
5. Sound natural

Return numbered list.`,

  [MarketplaceAITask.PRODUCT_TAGS]: `Generate relevant tags for product discovery.

Product: {{productName}}
Description: {{description}}
Category: {{category}}

Generate 10-15 tags that:
1. Include category keywords
2. Include use cases
3. Include target audience
4. Include features
5. Are searchable

Return comma-separated list.`,

  [MarketplaceAITask.PRODUCT_CATEGORIZATION]: `Suggest the best category for this product.

Product: {{productName}}
Description: {{description}}
Images: {{images}}

Available Categories: {{categories}}

Return JSON:
{
  "primaryCategory": string,
  "secondaryCategories": string[],
  "confidence": number (0-1),
  "reasoning": string
}`,

  [MarketplaceAITask.SEARCH_QUERY_EXPANSION]: `Expand search query with synonyms and related terms.

Original Query: "{{query}}"

Generate:
1. Synonyms
2. Related terms
3. Common misspellings
4. Regional variations

Return JSON:
{
  "expanded": string[],
  "synonyms": string[],
  "related": string[]
}`,

  [MarketplaceAITask.PRODUCT_MATCHING]: `Match product to user intent.

User Query: "{{query}}"
Product: {{productName}}
Description: {{description}}

Calculate relevance score (0-100) and explain why.

Return JSON:
{
  "score": number,
  "reasoning": string,
  "highlights": string[]
}`,

  [MarketplaceAITask.PRICE_ANALYSIS]: `Analyze product pricing.

Product: {{productName}}
Current Price: ₹{{price}}
Category: {{category}}
Competitor Prices: {{competitorPrices}}

Provide:
1. Market position (low/medium/high)
2. Recommended price range
3. Pricing strategy suggestion

Return JSON:
{
  "marketPosition": string,
  "recommendedRange": { "min": number, "max": number },
  "strategy": string,
  "reasoning": string
}`,

  [MarketplaceAITask.COUNTER_OFFER]: `Generate counter-offer for negotiation.

Current Offer: ₹{{currentOffer}}
Target Price: ₹{{targetPrice}}
Minimum Price: ₹{{minimumPrice}}

Suggest counter-offer that:
1. Moves toward target
2. Maintains negotiation momentum
3. Stays above minimum

Return JSON:
{
  "counterOffer": number,
  "message": string
}`,

  [MarketplaceAITask.CONTENT_MODERATION]: `Moderate user-generated content.

Content: {{content}}
Type: {{contentType}}

Check for:
1. Profanity
2. Hate speech
3. Spam
4. Personal information
5. Inappropriate content

Return JSON:
{
  "approved": boolean,
  "issues": string[],
  "severity": "low" | "medium" | "high",
  "action": "approve" | "flag" | "block"
}`,

  [MarketplaceAITask.IMAGE_VERIFICATION]: `Verify product image authenticity.

Image URL: {{imageUrl}}
Product: {{productName}}

Check for:
1. Stock photos
2. Watermarks
3. Image quality
4. Product visibility
5. Misleading content

Return JSON:
{
  "authentic": boolean,
  "issues": string[],
  "confidence": number (0-1)
}`,

  [MarketplaceAITask.SHOP_RECOMMENDATION]: `Recommend shops to user.

User Profile: {{userProfile}}
Location: {{location}}
Preferences: {{preferences}}

Recommend 5 shops that:
1. Match user preferences
2. Have good ratings
3. Are nearby
4. Have active inventory

Return JSON array of shop IDs with scores.`,

  [MarketplaceAITask.CROSS_SELL]: `Suggest complementary products.

Product: {{productName}}
Category: {{category}}
Price: ₹{{price}}

Suggest 5 products that:
1. Complement this product
2. Are frequently bought together
3. Are in similar price range

Return JSON array of product IDs.`,

  [MarketplaceAITask.CHAT_RESPONSE]: `Generate helpful customer service response.

Customer Question: {{question}}
Context: {{context}}

Provide:
1. Clear answer
2. Helpful tone
3. Next steps if needed

Keep under 100 words.`,

  [MarketplaceAITask.REVIEW_SUMMARY]: `Summarize product reviews.

Reviews: {{reviews}}
Total: {{totalReviews}}

Create summary covering:
1. Overall sentiment
2. Common pros
3. Common cons
4. Key themes

Keep under 150 words.`,

  [MarketplaceAITask.FAQ_GENERATION]: `Generate FAQ for product.

Product: {{productName}}
Description: {{description}}
Category: {{category}}

Create 5 common questions and answers about:
1. Product features
2. Usage
3. Shipping
4. Returns
5. Compatibility

Return JSON array of Q&A pairs.`,
};
