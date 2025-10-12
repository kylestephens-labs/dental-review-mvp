import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotFound from '../pages/NotFound';

// Mock react-router-dom
const mockUseLocation = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockUseLocation(),
  };
});

// Mock useEffect to actually call the callback
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useEffect: (callback: () => void) => {
      callback();
    },
  };
});

describe('NotFound Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock for useLocation
    mockUseLocation.mockReturnValue({
      pathname: '/non-existent-route',
      search: '',
      hash: '',
      state: null,
      key: 'default'
    });
  });

  test('should render 404 error message', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Oops! Page not found')).toBeInTheDocument();
  });

  test('should render return to home link', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );

    const homeLink = screen.getByText('Return to Home');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
    expect(homeLink).toHaveClass('text-blue-500', 'underline', 'hover:text-blue-700');
  });

  test('should have correct styling classes', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );

    // Find the outer container (should have the flex classes)
    const outerContainer = screen.getByText('404').closest('div')?.parentElement;
    expect(outerContainer).toHaveClass('flex', 'min-h-screen', 'items-center', 'justify-center', 'bg-gray-100');

    // Find the inner content div (should have text-center)
    const contentDiv = screen.getByText('404').closest('div');
    expect(contentDiv).toHaveClass('text-center');
  });

  test('should log error with current pathname', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const testPathname = '/some-missing-page';
    mockUseLocation.mockReturnValue({
      pathname: testPathname,
      search: '',
      hash: '',
      state: null,
      key: 'test'
    });

    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );

    // Check that useEffect was called (which should trigger the console.error)
    expect(consoleSpy).toHaveBeenCalledWith(
      '404 Error: User attempted to access non-existent route:',
      testPathname
    );
    
    consoleSpy.mockRestore();
  });

  test('should handle different pathnames', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const testCases = [
      '/admin/dashboard',
      '/api/users',
      '/products/non-existent',
      '/very/long/nested/path'
    ];

    testCases.forEach(pathname => {
      mockUseLocation.mockReturnValue({
        pathname,
        search: '',
        hash: '',
        state: null,
        key: 'test'
      });

      const { unmount } = render(
        <BrowserRouter>
          <NotFound />
        </BrowserRouter>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        '404 Error: User attempted to access non-existent route:',
        pathname
      );

      unmount();
    });
    
    consoleSpy.mockRestore();
  });

  test('should render without errors', () => {
    expect(() => {
      render(
        <BrowserRouter>
          <NotFound />
        </BrowserRouter>
      );
    }).not.toThrow();
  });

  test('should be accessible', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );

    // Check for proper heading hierarchy
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('404');

    // Check that link is accessible
    const homeLink = screen.getByRole('link', { name: 'Return to Home' });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  test('should have proper semantic structure', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );

    // Check for main heading
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();

    // Check for paragraph text
    const paragraph = screen.getByText('Oops! Page not found');
    expect(paragraph).toBeInTheDocument();

    // Check for navigation link
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
  });

  test('should handle component re-rendering', () => {
    const { rerender } = render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );

    // Change pathname and re-render
    mockUseLocation.mockReturnValue({
      pathname: '/different-route',
      search: '',
      hash: '',
      state: null,
      key: 'different'
    });

    rerender(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );

    // Component should still render correctly
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Oops! Page not found')).toBeInTheDocument();
    expect(screen.getByText('Return to Home')).toBeInTheDocument();
  });

  test('should export as default', () => {
    expect(NotFound).toBeDefined();
    expect(typeof NotFound).toBe('function');
  });

  test('should have responsive design classes', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );

    const outerContainer = screen.getByText('404').closest('div')?.parentElement;
    expect(outerContainer).toHaveClass('min-h-screen');
  });

  test('should handle edge case pathnames', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const edgeCases = [
      '', // Empty pathname
      '/', // Root pathname
      '//', // Double slash
      '/path/with/special-chars!@#$%', // Special characters
    ];

    edgeCases.forEach(pathname => {
      mockUseLocation.mockReturnValue({
        pathname,
        search: '',
        hash: '',
        state: null,
        key: 'edge-case'
      });

      const { unmount } = render(
        <BrowserRouter>
          <NotFound />
        </BrowserRouter>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        '404 Error: User attempted to access non-existent route:',
        pathname
      );

      unmount();
    });
    
    consoleSpy.mockRestore();
  });
});
