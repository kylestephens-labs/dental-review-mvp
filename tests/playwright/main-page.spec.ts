import { test, expect } from '@playwright/test';
import { TestUtils } from './utils/test-utils';

test.describe('Main Page Components', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await page.goto('/');
    await testUtils.waitForPageLoad();
  });

  test('should render the main page correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Dental/);
    
    // Check main page structure
    await testUtils.checkElementVisibility('header');
    await testUtils.checkElementVisibility('main');
    await testUtils.checkElementVisibility('footer');
    
    // Take full page screenshot
    await testUtils.takeScreenshot('main-page-full');
  });

  test('should render header component', async ({ page }) => {
    const header = page.locator('header');
    
    // Check header is visible
    await expect(header).toBeVisible();
    
    // Check for navigation elements
    await testUtils.checkElementVisibility('nav');
    
    // Take header screenshot
    await testUtils.takeElementScreenshot('header', 'header-component');
    
    // Check responsive behavior
    await testUtils.checkResponsiveDesign([
      { width: 320, height: 568, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' }
    ]);
  });

  test('should render hero section', async ({ page }) => {
    // Look for hero section (might be in main or have specific class)
    const hero = page.locator('section').first().or(page.locator('[class*="hero"]'));
    
    await expect(hero).toBeVisible();
    
    // Check for hero content
    await testUtils.checkElementVisibility('h1');
    
    // Take hero screenshot
    await testUtils.takeElementScreenshot('section', 'hero-section');
  });

  test('should render services section', async ({ page }) => {
    // Look for services section
    const servicesSection = page.locator('section').nth(1).or(page.locator('[class*="service"]'));
    
    await expect(servicesSection).toBeVisible();
    
    // Check for service items
    const serviceItems = page.locator('[class*="service"], .service-item, .card');
    await expect(serviceItems.first()).toBeVisible();
    
    // Take services screenshot
    await testUtils.takeElementScreenshot('section', 'services-section');
  });

  test('should render footer component', async ({ page }) => {
    const footer = page.locator('footer');
    
    await expect(footer).toBeVisible();
    
    // Check for footer content
    await testUtils.checkElementVisibility('footer');
    
    // Take footer screenshot
    await testUtils.takeElementScreenshot('footer', 'footer-component');
  });

  test('should be accessible', async ({ page }) => {
    await testUtils.checkAccessibility();
    
    // Check for proper focus management
    await testUtils.testKeyboardNavigation('header');
  });

  test('should handle mobile navigation', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Look for mobile menu button
    const mobileMenuButton = page.locator('[aria-label*="menu"], [aria-label*="Menu"], button[class*="menu"]');
    
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await page.waitForTimeout(300);
      
      // Check if mobile menu is open
      const mobileMenu = page.locator('[class*="mobile-menu"], [class*="nav-menu"]');
      await expect(mobileMenu).toBeVisible();
      
      await testUtils.takeScreenshot('mobile-menu-open');
    }
  });
});
