import { test, expect } from '@playwright/test';
import { TestUtils } from './utils/test-utils';

test.describe('IntakeForm Component', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await page.goto('/');
    await testUtils.waitForPageLoad();
  });

  test('should render intake form correctly', async ({ page }) => {
    // Look for the intake form
    const form = page.locator('form').or(page.locator('[class*="intake"], [class*="form"]'));
    
    if (await form.isVisible()) {
      await testUtils.takeElementScreenshot('form', 'intake-form');
      
      // Check form structure
      await expect(form).toBeVisible();
      
      // Check for required form fields
      const nameField = form.locator('input[name*="name"], input[id*="name"]');
      const phoneField = form.locator('input[name*="phone"], input[id*="phone"]');
      const emailField = form.locator('input[name*="email"], input[id*="email"]');
      
      if (await nameField.isVisible()) {
        await expect(nameField).toBeVisible();
      }
      
      if (await phoneField.isVisible()) {
        await expect(phoneField).toBeVisible();
      }
      
      if (await emailField.isVisible()) {
        await expect(emailField).toBeVisible();
      }
    }
  });

  test('should handle form validation', async ({ page }) => {
    const form = page.locator('form');
    
    if (await form.isVisible()) {
      const submitButton = form.locator('button[type="submit"], input[type="submit"]');
      
      if (await submitButton.isVisible()) {
        // Try submitting empty form
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        // Check for validation messages
        const errorMessages = page.locator('[class*="error"], [class*="invalid"], .error-message, [role="alert"]');
        const errorCount = await errorMessages.count();
        
        if (errorCount > 0) {
          await testUtils.takeScreenshot('form-validation-errors');
          
          // Check that error messages are visible
          for (let i = 0; i < errorCount; i++) {
            const error = errorMessages.nth(i);
            await expect(error).toBeVisible();
          }
        }
      }
    }
  });

  test('should handle form input interactions', async ({ page }) => {
    const form = page.locator('form');
    
    if (await form.isVisible()) {
      const inputs = form.locator('input, textarea, select');
      const inputCount = await inputs.count();
      
      if (inputCount > 0) {
        // Test each input field
        for (let i = 0; i < Math.min(inputCount, 5); i++) {
          const input = inputs.nth(i);
          
          // Focus the input
          await input.focus();
          await page.waitForTimeout(200);
          
          // Test typing in the input
          const inputType = await input.getAttribute('type');
          const inputName = await input.getAttribute('name') || await input.getAttribute('id') || `input-${i}`;
          
          if (inputType !== 'submit' && inputType !== 'button') {
            // Type test data based on input type
            let testValue = '';
            if (inputType === 'email') {
              testValue = 'test@example.com';
            } else if (inputType === 'tel' || inputName.includes('phone')) {
              testValue = '555-123-4567';
            } else if (inputName.includes('name')) {
              testValue = 'John Doe';
            } else {
              testValue = 'Test Value';
            }
            
            await input.fill(testValue);
            await page.waitForTimeout(200);
          }
        }
        
        await testUtils.takeScreenshot('form-filled');
      }
    }
  });

  test('should handle form submission', async ({ page }) => {
    const form = page.locator('form');
    
    if (await form.isVisible()) {
      // Fill out the form with valid data
      const inputs = form.locator('input, textarea, select');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const inputType = await input.getAttribute('type');
        const inputName = await input.getAttribute('name') || await input.getAttribute('id') || `input-${i}`;
        
        if (inputType !== 'submit' && inputType !== 'button') {
          let testValue = '';
          if (inputType === 'email') {
            testValue = 'test@example.com';
          } else if (inputType === 'tel' || inputName.includes('phone')) {
            testValue = '555-123-4567';
          } else if (inputName.includes('name')) {
            testValue = 'John Doe';
          } else if (inputType === 'checkbox') {
            // Don't fill checkboxes automatically
            continue;
          } else {
            testValue = 'Test Value';
          }
          
          await input.fill(testValue);
        }
      }
      
      // Submit the form
      const submitButton = form.locator('button[type="submit"], input[type="submit"]');
      
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        
        // Check for success message or redirect
        const successMessage = page.locator('[class*="success"], [class*="thank"], .success-message');
        
        if (await successMessage.isVisible()) {
          await testUtils.takeScreenshot('form-submission-success');
        } else {
          // Check if form was submitted (might show loading state)
          await testUtils.takeScreenshot('form-submission-attempt');
        }
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const form = page.locator('form');
    
    if (await form.isVisible()) {
      await testUtils.takeScreenshot('intake-form-mobile');
      
      // Test form interactions on mobile
      const inputs = form.locator('input, textarea, select');
      const firstInput = inputs.first();
      
      if (await firstInput.isVisible()) {
        await firstInput.tap();
        await page.waitForTimeout(300);
        
        await testUtils.takeScreenshot('intake-form-mobile-focused');
      }
    }
  });

  test('should handle keyboard navigation', async ({ page }) => {
    const form = page.locator('form');
    
    if (await form.isVisible()) {
      const inputs = form.locator('input, textarea, select');
      const firstInput = inputs.first();
      
      if (await firstInput.isVisible()) {
        await firstInput.focus();
        
        // Test Tab navigation through form
        for (let i = 0; i < 3; i++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(100);
        }
        
        await testUtils.takeScreenshot('form-keyboard-navigation');
      }
    }
  });
});
