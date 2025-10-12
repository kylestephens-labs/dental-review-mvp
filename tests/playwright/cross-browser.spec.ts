import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Compatibility', () => {
  test('should render consistently across browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for each browser
    await page.screenshot({ 
      path: `test-results/screenshots/cross-browser-${browserName}.png`,
      fullPage: true 
    });
    
    // Basic checks that should work across all browsers
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveTitle(/Dental/);
  });
});

test.describe('Performance Tests', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    console.log(`Page load time: ${loadTime}ms`);
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for large images that might affect LCP
    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src && !src.includes('data:')) {
        // Check if image has proper loading attributes
        const loading = await img.getAttribute('loading');
        expect(loading).toBeTruthy();
      }
    }
  });
});
