import Stripe from 'stripe';

let stripe: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
}

export function verifyWebhookSignature(rawBody: string, signature: string): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  }

  try {
    const stripeClient = getStripeClient();
    return stripeClient.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${error}`);
  }
}

export { getStripeClient };
