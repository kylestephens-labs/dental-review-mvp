// Test file to demonstrate feature flag lint check with registered flags
import { isEnabled } from './frontend/src/flags.js';

// This should pass because BASIC_INTAKE_FORM is registered
const isBasicFormEnabled = isEnabled('BASIC_INTAKE_FORM');

// This should also pass because ENHANCED_INTAKE_FORM is registered
const isEnhancedFormEnabled = isEnabled('ENHANCED_INTAKE_FORM');

console.log('Basic form flag:', isBasicFormEnabled);
console.log('Enhanced form flag:', isEnhancedFormEnabled);
