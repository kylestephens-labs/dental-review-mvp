import React from 'react';
import { OnboardFormProps, maskPhoneNumber } from '../../lib/validation/onboard';

/**
 * Helper function to collect and validate form data
 */
function collectFormData(form: HTMLFormElement) {
  const formData = new FormData(form);
  
  return {
    practice_name: formData.get('practice_name') as string,
    practice_email: formData.get('practice_email') as string,
    practice_phone: formData.get('practice_phone') as string,
    practice_city: formData.get('practice_city') as string,
    practice_timezone: formData.get('practice_timezone') as string,
    quiet_hours_start: parseInt(formData.get('quiet_hours_start') as string, 10),
    quiet_hours_end: parseInt(formData.get('quiet_hours_end') as string, 10),
    daily_cap: parseInt(formData.get('daily_cap') as string, 10),
    review_link: formData.get('review_link') as string,
    default_locale: formData.get('default_locale') as string,
  };
}

/**
 * OnboardForm component for practice onboarding
 * Displays prefilled practice information in a form
 */
export function OnboardForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  errors = {} 
}: OnboardFormProps) {
  const [hasInteracted, setHasInteracted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = collectFormData(e.currentTarget);
    onSubmit(formData);
  };

  const handleInputChange = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  return (
    <div className="onboard-form">
      <form onSubmit={handleSubmit}>
        <fieldset disabled={isLoading}>
          <legend>Practice Information</legend>
          
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="practice-name">Practice Name *</label>
              <input 
                id="practice-name"
                name="practice_name"
                type="text" 
                defaultValue={initialData.practice.name}
                data-testid="practice-name-input"
                required
                aria-describedby="practice-name-help"
                onChange={handleInputChange}
              />
              <small id="practice-name-help" className="form-help">
                The name of your dental practice
              </small>
            </div>
            
            <div className="form-field">
              <label htmlFor="practice-email">Practice Email *</label>
              <input 
                id="practice-email"
                name="practice_email"
                type="email" 
                defaultValue={initialData.practice.email}
                data-testid="practice-email-input"
                required
                aria-describedby="practice-email-help"
                onChange={handleInputChange}
              />
              <small id="practice-email-help" className="form-help">
                Primary contact email for your practice
              </small>
              {errors.practice_email && (
                <div className="form-error" data-testid="practice-email-error" role="alert">
                  {errors.practice_email}
                </div>
              )}
            </div>
            
            <div className="form-field">
              <label htmlFor="practice-phone">Practice Phone *</label>
              <input 
                id="practice-phone"
                name="practice_phone"
                type="tel" 
                defaultValue={maskPhoneNumber(initialData.practice.phone)}
                data-testid="practice-phone-input"
                required
                aria-describedby="practice-phone-help"
                placeholder="+1 (555) 123-4567"
                onChange={handleInputChange}
              />
              <small id="practice-phone-help" className="form-help">
                Primary phone number for your practice
              </small>
            </div>
          </div>
        </fieldset>
        
        <fieldset disabled={isLoading}>
          <legend>Review Settings</legend>
          
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="quiet-hours-start">Quiet Hours Start *</label>
              <input 
                id="quiet-hours-start"
                name="quiet_hours_start"
                type="number" 
                min="0" 
                max="23"
                defaultValue={initialData.settings.quiet_hours_start}
                data-testid="quiet-hours-start-input"
                required
                aria-describedby="quiet-hours-start-help"
                onChange={handleInputChange}
              />
              <small id="quiet-hours-start-help" className="form-help">
                Hour when review requests should stop (0-23)
              </small>
            </div>
            
            <div className="form-field">
              <label htmlFor="quiet-hours-end">Quiet Hours End *</label>
              <input 
                id="quiet-hours-end"
                name="quiet_hours_end"
                type="number" 
                min="0" 
                max="23"
                defaultValue={initialData.settings.quiet_hours_end}
                data-testid="quiet-hours-end-input"
                required
                aria-describedby="quiet-hours-end-help"
                onChange={handleInputChange}
              />
              <small id="quiet-hours-end-help" className="form-help">
                Hour when review requests can resume (0-23)
              </small>
            </div>
            
            <div className="form-field">
              <label htmlFor="daily-cap">Daily Cap *</label>
              <input 
                id="daily-cap"
                name="daily_cap"
                type="number" 
                min="1"
                max="1000"
                defaultValue={initialData.settings.daily_cap}
                data-testid="daily-cap-input"
                required
                aria-describedby="daily-cap-help"
                onChange={handleInputChange}
              />
              <small id="daily-cap-help" className="form-help">
                Maximum number of review requests per day (1-1000)
              </small>
            </div>
          </div>
        </fieldset>
        
        {/* Hidden inputs for additional data */}
        <input type="hidden" name="practice_city" value={initialData.practice.city || ''} />
        <input type="hidden" name="practice_timezone" value={initialData.practice.tz || ''} />
        <input type="hidden" name="review_link" value={initialData.settings.review_link || ''} />
        <input type="hidden" name="default_locale" value={initialData.settings.default_locale || 'en'} />
        
        <div className="form-actions">
          <button 
            type="submit" 
            disabled={isLoading || !hasInteracted}
            className="submit-button"
            aria-describedby="submit-help"
          >
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
          <small id="submit-help" className="form-help">
            Click to save your practice settings and complete onboarding
          </small>
        </div>
      </form>
    </div>
  );
}