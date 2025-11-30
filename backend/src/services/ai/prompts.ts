/**
 * AI Prompt Templates
 * Structured prompts for different campaign generation tasks
 */

import { CampaignContext, ContentGenerationOptions } from "./types";

/**
 * Extended context type that includes all possible properties
 * from both backend CampaignContext and frontend AIGenerationContext
 */
interface ExtendedContext extends CampaignContext {
  headline?: string;
  adText?: string;
  description?: string;
  content?: string;
  contentType?: string;
  targetLanguage?: string;
  channelName?: string;
  channelCategory?: string;
  subscribers?: number;
}

export class PromptBuilder {
  /**
   * Build campaign content generation prompt
   * @param context - Campaign context with optional headline and ad text
   * @param options - Generation options including max length
   * @returns Formatted prompt string
   */
  static buildCampaignContentPrompt(
    context: ExtendedContext,
    options: ContentGenerationOptions = {}
  ): string {
    const maxLength = options.maxLength || 500;
    const tone = context.tone || "professional yet friendly";

    return `You are a senior copywriter with 10 years experience in Telegram advertising. You've written thousands of successful ads. You know what works: specific benefits, emotional triggers, urgency. You avoid: generic claims, corporate speak, AI-sounding language.

Write engaging ad copy for Telegram that sounds natural and human.

About the campaign:
${context.headline ? `Campaign headline: ${context.headline}` : ""}
${
  context.categories && context.categories.length > 0
    ? `Topics: ${context.categories.join(", ")}`
    : ""
}
${context.targetAudience ? `Who will see this: ${context.targetAudience}` : ""}
Tone: ${tone}

${
  context.headline
    ? `The ad copy should support and expand on the headline. `
    : ""
}Structure (3-4 short paragraphs):
1. Hook (1 sentence with emoji)
2. Benefits (2-3 bullet points or short sentences)
3. Call to action (1 sentence)

Keep it under ${maxLength} characters. Use 2-3 emojis naturally. Add line breaks so it's easy to read on mobile. Focus on what people get out of it.

MUST include:
- One emoji at the start
- 2-3 benefit points
- One clear call to action
- Keep under ${maxLength} characters

MUST NOT include:
- Excessive punctuation (!!!)
- ALL CAPS words
- Spammy phrases (click here, buy now)
- Generic claims (best ever, #1)

Write ONLY the ad text. No quotes, no explanations, no labels. Just the message itself.`;
  }

  /**
   * Build headline generation prompt
   * @param topic - Main topic or theme for headlines
   * @param context - Campaign context for targeting
   * @param count - Number of headlines to generate
   * @returns Formatted prompt string
   */
  static buildHeadlinePrompt(
    topic: string,
    context: ExtendedContext,
    count: number = 5
  ): string {
    return `You are a senior copywriter with 10 years experience in Telegram advertising. You write headlines that make people stop scrolling and click.

Here are examples of great headlines:
- 🔥 Flash Sale: 70% Off Everything Today Only
- 💰 Save Big on Premium Products This Week
- 🎁 Exclusive Deal: Buy 2 Get 1 Free
- ⚡ Limited Time: Free Shipping on All Orders
- 🚀 New Launch: Get Early Access Now

Now write ${count} catchy headlines for a Telegram ad campaign.

${topic ? `About: ${topic}` : ""}
${context.categories ? `Topics: ${context.categories.join(", ")}` : ""}
${context.targetAudience ? `Audience: ${context.targetAudience}` : ""}

Keep each under 60 characters. Add 1-2 emojis naturally. Make people curious or excited. Be specific. Sound human and conversational.

Write ONLY the headlines, numbered 1 to ${count}. No quotes, no extra text.`;
  }

  /**
   * Build CTA button text generation prompt
   * @param campaignGoal - Goal or objective of the campaign
   * @param count - Number of CTA options to generate
   * @returns Formatted prompt string
   */
  static buildCTAPrompt(campaignGoal: string, count: number = 10): string {
    return `You are a conversion optimization expert. You write CTAs that get clicks.

Here are examples of great CTAs:
- Shop Now
- Get Started
- Claim Offer
- Learn More
- Join Free
- Try Today
- Save Now
- Get Access
- Download Free
- Start Trial

Now write ${count} short button texts that make people want to click.

${campaignGoal ? `Goal: ${campaignGoal}` : ""}

Keep it 2 to 4 words. Start with an action word. Make it feel urgent or valuable. Be clear about what happens when they click. Make each one different.

Write ONLY the button texts, numbered 1 to ${count}. No quotes, no extra words.`;
  }

  /**
   * Build targeting suggestions prompt
   */
  static buildTargetingPrompt(
    campaignDescription: string,
    existingContent?: string
  ): string {
    return `You are a targeting expert. Based on this campaign, suggest who should see these ads:

${campaignDescription}

${existingContent ? `Ad content: ${existingContent}` : ""}

Suggest the best categories from: Technology, Business, Entertainment, Education, Health, Finance, Gaming, News, Lifestyle, Sports, Travel, Food, Fashion, Crypto, Marketing, E-commerce.

Also suggest:
- Subscriber count range (like 5000 to 100000)
- Languages (array of language codes like ["en", "es"])
- Countries (array of country codes like ["US", "UK"])

Return ONLY valid JSON with this exact structure:
{
  "categories": ["Category1", "Category2"],
  "minSubscribers": 5000,
  "maxSubscribers": 100000,
  "languages": ["en"],
  "countries": ["US"]
}

No explanations, no markdown, just the JSON object.`;
  }

  /**
   * Build content improvement prompt
   * @param originalContent - Content to improve
   * @param improvementGoals - Array of improvement goals (e.g., "Enhance clarity", "Context: ...")
   * @returns Formatted prompt string
   */
  static buildImprovementPrompt(
    originalContent: string,
    improvementGoals: string[]
  ): string {
    // Extract context from goals if present
    const contextInfo = improvementGoals.find((goal) =>
      goal.startsWith("Context:")
    );

    return `You are a senior copywriter improving ad copy. Make this text better and give me 5 different improved versions:

${originalContent}

${contextInfo ? `${contextInfo}\n` : ""}

For each version:
1. Add power words (amazing, exclusive, limited, proven, guaranteed)
2. Create urgency (today, now, don't miss, limited time)
3. Strengthen benefits (save money, get results, boost performance)
4. Improve readability (shorter sentences, active voice)
5. Add social proof hints (join thousands, trusted by, rated 5-star)

Keep the same message but make it clearer and more impactful. Add emojis if they fit naturally. Make the call to action stronger. Keep it about the same length. Sound human and natural, not robotic.

Review your output:
- Is it natural and human-like? ✓
- Does it avoid AI clichés? ✓
- Is it specific, not generic? ✓
- Would you click on this ad? ✓

Write ONLY 5 improved versions, numbered 1 to 5. No quotes, no explanations, just the better text options.`;
  }

  /**
   * Build translation prompt
   * @param content - Content to translate
   * @param targetLanguage - Target language for translation
   * @returns Formatted prompt string
   */
  static buildTranslationPrompt(
    content: string,
    targetLanguage: string
  ): string {
    return `Translate this to ${targetLanguage}. Keep the same energy and persuasiveness. Adapt any cultural references so they make sense. Keep the formatting and emojis.

${content}

Write ONLY the translated text. No quotes, no explanations.`;
  }

  /**
   * Build channel description prompt
   * @param channelName - Name of the channel
   * @param channelTopic - Main topic or theme of the channel
   * @param postingFrequency - How often content is posted
   * @returns Formatted prompt string
   */
  static buildChannelDescriptionPrompt(
    channelName: string,
    channelTopic: string,
    postingFrequency: string
  ): string {
    return `Write a channel description for Telegram.

Channel: ${channelName}
About: ${channelTopic}
Posts: ${postingFrequency}

Keep it under 150 characters. Add 2-3 emojis naturally. Make it clear what people get and why they should subscribe. Sound friendly and human.

Write ONLY the description. No quotes, no labels.`;
  }

  /**
   * Build ad copy variations prompt
   * @param baseContent - Original ad content to create variations from
   * @param variationCount - Number of variations to generate
   * @param context - Campaign context for tone and audience
   * @returns Formatted prompt string
   */
  static buildVariationsPrompt(
    baseContent: string,
    variationCount: number = 3,
    context: ExtendedContext
  ): string {
    return `PROJECT: TelegramAds - Telegram advertising platform

TASK: Create ${variationCount} variations of the following ad content for A/B testing.

BASE CONTENT:
${baseContent}

CONTEXT:
${context.tone ? `Tone: ${context.tone}` : ""}
${context.targetAudience ? `Audience: ${context.targetAudience}` : ""}

REQUIREMENTS:
- Each variation should test a different approach
- Variation 1: Focus on emotional appeal
- Variation 2: Focus on logical benefits
- Variation 3: Focus on urgency/scarcity
- Keep similar length to original
- Maintain core message
- Each should be complete and ready to use

OUTPUT FORMAT:
Return ${variationCount} variations, clearly labeled as Variation 1, 2, 3.`;
  }

  /**
   * Build complete campaign wizard prompt
   * @param productOrService - Product or service being advertised
   * @param targetAudience - Target audience description
   * @param budget - Campaign budget
   * @param context - Campaign context including categories, pricing, tone
   * @returns Formatted prompt string
   */
  static buildCampaignWizardPrompt(
    productOrService: string,
    targetAudience: string,
    budget: number,
    context: ExtendedContext
  ): string {
    return `PROJECT: TelegramAds - Telegram advertising platform

TASK: Create a complete campaign package for Telegram advertising.

PRODUCT/SERVICE:
${productOrService}

TARGET AUDIENCE:
${targetAudience}

BUDGET: $${budget}

CONTEXT:
${context.categories ? `Categories: ${context.categories.join(", ")}` : ""}
${context.pricingModel ? `Pricing Model: ${context.pricingModel}` : ""}
${context.tone ? `Tone: ${context.tone}` : ""}
${context.language ? `Language: ${context.language}` : ""}

GENERATE:
1. Campaign Name (catchy and descriptive)
2. Main Ad Copy (150-200 words, compelling and benefit-focused)
3. 5 Headline Options (under 60 characters each)
4. 5 CTA Button Options (2-4 words each)
5. Targeting Recommendations (demographics, categories, engagement)
6. Budget Allocation Suggestions (daily cap, total budget strategy)
7. Success Metrics to Track

OUTPUT FORMAT:
Provide a complete, structured campaign package ready for implementation.`;
  }
}
