import { test, expect } from '@playwright/test';
import { TestUtils } from './utils/test-utils';

test.describe('Shadcn/UI Components', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await page.goto('/');
    await testUtils.waitForPageLoad();
  });

  test.describe('Button Component', () => {
    test('should render shadcn button variants', async ({ page }) => {
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        await testUtils.takeScreenshot('shadcn-buttons');
        
        // Test different button states
        for (let i = 0; i < Math.min(buttonCount, 3); i++) {
          const button = buttons.nth(i);
          
          // Test hover state
          await button.hover();
          await page.waitForTimeout(200);
          
          // Test focus state
          await button.focus();
          await page.waitForTimeout(200);
        }
        
        await testUtils.takeScreenshot('shadcn-buttons-interactive');
      }
    });
  });

  test.describe('Form Components', () => {
    test('should render shadcn form elements', async ({ page }) => {
      // Look for shadcn form components
      const formElements = page.locator('[class*="form-"], .form-field, .form-item');
      const elementCount = await formElements.count();
      
      if (elementCount > 0) {
        await testUtils.takeScreenshot('shadcn-form-elements');
        
        // Test form interactions
        const inputs = page.locator('input, textarea, select');
        const inputCount = await inputs.count();
        
        if (inputCount > 0) {
          const firstInput = inputs.first();
          await firstInput.focus();
          await page.waitForTimeout(200);
          
          await testUtils.takeScreenshot('shadcn-form-focused');
        }
      }
    });
  });

  test.describe('Card Components', () => {
    test('should render shadcn cards', async ({ page }) => {
      const cards = page.locator('[class*="card"], .card');
      const cardCount = await cards.count();
      
      if (cardCount > 0) {
        await testUtils.takeScreenshot('shadcn-cards');
        
        // Test card interactions
        for (let i = 0; i < Math.min(cardCount, 3); i++) {
          const card = cards.nth(i);
          await card.hover();
          await page.waitForTimeout(200);
        }
        
        await testUtils.takeScreenshot('shadcn-cards-hover');
      }
    });
  });

  test.describe('Dialog/Modal Components', () => {
    test('should handle shadcn dialogs', async ({ page }) => {
      // Look for dialog triggers
      const dialogTriggers = page.locator('[data-state], [aria-haspopup="dialog"]');
      const triggerCount = await dialogTriggers.count();
      
      if (triggerCount > 0) {
        const trigger = dialogTriggers.first();
        await trigger.click();
        await page.waitForTimeout(500);
        
        // Check if dialog opened
        const dialog = page.locator('[role="dialog"], [data-state="open"]');
        
        if (await dialog.isVisible()) {
          await testUtils.takeScreenshot('shadcn-dialog-open');
          
          // Test dialog close
          const closeButton = dialog.locator('[aria-label*="close"], button[class*="close"]');
          
          if (await closeButton.isVisible()) {
            await closeButton.click();
            await page.waitForTimeout(300);
            await testUtils.takeScreenshot('shadcn-dialog-closed');
          }
        }
      }
    });
  });

  test.describe('Toast Components', () => {
    test('should handle toast notifications', async ({ page }) => {
      // Look for toast triggers or check if toasts are already visible
      const toasts = page.locator('[role="alert"], [class*="toast"], .toast');
      const toastCount = await toasts.count();
      
      if (toastCount > 0) {
        await testUtils.takeScreenshot('shadcn-toasts');
        
        // Test toast interactions
        for (let i = 0; i < toastCount; i++) {
          const toast = toasts.nth(i);
          await expect(toast).toBeVisible();
        }
      }
    });
  });

  test.describe('Tooltip Components', () => {
    test('should handle tooltips', async ({ page }) => {
      // Look for elements with tooltips
      const tooltipTriggers = page.locator('[data-tooltip], [title], [aria-describedby]');
      const triggerCount = await tooltipTriggers.count();
      
      if (triggerCount > 0) {
        const trigger = tooltipTriggers.first();
        await trigger.hover();
        await page.waitForTimeout(500);
        
        // Check if tooltip appeared
        const tooltip = page.locator('[role="tooltip"], [class*="tooltip"]');
        
        if (await tooltip.isVisible()) {
          await testUtils.takeScreenshot('shadcn-tooltip');
        }
      }
    });
  });

  test.describe('Input Components', () => {
    test('should render input variants', async ({ page }) => {
      const inputs = page.locator('input, textarea, select');
      const inputCount = await inputs.count();
      
      if (inputCount > 0) {
        await testUtils.takeScreenshot('shadcn-inputs');
        
        // Test different input types
        for (let i = 0; i < Math.min(inputCount, 5); i++) {
          const input = inputs.nth(i);
          const inputType = await input.getAttribute('type');
          
          await input.focus();
          await page.waitForTimeout(200);
          
          // Test different input types
          if (inputType === 'text' || inputType === 'email' || inputType === 'tel') {
            await input.fill('Test Input');
            await page.waitForTimeout(200);
          }
        }
        
        await testUtils.takeScreenshot('shadcn-inputs-filled');
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive across viewports', async ({ page }) => {
      const viewports = [
        { width: 320, height: 568, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1920, height: 1080, name: 'desktop' }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(500);
        
        await testUtils.takeScreenshot(`shadcn-responsive-${viewport.name}`);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should meet accessibility standards', async ({ page }) => {
      await testUtils.checkAccessibility();
      
      // Check for proper ARIA attributes
      const ariaElements = page.locator('[aria-label], [aria-describedby], [aria-expanded]');
      const ariaCount = await ariaElements.count();
      
      expect(ariaCount).toBeGreaterThan(0);
      
      // Check for proper focus management
      const focusableElements = page.locator('button, a, input, textarea, select, [tabindex]');
      const focusableCount = await focusableElements.count();
      
      if (focusableCount > 0) {
        const firstFocusable = focusableElements.first();
        await firstFocusable.focus();
        await page.waitForTimeout(200);
        
        await testUtils.takeScreenshot('shadcn-focus-management');
      }
    });
  });
});
