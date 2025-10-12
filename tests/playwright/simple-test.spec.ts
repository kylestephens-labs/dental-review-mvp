import { test, expect } from '@playwright/test';

test.describe('Simple Page Test', () => {
  test('should load the page', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'test-results/simple-page-test.png',
      fullPage: true 
    });
    
    // Check if the page has content
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check if React has loaded
    const root = page.locator('#root');
    await expect(root).toBeVisible();
    
    // Check if there's any content in the root
    const rootContent = await root.textContent();
    console.log('Root content:', rootContent);
    
    // Check page title
    const title = await page.title();
    console.log('Page title:', title);
    expect(title).toContain('Dental');
  });
});
