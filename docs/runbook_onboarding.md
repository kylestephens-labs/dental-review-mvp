# Onboarding Runbook

## Overview
This runbook contains step-by-step procedures for onboarding new dental practices into the Review Engine system.

## Stripe Product & Price IDs

### Production Environment
- **Product ID**: `prod_TE3WmAgUuw3JyY`
- **Price ID**: `price_1SHbPd0K6ldNExzpxZWi5FZk`
- **Product Name**: Dental Review Engine — Founder
- **Price**: $199.00 USD monthly recurring
- **Created Date**: January 18, 2025
- **Status**: Active

### Staging Environment
- **Product ID**: `prod_XXXXXXXXXXXXXX` (To be filled after creation)
- **Price ID**: `price_XXXXXXXXXXXXXX` (To be filled after creation)
- **Product Name**: Dental Review Engine — Founder $249/mo
- **Price**: $249.00 USD monthly recurring
- **Created Date**: [To be filled after creation]
- **Status**: Active

### Metadata Configuration
Both environments must have the following metadata on the product:

| Key | Value | Purpose |
|-----|-------|---------|
| `guarantee_live_48h` | `true` | SLA guarantee flag |
| `guarantee_plus10_reviews_30d` | `true` | Review guarantee flag |
| `sms_overage_rate` | `0.02` | SMS overage pricing |
| `sku_code` | `dental_review_engine_founder_199_monthly` | SKU identifier |

**Note**: `addl_location_monthly` metadata was not included in the current configuration.

### Verification Steps
1. Navigate to Stripe Dashboard → Products
2. Verify product exists with exact name: "Dental Review Engine — Founder"
3. Verify price is $199.00 USD monthly recurring
4. Verify all metadata keys and values are present
5. Test API retrieval using product_id and price_id
6. Run verification script: `node scripts/verify-stripe-product.js prod_TE3WmAgUuw3JyY price_1SHbPd0K6ldNExzpxZWi5FZk`

### Screenshots
- [ ] Product details page screenshot
- [ ] Pricing configuration screenshot
- [ ] Metadata configuration screenshot
