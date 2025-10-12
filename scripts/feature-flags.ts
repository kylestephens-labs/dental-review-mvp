#!/usr/bin/env tsx

import { updateFeatureFlag, getFeatureFlag, getAllFeatureFlags } from '../src/lib/feature-flags';

const command = process.argv[2];
const flagName = process.argv[3];
const value = process.argv[4];

switch (command) {
  case 'enable':
    updateFeatureFlag(flagName, { enabled: true });
    console.log(`✅ Feature flag '${flagName}' enabled`);
    break;
    
  case 'disable':
    updateFeatureFlag(flagName, { enabled: false });
    console.log(`❌ Feature flag '${flagName}' disabled`);
    break;
    
  case 'rollout':
    const percentage = parseInt(value);
    updateFeatureFlag(flagName, { rolloutPercentage: percentage });
    console.log(`🔄 Feature flag '${flagName}' rollout set to ${percentage}%`);
    break;
    
  case 'status':
    const flag = getFeatureFlag(flagName);
    if (flag) {
      console.log(`📊 Feature flag '${flagName}' status:`, flag);
    } else {
      console.log(`❌ Feature flag '${flagName}' not found`);
    }
    break;
    
  case 'list':
    const flags = getAllFeatureFlags();
    console.log('📋 All feature flags:');
    console.log('');
    
    // Group flags by category
    const categories = {
      'UI Features': ['ENHANCED_INTAKE_FORM', 'AUTO_SAVE', 'ADVANCED_ANALYTICS', 'DYNAMIC_CONTENT'],
      'Dental Project Integrations': ['GOOGLE_CALENDAR_INTEGRATION', 'OUTLOOK_INTEGRATION', 'CSV_UPLOAD_FEATURE', 'FRONT_DESK_MODE'],
      'Dental Project Features': ['REVIEW_INGESTION', 'WEEKLY_DIGEST']
    };
    
    Object.entries(categories).forEach(([category, flagNames]) => {
      console.log(`🔹 ${category}:`);
      flagNames.forEach(name => {
        const flag = flags[name];
        if (flag) {
          const status = flag.enabled ? '✅' : '❌';
          const rollout = flag.rolloutPercentage !== undefined ? ` (${flag.rolloutPercentage}%)` : '';
          const description = flag.description ? ` - ${flag.description}` : '';
          console.log(`  ${name}: ${status}${rollout}${description}`);
        }
      });
      console.log('');
    });
    break;
    
  case 'enable-dental':
    // Enable all dental project integrations
    const dentalFlags = ['GOOGLE_CALENDAR_INTEGRATION', 'OUTLOOK_INTEGRATION', 'CSV_UPLOAD_FEATURE', 'FRONT_DESK_MODE'];
    dentalFlags.forEach(flagName => {
      updateFeatureFlag(flagName, { enabled: true, rolloutPercentage: 25 });
      console.log(`✅ ${flagName}: enabled (25% rollout)`);
    });
    console.log('🚀 All dental integrations enabled with 25% rollout');
    break;
    
  case 'enable-features':
    // Enable all dental project features
    const featureFlags = ['REVIEW_INGESTION', 'WEEKLY_DIGEST'];
    featureFlags.forEach(flagName => {
      updateFeatureFlag(flagName, { enabled: true, rolloutPercentage: 50 });
      console.log(`✅ ${flagName}: enabled (50% rollout)`);
    });
    console.log('🚀 All dental features enabled with 50% rollout');
    break;
    
  case 'disable-all':
    // Disable all feature flags
    const allFlags = getAllFeatureFlags();
    Object.keys(allFlags).forEach(flagName => {
      updateFeatureFlag(flagName, { enabled: false, rolloutPercentage: 0 });
      console.log(`❌ ${flagName}: disabled`);
    });
    console.log('🚫 All feature flags disabled');
    break;
    
  default:
    console.log(`
Usage: npm run feature:flag <command> [flagName] [value]

Commands:
  enable <flagName>           - Enable a feature flag
  disable <flagName>          - Disable a feature flag
  rollout <flagName> <%>      - Set rollout percentage
  status <flagName>           - Show flag status
  list                        - List all flags
  
  enable-dental               - Enable all dental integrations (25% rollout)
  enable-features             - Enable all dental features (50% rollout)
  disable-all                 - Disable all feature flags

Examples:
  npm run feature:flag enable ENHANCED_INTAKE_FORM
  npm run feature:flag rollout ENHANCED_INTAKE_FORM 50
  npm run feature:flag status ENHANCED_INTAKE_FORM
  npm run feature:flag list
  npm run feature:flag enable-dental
  npm run feature:flag enable-features
  npm run feature:flag disable-all
    `);
}
