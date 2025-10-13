import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke test configuration for post-deployment validation
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/playwright',
  testMatch: '**/smoke-tests.spec.ts',
  
  /* Run smoke tests in parallel for speed */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* No retries for smoke tests - we want immediate feedback */
  retries: 0,
  
  /* Use multiple workers for speed */
  workers: process.env.CI ? 2 : 4,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'smoke-test-results' }],
    ['json', { outputFile: 'smoke-test-results/results.json' }],
    ['junit', { outputFile: 'smoke-test-results/results.xml' }]
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL - will be overridden by environment variable in CI */
    baseURL: process.env.SMOKE_TEST_URL || 'http://localhost:5173',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Timeout for each action */
    actionTimeout: 10000,
    
    /* Timeout for navigation */
    navigationTimeout: 30000,
  },
  
  /* Configure projects for smoke testing - focus on Chrome for speed */
  projects: [
    {
      name: 'chromium-smoke',
      use: { 
        ...devices['Desktop Chrome'],
        // Disable images and CSS for faster loading
        // launchOptions: {
        //   args: ['--disable-images', '--disable-css']
        // }
      },
    },
    
    // Optional: Add mobile smoke test
    {
      name: 'mobile-smoke',
      use: { 
        ...devices['Pixel 5'],
      },
    },
  ],
  
  /* Global timeout for the entire test run */
  timeout: 60000, // 1 minute
  
  /* Expect timeout for assertions */
  expect: {
    timeout: 10000, // 10 seconds
  },
  
  /* Global setup and teardown */
  globalSetup: './tests/playwright/smoke-setup.ts',
  globalTeardown: './tests/playwright/smoke-teardown.ts',
});
