####Task 6: POST /webhooks/stripe with signature verify
	•	Task Classification: Functional
	•	Status: Ready

Overview of the task

Implement a secure Stripe webhook endpoint that verifies signatures and handles the checkout.session.completed event. On receipt, create the practice and default settings, persist the raw Stripe billing payload, and log an internal events row (type='stripe_checkout'). Return an HTTP 200 on success.

Goal of the task

Reliably and securely bootstrap a new practice from a paid checkout so downstream onboarding (magic link, proof SMS, etc.) can proceed.

BDD Scenario

Feature: Stripe checkout webhook boots a new practice
  As an operator of the Review Engine
  I want Stripe to notify us when a dentist completes checkout
  So that a practice and its settings are created automatically

  Background:
    Given the backend is configured with STRIPE_WEBHOOK_SECRET
    And the database has the core tables from migrations 001 and 002
    And Stripe product/price for founder pricing exists (checked in Task 5)

  Scenario: Happy path - verified payload creates practice and logs event
    Given Stripe sends a "checkout.session.completed" event with a valid signature
    And the session contains customer details and product metadata
    When the endpoint POST /webhooks/stripe processes the payload
    Then a new practice record is created with status "provisioning"
    And a settings row is created with defaults (quiet hours, cap, locale)
    And billing_json is persisted from the Stripe session
    And an events row is written with type "stripe_checkout"
    And the endpoint responds with HTTP 200

  Scenario: Invalid signature is rejected
    Given Stripe sends any event with an invalid signature
    When the endpoint attempts to verify the signature
    Then no database changes are made
    And the endpoint responds with HTTP 400

  Scenario: Idempotent handling of duplicate delivery
    Given a "checkout.session.completed" event is delivered twice with the same Stripe event id
    And the first delivery created the practice and wrote an event row
    When the duplicate is received
    Then no duplicate practice/settings are created
    And the endpoint responds with HTTP 200

  Scenario: Unhandled event type is safely ignored
    Given Stripe sends a "payment_intent.canceled" with a valid signature
    When the endpoint processes the event
    Then no database changes are made
    And the endpoint responds with HTTP 200

  Scenario Outline: Minimal but usable customer details
    Given a "checkout.session.completed" with valid signature
    And the session has <name_presence> name and <phone_presence> phone
    When the endpoint maps fields into practice and settings
    Then missing optional fields are stored as NULL or sensible defaults
    And the endpoint responds with HTTP 200
    Examples:
      | name_presence | phone_presence |
      | present       | present        |
      | present       | missing        |
      | missing       | present        |
      | missing       | missing        |

Acceptance Criteria
	•	Signature verification: Payload is validated with STRIPE_WEBHOOK_SECRET using Stripe SDK; invalid signatures return 400 without side effects.
	•	Event gating: Only checkout.session.completed triggers creation logic; other events return 200 with no writes.
	•	Practice creation: Inserts into practices with status='provisioning', name, email, phone, tz (nullable), created_at set by DB.
	•	Settings creation: Inserts into settings for the new practice with defaults (default_locale='en', quiet hours and daily cap from constants), and stores review_link if provided later (NULL for now).
	•	Billing payload: Full Stripe session JSON (safe subset) is stored in settings.billing_json (or practice-level column per schema) for audit.
	•	Event log: Writes an events row with type='stripe_checkout', actor='system', and payload_json containing stripe_event_id, session_id, and customer_email.
	•	Idempotency: Duplicate Stripe event.id does not create duplicate practice/settings (guard with a unique key or prior-event check).
	•	Performance: Endpoint returns 200 within Stripe’s timeout budget even on retries; heavy work is minimal and synchronous (no external calls).
	•	Error handling: Unexpected errors return 5xx and are logged; no partial rows remain (wrap in transaction).
	•	Observability: Structured logs for received event type, verification result, created IDs; metrics counter for processed vs. ignored vs. rejected.
	•	Security: Route is not exposed to CORS; only POST allowed; request body used exactly as received (raw body) for signature verification.

Files & Resources
	•	Files Affected
	•	backend/src/api/webhooks/stripe.ts (new)
	•	backend/src/utils/stripe.ts (helper: construct client, verify signature)
	•	backend/src/models/practices.ts (createPractice)
	•	backend/src/models/settings.ts (createDefaultSettings)
	•	backend/src/models/events.ts (insertEvent, getEventByStripeId)
	•	backend/src/utils/errors.ts (http errors)
	•	backend/src/api/healthz.ts (no change; for env smoke test)
	•	Dependencies
	•	Task 5: Stripe product/price + metadata validated
	•	Phase 0 migrations (001, 002) applied; indices & constraints in place
	•	.env contains STRIPE_WEBHOOK_SECRET and STRIPE_API_KEY; boot check passes
	•	External Resources
	•	Stripe SDK & Webhook signature docs
	•	Stripe CLI for local test (stripe listen / stripe trigger checkout.session.completed)

Business Context
	•	Value: Turns paid intent into a live tenant automatically, enabling “go-live ≤ 48h” and 2-minute onboarding.
	•	Risk: Duplicate creation on retries, spoofed payloads if signature not verified, slow responses causing Stripe to retry, PII mishandling.
	•	Success: End-to-end test via Stripe CLI creates exactly one practice + settings, logs one stripe_checkout event, and returns 200; invalid signature returns 400 with no writes; duplicate event is idempotently acknowledged with 200.

⸻

Notes to implementer
	•	Use raw body middleware for this route (Stripe requires the exact byte stream for signature verification).
	•	Store Stripe event.id in events.payload_json and consider an auxiliary table or unique partial index to enforce idempotency (e.g., UNIQUE((payload_json->>'stripe_event_id')) WHERE type='stripe_checkout').
	•	Map fields from checkout.session:
	•	practice.name ← customer_details.name (nullable)
	•	practice.email ← customer_details.email
	•	practice.phone ← customer_details.phone (nullable)
	•	settings.billing_json ← safe copy of session object
	•	Defaults for quiet_hours_start/end, daily_cap, default_locale='en'
	•	Do not emit TTL start (stripe_checkout_at) here; that’s covered in Task 8 (Instrumentation).


    ####


    