import { Page, expect } from '@playwright/test';

export class TestUtils {
  constructor(private page: Page) {}

  /**
   * Wait for the page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Take a screenshot with a custom name
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  /**
   * Take a screenshot of a specific element
   */
  async takeElementScreenshot(selector: string, name: string) {
    const element = this.page.locator(selector);
    await element.screenshot({ 
      path: `test-results/screenshots/${name}.png` 
    });
  }

  /**
   * Check if an element is visible and has correct styling
   */
  async checkElementVisibility(selector: string, expectedText?: string) {
    const element = this.page.locator(selector);
    await expect(element).toBeVisible();
    
    if (expectedText) {
      await expect(element).toContainText(expectedText);
    }
  }

  /**
   * Check responsive design at different viewport sizes
   */
  async checkResponsiveDesign(viewportSizes: Array<{ width: number; height: number; name: string }>) {
    for (const size of viewportSizes) {
      await this.page.setViewportSize({ width: size.width, height: size.height });
      await this.page.waitForTimeout(500); // Wait for layout to adjust
      await this.takeScreenshot(`responsive-${size.name}`);
    }
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(startSelector: string) {
    const startElement = this.page.locator(startSelector);
    await startElement.focus();
    
    // Test Tab navigation
    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(100);
    
    // Test Enter key
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(100);
  }

  /**
   * Test form interactions
   */
  async testFormInteraction(formSelector: string, fieldData: Record<string, string>) {
    const form = this.page.locator(formSelector);
    
    for (const [fieldName, value] of Object.entries(fieldData)) {
      const field = form.locator(`[name="${fieldName}"], [id="${fieldName}"]`);
      await field.fill(value);
      await this.page.waitForTimeout(100);
    }
  }

  /**
   * Check accessibility basics
   */
  async checkAccessibility() {
    // Check for proper heading hierarchy
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
    
    // Check for alt text on images
    const images = await this.page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
    
    // Check for proper button/link text
    const buttons = await this.page.locator('button').all();
    for (const button of buttons) {
      const text = await button.textContent();
      expect(text?.trim()).toBeTruthy();
    }
  }
}
