# AI Service Documentation

## Overview

The AI service provides intelligent content generation for campaigns using three AI providers with automatic failover and round-robin load balancing:

1. **Cerebras** - Ultra-fast inference (default, lowest latency)
2. **Google Gemini** - Most capable (fallback 1, best quality)
3. **NVIDIA NIM** - Most reliable (fallback 2, enterprise-grade)

## Installation

### 1. Install Required Packages

```bash
npm install @google/generative-ai
```

Note: Cerebras and NVIDIA use standard fetch API, no additional packages needed.

### 2. Configure Environment Variables

Add your API keys to `.env`:

```bash
# Multiple API keys can be space-separated for round-robin
CEREBRAS_API_KEYS="key1 key2 key3"
GEMINI_API_KEYS="key1 key2"
NVIDIA_API_KEYS="key1"
```

### 3. Get API Keys

**Cerebras:**

- Visit: https://inference.cerebras.ai/
- Sign up and get free API key
- Ultra-fast inference, best for quick responses

**Google Gemini:**

- Visit: https://ai.google.dev/
- Get API key from Google AI Studio
- Most capable model, best for complex tasks

**NVIDIA NIM:**

- Visit: https://build.nvidia.com/
- Sign up for NVIDIA Developer Program
- Get API key for NIM endpoints

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AI Service Layer                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Cerebras    │  │   Gemini     │  │   NVIDIA     │      │
│  │  Provider    │  │   Provider   │  │   Provider   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                  │               │
│         └─────────────────┴──────────────────┘               │
│                           │                                   │
│                    Round-Robin                                │
│                    + Failover                                 │
│                           │                                   │
├─────────────────────────────────────────────────────────────┤
│                    BullMQ Queue System                        │
│              (Rate limiting + Priority)                       │
├─────────────────────────────────────────────────────────────┤
│                      API Endpoints                            │
│  /api/ai/generate  |  /api/ai/instant  |  /api/ai/health    │
└─────────────────────────────────────────────────────────────┘
```

## Features

### 1. Round-Robin Load Balancing

- Multiple API keys per provider
- Automatic key rotation
- Prevents rate limiting

### 2. Automatic Failover

- If one provider fails, tries next
- Health monitoring
- Automatic recovery

### 3. Queue Management

- BullMQ for job processing
- Priority support (1-10)
- Rate limiting (100 jobs/minute)
- Retry with exponential backoff

### 4. Task Types

- `CAMPAIGN_CONTENT` - Complete ad content
- `AD_COPY` - Persuasive ad copy
- `HEADLINE` - Attention-grabbing headlines
- `CTA_BUTTON` - Call-to-action buttons
- `CHANNEL_DESCRIPTION` - Channel descriptions
- `TARGETING_SUGGESTIONS` - Targeting recommendations
- `CONTENT_IMPROVEMENT` - Content optimization
- `TRANSLATION` - Multi-language translation

## Usage

### API Endpoints

#### 1. Queued Generation (Recommended for heavy tasks)

```typescript
POST /api/ai/generate

{
  "taskType": "campaign_content",
  "context": {
    "categories": ["Technology", "Business"],
    "targetAudience": "Tech entrepreneurs",
    "tone": "professional",
    "language": "en",
    "pricingModel": "CPM"
  },
  "options": {
    "includeEmojis": true,
    "maxLength": 200,
    "callToAction": true
  },
  "priority": 5
}

Response:
{
  "success": true,
  "data": {
    "jobId": "ai-user123-campaign_content-1234567890",
    "message": "AI generation job queued successfully"
  }
}
```

#### 2. Check Job Status

```typescript
GET /api/ai/status/{jobId}

Response:
{
  "success": true,
  "data": {
    "id": "ai-user123-campaign_content-1234567890",
    "state": "completed",
    "result": {
      "success": true,
      "content": "Generated content here...",
      "provider": "cerebras",
      "model": "llama-3.3-70b",
      "tokensUsed": 450,
      "latencyMs": 1200
    }
  }
}
```

#### 3. Instant Generation (For quick tasks)

```typescript
POST /api/ai/instant

{
  "taskType": "headline",
  "topic": "AI-powered advertising platform",
  "context": {
    "tone": "professional"
  },
  "count": 5
}

Response:
{
  "success": true,
  "data": {
    "headlines": [
      "Transform Your Ads with AI Power",
      "Reach Millions on Telegram Instantly",
      "Smart Advertising Made Simple",
      "Boost ROI with AI-Driven Campaigns",
      "Advertise Smarter, Not Harder"
    ]
  }
}
```

#### 4. Health Check (Admin only)

```typescript
GET /api/ai/health

Response:
{
  "success": true,
  "data": {
    "providers": {
      "cerebras": {
        "healthy": true,
        "lastCheck": "2024-01-15T10:30:00Z",
        "consecutiveFailures": 0,
        "averageLatency": 1200
      },
      "gemini": {
        "healthy": true,
        "lastCheck": "2024-01-15T10:30:00Z",
        "consecutiveFailures": 0,
        "averageLatency": 2500
      },
      "nvidia": {
        "healthy": true,
        "lastCheck": "2024-01-15T10:30:00Z",
        "consecutiveFailures": 0,
        "averageLatency": 1800
      }
    },
    "queue": {
      "waiting": 5,
      "active": 3,
      "completed": 1250,
      "failed": 12,
      "delayed": 0
    }
  }
}
```

### Direct Service Usage

```typescript
import { getCampaignAIService } from "@/services/ai/CampaignAIService";

const campaignAI = getCampaignAIService();

// Generate campaign content
const result = await campaignAI.generateCampaignContent(
  {
    categories: ["Technology"],
    targetAudience: "Developers",
    tone: "professional",
  },
  {
    includeEmojis: true,
    maxLength: 200,
  }
);

// Generate headlines
const headlines = await campaignAI.generateHeadlines(
  "AI-powered advertising",
  { tone: "professional" },
  5
);

// Generate CTAs
const ctas = await campaignAI.generateCTAs(
  "Sign up for free trial",
  { tone: "urgent" },
  10
);

// Get targeting suggestions
const targeting = await campaignAI.getTargetingSuggestions(
  "We offer AI-powered advertising solutions for Telegram channels"
);

// Improve content
const improved = await campaignAI.improveContent("Original ad copy here", [
  "Increase urgency",
  "Add emotional appeal",
  "Strengthen CTA",
]);

// Translate content
const translated = await campaignAI.translateContent(
  "English content here",
  "es",
  { tone: "professional" }
);
```

## Configuration

### Provider Priority

Default order (can be customized in `AIService.ts`):

1. Cerebras (fastest)
2. Gemini (most capable)
3. NVIDIA (most reliable)

### Rate Limits

- Queue: 100 jobs/minute
- Worker concurrency: 5 jobs simultaneously
- Retry attempts: 3 with exponential backoff

### Health Checks

- Automatic health checks every 5 minutes
- Provider marked unhealthy after 3 consecutive failures
- Automatic recovery when provider responds

## Best Practices

### 1. Use Queued Generation for Heavy Tasks

- Complete campaign generation
- Multiple variations
- Complex content improvement

### 2. Use Instant Generation for Quick Tasks

- Single headlines
- CTA buttons
- Simple translations

### 3. Provide Rich Context

```typescript
{
  "context": {
    "categories": ["Technology", "Business"],
    "targetAudience": "Tech entrepreneurs aged 25-45",
    "tone": "professional",
    "language": "en",
    "pricingModel": "CPM",
    "budget": 1000
  }
}
```

### 4. Set Appropriate Priority

- 1-3: High priority (urgent requests)
- 4-6: Normal priority (default)
- 7-10: Low priority (batch processing)

### 5. Monitor Health Status

- Check `/api/ai/health` regularly
- Monitor queue metrics
- Track provider latency

## Troubleshooting

### Provider Not Initialized

```
Error: No AI providers initialized
```

**Solution:** Check environment variables are set correctly

### All Providers Failed

```
Error: All AI providers failed
```

**Solution:**

1. Check API keys are valid
2. Check internet connectivity
3. Check provider status pages
4. Review health check endpoint

### Rate Limiting

```
Error: Rate limit exceeded
```

**Solution:**

1. Add more API keys (space-separated)
2. Reduce request frequency
3. Use queue system instead of instant

### Job Stuck in Queue

**Solution:**

1. Check worker is running: `npm run worker:ai`
2. Check Redis connection
3. Check queue metrics

## Worker Management

### Start AI Worker

```bash
# Development
npm run worker:ai

# Production (with PM2)
pm2 start npm --name "ai-worker" -- run worker:ai
```

### Monitor Worker

```bash
# Check logs
pm2 logs ai-worker

# Check status
pm2 status

# Restart worker
pm2 restart ai-worker
```

## Performance Metrics

### Typical Latencies

- **Cerebras**: 800-1500ms (fastest)
- **Gemini**: 2000-3000ms (most capable)
- **NVIDIA**: 1500-2500ms (most reliable)

### Token Usage

- Headline: ~100-200 tokens
- CTA: ~50-100 tokens
- Ad Copy: ~300-500 tokens
- Campaign Content: ~500-1000 tokens
- Complete Campaign: ~1500-2500 tokens

## Security

- API keys stored in environment variables
- Never exposed to frontend
- User authentication required
- Rate limiting per user
- Job ownership verification

## Future Enhancements

- [ ] Caching for repeated requests
- [ ] A/B testing integration
- [ ] Performance analytics
- [ ] Custom model fine-tuning
- [ ] Multi-modal support (images)
- [ ] Real-time streaming UI
- [ ] Cost tracking per user
- [ ] Custom prompt templates
