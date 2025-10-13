import { Request, Response } from 'express';
import { verifyWebhookSignature } from '../../utils/stripe';
import { createPractice } from '../../models/practices';
import { createDefaultSettings } from '../../models/settings';
import { insertEvent, getEventByStripeId } from '../../models/events';
import { createToken } from '../../models/onboarding_tokens';
import { generateMagicLinkToken } from '../../utils/hmac_token';
import { sesClient } from '../../client/ses';
import { HttpError } from '../../utils/errors';
import { pool } from '../../config/database';

export async function POST(req: Request, res: Response) {
  try {
    // Get raw body for signature verification
    const rawBody = req.body;
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      throw new HttpError('Missing Stripe signature', 400);
    }

    // Verify webhook signature
    let stripeEvent;
    try {
      stripeEvent = verifyWebhookSignature(rawBody, signature);
    } catch (error) {
      console.error('Stripe signature verification failed:', error);
      throw new HttpError('Invalid signature', 400);
    }

    // Only handle checkout.session.completed events
    if (stripeEvent && stripeEvent.type !== 'checkout.session.completed') {
      console.log(`Ignoring event type: ${stripeEvent.type}`);
      return res.status(200).json({ received: true });
    }

    // Ensure we have a valid stripe event
    if (!stripeEvent) {
      throw new HttpError('Invalid webhook payload', 400);
    }

    // Check for idempotency - prevent duplicate processing
    const existingEvent = await getEventByStripeId(stripeEvent.id);
    if (existingEvent) {
      console.log(`Event ${stripeEvent.id} already processed, skipping`);
      return res.status(200).json({ received: true });
    }

    const session = stripeEvent.data.object as any;
    const customerDetails = session.customer_details || {};

    // Ensure we have a name - use email as fallback if name is missing
    const practiceName = customerDetails.name || customerDetails.email || 'Unknown Practice';

    // Use database transaction for atomicity
    const client = await pool().connect();
    
    try {
      await client.query('BEGIN');

      // Create practice
      const practice = await createPractice({
        name: practiceName,
        email: customerDetails.email || null,
        phone: customerDetails.phone || null,
        status: 'provisioning'
      }, client);

      // Create default settings
      await createDefaultSettings(practice.id, {
        billing_json: session
      }, client);

      // Create magic link token
      const { token, tokenId } = await createToken({
        practice_id: practice.id,
        expiry_days: 7
      }, client);

      // Generate magic link
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const magicLink = `${frontendUrl}/onboard/${generateMagicLinkToken(tokenId, practice.id, 7)}`;

      // Send magic link email
      const emailResult = await sesClient.sendMagicLinkEmail(
        practice.email || customerDetails.email,
        practice.name || 'Practice Owner',
        magicLink
      );

      // Log events
      await insertEvent({
        practice_id: practice.id,
        type: 'stripe_checkout',
        actor: 'system',
        payload_json: {
          stripe_event_id: stripeEvent.id,
          session_id: session.id,
          customer_email: customerDetails.email
        }
      }, client);

      if (emailResult.success) {
        await insertEvent({
          practice_id: practice.id,
          type: 'onboarding_email_sent',
          actor: 'system',
          payload_json: {
            message_id: emailResult.messageId,
            token_id: tokenId
          }
        }, client);
      } else {
        await insertEvent({
          practice_id: practice.id,
          type: emailResult.retryable ? 'onboarding_email_retry' : 'onboarding_email_failed',
          actor: 'system',
          payload_json: {
            error: emailResult.error,
            token_id: tokenId
          }
        }, client);
      }

      await client.query('COMMIT');
      
      console.log(`Successfully processed checkout for practice ${practice.id}`);
      return res.status(200).json({ received: true });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Stripe webhook error:', error);
    
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
