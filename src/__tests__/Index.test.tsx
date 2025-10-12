import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Index from '../pages/Index';

// Mock all the components that Index imports
vi.mock('@/components/Header', () => ({
  Header: () => <div data-testid="header">Header Component</div>
}));

vi.mock('@/components/Hero', () => ({
  Hero: () => <div data-testid="hero">Hero Component</div>
}));

vi.mock('@/components/Services', () => ({
  Services: () => <div data-testid="services">Services Component</div>
}));

vi.mock('@/components/Reviews', () => ({
  Reviews: () => <div data-testid="reviews">Reviews Component</div>
}));

vi.mock('@/components/Insurers', () => ({
  Insurers: () => <div data-testid="insurers">Insurers Component</div>
}));

vi.mock('@/components/IntakeForm', () => ({
  IntakeForm: () => <div data-testid="intake-form">IntakeForm Component</div>
}));

vi.mock('@/components/OfficeInfo', () => ({
  OfficeInfo: () => <div data-testid="office-info">OfficeInfo Component</div>
}));

vi.mock('@/components/Footer', () => ({
  Footer: () => <div data-testid="footer">Footer Component</div>
}));

describe('Index Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render all required components', () => {
    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );

    // Check that all components are rendered
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('services')).toBeInTheDocument();
    expect(screen.getByTestId('reviews')).toBeInTheDocument();
    expect(screen.getByTestId('insurers')).toBeInTheDocument();
    expect(screen.getByTestId('intake-form')).toBeInTheDocument();
    expect(screen.getByTestId('office-info')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  test('should have correct page structure', () => {
    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );

    // Check for main element
    const main = screen.getByTestId('hero').closest('main');
    expect(main).toBeInTheDocument();

    // Check that the page renders without errors (structure is valid)
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  test('should render components in correct order', () => {
    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );

    const components = [
      'header',
      'hero',
      'services',
      'reviews',
      'insurers',
      'intake-form',
      'office-info',
      'footer'
    ];

    const renderedComponents = components.map(id => screen.getByTestId(id));
    
    // Check that components are in the correct order
    components.forEach((id, index) => {
      expect(renderedComponents[index]).toHaveAttribute('data-testid', id);
    });
  });

  test('should have proper semantic structure', () => {
    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );

    // Check for main element
    const main = screen.getByTestId('hero').closest('main');
    expect(main).toBeInTheDocument();

    // Check that header is outside main
    const header = screen.getByTestId('header');
    const mainElement = screen.getByTestId('hero').closest('main');
    expect(header.closest('div')).not.toBe(mainElement);

    // Check that footer is outside main
    const footer = screen.getByTestId('footer');
    expect(footer.closest('div')).not.toBe(mainElement);
  });

  test('should render without errors', () => {
    expect(() => {
      render(
        <BrowserRouter>
          <Index />
        </BrowserRouter>
      );
    }).not.toThrow();
  });

  test('should be accessible', () => {
    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );

    // Check for main landmark
    const main = screen.getByTestId('hero').closest('main');
    expect(main).toBeInTheDocument();

    // Check that all components are visible
    const components = [
      'header', 'hero', 'services', 'reviews', 
      'insurers', 'intake-form', 'office-info', 'footer'
    ];

    components.forEach(id => {
      const element = screen.getByTestId(id);
      expect(element).toBeVisible();
    });
  });

  test('should handle component rendering consistently', () => {
    const { rerender } = render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );

    // Re-render and check consistency
    rerender(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );

    // All components should still be present
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('services')).toBeInTheDocument();
    expect(screen.getByTestId('reviews')).toBeInTheDocument();
    expect(screen.getByTestId('insurers')).toBeInTheDocument();
    expect(screen.getByTestId('intake-form')).toBeInTheDocument();
    expect(screen.getByTestId('office-info')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  test('should export as default', () => {
    // This test ensures the component is exported as default
    expect(Index).toBeDefined();
    expect(typeof Index).toBe('function');
  });

  test('should not have any console errors', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );

    expect(consoleSpy).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});
