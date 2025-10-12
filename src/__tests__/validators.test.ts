import { describe, test, expect } from 'vitest';
import { leadFormSchema, type LeadFormData } from '../lib/validators';

describe('Lead Form Validation', () => {
  describe('Valid Form Data', () => {
    test('should pass validation with valid data', () => {
      const validData: LeadFormData = {
        name: 'John Doe',
        phone: '+1-555-123-4567',
        email: 'john@example.com',
        service: 'Family Dentistry',
        preferredDate: '2024-01-15',
        preferredTime: '9:00 AM - 10:00 AM',
        notes: 'First time patient',
        smsOptIn: true
      };

      const result = leadFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    test('should pass validation with only phone number', () => {
      const validData: LeadFormData = {
        name: 'Jane Smith',
        phone: '555-123-4567',
        email: '',
        service: 'Cosmetic Dentistry',
        preferredDate: '2024-01-16',
        preferredTime: '2:00 PM - 3:00 PM',
        notes: '',
        smsOptIn: false
      };

      const result = leadFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should pass validation with only email', () => {
      const validData: LeadFormData = {
        name: 'Bob Johnson',
        phone: '',
        email: 'bob@example.com',
        service: 'Emergency Care',
        preferredDate: '2024-01-17',
        preferredTime: '8:00 AM - 9:00 AM',
        notes: 'Urgent appointment needed',
        smsOptIn: true
      };

      const result = leadFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Name Validation', () => {
    test('should reject empty name', () => {
      const invalidData = {
        name: '',
        phone: '555-123-4567',
        email: '',
        service: 'Family Dentistry',
        preferredDate: '2024-01-15',
        preferredTime: '9:00 AM - 10:00 AM'
      };

      const result = leadFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['name']);
        expect(result.error.issues[0].message).toBe('Name is required');
      }
    });

    test('should reject name with only whitespace', () => {
      const invalidData = {
        name: '   ',
        phone: '555-123-4567',
        email: '',
        service: 'Family Dentistry',
        preferredDate: '2024-01-15',
        preferredTime: '9:00 AM - 10:00 AM'
      };

      const result = leadFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject name longer than 100 characters', () => {
      const invalidData = {
        name: 'A'.repeat(101),
        phone: '555-123-4567',
        email: '',
        service: 'Family Dentistry',
        preferredDate: '2024-01-15',
        preferredTime: '9:00 AM - 10:00 AM'
      };

      const result = leadFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name must be less than 100 characters');
      }
    });

    test('should accept name with special characters', () => {
      const validData: LeadFormData = {
        name: "O'Connor-Smith",
        phone: '555-123-4567',
        email: '',
        service: 'Family Dentistry',
        preferredDate: '2024-01-15',
        preferredTime: '9:00 AM - 10:00 AM'
      };

      const result = leadFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Phone Validation', () => {
    test('should accept valid phone formats', () => {
      const validPhones = [
        '555-123-4567',
        '(555) 123-4567',
        '+1-555-123-4567',
        '555 123 4567',
        '+1 555 123 4567'
      ];

      validPhones.forEach(phone => {
        const validData: LeadFormData = {
          name: 'John Doe',
          phone,
          email: '',
          service: 'Family Dentistry',
          preferredDate: '2024-01-15',
          preferredTime: '9:00 AM - 10:00 AM'
        };

        const result = leadFormSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    test('should reject invalid phone formats', () => {
      const invalidPhones = [
        'abc-def-ghij',
        '123',
        '555-123',
        '555-123-4567a'  // contains letters
      ];

      invalidPhones.forEach(phone => {
        const invalidData = {
          name: 'John Doe',
          phone,
          email: '',
          service: 'Family Dentistry',
          preferredDate: '2024-01-15',
          preferredTime: '9:00 AM - 10:00 AM'
        };

        const result = leadFormSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          // Check for either regex validation error or length validation error
          const errorMessage = result.error.issues[0].message;
          expect(errorMessage).toMatch(/Please enter a valid phone number|Phone number must be at least 10 digits/);
        }
      });
    });

    test('should accept empty phone when email is provided', () => {
      const validData: LeadFormData = {
        name: 'John Doe',
        phone: '',
        email: 'john@example.com',
        service: 'Family Dentistry',
        preferredDate: '2024-01-15',
        preferredTime: '9:00 AM - 10:00 AM'
      };

      const result = leadFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Email Validation', () => {
    test('should accept valid email formats', () => {
      const validEmails = [
        'john@example.com',
        'jane.doe@company.co.uk',
        'user+tag@domain.org',
        'test123@subdomain.example.com'
      ];

      validEmails.forEach(email => {
        const validData: LeadFormData = {
          name: 'John Doe',
          phone: '',
          email,
          service: 'Family Dentistry',
          preferredDate: '2024-01-15',
          preferredTime: '9:00 AM - 10:00 AM'
        };

        const result = leadFormSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    test('should reject invalid email formats', () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'john@',
        'john@.com',
        'john..doe@example.com',
        'john@example..com'
      ];

      invalidEmails.forEach(email => {
        const invalidData = {
          name: 'John Doe',
          phone: '',
          email,
          service: 'Family Dentistry',
          preferredDate: '2024-01-15',
          preferredTime: '9:00 AM - 10:00 AM'
        };

        const result = leadFormSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Please enter a valid email address');
        }
      });
    });

    test('should reject email longer than 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const invalidData = {
        name: 'John Doe',
        phone: '',
        email: longEmail,
        service: 'Family Dentistry',
        preferredDate: '2024-01-15',
        preferredTime: '9:00 AM - 10:00 AM'
      };

      const result = leadFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email must be less than 255 characters');
      }
    });
  });

  describe('Service Validation', () => {
    test('should reject empty service', () => {
      const invalidData = {
        name: 'John Doe',
        phone: '555-123-4567',
        email: '',
        service: '',
        preferredDate: '2024-01-15',
        preferredTime: '9:00 AM - 10:00 AM'
      };

      const result = leadFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please select a service');
      }
    });

    test('should accept valid service', () => {
      const validData: LeadFormData = {
        name: 'John Doe',
        phone: '555-123-4567',
        email: '',
        service: 'Family Dentistry',
        preferredDate: '2024-01-15',
        preferredTime: '9:00 AM - 10:00 AM'
      };

      const result = leadFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Date and Time Validation', () => {
    test('should reject empty preferred date', () => {
      const invalidData = {
        name: 'John Doe',
        phone: '555-123-4567',
        email: '',
        service: 'Family Dentistry',
        preferredDate: '',
        preferredTime: '9:00 AM - 10:00 AM'
      };

      const result = leadFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please select a preferred date');
      }
    });

    test('should reject empty preferred time', () => {
      const invalidData = {
        name: 'John Doe',
        phone: '555-123-4567',
        email: '',
        service: 'Family Dentistry',
        preferredDate: '2024-01-15',
        preferredTime: ''
      };

      const result = leadFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please select a preferred time');
      }
    });
  });

  describe('Notes Validation', () => {
    test('should accept empty notes', () => {
      const validData: LeadFormData = {
        name: 'John Doe',
        phone: '555-123-4567',
        email: '',
        service: 'Family Dentistry',
        preferredDate: '2024-01-15',
        preferredTime: '9:00 AM - 10:00 AM',
        notes: ''
      };

      const result = leadFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should reject notes longer than 1000 characters', () => {
      const invalidData = {
        name: 'John Doe',
        phone: '555-123-4567',
        email: '',
        service: 'Family Dentistry',
        preferredDate: '2024-01-15',
        preferredTime: '9:00 AM - 10:00 AM',
        notes: 'A'.repeat(1001)
      };

      const result = leadFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Notes must be less than 1000 characters');
      }
    });

    test('should accept notes at 1000 character limit', () => {
      const validData: LeadFormData = {
        name: 'John Doe',
        phone: '555-123-4567',
        email: '',
        service: 'Family Dentistry',
        preferredDate: '2024-01-15',
        preferredTime: '9:00 AM - 10:00 AM',
        notes: 'A'.repeat(1000)
      };

      const result = leadFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Contact Information Requirement', () => {
    test('should reject when both phone and email are empty', () => {
      const invalidData = {
        name: 'John Doe',
        phone: '',
        email: '',
        service: 'Family Dentistry',
        preferredDate: '2024-01-15',
        preferredTime: '9:00 AM - 10:00 AM'
      };

      const result = leadFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please provide either a phone number or email address');
        expect(result.error.issues[0].path).toEqual(['phone']);
      }
    });

    test('should accept when phone is provided but email is empty', () => {
      const validData: LeadFormData = {
        name: 'John Doe',
        phone: '555-123-4567',
        email: '',
        service: 'Family Dentistry',
        preferredDate: '2024-01-15',
        preferredTime: '9:00 AM - 10:00 AM'
      };

      const result = leadFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should accept when email is provided but phone is empty', () => {
      const validData: LeadFormData = {
        name: 'John Doe',
        phone: '',
        email: 'john@example.com',
        service: 'Family Dentistry',
        preferredDate: '2024-01-15',
        preferredTime: '9:00 AM - 10:00 AM'
      };

      const result = leadFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('SMS Opt-in Validation', () => {
    test('should accept smsOptIn as true', () => {
      const validData: LeadFormData = {
        name: 'John Doe',
        phone: '555-123-4567',
        email: '',
        service: 'Family Dentistry',
        preferredDate: '2024-01-15',
        preferredTime: '9:00 AM - 10:00 AM',
        smsOptIn: true
      };

      const result = leadFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should accept smsOptIn as false', () => {
      const validData: LeadFormData = {
        name: 'John Doe',
        phone: '555-123-4567',
        email: '',
        service: 'Family Dentistry',
        preferredDate: '2024-01-15',
        preferredTime: '9:00 AM - 10:00 AM',
        smsOptIn: false
      };

      const result = leadFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should accept undefined smsOptIn', () => {
      const validData: LeadFormData = {
        name: 'John Doe',
        phone: '555-123-4567',
        email: '',
        service: 'Family Dentistry',
        preferredDate: '2024-01-15',
        preferredTime: '9:00 AM - 10:00 AM'
        // smsOptIn is optional
      };

      const result = leadFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
