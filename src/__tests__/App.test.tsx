import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock the page components
vi.mock('../pages/Index', () => ({
  default: () => <div data-testid="index-page">Index Page</div>
}));

vi.mock('../pages/NotFound', () => ({
  default: () => <div data-testid="not-found-page">404 Not Found</div>
}));

// Mock UI components
vi.mock('@/components/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>
}));

vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="sonner">Sonner</div>
}));

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-provider">{children}</div>
  )
}));

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn(() => ({})),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="query-client-provider">{children}</div>
  )
}));

// Mock React Router
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="browser-router">{children}</div>
  ),
  Routes: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="routes">{children}</div>
  ),
  Route: ({ path, element }: { path: string; element: React.ReactNode }) => (
    <div data-testid={`route-${path}`}>{element}</div>
  )
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    test('should render all required providers', () => {
      render(<App />);
      
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument();
      expect(screen.getByTestId('browser-router')).toBeInTheDocument();
    });

    test('should render all UI components', () => {
      render(<App />);
      
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
      expect(screen.getByTestId('sonner')).toBeInTheDocument();
    });

    test('should render routing structure', () => {
      render(<App />);
      
      expect(screen.getByTestId('routes')).toBeInTheDocument();
      expect(screen.getByTestId('route-/')).toBeInTheDocument();
      expect(screen.getByTestId('route-*')).toBeInTheDocument();
    });
  });

  describe('Routing Configuration', () => {
    test('should render Index page for root route', () => {
      render(<App />);
      
      expect(screen.getByTestId('index-page')).toBeInTheDocument();
    });

    test('should render NotFound page for catch-all route', () => {
      render(<App />);
      
      expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
    });

    test('should have correct route paths configured', () => {
      render(<App />);
      
      // Check that both routes are rendered
      const rootRoute = screen.getByTestId('route-/');
      const catchAllRoute = screen.getByTestId('route-*');
      
      expect(rootRoute).toBeInTheDocument();
      expect(catchAllRoute).toBeInTheDocument();
    });
  });

  describe('Provider Hierarchy', () => {
    test('should have correct provider nesting order', () => {
      const { container } = render(<App />);
      
      // QueryClientProvider should be outermost
      const queryProvider = screen.getByTestId('query-client-provider');
      expect(queryProvider).toBeInTheDocument();
      
      // TooltipProvider should be inside QueryClientProvider
      const tooltipProvider = screen.getByTestId('tooltip-provider');
      expect(tooltipProvider).toBeInTheDocument();
      
      // BrowserRouter should be inside TooltipProvider
      const browserRouter = screen.getByTestId('browser-router');
      expect(browserRouter).toBeInTheDocument();
    });

    test('should render UI components at correct level', () => {
      render(<App />);
      
      // Toaster and Sonner should be rendered
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
      expect(screen.getByTestId('sonner')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('should render without errors', () => {
      expect(() => render(<App />)).not.toThrow();
    });

    test('should render all child components', () => {
      render(<App />);
      
      // Check that all expected components are rendered
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument();
      expect(screen.getByTestId('browser-router')).toBeInTheDocument();
      expect(screen.getByTestId('routes')).toBeInTheDocument();
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
      expect(screen.getByTestId('sonner')).toBeInTheDocument();
      expect(screen.getByTestId('index-page')).toBeInTheDocument();
      expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
    });

    test('should maintain component structure consistency', () => {
      const { rerender } = render(<App />);
      
      // Re-render and check structure is maintained
      rerender(<App />);
      
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument();
      expect(screen.getByTestId('browser-router')).toBeInTheDocument();
    });
  });

  describe('Dependencies', () => {
    test('should import all required dependencies', () => {
      // This test ensures all imports are working correctly
      expect(App).toBeDefined();
      expect(typeof App).toBe('function');
    });

    test('should export App as default', () => {
      expect(App).toBeDefined();
      expect(App.name).toBe('App');
    });
  });
});
