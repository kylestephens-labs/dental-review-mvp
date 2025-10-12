import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '../../utils/stripe';
import { createPractice } from '../../models/practices';
import { createDefaultSettings } from '../../models/settings';
import { insertEvent, getEventByStripeId } from '../../models/events';
import { HttpError } from '../../utils/errors';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');

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
    if (stripeEvent.type !== 'checkout.session.completed') {
      console.log(`Ignoring event type: ${stripeEvent.type}`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Check for idempotency - prevent duplicate processing
    const existingEvent = await getEventByStripeId(stripeEvent.id);
    if (existingEvent) {
      console.log(`Event ${stripeEvent.id} already processed, skipping`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const session = stripeEvent.data.object as any;
    const customerDetails = session.customer_details || {};

    // Create practice
    const practice = await createPractice({
      name: customerDetails.name || null,
      email: customerDetails.email || null,
      phone: customerDetails.phone || null,
      status: 'provisioning'
    });

    // Create default settings
    await createDefaultSettings(practice.id, {
      billing_json: session
    });

    // Log the event
    await insertEvent({
      practice_id: practice.id,
      type: 'stripe_checkout',
      actor: 'system',
      payload_json: {
        stripe_event_id: stripeEvent.id,
        session_id: session.id,
        customer_email: customerDetails.email
      }
    });

    console.log(`Successfully processed checkout for practice ${practice.id}`);
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message }, 
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
