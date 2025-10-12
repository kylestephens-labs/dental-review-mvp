import { test, expect } from '@playwright/test';

test.describe('Page Loading Test', () => {
  test('should load the page and capture screenshots', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Listen for page errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });
    
    await page.goto('/');
    
    // Wait longer for the page to load
    await page.waitForTimeout(3000);
    
    // Take a screenshot regardless of visibility
    await page.screenshot({ 
      path: 'test-results/page-loading-test.png',
      fullPage: true 
    });
    
    // Check what's actually on the page
    const html = await page.content();
    console.log('Page HTML length:', html.length);
    
    // Check if there are any errors
    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors);
    }
    
    if (pageErrors.length > 0) {
      console.log('Page errors:', pageErrors);
    }
    
    // Try to find any visible elements
    const visibleElements = await page.locator('*').all();
    console.log('Total elements found:', visibleElements.length);
    
    // Check if the root div exists
    const root = page.locator('#root');
    const rootExists = await root.count() > 0;
    console.log('Root div exists:', rootExists);
    
    if (rootExists) {
      const rootHTML = await root.innerHTML();
      console.log('Root content length:', rootHTML.length);
      console.log('Root content preview:', rootHTML.substring(0, 200));
    }
    
    // Just check that we got some response
    expect(html.length).toBeGreaterThan(100);
  });
});
