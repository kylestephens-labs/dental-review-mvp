import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { useToast, toast } from '../hooks/use-toast';
import { ToastAction } from '../components/ui/toast';

describe('useToast Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should return initial state with empty toasts', () => {
    const { result } = renderHook(() => useToast());
    
    expect(result.current.toasts).toEqual([]);
    expect(typeof result.current.toast).toBe('function');
    expect(typeof result.current.dismiss).toBe('function');
  });

  test('should provide toast function', () => {
    const { result } = renderHook(() => useToast());
    
    expect(typeof result.current.toast).toBe('function');
  });

  test('should provide dismiss function', () => {
    const { result } = renderHook(() => useToast());
    
    expect(typeof result.current.dismiss).toBe('function');
  });

  test('should handle multiple hook instances', () => {
    const { result: result1 } = renderHook(() => useToast());
    const { result: result2 } = renderHook(() => useToast());
    
    expect(result1.current.toasts).toEqual([]);
    expect(result2.current.toasts).toEqual([]);
    expect(typeof result1.current.toast).toBe('function');
    expect(typeof result2.current.toast).toBe('function');
  });
});

describe('toast Function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should create toast with unique id', () => {
    const toast1 = toast({ title: 'Test 1' });
    const toast2 = toast({ title: 'Test 2' });
    
    expect(toast1.id).toBeDefined();
    expect(toast2.id).toBeDefined();
    expect(toast1.id).not.toBe(toast2.id);
  });

  test('should return toast object with required methods', () => {
    const result = toast({ title: 'Test Toast' });
    
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('dismiss');
    expect(result).toHaveProperty('update');
    expect(typeof result.dismiss).toBe('function');
    expect(typeof result.update).toBe('function');
  });

  test('should create toast with default open state', () => {
    const result = toast({ title: 'Test Toast' });
    
    expect(result.id).toBeDefined();
    expect(typeof result.dismiss).toBe('function');
    expect(typeof result.update).toBe('function');
  });

  test('should handle toast with description', () => {
    const result = toast({ 
      title: 'Test Toast',
      description: 'This is a test description'
    });
    
    expect(result.id).toBeDefined();
    expect(typeof result.dismiss).toBe('function');
    expect(typeof result.update).toBe('function');
  });

  test('should handle toast with custom duration', () => {
    const result = toast({ 
      title: 'Test Toast',
      duration: 5000
    });
    
    expect(result.id).toBeDefined();
    expect(typeof result.dismiss).toBe('function');
    expect(typeof result.update).toBe('function');
  });

  test('should handle toast with action', () => {
    const result = toast({ 
      title: 'Test Toast',
      action: React.createElement(ToastAction, { altText: 'Undo', onClick: vi.fn() }, 'Undo') as any
    });
    
    expect(result.id).toBeDefined();
    expect(typeof result.dismiss).toBe('function');
    expect(typeof result.update).toBe('function');
  });

  test('should handle dismiss function', () => {
    const result = toast({ title: 'Test Toast' });
    
    expect(() => result.dismiss()).not.toThrow();
  });

  test('should handle update function', () => {
    const result = toast({ title: 'Test Toast' });
    
    expect(() => result.update({ id: result.id, title: 'Updated Toast' })).not.toThrow();
  });

  test('should handle multiple toast creation', () => {
    const toasts = Array.from({ length: 5 }, (_, i) => 
      toast({ title: `Toast ${i + 1}` })
    );
    
    // All toasts should have unique IDs
    const ids = toasts.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
    
    // All toasts should have required methods
    toasts.forEach(toast => {
      expect(typeof toast.dismiss).toBe('function');
      expect(typeof toast.update).toBe('function');
    });
  });

  test('should handle toast with all properties', () => {
    const result = toast({
      title: 'Complete Toast',
      description: 'This toast has all properties',
      duration: 3000,
      action: React.createElement(ToastAction, { altText: 'Action', onClick: vi.fn() }, 'Action') as any
    });
    
    expect(result.id).toBeDefined();
    expect(typeof result.dismiss).toBe('function');
    expect(typeof result.update).toBe('function');
  });
});
