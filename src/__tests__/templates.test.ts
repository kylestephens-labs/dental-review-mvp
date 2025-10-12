import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Template System', () => {
  test('should read EN template and check placeholder tokens render', () => {
    // This test will fail initially because we haven't created the templates yet
    const templatePath = join(process.cwd(), 'common/templates/review-request-en.json');
    const templateData = JSON.parse(readFileSync(templatePath, 'utf-8'));
    
    // Check that template has required structure
    expect(templateData).toHaveProperty('name');
    expect(templateData).toHaveProperty('locale', 'en');
    expect(templateData).toHaveProperty('channel', 'sms');
    expect(templateData).toHaveProperty('body');
    
    // Check that template body contains placeholder tokens
    const body = templateData.body;
    expect(body).toContain('{{practice_name}}');
    expect(body).toContain('{{review_link}}');
    expect(body).toContain('{{patient_name}}');
    
    // Test that placeholder tokens can be replaced
    const testData = {
      practice_name: 'Test Dental Practice',
      review_link: 'https://g.page/test-dental/review',
      patient_name: 'John Doe'
    };
    
    let renderedBody = body;
    Object.entries(testData).forEach(([key, value]) => {
      renderedBody = renderedBody.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    
    // Verify all placeholders were replaced
    expect(renderedBody).not.toContain('{{');
    expect(renderedBody).not.toContain('}}');
    expect(renderedBody).toContain('Test Dental Practice');
    expect(renderedBody).toContain('https://g.page/test-dental/review');
    expect(renderedBody).toContain('John Doe');
  });

  test('should read ES template and check placeholder tokens render', () => {
    // This test will fail initially because we haven't created the templates yet
    const templatePath = join(process.cwd(), 'common/templates/review-request-es.json');
    const templateData = JSON.parse(readFileSync(templatePath, 'utf-8'));
    
    // Check that template has required structure
    expect(templateData).toHaveProperty('name');
    expect(templateData).toHaveProperty('locale', 'es');
    expect(templateData).toHaveProperty('channel', 'sms');
    expect(templateData).toHaveProperty('body');
    
    // Check that template body contains placeholder tokens
    const body = templateData.body;
    expect(body).toContain('{{practice_name}}');
    expect(body).toContain('{{review_link}}');
    expect(body).toContain('{{patient_name}}');
    
    // Test that placeholder tokens can be replaced
    const testData = {
      practice_name: 'Clínica Dental de Prueba',
      review_link: 'https://g.page/test-dental/review',
      patient_name: 'Juan Pérez'
    };
    
    let renderedBody = body;
    Object.entries(testData).forEach(([key, value]) => {
      renderedBody = renderedBody.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    
    // Verify all placeholders were replaced
    expect(renderedBody).not.toContain('{{');
    expect(renderedBody).not.toContain('}}');
    expect(renderedBody).toContain('Clínica Dental de Prueba');
    expect(renderedBody).toContain('https://g.page/test-dental/review');
    expect(renderedBody).toContain('Juan Pérez');
  });

  test('should validate ADA compliance requirements', () => {
    // Test that templates meet ADA compliance requirements
    const enTemplatePath = join(process.cwd(), 'common/templates/review-request-en.json');
    const esTemplatePath = join(process.cwd(), 'common/templates/review-request-es.json');
    
    const enTemplate = JSON.parse(readFileSync(enTemplatePath, 'utf-8'));
    const esTemplate = JSON.parse(readFileSync(esTemplatePath, 'utf-8'));
    
    // ADA compliance checks
    const checkADACompliance = (template: any) => {
      const body = template.body;
      
      // Should not contain all caps (harder to read)
      expect(body).not.toMatch(/[A-Z]{3,}/);
      
      // Should be clear and simple language
      expect(body.length).toBeLessThan(160); // SMS character limit
      
      // Should include opt-out instructions
      expect(body.toLowerCase()).toMatch(/stop|alto/);
      
      // Should be respectful and professional
      expect(body).not.toContain('!');
      expect(body).not.toContain('urgent');
      expect(body).not.toContain('immediately');
    };
    
    checkADACompliance(enTemplate);
    checkADACompliance(esTemplate);
  });
});
