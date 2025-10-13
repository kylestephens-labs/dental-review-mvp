import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting smoke test setup...');
  
  // Get the base URL from environment or config
  const baseUrl = process.env.SMOKE_TEST_URL || config.projects[0].use.baseURL;
  
  if (!baseUrl) {
    throw new Error('SMOKE_TEST_URL environment variable is required for smoke tests');
  }
  
  console.log(`📍 Testing against: ${baseUrl}`);
  
  // Validate that the URL is accessible
  try {
    const response = await fetch(baseUrl);
    if (!response.ok) {
      throw new Error(`Base URL returned ${response.status}: ${response.statusText}`);
    }
    console.log('✅ Base URL is accessible');
  } catch (error) {
    console.error('❌ Base URL is not accessible:', error);
    throw error;
  }
  
  // Set environment variables for tests
  process.env.SMOKE_TEST_BASE_URL = baseUrl;
  
  console.log('✅ Smoke test setup completed');
}

export default globalSetup;
