import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Playwright global setup...');
  
  // Start the development server if not already running
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the dev server to be ready
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    console.log('✅ Development server is ready');
  } catch (error) {
    console.log('⚠️  Development server not ready, tests will start it automatically');
  } finally {
    await browser.close();
  }
  
  console.log('✅ Playwright global setup complete');
}

export default globalSetup;
