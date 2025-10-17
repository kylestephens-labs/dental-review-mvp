#!/usr/bin/env tsx
/**
 * Environment validation script
 * Validates all required environment variables and exits with appropriate code
 */

import { logEnvironmentValidation, validateEnvironment, getValidationSummary } from '../utils/envValidation.js';

// Load environment variables
import 'dotenv/config';

console.log('🔍 Validating environment variables...\n');

// Perform validation once and reuse result
const result = validateEnvironment();
logEnvironmentValidation(result);

// Display summary
console.log(`\n${getValidationSummary(result)}`);

// Exit with appropriate code
if (!result.isValid) {
  console.log('\n❌ Environment validation failed. Please fix the issues above.');
  process.exit(1);
}

console.log('\n✅ Environment validation passed!');
process.exit(0);
