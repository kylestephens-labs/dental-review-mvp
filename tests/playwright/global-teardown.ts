import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Playwright global teardown...');
  
  // Add any cleanup logic here if needed
  // For example, cleaning up test data, stopping services, etc.
  
  console.log('✅ Playwright global teardown complete');
}

export default globalTeardown;
