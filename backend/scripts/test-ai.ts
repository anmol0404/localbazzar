/**
 * AI Service Test Script
 * Tests all AI providers and features
 * 
 * Usage: ts-node src/test-ai.ts
 */

import { getAIService } from '../src/services/ai/AIService';
import { AITaskType, AIProvider } from '../src/services/ai/types';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testAIService() {
  console.log('🤖 Testing AI Service...\n');

  const aiService = getAIService();

  // Test 1: Check available providers
  console.log('📋 Test 1: Available Providers');
  const providers = aiService.getAvailableProviders();
  console.log(`Available providers: ${providers.join(', ')}`);
  console.log(`Total providers: ${providers.length}\n`);

  // Test 2: Health check
  console.log('🏥 Test 2: Provider Health Check');
  const healthStatus = aiService.getHealthStatus();
  for (const [provider, health] of healthStatus.entries()) {
    console.log(`${provider}:`);
    console.log(`  - Healthy: ${health.healthy ? '✅' : '❌'}`);
    console.log(`  - Last Check: ${health.lastCheck.toISOString()}`);
    console.log(`  - Consecutive Failures: ${health.consecutiveFailures}`);
    console.log(`  - Average Latency: ${health.averageLatency.toFixed(0)}ms`);
  }
  console.log('');

  // Test 3: Simple text generation (Cerebras - fastest)
  console.log('⚡ Test 3: Simple Generation (Cerebras)');
  try {
    const startTime = Date.now();
    const response = await aiService.generate({
      taskType: AITaskType.HEADLINE,
      prompt: 'Generate a catchy headline for a smartphone product',
      maxTokens: 100,
      temperature: 0.7,
      preferredProvider: AIProvider.CEREBRAS,
    });
    const duration = Date.now() - startTime;

    console.log(`✅ Success!`);
    console.log(`Provider: ${response.provider}`);
    console.log(`Model: ${response.model}`);
    console.log(`Latency: ${response.latencyMs}ms (Total: ${duration}ms)`);
    console.log(`Tokens: ${response.tokensUsed || 'N/A'}`);
    console.log(`Content: "${response.content}"`);
  } catch (error) {
    console.error('❌ Failed:', error instanceof Error ? error.message : error);
  }
  console.log('');

  // Test 4: Complex generation (Gemini - most capable)
  console.log('🧠 Test 4: Complex Generation (Gemini)');
  try {
    const startTime = Date.now();
    const response = await aiService.generate({
      taskType: AITaskType.CAMPAIGN_CONTENT,
      prompt: 'Write a compelling product description for a premium wireless headphone with noise cancellation',
      maxTokens: 300,
      temperature: 0.8,
      preferredProvider: AIProvider.GEMINI,
    });
    const duration = Date.now() - startTime;

    console.log(`✅ Success!`);
    console.log(`Provider: ${response.provider}`);
    console.log(`Model: ${response.model}`);
    console.log(`Latency: ${response.latencyMs}ms (Total: ${duration}ms)`);
    console.log(`Tokens: ${response.tokensUsed || 'N/A'}`);
    console.log(`Content: "${response.content.substring(0, 150)}..."`);
  } catch (error) {
    console.error('❌ Failed:', error instanceof Error ? error.message : error);
  }
  console.log('');

  // Test 5: Round-robin (no preferred provider)
  console.log('🔄 Test 5: Round-Robin Load Balancing');
  for (let i = 1; i <= 3; i++) {
    try {
      const response = await aiService.generate({
        taskType: AITaskType.CTA_BUTTON,
        prompt: `Generate a call-to-action button text for request ${i}`,
        maxTokens: 50,
        temperature: 0.7,
      });
      console.log(`Request ${i}: ${response.provider} - "${response.content}"`);
    } catch (error) {
      console.error(`Request ${i}: ❌ Failed`);
    }
  }
  console.log('');

  // Test 6: Failover mechanism
  console.log('🛡️ Test 6: Failover Mechanism');
  console.log('Testing with invalid provider preference...');
  try {
    const response = await aiService.generate({
      taskType: AITaskType.HEADLINE,
      prompt: 'Generate a headline',
      maxTokens: 50,
      temperature: 0.7,
      preferredProvider: 'invalid' as any, // Force failover
    });
    console.log(`✅ Failover successful! Used: ${response.provider}`);
  } catch (error) {
    console.error('❌ Failover failed:', error instanceof Error ? error.message : error);
  }
  console.log('');

  // Test 7: Different task types
  console.log('📝 Test 7: Different Task Types');
  const taskTypes = [
    { type: AITaskType.HEADLINE, prompt: 'smartphone sale' },
    { type: AITaskType.CTA_BUTTON, prompt: 'buy now action' },
    { type: AITaskType.AD_COPY, prompt: 'promote eco-friendly products' },
  ];

  for (const task of taskTypes) {
    try {
      const response = await aiService.generate({
        taskType: task.type,
        prompt: task.prompt,
        maxTokens: 100,
        temperature: 0.7,
      });
      console.log(`${task.type}: "${response.content.substring(0, 50)}..."`);
    } catch (error) {
      console.log(`${task.type}: ❌ Failed`);
    }
  }
  console.log('');

  // Final health check
  console.log('🏥 Final Health Check');
  const finalHealth = aiService.getHealthStatus();
  for (const [provider, health] of finalHealth.entries()) {
    const status = health.healthy ? '✅ Healthy' : '❌ Unhealthy';
    console.log(`${provider}: ${status} (Failures: ${health.consecutiveFailures})`);
  }

  console.log('\n✨ AI Service Test Complete!');
}

// Run tests
testAIService()
  .then(() => {
    console.log('\n✅ All tests completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
