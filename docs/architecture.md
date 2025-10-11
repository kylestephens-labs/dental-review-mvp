Here’s the revised ARCHITECTURE.md with your requested changes applied:
	•	Outlook/Graph connector is now in-scope for the 14-day MVP (Gmail/Google Calendar first, Outlook/Graph immediately after).
	•	Added a GBP review-ingest path (Flow D) plus schema so weekly digests can surface “top quotes” and the +10 reviews/30d guarantee can be computed from first-party data.

⸻

ARCHITECTURE.md — Review Engine for East Bay Dentists (MVP)

0) MVP Scope (hard boundaries)

In-scope (14-day path):
	•	Stripe checkout (Founder $249/mo SKU) → backend webhook → create practice + settings in Postgres → kick off n8n onboarding → owner proof SMS.
	•	Owner onboarding portal (2-minute, magic-link): prefilled details, quiet hours & daily cap, GBP write-review link, choose data source: Google Calendar (first) or Outlook/Graph (second) or CSV or Front-Desk form.
	•	Flow A (Fulfillment): source → normalize → outbox/queue → quiet hours & caps → template selection (EN/ES, ADA-checked) → Twilio SMS (review ask) → email fallback if SMS blocked → 48h reminder if no click/review.
	•	Flow B (Tracking): click-tracking redirect (custom tracking domains, user-agent/IP hashed) → logs click then 302 to GBP; STOP handling (EN & ES synonyms).
	•	Flow C (Onboarding): proof SMS; concierge nudge if onboarding stalls (24h).
	•	Flow D (GBP Review Ingest & Metrics): scheduled fetch of practice’s Google reviews (count, rating, latest quotes) → persist snapshots & new reviews → power weekly digest “top quotes” and +10 reviews/30d guarantee.
	•	Weekly digest v1: sent/CTR/opt-outs + top quotes (from Flow D).
	•	KPI instrumentation (events): TTL ≤48h, onboarding median ≤2m, CTR ≥45%, requests/30d, opt-out <1%, deliverability failure rate.
	•	SLA/guarantees automation: TTL 48h breach detection; monthly +10 reviews check from review snapshots → enqueue credit if missed.

Out-of-scope (post-MVP backlog only):
	•	Monthly benchmarking email v2, demo microsite, full dashboard, Yelp/other review sources, review scrapers beyond GBP, bandits, missed-call service.

⸻

1) Project Structure (MVP-focused)

[Project Root]/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── webhooks/
│   │   │   │   ├── stripe.ts            # POST /webhooks/stripe (checkout.session.completed)
│   │   │   │   └── twilio_inbound.ts    # POST /webhooks/twilio (STOP, delivery)
│   │   │   ├── onboard/
│   │   │   │   ├── get.ts               # GET /onboard/:token (prefill via magic link)
│   │   │   │   └── save.ts              # POST /onboard (save settings)
│   │   │   ├── connectors/
│   │   │   │   ├── gcal/auth.ts         # Google OAuth start/callback
│   │   │   │   ├── gcal/watch.ts        # (MVP) polling/watch
│   │   │   │   ├── outlook/auth.ts      # Microsoft OAuth start/callback (Graph)
│   │   │   │   ├── outlook/webhook.ts   # (MVP) polling/watch or subscription
│   │   │   │   ├── csv/upload.ts        # POST patients.csv
│   │   │   │   └── frontdesk.ts         # POST manual add (name, mobile/email, occurred_at)
│   │   │   ├── tracking/redirect.ts     # GET /r/{id} → log click → 302 to GBP
│   │   │   └── healthz.ts
│   │   ├── client/                      # Stripe, Twilio, SES, GCal, Graph, Places clients
│   │   ├── models/                      # Prisma/SQL queries
│   │   ├── queue/                       # jobs outbox, workers, backoff, DLQ
│   │   └── utils/                       # idempotency, tz/quiet-hours, schema validation (zod), HMAC tokens
│   └── Dockerfile
├── frontend/ (Next.js)
│   ├── src/pages/
│   │   ├── onboard/[token].tsx          # 2-min portal (proof SMS first)
│   │   └── success.tsx                  # post-Stripe success → onboard redirect
│   └── src/components/                  # OAuth buttons, uploader, quiet-hour slider, caps
├── common/
│   ├── types/                           # Practice, Settings, Patient, Visit, ReviewRequest payloads
│   ├── templates/                       # EN/ES ADA-checked templates & logo lock-up tokens
│   └── utils/                           # phone/email validators, GBP link utils
├── workflows/
│   ├── flowA_fulfillment.json
│   ├── flowB_tracking.json
│   ├── flowC_onboarding.json
│   └── flowD_reviews_ingest.json        # NEW: GBP review ingest & snapshots
├── docs/
│   ├── runbook_onboarding.md
│   ├── runbook_sms.md                   # A2P playbook, STOP audit, template approval
│   └── migrations.md
├── infra/                               # Terraform: API App Runner, n8n App Runner, RDS, Secrets
└── scripts/                             # SQL migrations, seeders


⸻

2) High-Level System & Sequences (MVP)

2.1 Cash-to-SMS sequence (Stripe → test SMS)

Stripe Checkout (founder_249) —(webhook: checkout.session.completed)→ /webhooks/stripe
→ create practice + settings (status='provisioning', SLA start stripe_checkout_at)
→ generate magic-link onboard_token (HMAC, 7-day TTL, one-time) + email (SES)
→ POST n8n Flow C {practice_id} (send proof SMS)
→ redirect buyer to /onboard/:token

2.2 Data ingestion → review request (GCal/Outlook/CSV/Front-Desk)

[Source] → backend connectors → persist patients/visits → enqueue jobs (outbox) → n8n Flow A
Flow A: normalize → dedupe → quiet hours & caps (practice tz) → template pick (EN/ES) → Twilio SendMessage
→ schedule T+48h reminder if not clicked/reviewed → email fallback if SMS blocked/unavailable.

Connector order for MVP:
	1.	Google Calendar (Gmail/GSuite)
	2.	Outlook/Graph (Office 365)
	3.	CSV & Front-Desk (fallbacks)

2.3 Tracking & STOP

Click: GET /r/{review_request_id} → insert events(type='clicked', ip_hash, ua_hash) → 302 to GBP write URL.
STOP: Twilio inbound webhook → normalize EN/ES synonyms (STOP, END, QUIT, UNSUBSCRIBE, CANCEL; ALTO, CANCELAR) → patients.opted_out=true → suppress + audit events(type='stop').

2.4 GBP Review Ingest & Metrics (Flow D)

Schedule (cron): nightly + on-demand after onboarding
Steps:
	1.	Resolve practice’s GBP Place ID (stored in settings.review_link meta).
	2.	Fetch review summary (total count, average rating) and latest reviews (author, rating, text, published time, URL).
	3.	Upsert new reviews into reviews table.
	4.	Insert daily snapshot into review_snapshots (count & average).
	5.	Update practice_baselines on first run (baseline count/date).
	6.	Emit events(type='reviews_snapshot').
Uses: weekly digest “top quotes”; guarantee job computes reviews_added_30d from snapshots.

(Note: comply with GBP/Places API terms & quotas; cache responses; exponential backoff on 429/5xx.)

⸻

3) Core Components

3.1 Frontend (Next.js)
	•	/onboard/:token: prefilled practice details, quiet hours/caps, review link, connect Google or Outlook, upload CSV, “Send me a test message” first. Instrument onboarding_started/completed, proof_sms_ok/fail.
	•	success static page (Stripe → onboard redirect).

3.2 Backend (Node.js)
	•	Stripe webhook: create practice/settings; persist billing metadata; emit onboarding event.
	•	Onboarding API: save settings; trigger proof SMS via Flow C; record timestamps for median onboarding.
	•	Connectors: Google OAuth/watch, Outlook OAuth/watch/subscription, CSV upload (parse, dedupe, persist), Front-Desk POST (per-practice token + rate-limit).
	•	Tracking redirect: logs click & forensics (hashed IP/UA).
	•	Twilio inbound: STOP + (optional) delivery status; email fallback on provider codes.
	•	Reviews ingest trigger: POST /reviews/refresh (admin) to kick Flow D per practice.

3.3 n8n (separate service)
	•	Flow C Onboarding: proof SMS; status updates; concierge reminders on stall (24h).
	•	Flow A Fulfillment: consume jobs → throttle → send → reminder; enforce quiet hours & caps; skip if opted_out.
	•	Flow B Tracking: receives webhooks (if routed); updates RDS (clicks/STOP).
	•	Flow D Reviews Ingest: cron (nightly) + on-demand → GBP summary & reviews → RDS snapshots + new reviews.
	•	Weekly digest v1: cron aggregates & sends Sun 7am PT (uses Flow D data).

⸻

4) Data Stores (RDS authoritative for runtime)

Postgres tables (new & existing)
	•	practices(id, name, phone, email, city, tz, status, created_at)
	•	settings(practice_id, review_link, quiet_hours_start SMALLINT, quiet_hours_end SMALLINT, daily_cap INT, sms_sender, email_sender, default_locale TEXT DEFAULT 'en', brand_assets_json JSONB, billing_json JSONB)
	•	templates(id, name, locale TEXT, channel TEXT, body TEXT, status TEXT, created_at TIMESTAMPTZ)
	•	patients(id, practice_id, first_name, mobile_e164 BYTEA, email, opted_out BOOLEAN, first_seen_at)
	•	visits(id, practice_id, patient_id, occurred_at TIMESTAMPTZ)
	•	review_requests(id, practice_id, patient_id, visit_id, channel TEXT, template_id, locale TEXT, variant TEXT, sent_at TIMESTAMPTZ, status TEXT, provider_msg_id TEXT, provider_status TEXT, send_error_code TEXT, send_error_msg TEXT)
	•	engagements(id, review_request_id, event TEXT, occurred_at TIMESTAMPTZ, meta_json JSONB)  – events: clicked, delivered, failed, stopped
	•	events(id, practice_id, type TEXT, actor TEXT, payload_json JSONB, occurred_at TIMESTAMPTZ, ip_hash TEXT, ua_hash TEXT)
	•	jobs(id, type TEXT, payload_json JSONB, status TEXT, attempts INT, available_at TIMESTAMPTZ, last_error TEXT)  – outbox/queue

NEW for GBP review ingest
	•	reviews(id, practice_id, source TEXT, source_place_id TEXT, external_review_id TEXT, author_name TEXT, rating SMALLINT, text TEXT, url TEXT, published_at TIMESTAMPTZ, fetched_at TIMESTAMPTZ, UNIQUE(practice_id, source, external_review_id))
	•	review_snapshots(id, practice_id, snapshot_date DATE, total_reviews INT, average_rating NUMERIC(3,2), five_star INT, four_star INT, three_star INT, two_star INT, one_star INT, fetched_at TIMESTAMPTZ, UNIQUE(practice_id, snapshot_date))
	•	practice_baselines(practice_id PRIMARY KEY, baseline_date DATE, baseline_total INT, baseline_average NUMERIC(3,2))

Constraints & indexes
	•	visits idempotency: UNIQUE (practice_id, patient_id, occurred_at::date)
	•	Unique provider_msg_id; Stripe idempotency by event id
	•	High-volume indexes: partial on review_requests(sent_at IS NOT NULL), composite (practice_id, sent_at DESC)
	•	Review search: index (practice_id, published_at DESC)

Supabase (existing)
	•	Lead-gen/outreach only; no runtime coupling.

⸻

5) External Integrations (MVP)
	•	Stripe — checkout + checkout.session.completed webhook.
SKU: dental_review_engine_founder_249_monthly
Metadata: guarantee_live_48h=true, guarantee_plus10_reviews_30d=true, sms_overage_rate=0.02, addl_location_monthly=79
	•	Twilio — SMS send & inbound (A2P registration/templates; EN/ES).
	•	SES/Postmark — owner email (welcome, weekly digest v1).
	•	Google Places / GBP — resolve write-review link; review summaries & latest review details for Flow D (respect quotas/ToS; cache).
	•	Google Calendar — OAuth, watch/poll events (MVP: single primary).
	•	Microsoft Graph (Outlook) — OAuth, calendar watch/subscription.
	•	Tracking domains — r.yourdomain.com, rv.yourdomain.com CNAMEs; DKIM/SPF aligned.

⸻

6) Deployment & Infra
	•	Two App Runner services:
	1.	API (backend)
	2.	n8n (workflows)
	•	RDS Postgres (db.t4g.micro).
	•	Secrets Manager: Stripe, Twilio, Places/GBP, Google OAuth, Microsoft OAuth, HMAC token seeds.
	•	CloudWatch: error/bounce/latency alarms; queue depth, send failure rate, STOP spikes, TTL breaches, ingest errors/429s for Flow D.
	•	Frontend: Vercel.

⸻

7) Security & Compliance
	•	A2P 10DLC: brand/campaign registered; templates approved before send.
	•	STOP/UNSUB: inbound webhook flips patients.opted_out=true (EN/ES synonyms); audit trail.
	•	Quiet hours: enforced in Flow A using practice timezone (Olson ID from Places).
	•	PII minimization: first_name, mobile/email, occurred_at only; encrypt mobile at rest (pgcrypto).
	•	Webhook signing: verify Stripe; Twilio validation; rate-limit inbound webhooks (429+jitter).
	•	Magic links: HMAC token, practice-scoped, 7-day TTL; one-time; revocation on use.
	•	Front Desk: per-practice signed token + rate limit (e.g., 500/day).
	•	Review content: store only what’s required for digest/guarantee (author, rating, excerpt, url); observe provider ToS; cache & respect quotas.

⸻

8) KPI Instrumentation (where & how)
	•	TTL (≤48h): events rows (stripe_checkout_at, first_review_request_sent_at) → ttl = diff.
	•	Owner onboarding median (≤2m): onboarding_started → onboarding_completed.
	•	CTR: review_requests.sent vs engagements.event='clicked' (period).
	•	Requests/30d: count review_requests.sent_at.
	•	Opt-out: count distinct patients set opted_out in period.
	•	Deliverability failure rate: send_fail / (send_ok+send_fail).
	•	Reviews added (30d): latest review_snapshots.total_reviews − baseline_total (from practice_baselines).
	•	Weekly digest v1: SQL aggregates + top quotes from reviews (most recent, high-rating, short text).

⸻

9) Phase/Status Board (Definition of Done)

Component	Owner	Status	DoD
Stripe SKU + webhook ($249)	Backend	☐	SKU + metadata present; practice+settings created; billing_json saved; onboarding email sent; SLA timer started.
Onboarding page (magic link)	Frontend	☐	Prefill OK; POST saves; proof SMS button works; timestamps logged; one-time token enforced.
Twilio A2P + EN/ES ADA templates	Ops	☐	Brand/campaign approved; EN+ES templates live; template IDs recorded; logo lock-up token renders.
GBP resolver	Backend	☐	Review link stored; verified via 200 on first click.
Google Calendar connector	Backend	☐	OAuth; watch; sample event → visit → SMS.
Outlook/Graph connector	Backend	☐	OAuth; watch/subscription; sample event → visit → SMS.
CSV upload	Backend	☐	Sample file → patients/visits created (dedup); idempotency OK.
Front-Desk Mode	Backend	☐	Tokenized POST; rate-limited; sends work.
Flow C Onboarding	n8n	☐	Proof SMS & status; concierge reminders at 24h stall.
Flow A Fulfillment (queue-driven)	n8n	☐	Consumes jobs; throttles; respects quiet hours & caps; email fallback; reminder scheduled; skip if opted_out.
Flow B Tracking	n8n	☐	Logs clicks (ip/ua hashed); STOP synonyms (EN/ES) honored; delivery hooks captured when available.
Flow D Reviews Ingest	n8n	☐	Nightly snapshots saved; new reviews upserted; events emitted; baseline set on first run.
Weekly digest v1	n8n	☐	Email Sun 7am PT; counts + CTR + opt-outs + top quotes from reviews; digest_sent logged.
SLA/guarantee jobs	Backend	☐	TTL breach emits sla_breach; +10 reviews/30d computed from snapshots; credit job enqueued if missed.


⸻

10) Post-MVP Backlog
	•	Monthly benchmarks v2; Demo microsite; Dashboard; Yelp & other sources; Review detection scraper; A/B bandits; multi-location rollups; Zapier/Make; SFTP/Drive watcher.

⸻

11) Reliability Patterns
	•	Outbox/queue (jobs): API writes jobs; worker polls with backoff; DLQ on repeated failure; alerts on DLQ growth.
	•	Idempotency: Stripe event ID; CSV (file_hash,line_no); unique provider_msg_id; repeat-send guard (patient_id, visit_id, channel).
	•	Backoff: 1m → 5m → 30m → 3h → DLQ with last_error.
	•	Cost guardrail: daily job computes SMS cost/practice; alert if weekly > $0.70 per active patient.
	•	Ingest guardrail (Flow D): cache by Place ID/day; exponential backoff on 429/5xx; cap reviews pulled per run; store fetched_at.

⸻

12) Timezone & Quiet Hours
	•	TZ derivation: from practice address (Places) → Olson ID; stored in practices.tz.
	•	Apply windows: if CSV lacks time, schedule at 7pm local; otherwise within [quiet_hours_start, quiet_hours_end]; reminders respect same windows.

⸻

13) Tracking Domains & Deliverability
	•	Domains: r.yourdomain.com, rv.yourdomain.com with rotating warm-up; DKIM/SPF alignment for SES; monitor link reputation.
	•	Fallback policy: blocked SMS or unapproved campaign → send email variant; log provider_status, send_fail/send_ok.

⸻

14) Migrations (summary)
	•	001_init.sql creates/updates:
practices, settings, templates, patients, visits, review_requests, engagements, events, jobs, reviews, review_snapshots, practice_baselines + indices & constraints.
	•	Seed templates with EN & ES ADA-checked bodies; set practice_baselines on first Flow D run.

⸻

Done → Pilot → Scale
	•	After completing tasks, onboard 2–3 pilot dentists; verify TTL ≤48h, median onboarding ≤2m, CTR ≥45%, opt-out <1%, reviews_added_30d ≥10 for guarantee cohort, deliverability failures trending down.
	•	Expand outreach; maintain founder pricing for first 25 practices; monitor cost guardrail.

⸻