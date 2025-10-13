# Stripe Product Setup Checklist

## 🎯 Task 5: Create Stripe Product + Metadata

### Pre-Setup
- [ ] Access to Stripe Dashboard (Staging account)
- [ ] Access to Stripe Dashboard (Production account)
- [ ] Admin permissions for product creation
- [ ] Environment variables configured (STRIPE_SECRET_KEY)

### Staging Environment Setup
- [ ] Navigate to Stripe Dashboard (Test Mode)
- [ ] Go to Products → Create Product
- [ ] **Product Name**: `Dental Review Engine — Founder $249/mo`
- [ ] **Description**: `Monthly subscription for dental practice review automation`
- [ ] **Product Type**: Service
- [ ] Create product
- [ ] **Add Pricing**: $249.00 USD monthly recurring
- [ ] **Add Metadata**:
  - [ ] `guarantee_live_48h` = `true`
  - [ ] `guarantee_plus10_reviews_30d` = `true`
  - [ ] `sms_overage_rate` = `0.02`
  - [ ] `addl_location_monthly` = `79`
  - [ ] `sku_code` = `dental_review_engine_founder_249_monthly`
- [ ] Verify product is active
- [ ] Verify price is active
- [ ] **Record Staging IDs**:
  - [ ] Product ID: `prod_test_XXXXXXXXXXXXXX`
  - [ ] Price ID: `price_test_XXXXXXXXXXXXXX`

### Production Environment Setup
- [ ] Navigate to Stripe Dashboard (Live Mode)
- [ ] Go to Products → Create Product
- [ ] **Product Name**: `Dental Review Engine — Founder $249/mo`
- [ ] **Description**: `Monthly subscription for dental practice review automation`
- [ ] **Product Type**: Service
- [ ] Create product
- [ ] **Add Pricing**: $249.00 USD monthly recurring
- [ ] **Add Metadata**:
  - [ ] `guarantee_live_48h` = `true`
  - [ ] `guarantee_plus10_reviews_30d` = `true`
  - [ ] `sms_overage_rate` = `0.02`
  - [ ] `addl_location_monthly` = `79`
  - [ ] `sku_code` = `dental_review_engine_founder_249_monthly`
- [ ] Verify product is active
- [ ] Verify price is active
- [ ] **Record Production IDs**:
  - [ ] Product ID: `prod_XXXXXXXXXXXXXX`
  - [ ] Price ID: `price_XXXXXXXXXXXXXX`

### Verification
- [ ] Run verification script for Staging:
  ```bash
  node scripts/verify-stripe-product.js <staging_product_id> <staging_price_id>
  ```
- [ ] Run verification script for Production:
  ```bash
  node scripts/verify-stripe-product.js <production_product_id> <production_price_id>
  ```
- [ ] Both scripts should return "🎉 All verifications passed!"

### Documentation
- [ ] Update `docs/runbook_onboarding.md` with actual Product IDs and Price IDs
- [ ] Take screenshots of product configuration
- [ ] Take screenshots of pricing configuration
- [ ] Take screenshots of metadata configuration
- [ ] Add screenshots to runbook

### Final Verification
- [ ] Staging product retrievable via API
- [ ] Production product retrievable via API
- [ ] All metadata matches exactly
- [ ] No duplicate products with same name
- [ ] Both environments configured identically

## ✅ Completion Criteria
- [ ] Both Staging and Production products created
- [ ] All metadata correctly configured
- [ ] Verification scripts pass
- [ ] Runbook updated with actual IDs
- [ ] Screenshots captured
- [ ] No duplicate products exist
