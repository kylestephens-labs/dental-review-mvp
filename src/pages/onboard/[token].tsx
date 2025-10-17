import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  fetchOnboardData, 
  getTokenErrorMessage, 
  isTokenErrorState, 
  isTokenSuccessState, 
  isTokenLoadingState 
} from '../../lib/api/onboard';
import { 
  TokenValidationState, 
  TokenValidationResult, 
  OnboardFormData 
} from '../../lib/validation/onboard';
import { OnboardForm } from '../../components/onboard/Form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Skeleton } from '../../components/ui/skeleton';
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  ArrowLeft,
  ExternalLink 
} from 'lucide-react';

/**
 * Onboarding page component that handles magic link token validation
 * and displays prefilled form with practice information
 */
export default function OnboardPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [validationResult, setValidationResult] = useState<TokenValidationResult>({
    state: 'loading'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch onboarding data when component mounts
  useEffect(() => {
    if (!token) {
      setValidationResult({
        state: 'invalid',
        error: {
          success: false,
          error: 'No token provided'
        }
      });
      return;
    }

    const loadOnboardData = async () => {
      try {
        const result = await fetchOnboardData(token);
        setValidationResult(result);
      } catch (error) {
        console.error('Error loading onboard data:', error);
        setValidationResult({
          state: 'error',
          error: {
            success: false,
            error: 'Failed to load onboarding data'
          }
        });
      }
    };

    loadOnboardData();
  }, [token]);

  // Handle form submission
  const handleFormSubmit = async (formData: OnboardFormData) => {
    if (!token) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // For now, we'll just show a success message
      // In the future, this would call the submit API
      console.log('Form submitted:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      alert('Onboarding data saved successfully!');
      
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('Failed to save changes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form cancellation
  const handleFormCancel = () => {
    navigate('/');
  };

  // Handle retry
  const handleRetry = () => {
    if (!token) return;
    
    setValidationResult({ state: 'loading' });
    
    const loadOnboardData = async () => {
      try {
        const result = await fetchOnboardData(token);
        setValidationResult(result);
      } catch (error) {
        console.error('Error loading onboard data:', error);
        setValidationResult({
          state: 'error',
          error: {
            success: false,
            error: 'Failed to load onboarding data'
          }
        });
      }
    };

    loadOnboardData();
  };

  // Render loading state
  if (isTokenLoadingState(validationResult.state)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading Onboarding Data
            </CardTitle>
            <CardDescription>
              Please wait while we load your practice information...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render error states
  if (isTokenErrorState(validationResult.state)) {
    const errorMessage = getTokenErrorMessage(validationResult.state, validationResult.error);
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Onboarding Error
            </CardTitle>
            <CardDescription>
              There was a problem accessing your onboarding link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                This could happen if:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>The link has expired (valid for 7 days)</li>
                <li>The link has already been used</li>
                <li>The link is invalid or corrupted</li>
                <li>There's a temporary server issue</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Home
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">
                Need help? Contact support at{' '}
                <a 
                  href="mailto:support@example.com" 
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  support@example.com
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render success state with form
  if (isTokenSuccessState(validationResult.state) && validationResult.data) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Success indicator */}
          <div className="mb-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Welcome! Your practice information has been loaded successfully.
              </AlertDescription>
            </Alert>
          </div>

          {/* Form component */}
          <OnboardForm
            initialData={validationResult.data}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isSubmitting}
            errors={submitError ? { general: submitError } : {}}
          />
        </div>
      </div>
    );
  }

  // Fallback error state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            Unexpected Error
          </CardTitle>
          <CardDescription>
            Something went wrong. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
