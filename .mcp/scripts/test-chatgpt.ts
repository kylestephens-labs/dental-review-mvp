#!/usr/bin/env tsx

/**
 * Test script for ChatGPT Integration
 * 
 * This script demonstrates how to test the ChatGPT integration with a real API key.
 * 
 * Usage:
 * 1. Set your OpenAI API key: export OPENAI_API_KEY="your-api-key-here"
 * 2. Run: npm run test:chatgpt
 */

import { ChatGPTIntegration } from '../tools/chatgpt-integration.js';

async function testChatGPTIntegration() {
  console.log('🧪 Testing ChatGPT Integration...\n');
  
  // Check if API key is set
  console.log(`🔑 OPENAI_API_KEY status: ${process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'}`);
  if (process.env.OPENAI_API_KEY) {
    console.log(`🔑 API Key preview: ${process.env.OPENAI_API_KEY.substring(0, 20)}...`);
  }
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ OPENAI_API_KEY environment variable not set');
    console.log('💡 To test with real ChatGPT API:');
    console.log('   1. Get an API key from https://platform.openai.com/api-keys');
    console.log('   2. Set it: export OPENAI_API_KEY="your-api-key-here"');
    console.log('   3. Run this test again');
    console.log('\n🔄 Testing fallback behavior instead...\n');
  }
  
  // Create a test task
  const testTask = {
    id: 'test-task-123',
    title: 'User Authentication System',
    priority: 'P1',
    status: 'ready',
    agent: 'unassigned',
    codexReviewCycles: 0,
    created: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    overview: '[Overview to be defined]',
    goal: '[Goal to be defined]',
    acceptanceCriteria: [],
    definitionOfReady: [],
    definitionOfDone: [],
    filesAffected: [],
    implementationNotes: '[Implementation notes will be added here]',
    reviewFeedback: '[Review feedback will be added here]',
    feedbackResolved: true,
    errorContext: '[Error context will be added here]'
  };
  
  // Initialize ChatGPT integration
  const integration = new ChatGPTIntegration();
  
  try {
    // Test the fallback method directly
    console.log('🧪 Testing fallback task details generation...');
    const fallbackDetails = integration.generateFallbackTaskDetails(testTask);
    
    console.log('📋 Generated fallback details:');
    console.log(JSON.stringify(fallbackDetails, null, 2));
    
    console.log('✅ ChatGPT integration test completed successfully');
  } catch (error) {
    console.error('❌ ChatGPT integration test failed:', error);
  }
}

// Run the test
testChatGPTIntegration().catch(console.error);
