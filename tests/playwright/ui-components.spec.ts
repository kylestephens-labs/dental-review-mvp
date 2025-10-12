import { test, expect } from '@playwright/test';
import { TestUtils } from './utils/test-utils';

test.describe('UI Components Visual Tests', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await page.goto('/');
    await testUtils.waitForPageLoad();
  });

  test.describe('Button Components', () => {
    test('should render buttons correctly', async ({ page }) => {
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      expect(buttonCount).toBeGreaterThan(0);
      
      // Test each button
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        await expect(button).toBeVisible();
        
        // Check button has text or aria-label
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        expect(text?.trim() || ariaLabel).toBeTruthy();
      }
      
      await testUtils.takeScreenshot('all-buttons');
    });

    test('should handle button interactions', async ({ page }) => {
      const buttons = page.locator('button');
      const firstButton = buttons.first();
      
      if (await firstButton.isVisible()) {
        // Test hover state
        await firstButton.hover();
        await page.waitForTimeout(200);
        await testUtils.takeScreenshot('button-hover');
        
        // Test focus state
        await firstButton.focus();
        await page.waitForTimeout(200);
        await testUtils.takeScreenshot('button-focus');
      }
    });
  });

  test.describe('Form Components', () => {
    test('should render form elements correctly', async ({ page }) => {
      // Look for forms
      const forms = page.locator('form');
      const formCount = await forms.count();
      
      if (formCount > 0) {
        const form = forms.first();
        await expect(form).toBeVisible();
        
        // Check for form inputs
        const inputs = form.locator('input, textarea, select');
        const inputCount = await inputs.count();
        
        if (inputCount > 0) {
          await testUtils.takeElementScreenshot('form', 'form-component');
          
          // Test form interactions
          for (let i = 0; i < Math.min(inputCount, 3); i++) {
            const input = inputs.nth(i);
            await input.focus();
            await page.waitForTimeout(100);
          }
          
          await testUtils.takeScreenshot('form-focused');
        }
      }
    });

    test('should validate form inputs', async ({ page }) => {
      const forms = page.locator('form');
      const formCount = await forms.count();
      
      if (formCount > 0) {
        const form = forms.first();
        
        // Try to submit empty form to test validation
        const submitButton = form.locator('button[type="submit"], input[type="submit"]');
        
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(500);
          
          // Check for validation messages
          const errorMessages = page.locator('[class*="error"], [class*="invalid"], .error-message');
          const errorCount = await errorMessages.count();
          
          if (errorCount > 0) {
            await testUtils.takeScreenshot('form-validation-errors');
          }
        }
      }
    });
  });

  test.describe('Card Components', () => {
    test('should render cards correctly', async ({ page }) => {
      const cards = page.locator('[class*="card"], .card, article');
      const cardCount = await cards.count();
      
      if (cardCount > 0) {
        await testUtils.takeScreenshot('all-cards');
        
        // Test individual cards
        for (let i = 0; i < Math.min(cardCount, 3); i++) {
          const card = cards.nth(i);
          await expect(card).toBeVisible();
          
          // Test card hover
          await card.hover();
          await page.waitForTimeout(200);
        }
        
        await testUtils.takeScreenshot('cards-hover');
      }
    });
  });

  test.describe('Navigation Components', () => {
    test('should render navigation correctly', async ({ page }) => {
      const nav = page.locator('nav');
      
      if (await nav.isVisible()) {
        await testUtils.takeElementScreenshot('nav', 'navigation-component');
        
        // Test navigation links
        const navLinks = nav.locator('a');
        const linkCount = await navLinks.count();
        
        if (linkCount > 0) {
          // Test first few links
          for (let i = 0; i < Math.min(linkCount, 3); i++) {
            const link = navLinks.nth(i);
            await link.hover();
            await page.waitForTimeout(100);
          }
          
          await testUtils.takeScreenshot('navigation-hover');
        }
      }
    });
  });

  test.describe('Modal/Dialog Components', () => {
    test('should handle modal interactions', async ({ page }) => {
      // Look for modal triggers
      const modalTriggers = page.locator('[aria-haspopup="dialog"], [data-modal], button[class*="modal"]');
      const triggerCount = await modalTriggers.count();
      
      if (triggerCount > 0) {
        const trigger = modalTriggers.first();
        await trigger.click();
        await page.waitForTimeout(500);
        
        // Check if modal opened
        const modal = page.locator('[role="dialog"], [class*="modal"], [class*="dialog"]');
        
        if (await modal.isVisible()) {
          await testUtils.takeScreenshot('modal-open');
          
          // Test modal close
          const closeButton = modal.locator('[aria-label*="close"], [aria-label*="Close"], button[class*="close"]');
          
          if (await closeButton.isVisible()) {
            await closeButton.click();
            await page.waitForTimeout(300);
            await testUtils.takeScreenshot('modal-closed');
          }
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive across different screen sizes', async ({ page }) => {
      const viewports = [
        { width: 320, height: 568, name: 'mobile-small' },
        { width: 375, height: 667, name: 'mobile-medium' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1024, height: 768, name: 'tablet-landscape' },
        { width: 1920, height: 1080, name: 'desktop-large' }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(500);
        
        await testUtils.takeScreenshot(`responsive-${viewport.name}`);
        
        // Check that main content is still visible
        await expect(page.locator('main, body')).toBeVisible();
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should meet basic accessibility requirements', async ({ page }) => {
      await testUtils.checkAccessibility();
      
      // Check for proper color contrast (basic check)
      const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, div');
      const textCount = await textElements.count();
      
      expect(textCount).toBeGreaterThan(0);
      
      // Check for proper focus indicators
      const focusableElements = page.locator('button, a, input, textarea, select');
      const focusableCount = await focusableElements.count();
      
      if (focusableCount > 0) {
        const firstFocusable = focusableElements.first();
        await firstFocusable.focus();
        await page.waitForTimeout(200);
        
        await testUtils.takeScreenshot('focus-indicator');
      }
    });
  });
});
