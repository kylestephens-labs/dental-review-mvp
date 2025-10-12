import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '../hooks/use-mobile';

// Mock window.matchMedia
const mockMatchMedia = vi.fn();

describe('useIsMobile Hook', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });
    
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024, // Default desktop width
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should return false for desktop width (1024px)', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(false);
  });

  test('should return true for mobile width (375px)', () => {
    // Set mobile width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375,
    });

    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(true);
  });

  test('should return true for tablet width (767px)', () => {
    // Set tablet width (just below mobile breakpoint)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 767,
    });

    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(true);
  });

  test('should return false for tablet width (768px)', () => {
    // Set tablet width (at mobile breakpoint)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 768,
    });

    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(false);
  });

  test('should add and remove event listeners correctly', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener,
      removeEventListener,
    });

    const { unmount } = renderHook(() => useIsMobile());
    
    // Verify event listener was added
    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    
    // Unmount and verify event listener was removed
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  test('should update state when media query changes', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    let changeCallback: (() => void) | null = null;
    
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: (event: string, callback: () => void) => {
        if (event === 'change') {
          changeCallback = callback;
        }
        addEventListener(event, callback);
      },
      removeEventListener,
    });

    const { result, rerender } = renderHook(() => useIsMobile());
    
    // Initial state should be false
    expect(result.current).toBe(false);
    
    // Simulate window resize to mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375,
    });
    
    // Trigger the change callback
    act(() => {
      if (changeCallback) {
        changeCallback();
      }
    });
    
    // State should now be true
    expect(result.current).toBe(true);
  });

  test('should handle undefined initial state correctly', () => {
    // Mock initial state as undefined
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useIsMobile());
    
    // Should return false (!!undefined = false)
    expect(result.current).toBe(false);
  });

  test('should work with different breakpoint values', () => {
    // Test edge cases around the breakpoint
    const testCases = [
      { width: 767, expected: true },   // Just below breakpoint
      { width: 768, expected: false },  // At breakpoint
      { width: 769, expected: false },  // Just above breakpoint
    ];

    testCases.forEach(({ width, expected }) => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: width,
      });

      mockMatchMedia.mockReturnValue({
        matches: width < 768,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(expected);
    });
  });

  test('should handle multiple hook instances independently', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result: result1 } = renderHook(() => useIsMobile());
    const { result: result2 } = renderHook(() => useIsMobile());
    
    // Both should return the same value
    expect(result1.current).toBe(result2.current);
    expect(result1.current).toBe(false);
  });
});
