import { Request, Response } from 'express';
import { verifyWebhookSignature } from '../../utils/stripe';
import { createPractice } from '../../models/practices';
import { createDefaultSettings } from '../../models/settings';
import { insertEvent, getEventByStripeId, getTTLStartEventByStripeId } from '../../models/events';
import { createToken } from '../../models/onboarding_tokens';
import { generateMagicLinkToken } from '../../utils/hmac_token';
import { sesClient } from '../../client/ses';
import { pool, PoolClient } from '../../config/database';

/**
 * Logs checkout-related events for tracking and SLA purposes
 */
async function logCheckoutEvents(
  practiceId: string,
  stripeEvent: any,
  session: any,
  customerDetails: any,
  practiceName: string,
  client: PoolClient
): Promise<void> {
  // TTL start event for SLA tracking
  await insertEvent(
    {
      practice_id: practiceId,
      type: 'stripe_checkout_at',
      actor: 'system',
      payload_json: {
        stripe_event_id: stripeEvent.id,
        stripe_session_id: session.id,
        customer_email: customerDetails.email,
        customer_id: session.customer,
        practice_name: practiceName
      }
    },
    client
  );

  // General checkout event for audit trail
  await insertEvent(
    {
      practice_id: practiceId,
      type: 'stripe_checkout',
      actor: 'system',
      payload_json: {
        stripe_event_id: stripeEvent.id,
        session_id: session.id,
        customer_email: customerDetails.email
      }
    },
    client
  );
}

export async function POST(req: Request, res: Response) {
  // Get raw body for signature verification
  const rawBody = req.body;
  const signature = req.headers['stripe-signature'] as string | undefined;

  if (!signature) {
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }

  let stripeEvent;
  try {
    stripeEvent = verifyWebhookSignature(rawBody, signature);
  } catch (error) {
    console.error('Stripe signature verification failed:', error);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Only handle checkout.session.completed events
  if (stripeEvent && stripeEvent.type !== 'checkout.session.completed') {
    console.log(`Ignoring event type: ${stripeEvent.type}`);
    return res.status(200).json({ received: true });
  }

  if (!stripeEvent) {
    console.error('Stripe webhook error: Missing event payload');
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  try {
    // Check for idempotency - prevent duplicate processing
    // Check both stripe_checkout and stripe_checkout_at events
    const existingEvent = await getEventByStripeId(stripeEvent.id);
    const existingTTLEvent = await getTTLStartEventByStripeId(stripeEvent.id);
    
    if (existingEvent || existingTTLEvent) {
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
      const practice = await createPractice(
        {
          name: practiceName,
          email: customerDetails.email || null,
          phone: customerDetails.phone || null,
          status: 'provisioning'
        },
        client
      );

      // Create default settings
      await createDefaultSettings(
        practice.id,
        {
          billing_json: session
        },
        client
      );

      // Create magic link token
      const { tokenId } = await createToken(
        {
          practice_id: practice.id,
          expiry_days: 7
        },
        client
      );

      // Generate magic link
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const magicLink = `${frontendUrl}/onboard/${generateMagicLinkToken(tokenId, practice.id, 7)}`;

      // Send magic link email
      const emailResult = await sesClient.sendMagicLinkEmail(
        practice.email || customerDetails.email,
        practice.name || 'Practice Owner',
        magicLink
      );

      // Log events for tracking and SLA
      await logCheckoutEvents(practice.id, stripeEvent, session, customerDetails, practiceName, client);

      if (emailResult.success) {
        await insertEvent(
          {
            practice_id: practice.id,
            type: 'onboarding_email_sent',
            actor: 'system',
            payload_json: {
              message_id: emailResult.messageId,
              token_id: tokenId
            }
          },
          client
        );
      } else {
        await insertEvent(
          {
            practice_id: practice.id,
            type: emailResult.retryable ? 'onboarding_email_retry' : 'onboarding_email_failed',
            actor: 'system',
            payload_json: {
              error: emailResult.error,
              token_id: tokenId
            }
          },
          client
        );
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
    return res.status(500).json({ error: 'Internal server error' });
  }
}
