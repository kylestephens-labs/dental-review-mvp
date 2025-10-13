#!/usr/bin/env node

/**
 * Stripe Product Verification Script
 * 
 * This script verifies that the Stripe product and price are correctly configured
 * with the required metadata for the Dental Review Engine.
 * 
 * Usage:
 *   node scripts/verify-stripe-product.js <product_id> <price_id>
 * 
 * Example:
 *   node scripts/verify-stripe-product.js prod_XXXXXXXXXXXXXX price_XXXXXXXXXXXXXX
 */

import Stripe from 'stripe';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

try {
  const envFile = readFileSync(join(projectRoot, '.env'), 'utf8');
  const envVars = envFile.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  for (const line of envVars) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  }
} catch (error) {
  // .env file doesn't exist, continue with system environment variables
  console.log('No .env file found, using system environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const REQUIRED_METADATA = {
  'guarantee_live_48h': 'true',
  'guarantee_plus10_reviews_30d': 'true', 
  'sms_overage_rate': '0.02',
  'sku_code': 'dental_review_engine_founder_199_monthly'
};

const REQUIRED_PRODUCT_NAME = 'Dental Review Engine — Founder';
const REQUIRED_PRICE_AMOUNT = 19900; // $199.00 in cents
const REQUIRED_CURRENCY = 'usd';
const REQUIRED_INTERVAL = 'month';

async function verifyStripeProduct(productId, priceId) {
  console.log('🔍 Verifying Stripe Product Configuration...\n');
  
  try {
    // Verify Product
    console.log('📦 Verifying Product...');
    const product = await stripe.products.retrieve(productId);
    
    console.log(`   Product ID: ${product.id}`);
    console.log(`   Product Name: ${product.name}`);
    console.log(`   Active: ${product.active}`);
    
    // Check product name
    if (product.name !== REQUIRED_PRODUCT_NAME) {
      console.error(`   ❌ Product name mismatch. Expected: "${REQUIRED_PRODUCT_NAME}", Got: "${product.name}"`);
      return false;
    }
    console.log('   ✅ Product name matches');
    
    // Check if product is active
    if (!product.active) {
      console.error('   ❌ Product is not active');
      return false;
    }
    console.log('   ✅ Product is active');
    
    // Verify Price
    console.log('\n💰 Verifying Price...');
    const price = await stripe.prices.retrieve(priceId);
    
    console.log(`   Price ID: ${price.id}`);
    console.log(`   Amount: ${price.unit_amount} ${price.currency}`);
    console.log(`   Recurring: ${price.recurring ? 'Yes' : 'No'}`);
    console.log(`   Active: ${price.active}`);
    
    // Check price amount
    if (price.unit_amount !== REQUIRED_PRICE_AMOUNT) {
      console.error(`   ❌ Price amount mismatch. Expected: ${REQUIRED_PRICE_AMOUNT}, Got: ${price.unit_amount}`);
      return false;
    }
    console.log('   ✅ Price amount matches');
    
    // Check currency
    if (price.currency !== REQUIRED_CURRENCY) {
      console.error(`   ❌ Currency mismatch. Expected: ${REQUIRED_CURRENCY}, Got: ${price.currency}`);
      return false;
    }
    console.log('   ✅ Currency matches');
    
    // Check recurring interval
    if (!price.recurring || price.recurring.interval !== REQUIRED_INTERVAL) {
      console.error(`   ❌ Recurring interval mismatch. Expected: ${REQUIRED_INTERVAL}, Got: ${price.recurring?.interval || 'None'}`);
      return false;
    }
    console.log('   ✅ Recurring interval matches');
    
    // Check if price is active
    if (!price.active) {
      console.error('   ❌ Price is not active');
      return false;
    }
    console.log('   ✅ Price is active');
    
    // Verify Metadata
    console.log('\n🏷️  Verifying Metadata...');
    const metadata = product.metadata || {};
    
    let allMetadataCorrect = true;
    for (const [key, expectedValue] of Object.entries(REQUIRED_METADATA)) {
      const actualValue = metadata[key];
      if (actualValue !== expectedValue) {
        console.error(`   ❌ Metadata mismatch for "${key}". Expected: "${expectedValue}", Got: "${actualValue || 'undefined'}"`);
        allMetadataCorrect = false;
      } else {
        console.log(`   ✅ "${key}": "${actualValue}"`);
      }
    }
    
    if (!allMetadataCorrect) {
      return false;
    }
    
    console.log('\n🎉 All verifications passed! Product and price are correctly configured.');
    return true;
    
  } catch (error) {
    console.error('❌ Error verifying Stripe configuration:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  const productId = process.argv[2];
  const priceId = process.argv[3];
  
  if (!productId || !priceId) {
    console.error('Usage: node scripts/verify-stripe-product.js <product_id> <price_id>');
    console.error('Example: node scripts/verify-stripe-product.js prod_XXXXXXXXXXXXXX price_XXXXXXXXXXXXXX');
    process.exit(1);
  }
  
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY environment variable is required');
    process.exit(1);
  }
  
  const success = await verifyStripeProduct(productId, priceId);
  process.exit(success ? 0 : 1);
}

main().catch(console.error);
