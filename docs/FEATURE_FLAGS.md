# Feature Flags System

## 🎯 **Overview**

Simple feature flag system for safe feature rollouts and risk management.

## 🚀 **Implementation**

### **Environment Variables**
```bash
# Feature flags are controlled via environment variables
FEATURE_FLAG_NEW_DASHBOARD=true
FEATURE_FLAG_STRIPE_WEBHOOKS=false
FEATURE_FLAG_SMS_INTEGRATION=true
```

### **Usage in Code**
```typescript
// Check feature flag
if (process.env.FEATURE_FLAG_NEW_DASHBOARD === 'true') {
  // New dashboard code
} else {
  // Old dashboard code
}

// React hook
const isNewDashboardEnabled = useFeatureFlag('NEW_DASHBOARD');
```

## 📋 **Feature Flag Management**

### **Enable Feature**
```bash
# Set environment variable
export FEATURE_FLAG_NEW_DASHBOARD=true

# Deploy
npm run deploy
```

### **Disable Feature**
```bash
# Set environment variable
export FEATURE_FLAG_NEW_DASHBOARD=false

# Deploy
npm run deploy
```

## 🎯 **Benefits**

- ✅ **Safe deployments**: Features can be disabled instantly
- ✅ **Gradual rollouts**: Enable for subset of users
- ✅ **Easy rollback**: Disable problematic features
- ✅ **A/B testing**: Compare feature versions

## 📊 **Current Feature Flags**

See `.env.example` for all available feature flags.

## 🚀 **Best Practices**

1. **Default to false**: New features start disabled
2. **Test thoroughly**: Verify both enabled/disabled states
3. **Monitor closely**: Watch for issues after enabling
4. **Clean up**: Remove flags after feature is stable
