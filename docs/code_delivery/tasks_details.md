#####

Task 5: Create Stripe Product + Metadata (“Dental Review Engine — Founder $249/mo”)
	•	Task Classification: Non-Functional
	•	Status: Ready

Overview of the task

Create a Stripe Product and recurring Price for the founder plan and attach the required metadata so downstream systems (webhook provisioning, guarantees, cost guardrails) have a single source of truth.

Goal of the task

A single, active monthly product/price exists in Stripe with the exact metadata keys/values, and those IDs are captured in the runbook for use by engineering and ops.

BDD Scenario

Feature: Founder pricing product exists in Stripe with required metadata
  As an operations owner
  I want to create and verify a $249/month Stripe product with precise metadata
  So that provisioning, guarantees, and pricing logic can rely on a single source of truth

  Scenario Outline: Create and verify Stripe product + price for an environment
    Given I am logged into the <environment> Stripe account with write access
    And there is no active product named "Dental Review Engine — Founder $249/mo"
    When I create a Product named "Dental Review Engine — Founder $249/mo"
      And I create a monthly recurring Price for $249 USD linked to that product
      And I set the following metadata on the Product:
        | key                               | value   |
        | guarantee_live_48h                | true    |
        | guarantee_plus10_reviews_30d      | true    |
        | sms_overage_rate                  | 0.02    |
        | addl_location_monthly             | 79      |
        | sku_code                          | dental_review_engine_founder_249_monthly |
    Then I can retrieve the Product via the Stripe Dashboard and API
    And the Product is active and the Price is active and recurring monthly
    And the Product metadata matches exactly the keys and values listed above
    And I record product_id and price_id in the runbook
    But if any metadata key is missing or misspelled, I correct it before marking complete

  Examples:
    | environment |
    | Staging     |
    | Production  |

Acceptance Criteria
	•	Stripe Product exists with name exactly: Dental Review Engine — Founder $249/mo.
	•	Price exists: currency USD, unit amount 24900, recurring.interval=month, active=true.
	•	Product metadata present with exact keys/values (stringified as needed by Stripe):
	•	guarantee_live_48h=true
	•	guarantee_plus10_reviews_30d=true
	•	sms_overage_rate=0.02
	•	addl_location_monthly=79
	•	sku_code=dental_review_engine_founder_249_monthly
	•	Runbook updated with product_id, price_id, creation date, and screenshots (Dashboard Product > Pricing).
	•	Test retrieval succeeds (Dashboard and API) in both Staging and Production.
	•	No duplicate active products with the same name in the same environment. If one exists, it is archived or renamed with an environment suffix.

Files & Resources
	•	Files Affected:
	•	docs/runbook_onboarding.md (append “Stripe Product & Price IDs” section)
	•	docs/runbook_stripe.md (new, optional) – step-by-step with screenshots
	•	Dependencies:
	•	Access to the correct Stripe accounts (Staging & Production)
	•	Product naming convention agreed (this task uses the canonical name)
	•	External Resources:
	•	Stripe Dashboard → Products & Prices
	•	Stripe API (optional verification): stripe products retrieve <product_id>, stripe prices retrieve <price_id>
	•	ENV inventory (where IDs might also be mirrored): AWS Secrets Manager / Vercel env

Business Context
	•	Value: Centralizes pricing & guarantees in Stripe metadata so the webhook can provision practices with the right defaults and so guarantee jobs (+10 reviews/30d, ≤48h TTL) can run from authoritative flags.
	•	Risk: Typos or missing metadata cause downstream logic to mis-read guarantees or pricing; duplicate products can cause the webhook to bind to the wrong SKU.
	•	Success: Engineering can reference one product/price by ID in both environments; metadata keys are exact; runbook contains IDs and screenshots; retrieval via API confirms configuration.


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


    Task 7: Magic-link issuance
	•	Task Classification: Functional
	•	Status: Ready

Overview of the task

Issue a secure, one-time, 7-day magic link after a successful Stripe checkout. The backend creates and stores a signed HMAC token, emails the owner an onboarding link, and verifies/consumes the token on GET /onboard/:token before serving prefilled onboarding data or redirecting to the frontend page.

Goal of the task

Let a new practice start onboarding in ~2 minutes without a password, while preventing replay/tampering and providing a clear audit trail.

BDD Scenario

Feature: Passwordless onboarding via one-time magic link
  As a new practice owner
  I want to receive a secure onboarding link
  So that I can complete setup quickly without creating a password

  Background:
    Given STRIPE_WEBHOOK has created a practice with contact email
    And the system is configured with HMAC_SECRET and SES sender identity
    And magic links expire after 7 days and are one-time use

  Scenario: Happy path - owner starts onboarding from email
    Given a magic link has been issued for practice "Bright Smiles Dental"
    And the link was sent to owner@example.com
    When the owner clicks the link within 7 days
    Then GET /onboard/:token verifies signature and expiry
    And the token is marked as used (one-time)
    And the owner is shown the prefilled onboarding page
    And an events row is written with type "onboarding_started"

  Scenario: Expired link is rejected
    Given a magic link was issued more than 7 days ago
    When the owner clicks the link
    Then the request is rejected with HTTP 410 (expired)
    And no onboarding data is returned
    And an events row is written with type "onboarding_token_expired"

  Scenario: Replayed link is rejected
    Given a magic link was already used once
    When the link is clicked again
    Then the request is rejected with HTTP 401 (already used)
    And an events row is written with type "onboarding_token_reused"

  Scenario: Tampered token is rejected
    Given an attacker modifies any part of the token
    When GET /onboard/:token is called
    Then signature verification fails
    And the request is rejected with HTTP 401 (invalid token)
    And no state changes occur

  Scenario: Wrong-practice token is rejected
    Given a token scoped to practice A
    When the token is presented while requesting practice B context
    Then the request is rejected with HTTP 403 (wrong scope)
    And an events row is written with type "onboarding_token_scope_mismatch"

  Scenario Outline: Email deliverability fallback
    Given SES returns <send_result> on send
    When the system attempts to send the magic-link email
    Then the system <expected_behavior>
    And an events row is written with type "<event_type>"
    Examples:
      | send_result | expected_behavior                     | event_type              |
      | success     | records message_id and returns 200    | onboarding_email_sent   |
      | temp_fail   | enqueues retry and returns 202        | onboarding_email_retry  |
      | perm_fail   | logs error and returns 500            | onboarding_email_failed |

Acceptance Criteria
	•	Issuance: On checkout.session.completed, system creates a magic-link token scoped to practice_id, with exp = now + 7d, and persists issued_at, expires_at, used_at (NULL), and a server-side identifier.
	•	Format: Token is base64url of {token_id}.{exp}.{practice_id}.{mac} where mac = HMACSHA256(token_id.exp.practice_id, HMAC_SECRET). The raw MAC is not stored; only a hash of token_id (or the whole token) is stored server-side for lookups.
	•	Email: SES email is sent to the practice owner with the link https://app.yourdomain.com/onboard/<token>; message_id is stored; failures are logged and retried with exponential backoff.
	•	Verification: GET /onboard/:token verifies MAC, TTL, not-used, and practice scope. Invalid → 401, expired → 410, reused → 401, wrong scope → 403.
	•	Consumption: On first successful verification, mark used_at = now() atomically; subsequent requests with the same token are rejected (idempotent guard).
	•	Prefill: Successful verification returns prefilled practice/settings (name, email, phone, quiet hours defaults) or redirects to frontend/onboard/[token].tsx with HTTP 302.
	•	Audit: Insert events rows for onboarding_email_sent|retry|failed, onboarding_token_issued, onboarding_started, onboarding_token_expired, onboarding_token_reused, onboarding_token_scope_mismatch.
	•	Security: Route uses raw body only where needed (not here), enforces POST for issuance, GET for verification, and rate-limits verification attempts per IP and per token.
	•	Observability: Structured logs include practice_id, token_id, decision (allow/deny), and reason; metrics counters for issued/verified/denied/expired.

Files & Resources
	•	Files Affected
	•	backend/src/utils/hmac_token.ts — generate/verify magic-link tokens (base64url, exp, HMAC).
	•	backend/src/api/onboard/get.ts — GET /onboard/:token verify/consume + prefill/redirect.
	•	backend/src/models/onboarding_tokens.ts — createToken, consumeToken, findByTokenId (stores token_id_hash, practice_id, issued_at, expires_at, used_at).
	•	backend/src/models/events.ts — helper to log events listed above.
	•	backend/src/client/ses.ts — SES send wrapper returning message_id and retry hints.
	•	backend/src/api/webhooks/stripe.ts — touch: call createToken + sendEmail after practice creation.
	•	frontend/src/pages/onboard/[token].tsx — no logic change; ensure it calls GET /onboard/:token to prefill.
	•	Dependencies
	•	Task 6 (Stripe webhook) completed and creates the practice row.
	•	Phase 0 migrations applied; add token table migration if not present.
	•	External Resources
	•	AWS SES (verified sender/domain).
	•	HMAC key (HMAC_SECRET) in Secrets Manager.
	•	Base64url utility (Node Buffer or small helper).

Business Context
	•	Value: Delivers the “2-minute setup, no new software” promise, cutting friction and support load; supports SLA “Go-live ≤ 48h.”
	•	Risk: Token replay/tamper leading to account takeover; email deliverability issues; token leakage in logs or referrals.
	•	Success: Owner receives email, link verifies once within 7 days, prefill loads, and subsequent clicks are blocked; all outcomes are auditable and idempotent.

⸻

Implementation notes
	•	Store only token_id_hash (e.g., sha256(token_id)) to locate tokens; never store the full token string.
	•	Mark consumption inside a DB transaction with a WHERE used_at IS NULL AND now() < expires_at guard; return rows affected = 1 as success.
	•	Add a lightweight rate limiter: e.g., 10 verify attempts per token per hour, 50 per IP per hour.
	•	Email subject: “Your 2-minute onboarding link” with CTA and short expiry note; include support fallback.

  # AI Response Should:
- Reference the established context from docs/SENIOR_ENGINEER_PROMPT.md
- Apply the appropriate approach (TDD/Problem Analysis)
- Work systematically through the task
- Ask focused questions about specific requirements

####


Task 7b: Add /healthz endpoint for App Runner health checks
	•	Task Classification: Functional
	•	Status: Ready

Overview of the task

Expose a lightweight liveness endpoint at GET /healthz that always returns HTTP 200 with a minimal JSON payload including a static status and current commit SHA. Add a minimal test to assert status code and response shape. This enables AWS App Runner (and local/dev tools) to verify service health without touching downstream dependencies.

Goal of the task

Provide a fast, dependency-free liveness probe suitable for App Runner health checks and local diagnostics, with a commit identifier to aid release verification and rollbacks.

BDD Scenario

Feature: Liveness probe for the API service
  As a platform operator
  I want a simple health endpoint
  So that App Runner and developers can verify the service is running and identify the deployed commit

  Scenario: Successful liveness check
    Given the API service is running
    When I send a GET request to "/healthz"
    Then the response status is 200
    And the response body is JSON with "status" set to "ok"
    And the response body includes a non-empty "sha" string

  Scenario: HEAD request behaves like GET
    Given the API service is running
    When I send a HEAD request to "/healthz"
    Then the response status is 200

  Scenario: Endpoint is dependency-free
    Given the database or external services are unavailable
    When I send a GET request to "/healthz"
    Then the response status is 200
    And the response body is JSON with "status" set to "ok"

Acceptance Criteria
	•	GET /healthz returns 200 OK with body: { "status": "ok", "sha": "<commit>" }.
	•	sha is sourced from an environment variable (e.g., COMMIT_SHA) or build-time constant, and is a non-empty string.
	•	HEAD /healthz returns 200 OK.
	•	Endpoint has no dependency on DB, queues, or external services (pure in-process response).
	•	Unit test asserts status 200 and JSON shape (status === "ok", typeof sha === "string" and not empty).
	•	Local manual check passes: curl -sS localhost:$PORT/healthz | jq -r .status outputs ok.
	•	Staging App Runner health check succeeds using /healthz path.

Files & Resources
	•	Files Affected:
	•	backend/src/api/healthz.ts (new) — route handler
	•	backend/src/api/index.ts or router registry — add route registration
	•	backend/src/utils/buildInfo.ts (new, optional) — export commit SHA from env/build
	•	backend/src/api/__tests__/healthz.test.ts (new) — minimal unit test
	•	Dependencies:
	•	API server bootstrapped (Express/Fastify/Next API routes as used by the project)
	•	Test runner configured (e.g., Jest + supertest)
	•	External Resources:
	•	AWS App Runner service settings (health check path /healthz, 200 expected)

Business Context
	•	Value: Enables reliable rollouts and quick diagnosis (which commit is live), reduces false negatives by keeping the probe dependency-free.
	•	Risk: If it touches DB or external services, transient outages could flake health checks and trigger unnecessary restarts.
	•	Success: App Runner shows healthy status in staging and local curl/test both pass; logs confirm no downstream calls during /healthz.

⸻

Implementation Notes (non-binding)
	•	Commit SHA source: Prefer process.env.COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || "dev".
	•	Route shape (Express example):
	•	router.get("/healthz", (_req, res) => res.status(200).json({ status: "ok", sha: COMMIT_SHA }));
	•	router.head("/healthz", (_req, res) => res.sendStatus(200));
	•	Test tip: Use supertest to hit /healthz and assert res.status === 200, res.body.status === "ok", typeof res.body.sha === "string" and res.body.sha.length > 0.

    # AI Response Should:
- Reference the established context from docs/SENIOR_ENGINEER_PROMPT.md
- Apply the appropriate approach (TDD/Problem Analysis)
- Work systematically through the task
- Ask focused questions about specific requirements

####


Task 8: Instrumentation — TTL Start (stripe_checkout_at)
	•	Task Classification: Functional
	•	Status: Ready

Overview of the task

On receipt of a valid checkout.session.completed webhook from Stripe, persist a single instrumentation row in events that marks the “time-to-live” (TTL) start for the practice: events.type = 'stripe_checkout_at'. This timestamp is the authoritative start of the 48-hour “live or free” SLA window.

Goal of the task

Record an idempotent, auditable marker for the exact moment we begin the 48-hour SLA timer, tied to the newly created practice.

BDD Scenario

Feature: Start TTL when a Stripe checkout completes
  As the platform
  I want to record the TTL start when checkout completes
  So that SLA calculations use a single, reliable timestamp

  Background:
    Given the events table exists and the Stripe webhook endpoint is live

  Scenario: TTL start is recorded on successful checkout
    Given a valid Stripe "checkout.session.completed" event with event_id "evt_123"
    And the webhook signature is verified
    And a practice row has been created for the session's customer
    When the webhook handler processes the event
    Then an events row is written with type "stripe_checkout_at"
    And the row references the correct practice_id
    And payload_json includes {"stripe_event_id":"evt_123","stripe_session_id":"cs_test_..."}
    And occurred_at is set to the server receipt time
    And no duplicate "stripe_checkout_at" is created for the same session

  Scenario: Duplicate delivery does not create multiple TTL starts
    Given the same Stripe event "evt_123" is delivered again
    When the webhook handler processes the duplicate
    Then no additional "stripe_checkout_at" event is inserted
    And the handler returns 200 OK

  Scenario: Invalid signature is rejected
    Given a "checkout.session.completed" payload with an invalid signature
    When the webhook handler processes the request
    Then no "stripe_checkout_at" event is written
    And the handler returns 400/401

Acceptance Criteria
	•	On first valid checkout.session.completed, exactly one events row is inserted with:
	•	type = 'stripe_checkout_at'
	•	practice_id matching the created/associated practice
	•	occurred_at set by the server at insert time (UTC)
	•	payload_json including stripe_event_id, stripe_session_id, and minimal useful context (customer id/email if available)
	•	Subsequent deliveries of the same Stripe event (same stripe_event_id) do not create additional rows (idempotent by event id or session id).
	•	Handler returns 200 OK on valid events (including duplicates) and 4xx on invalid signature.
	•	Basic unit/integration tests cover: happy path, duplicate event, invalid signature.
	•	SQL query to retrieve TTL start for a practice returns the inserted row (documented in code comment/test).

Files & Resources
	•	Files Affected:
	•	backend/src/api/webhooks/stripe.ts (insert TTL event; enforce idempotency)
	•	backend/src/models/events.ts (helper to insert/find events)
	•	backend/src/utils/idempotency.ts (optional: guard by stripe_event_id)
	•	common/types/events.ts (add 'stripe_checkout_at' literal to type union)
	•	docs/runbook_onboarding.md (note TTL start source)
	•	Tests:
	•	backend/src/api/webhooks/__tests__/stripe.webhook.test.ts
	•	backend/src/models/__tests__/events.test.ts
	•	Dependencies:
	•	Task 6 (“POST /webhooks/stripe with signature verify”) completed.
	•	Migration 001 (events table) completed.
	•	Practice creation on checkout path is in place (so we can resolve practice_id).
	•	External Resources:
	•	Stripe Webhooks & Signature Verification docs
	•	Internal DB schema for events(practice_id, type, payload_json, occurred_at, ...)

Business Context
	•	Value: Establishes the SLA timer for “Live in ≤48h or first month free,” enabling later breach detection and credits.
	•	Risk: Missing or duplicated TTL starts can cause false SLA breaches or missed credits. Bad practice_id linkage breaks downstream analytics.
	•	Success:
	•	Verified single stripe_checkout_at per session/practice.
	•	SLA computation jobs can reliably diff first_review_request_sent_at - stripe_checkout_at.
	•	Observability dashboards show non-zero counts for TTL starts aligned with checkouts.


  # AI Response Should:
- Reference the established context from docs/SENIOR_ENGINEER_PROMPT.md
- Apply the appropriate approach (TDD/Problem Analysis)
- Work systematically through the task
- Ask focused questions about specific requirements


####


Task 9: GET /onboard/:token prefill
	•	Task Classification: Functional
	•	Status: Ready

Overview of the task

Implement the onboarding page that, given a one-time magic link token, fetches practice info and displays a prefilled form (name, phone, email) plus default quiet-hours and daily-cap settings. Page loads but does not save anything to the server.

Goal of the task

Enable a frictionless “2-minute” onboarding start by showing owners they’re “already set up,” with safe token handling and instrumentation of onboarding_started.

BDD Scenario

Feature: Prefilled onboarding via magic link
  As a dental practice owner
  I want my practice details to be prefilled when I open the onboarding link
  So that I can finish setup quickly without retyping information

  Background:
    Given the system issues a one-time HMAC-signed onboarding token with a 7-day TTL

  Scenario: Happy path - token valid, form prefilled, no writes on load
    Given I open the onboarding URL "/onboard/<token>" with a valid, unused token
    When the page requests GET /onboard/<token> from the backend
    Then I see my practice name, phone, and email prefilled
    And I see default quiet hours and a default daily send cap prefilled
    And the "Save" action is disabled until I interact with the form
    And no practice settings are saved to the database on page load
    And an "onboarding_started" event is recorded once per token

  Scenario: Block access - token invalid, expired, or already used
    Given I open the onboarding URL "/onboard/<token>" with a token that is <state>
    When the backend validates the token
    Then I see an error screen explaining why onboarding cannot proceed
    And I am offered a safe recovery path (request new link or contact support)
    And no practice data is leaked in the response

  Scenario: Observability - health and UX guardrails
    Given the page load takes longer than 2 seconds to fetch the prefill payload
    When a timeout threshold is exceeded
    Then the UI shows a non-blocking skeleton/loader and retries once
    And errors are captured in logs/telemetry without exposing PII

  Scenario Outline: Token validation responses
    Given the onboarding token is "<token_state>"
    When GET /onboard/<token> is called
    Then the API responds with "<http_status>" and "<ui_state>"

    Examples:
      | token_state | http_status | ui_state                 |
      | valid       | 200         | prefilled_form           |
      | expired     | 410         | expired_link_message     |
      | used        | 409         | already_used_message     |
      | invalid     | 401         | invalid_link_message     |

Acceptance Criteria
	•	Prefill data: Name, phone (E.164 masked), email, quiet-hours (start/end), and daily cap values render on initial load.
	•	No writes on load: Loading the page never mutates DB state (settings remain unchanged until a future POST).
	•	Token validation:
	•	Valid & unused → 200 with prefill payload.
	•	Expired → 410 Gone.
	•	Already used → 409 Conflict.
	•	Invalid signature/format → 401 Unauthorized.
	•	Security: Token is single-use, practice-scoped, HMAC-signed, and never logged in plaintext; server-side verifies TTL and signature.
	•	PII safety: Phone is displayed masked in UI (e.g., (***) ***-1234), full value never logged; API returns full E.164 only over HTTPS and only to authorized token.
	•	Instrumentation: Exactly one events(type='onboarding_started') is written per token on first successful render. Idempotent if the user refreshes.
	•	UX resiliency: Loading skeleton shown within 150ms; network errors show a friendly retry with support fallback; no hard crash.
	•	Contract: Frontend validates response against a Zod schema; unknown fields are ignored; missing required fields show an error state.
	•	Accessibility: Labels/ARIA for inputs; focus states; color-contrast ≥ 4.5:1.
	•	Tests: Unit tests for token states and schema; integration test confirms no DB writes on GET; e2e happy-path renders prefilled values.

Files & Resources
	•	Files Affected:
	•	frontend/src/pages/onboard/[token].tsx (prefilled page + SSR/CSR fetch + skeleton state)
	•	frontend/src/components/onboard/Form.tsx (presentational form; save button disabled)
	•	frontend/src/lib/api/onboard.ts (typed client for GET /onboard/:token)
	•	frontend/src/lib/validation/onboard.ts (Zod schema for prefill payload)
	•	backend/src/api/onboard/get.ts (GET /onboard/:token validation + response; no writes)
	•	common/types/onboard.ts (shared TypeScript types)
	•	backend/src/utils/magicLink.ts (HMAC verify, TTL, one-time checks)
	•	backend/src/models/events.ts (write onboarding_started idempotently)
	•	Tests: frontend/__tests__/onboard.spec.tsx, backend/__tests__/onboard.get.test.ts
	•	Dependencies:
	•	Task 6 (Stripe webhook creates practice + settings)
	•	Task 7 (Magic-link issuance & TTL/one-time semantics)
	•	Task 8/11 (Instrumentation scaffolding for events)
	•	External Resources:
	•	None beyond existing infra; ensure HTTPS, HSTS, and secure cookies/localStorage policies if used for UI state.

Business Context
	•	Value: Directly supports the “2-minute setup” promise and Owner UX KPI (median ≤ 2 min), reducing drop-off at first touch.
	•	Risk: Token misuse could leak PII; caching or logging could expose tokens; accidental writes on GET could corrupt settings.
	•	Success:
	•	Median time-to-first-render of prefilled page ≤ 1s p95 ≤ 2s.
	•	≥ 95% of valid token visits record onboarding_started exactly once.
	•	Zero DB mutations on GET verified via tests and logs.
	•	Correct HTTP codes for all token states with safe, branded error screens.


    # AI Response Should:
- Reference the established context from docs/SENIOR_ENGINEER_PROMPT.md
- Apply the appropriate approach (TDD/Problem Analysis)
- Work systematically through the task
- Ask focused questions about specific requirements