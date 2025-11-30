/**
 * Quick AI Test Script
 * Simple test to verify AI is working
 * 
 * Usage: ts-node src/test-ai-simple.ts
 */

import { getAIService } from '../src/services/ai/AIService';
import { AITaskType } from '../src/services/ai/types';
import * as dotenv from 'dotenv';

dotenv.config();

async function quickTest() {
  console.log('🚀 Quick AI Test\n');

  const aiService = getAIService();

  // Check providers
  const providers = aiService.getAvailableProviders();
  console.log(`✅ Providers initialized: ${providers.join(', ')}\n`);

  // Simple test
  console.log('Testing AI generation...');
  try {
    const response = await aiService.generate({
      taskType: AITaskType.HEADLINE,
      prompt: 'Write a catchy headline for a new smartphone',
      maxTokens: 50,
      temperature: 0.7,
    });

    console.log('\n✅ SUCCESS!');
    console.log(`Provider: ${response.provider}`);
    console.log(`Model: ${response.model}`);
    console.log(`Latency: ${response.latencyMs}ms`);
    console.log(`Result: "${response.content}"\n`);
  } catch (error) {
    console.error('\n❌ FAILED:', error);
    process.exit(1);
  }
}

quickTest();
