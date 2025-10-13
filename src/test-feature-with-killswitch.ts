// Test feature in production code with kill switch
import { isEnabled } from '../lib/feature-flags.js';

export function newProductionFeatureWithKillSwitch() {
  // Check if the feature is enabled via kill switch
  if (!isEnabled('NEW_PRODUCTION_FEATURE')) {
    console.log('Feature disabled by kill switch');
    return 'feature-disabled';
  }
  
  console.log('This is a new production feature with kill switch');
  return 'production-feature-result';
}
