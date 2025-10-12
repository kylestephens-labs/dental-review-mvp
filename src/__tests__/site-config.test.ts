import { describe, test, expect } from 'vitest';
import { siteConfig } from '../config/site.config';

describe('Site Configuration', () => {
  describe('Business Information', () => {
    test('should have valid business name', () => {
      expect(siteConfig.name).toBeDefined();
      expect(typeof siteConfig.name).toBe('string');
      expect(siteConfig.name.length).toBeGreaterThan(0);
    });

    test('should have valid city', () => {
      expect(siteConfig.city).toBeDefined();
      expect(typeof siteConfig.city).toBe('string');
      expect(siteConfig.city.length).toBeGreaterThan(0);
    });

    test('should have valid phone number', () => {
      expect(siteConfig.phone).toBeDefined();
      expect(typeof siteConfig.phone).toBe('string');
      expect(siteConfig.phone.length).toBeGreaterThan(0);
    });

    test('should have valid email', () => {
      expect(siteConfig.email).toBeDefined();
      expect(typeof siteConfig.email).toBe('string');
      expect(siteConfig.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });

  describe('Address Information', () => {
    test('should have complete address', () => {
      expect(siteConfig.address).toBeDefined();
      expect(siteConfig.address.line1).toBeDefined();
      expect(siteConfig.address.city).toBeDefined();
      expect(siteConfig.address.region).toBeDefined();
      expect(siteConfig.address.postalCode).toBeDefined();
      expect(siteConfig.address.country).toBeDefined();
    });

    test('should have valid postal code format', () => {
      expect(siteConfig.address.postalCode).toMatch(/^\d{5}(-\d{4})?$/);
    });

    test('should have valid region code', () => {
      expect(siteConfig.address.region).toMatch(/^[A-Z]{2}$/);
    });
  });

  describe('Business Hours', () => {
    test('should have defined business hours', () => {
      expect(siteConfig.hours).toBeDefined();
      expect(Array.isArray(siteConfig.hours)).toBe(true);
      expect(siteConfig.hours.length).toBeGreaterThan(0);
    });

    test('should have valid time format', () => {
      siteConfig.hours.forEach(hour => {
        expect(hour.days).toBeDefined();
        expect(Array.isArray(hour.days)).toBe(true);
        expect(hour.opens).toMatch(/^\d{2}:\d{2}$/);
        expect(hour.closes).toMatch(/^\d{2}:\d{2}$/);
      });
    });
  });

  describe('Services', () => {
    test('should have defined services', () => {
      expect(siteConfig.services).toBeDefined();
      expect(Array.isArray(siteConfig.services)).toBe(true);
      expect(siteConfig.services.length).toBeGreaterThan(0);
    });

    test('should have valid service structure', () => {
      siteConfig.services.forEach(service => {
        expect(service.title).toBeDefined();
        expect(service.blurb).toBeDefined();
        expect(typeof service.title).toBe('string');
        expect(typeof service.blurb).toBe('string');
        expect(service.title.length).toBeGreaterThan(0);
        expect(service.blurb.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Value Propositions', () => {
    test('should have defined value propositions', () => {
      expect(siteConfig.valueProps).toBeDefined();
      expect(Array.isArray(siteConfig.valueProps)).toBe(true);
      expect(siteConfig.valueProps.length).toBeGreaterThan(0);
    });

    test('should have valid value proposition content', () => {
      siteConfig.valueProps.forEach(prop => {
        expect(typeof prop).toBe('string');
        expect(prop.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Insurance Providers', () => {
    test('should have defined insurance providers', () => {
      expect(siteConfig.insurers).toBeDefined();
      expect(Array.isArray(siteConfig.insurers)).toBe(true);
      expect(siteConfig.insurers.length).toBeGreaterThan(0);
    });

    test('should have valid insurance provider names', () => {
      siteConfig.insurers.forEach(insurer => {
        expect(typeof insurer).toBe('string');
        expect(insurer.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Rating Information', () => {
    test('should have valid rating', () => {
      expect(siteConfig.rating).toBeDefined();
      expect(typeof siteConfig.rating.stars).toBe('number');
      expect(siteConfig.rating.stars).toBeGreaterThanOrEqual(0);
      expect(siteConfig.rating.stars).toBeLessThanOrEqual(5);
      expect(typeof siteConfig.rating.count).toBe('number');
      expect(siteConfig.rating.count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Social Media', () => {
    test('should have valid social media URLs', () => {
      if (siteConfig.social) {
        Object.values(siteConfig.social).forEach(url => {
          expect(typeof url).toBe('string');
          expect(url).toMatch(/^https?:\/\/.+/);
        });
      }
    });
  });

  describe('Colors', () => {
    test('should have valid color codes', () => {
      expect(siteConfig.colors).toBeDefined();
      expect(siteConfig.colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(siteConfig.colors.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(siteConfig.colors.bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe('Map Integration', () => {
    test('should have valid map embed URL', () => {
      expect(siteConfig.mapEmbedUrl).toBeDefined();
      expect(typeof siteConfig.mapEmbedUrl).toBe('string');
      expect(siteConfig.mapEmbedUrl).toMatch(/^https?:\/\/.+/);
    });
  });
});
