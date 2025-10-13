import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting smoke test teardown...');
  
  // Log any final cleanup or reporting
  console.log('✅ Smoke test teardown completed');
}

export default globalTeardown;
