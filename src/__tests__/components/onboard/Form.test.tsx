import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardForm } from '../../../components/onboard/Form';
import { OnboardPrefillResponse } from '../../../lib/validation/onboard';

describe('OnboardForm Component', () => {
  const mockInitialData: OnboardPrefillResponse = {
    success: true,
    practice: {
      id: 'practice-123',
      name: 'Test Dental Practice',
      email: 'test@example.com',
      phone: '+1234567890',
      city: 'Test City',
      tz: 'America/Los_Angeles',
      status: 'active',
      created_at: '2023-01-01T00:00:00Z'
    },
    settings: {
      id: 'settings-123',
      practice_id: 'practice-123',
      review_link: 'https://g.page/test',
      quiet_hours_start: 8,
      quiet_hours_end: 20,
      daily_cap: 50,
      sms_sender: '+1234567890',
      email_sender: 'noreply@example.com',
      default_locale: 'en',
      brand_assets_json: null,
      billing_json: null,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    },
    redirect_url: 'https://example.com/onboard/token123'
  };

  it('should render practice name prefilled in form', () => {
    render(
      <OnboardForm
        initialData={mockInitialData}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Expect to find the practice name prefilled
    expect(screen.getByDisplayValue('Test Dental Practice')).toBeInTheDocument();
  });

  it('should render practice email prefilled in form', () => {
    render(
      <OnboardForm
        initialData={mockInitialData}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Expect to find the practice email prefilled
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  it('should render practice phone prefilled in form (masked)', () => {
    render(
      <OnboardForm
        initialData={mockInitialData}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Expect to find the practice phone prefilled (masked)
    expect(screen.getByDisplayValue('(***) ***-7890')).toBeInTheDocument();
  });

  it('should render quiet hours start prefilled in form', () => {
    render(
      <OnboardForm
        initialData={mockInitialData}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Expect to find the quiet hours start prefilled
    expect(screen.getByDisplayValue('8')).toBeInTheDocument();
  });

  it('should render daily cap prefilled in form', () => {
    render(
      <OnboardForm
        initialData={mockInitialData}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Expect to find the daily cap prefilled
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
  });

  it('should show validation error for invalid email', () => {
    const mockInitialDataWithInvalidEmail = {
      ...mockInitialData,
      practice: {
        ...mockInitialData.practice,
        email: 'invalid-email'
      }
    };

    render(
      <OnboardForm
        initialData={mockInitialDataWithInvalidEmail}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        errors={{ practice_email: 'Invalid email format' }}
      />
    );

    // Expect to find the validation error message
    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
  });

  it('should disable submit button until user interacts with form', () => {
    render(
      <OnboardForm
        initialData={mockInitialData}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Submit button should be disabled initially
    const submitButton = screen.getByRole('button', { name: /save settings/i });
    expect(submitButton).toBeDisabled();
  });

  it('should call onSubmit when form is submitted after interaction', () => {
    const mockOnSubmit = vi.fn();
    
    render(
      <OnboardForm
        initialData={mockInitialData}
        onSubmit={mockOnSubmit}
        onCancel={vi.fn()}
      />
    );

    // Initially submit button should be disabled
    const submitButton = screen.getByRole('button', { name: /save settings/i });
    expect(submitButton).toBeDisabled();

    // Interact with a form field to enable submit
    const nameInput = screen.getByTestId('practice-name-input');
    fireEvent.change(nameInput, { target: { value: 'Updated Practice Name' } });

    // Now submit button should be enabled
    expect(submitButton).not.toBeDisabled();

    // Click the submit button
    fireEvent.click(submitButton);

    // Expect onSubmit to be called with form data
    expect(mockOnSubmit).toHaveBeenCalledWith({
      practice_name: 'Updated Practice Name',
      practice_email: 'test@example.com',
      practice_phone: '(***) ***-7890', // Masked phone number
      practice_city: 'Test City',
      practice_timezone: 'America/Los_Angeles',
      quiet_hours_start: 8,
      quiet_hours_end: 20,
      daily_cap: 50,
      review_link: 'https://g.page/test',
      default_locale: 'en'
    });
  });
});
