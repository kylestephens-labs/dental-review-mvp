// Test script for feature flag lint check
import { checkFeatureFlagLint } from './tools/prove/checks/feature-flag-lint.js';
import { buildContext } from './tools/prove/context.js';

async function testFeatureFlagLint() {
  console.log('Testing feature flag lint check...');
  
  try {
    const context = await buildContext();
    const result = await checkFeatureFlagLint(context);
    
    console.log('Result:', result);
    
    if (result.ok) {
      console.log('✅ Feature flag lint check passed');
    } else {
      console.log('❌ Feature flag lint check failed:', result.reason);
    }
  } catch (error) {
    console.error('Error testing feature flag lint:', error);
  }
}

testFeatureFlagLint();
