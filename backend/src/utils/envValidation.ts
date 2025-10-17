/**
 * Environment variable validation utility
 * Provides comprehensive validation for all required environment variables
 */

// Environment variable configuration interface
interface EnvConfig {
  readonly NODE_ENV: string;
  readonly PORT: string;
  readonly COMMIT_SHA: string;
  readonly DATABASE_URL: string;
  readonly STRIPE_SECRET_KEY: string;
  readonly STRIPE_PUBLISHABLE_KEY: string;
  readonly STRIPE_WEBHOOK_SECRET: string;
  readonly TWILIO_ACCOUNT_SID: string;
  readonly TWILIO_AUTH_TOKEN: string;
  readonly AWS_ACCESS_KEY_ID: string;
  readonly AWS_SECRET_ACCESS_KEY: string;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly HMAC_SECRET: string;
  readonly GOOGLE_PLACES_API_KEY: string;
  readonly GOOGLE_CLIENTID: string;
  readonly GOOGLE_OATUH_SECRET: string;
}

// Validation result interface
interface ValidationResult {
  readonly isValid: boolean;
  readonly missing: string[];
  readonly invalid: string[];
  readonly warnings: string[];
}

// Validation rule interface for extensibility
interface ValidationRule {
  readonly name: string;
  readonly validate: (value: string | undefined) => string | null;
  readonly isRequired: boolean;
}

// Validation rules configuration
const VALIDATION_RULES: Record<string, ValidationRule> = {
  DATABASE_URL: {
    name: 'DATABASE_URL',
    isRequired: true,
    validate: (value) => value && !value.startsWith('postgresql://') 
      ? 'DATABASE_URL must start with postgresql://' 
      : null
  },
  STRIPE_SECRET_KEY: {
    name: 'STRIPE_SECRET_KEY',
    isRequired: true,
    validate: (value) => value && !value.startsWith('sk_') 
      ? 'STRIPE_SECRET_KEY must start with sk_' 
      : null
  },
  STRIPE_PUBLISHABLE_KEY: {
    name: 'STRIPE_PUBLISHABLE_KEY',
    isRequired: true,
    validate: (value) => value && !value.startsWith('pk_') 
      ? 'STRIPE_PUBLISHABLE_KEY must start with pk_' 
      : null
  },
  STRIPE_WEBHOOK_SECRET: {
    name: 'STRIPE_WEBHOOK_SECRET',
    isRequired: true,
    validate: (value) => value && !value.startsWith('whsec_') 
      ? 'STRIPE_WEBHOOK_SECRET must start with whsec_' 
      : null
  },
  SUPABASE_URL: {
    name: 'SUPABASE_URL',
    isRequired: true,
    validate: (value) => value && !value.startsWith('https://') 
      ? 'SUPABASE_URL must start with https://' 
      : null
  }
} as const;

// Required environment variables
const REQUIRED_VARS = [
  'NODE_ENV',
  'PORT',
  'COMMIT_SHA',
  'DATABASE_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'HMAC_SECRET',
  'GOOGLE_PLACES_API_KEY',
  'GOOGLE_CLIENTID',
  'GOOGLE_OATUH_SECRET'
] as const;

/**
 * Validates all required environment variables
 * @returns ValidationResult with validation status and details
 */
export function validateEnvironment(): ValidationResult {
  const missing: string[] = [];
  const invalid: string[] = [];
  const warnings: string[] = [];

  // Check for missing required variables
  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Validate format rules
  for (const [varName, rule] of Object.entries(VALIDATION_RULES)) {
    const value = process.env[varName];
    if (value) {
      const error = rule.validate(value);
      if (error) {
        invalid.push(error);
      }
    }
  }

  // Check production-specific warnings
  if (process.env.NODE_ENV === 'production') {
    warnings.push(...getProductionWarnings());
  }

  // Check security warnings
  warnings.push(...getSecurityWarnings());

  const isValid = missing.length === 0 && invalid.length === 0;

  return {
    isValid,
    missing,
    invalid,
    warnings
  };
}

/**
 * Gets production-specific warnings
 */
function getProductionWarnings(): string[] {
  const warnings: string[] = [];
  
  if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
    warnings.push('Using test Stripe key in production');
  }
  if (process.env.STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_')) {
    warnings.push('Using test Stripe key in production');
  }
  if (process.env.DATABASE_URL?.includes('localhost')) {
    warnings.push('Using localhost database in production');
  }
  
  return warnings;
}

/**
 * Gets security-related warnings
 */
function getSecurityWarnings(): string[] {
  const warnings: string[] = [];
  
  if (process.env.HMAC_SECRET && process.env.HMAC_SECRET.length < 32) {
    warnings.push('HMAC_SECRET should be at least 32 characters long');
  }
  
  return warnings;
}

/**
 * Logs environment validation results
 * @param result - Optional validation result to avoid duplicate validation
 */
export function logEnvironmentValidation(result?: ValidationResult): void {
  const validationResult = result ?? validateEnvironment();
  
  console.log('🔍 Environment Validation Results:');
  console.log(`Status: ${validationResult.isValid ? '✅ VALID' : '❌ INVALID'}`);
  
  if (validationResult.missing.length > 0) {
    console.log('❌ Missing variables:');
    validationResult.missing.forEach(varName => console.log(`  - ${varName}`));
  }
  
  if (validationResult.invalid.length > 0) {
    console.log('❌ Invalid variables:');
    validationResult.invalid.forEach(error => console.log(`  - ${error}`));
  }
  
  if (validationResult.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    validationResult.warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  if (validationResult.isValid) {
    console.log('✅ All environment variables are properly configured');
  }
}

/**
 * Exits process if environment validation fails
 * @param result - Optional validation result to avoid duplicate validation
 */
export function validateEnvironmentOrExit(result?: ValidationResult): void {
  const validationResult = result ?? validateEnvironment();
  
  if (!validationResult.isValid) {
    console.error('❌ Environment validation failed');
    logEnvironmentValidation(validationResult);
    process.exit(1);
  }
  
  // Log warnings but don't exit
  if (validationResult.warnings.length > 0) {
    logEnvironmentValidation(validationResult);
  }
}

/**
 * Gets a summary of environment validation status
 * @param result - Optional validation result to avoid duplicate validation
 * @returns Summary string of validation status
 */
export function getValidationSummary(result?: ValidationResult): string {
  const validationResult = result ?? validateEnvironment();
  
  if (validationResult.isValid) {
    return `✅ Environment validation passed (${validationResult.warnings.length} warnings)`;
  }
  
  const errorCount = validationResult.missing.length + validationResult.invalid.length;
  return `❌ Environment validation failed (${errorCount} errors, ${validationResult.warnings.length} warnings)`;
}
