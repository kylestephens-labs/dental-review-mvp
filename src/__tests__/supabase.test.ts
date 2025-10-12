import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        error: null
      }))
    }))
  }
}));

import { submitLead } from '../lib/supabase';
import { supabase } from '@/integrations/supabase/client';

// Cast to mock for type safety
const mockSupabase = supabase as any;

describe('Supabase Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitLead', () => {
    test('should successfully submit lead data', async () => {
      const leadData = {
        business_name: 'Test Dental',
        city: 'Test City',
        source: 'web',
        form: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-123-4567',
          service: 'Family Dentistry',
          preferredDate: '2024-01-15',
          preferredTime: '9:00 AM - 10:00 AM',
          notes: 'First time patient',
          smsOptIn: true
        }
      };

      const mockInsert = vi.fn().mockReturnValue({ error: null });
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      await expect(submitLead(leadData)).resolves.not.toThrow();
      
      expect(mockSupabase.from).toHaveBeenCalledWith('leads');
      expect(mockInsert).toHaveBeenCalledWith([leadData]);
    });

    test('should throw error when database operation fails', async () => {
      const leadData = {
        business_name: 'Test Dental',
        city: 'Test City',
        source: 'web',
        form: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-123-4567',
          service: 'Family Dentistry',
          preferredDate: '2024-01-15',
          preferredTime: '9:00 AM - 10:00 AM'
        }
      };

      const mockError = new Error('Database connection failed');
      const mockInsert = vi.fn().mockReturnValue({ error: mockError });
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      await expect(submitLead(leadData)).rejects.toThrow('Database connection failed');
      
      expect(mockSupabase.from).toHaveBeenCalledWith('leads');
      expect(mockInsert).toHaveBeenCalledWith([leadData]);
    });

    test('should handle network errors', async () => {
      const leadData = {
        business_name: 'Test Dental',
        city: 'Test City',
        source: 'web',
        form: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-123-4567',
          service: 'Family Dentistry',
          preferredDate: '2024-01-15',
          preferredTime: '9:00 AM - 10:00 AM'
        }
      };

      const mockError = new Error('Network error');
      const mockInsert = vi.fn().mockReturnValue({ error: mockError });
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      await expect(submitLead(leadData)).rejects.toThrow('Network error');
    });

    test('should handle empty lead data', async () => {
      const emptyLeadData = {};

      const mockInsert = vi.fn().mockReturnValue({ error: null });
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      await expect(submitLead(emptyLeadData)).resolves.not.toThrow();
      
      expect(mockSupabase.from).toHaveBeenCalledWith('leads');
      expect(mockInsert).toHaveBeenCalledWith([emptyLeadData]);
    });

    test('should handle null lead data', async () => {
      const nullLeadData = null as any;

      const mockInsert = vi.fn().mockReturnValue({ error: null });
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      await expect(submitLead(nullLeadData)).resolves.not.toThrow();
      
      expect(mockSupabase.from).toHaveBeenCalledWith('leads');
      expect(mockInsert).toHaveBeenCalledWith([nullLeadData]);
    });
  });
});
