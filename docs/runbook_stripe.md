# Stripe Configuration Runbook

## Overview
Step-by-step guide for creating and configuring Stripe products and prices for the Dental Review Engine.

## Prerequisites
- Access to Stripe Dashboard (Staging and Production accounts)
- Admin permissions for product creation
- API access for verification

## Creating the Founder Product

### Step 1: Access Stripe Dashboard
1. Navigate to [Stripe Dashboard](https://dashboard.stripe.com)
2. Select the appropriate environment (Staging/Production)
3. Go to Products → Create Product

### Step 2: Create Product
1. **Product Name**: `Dental Review Engine — Founder $249/mo`
2. **Description**: `Monthly subscription for dental practice review automation`
3. **Product Type**: Service
4. Click "Create product"

### Step 3: Add Pricing
1. Click "Add pricing"
2. **Pricing Model**: Recurring
3. **Price**: $249.00
4. **Currency**: USD
5. **Billing Period**: Monthly
6. **Usage Type**: Licensed
7. Click "Save pricing"

### Step 4: Configure Metadata
1. Scroll down to "Metadata" section
2. Add the following key-value pairs:

| Key | Value |
|-----|-------|
| `guarantee_live_48h` | `true` |
| `guarantee_plus10_reviews_30d` | `true` |
| `sms_overage_rate` | `0.02` |
| `addl_location_monthly` | `79` |
| `sku_code` | `dental_review_engine_founder_249_monthly` |

3. Click "Save changes"

### Step 5: Verify Configuration
1. Ensure product status is "Active"
2. Ensure price status is "Active"
3. Verify all metadata is correctly set
4. Note down the Product ID and Price ID

### Step 6: API Verification
```bash
# Verify product and price configuration
node scripts/verify-stripe-product.js prod_XXXXXXXXXXXXXX price_XXXXXXXXXXXXXX

# Alternative: Use Stripe CLI directly
stripe products retrieve prod_XXXXXXXXXXXXXX
stripe prices retrieve price_XXXXXXXXXXXXXX
```

## Environment-Specific Notes

### Staging Environment
- Use test mode in Stripe Dashboard
- Product ID will start with `prod_test_`
- Price ID will start with `price_test_`

### Production Environment
- Use live mode in Stripe Dashboard
- Product ID will start with `prod_`
- Price ID will start with `price_`

## Troubleshooting

### Common Issues
1. **Duplicate Product Names**: If a product with the same name exists, archive it first or rename with environment suffix
2. **Missing Metadata**: Double-check all key-value pairs are exactly as specified
3. **Inactive Status**: Ensure both product and price are set to "Active"

### Verification Checklist
- [ ] Product name exactly matches: "Dental Review Engine — Founder $249/mo"
- [ ] Price is $249.00 USD monthly recurring
- [ ] All 5 metadata keys present with correct values
- [ ] Product and price both active
- [ ] Product ID and Price ID recorded in runbook
- [ ] Screenshots captured for documentation
