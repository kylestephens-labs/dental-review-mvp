Build Plan — granular, testable tasks (trunk-friendly)

Phase 0 — Foundations (schema, env, seeds) — MVP
1. Create .env.example + load check
Start: add .env.example with all keys (Stripe, Twilio, SES, Places, GCal, Graph, DB, HMAC).
End: boot script fails fast if any keys missing; npm run env:check passes locally.
Feature Flag(Y/N): N

2. SQL migration 001: core tables
Start: /scripts/migrations/001_init.sql.
End: creates practices, settings, patients, visits, review_requests, engagements, events with indexes/uniqs; psql -f succeeds.
Feature Flag(Y/N): N

3. SQL migration 002: queue + templates + reviews
Start: /scripts/migrations/002_queue_templates_reviews.sql.
End: creates jobs, templates, reviews, review_snapshots, practice_baselines; adds new cols to settings/review_requests per ARCH; migration idempotent.
Feature Flag(Y/N): N

4. Seed EN/ES ADA-checked templates
Start: /scripts/seed_templates.sql + /common/templates/*.json.
End: templates has EN & ES rows; unit test reads one and checks placeholder tokens render.
Feature Flag(Y/N): N

⸻

Phase 1 — Stripe → Provisioning & Instrumentation — MVP
5. Stripe SKU metadata check (manual)
Start: Stripe dashboard.
End: Product dental_review_engine_founder_249_monthly with metadata (guarantee_*, sms_overage_rate, etc.) captured in runbook.
Feature Flag(Y/N): N

6. POST /webhooks/stripe with signature verify
Start: backend route + middleware.
End: on checkout.session.completed: insert practice+settings, persist billing_json, write events(type='stripe_checkout'), 200 OK.
Feature Flag(Y/N): N

7. Magic-link issuance
Start: HMAC token util + GET /onboard/:token.
End: webhook writes token; SES email sent with link; token verified & one-time.
Feature Flag(Y/N): N

7b) /healthz endpoint (App Runner health checks)
• Start: Add backend route GET /healthz returning 200 with {status:'ok', sha:<commit>}.
• End: App Runner health check passes locally (curl 200) and in staging; minimal unit test asserts 200 + JSON shape.
• Size: ~1–2 files (<5 KB).
• Test tip: curl -sS localhost:PORT/healthz | jq .status → ok.
Feature Flag(Y/N): N

8. Instrumentation: TTL start
Start: webhook handler.
End: write events(type='stripe_checkout_at') with timestamp (this is the TTL start).
Feature Flag(Y/N): N

⸻

Phase 2 — Onboarding Portal (2-minute, proof first) — MVP
9. GET /onboard/:token prefill
Start: Next.js page fetches practice via token.
End: shows prefilled name/phone/email; default quiet hours/cap; loads but does not save.
Feature Flag(Y/N): N

10. POST /onboard save settings
Start: Zod schema validate + save.
End: updates settings; writes events(type='onboarding_completed').
Feature Flag(Y/N): N

11. Instrumentation: onboarding start
Start: client fires /events/onboarding_started.
End: writes events(type='onboarding_started') on first portal render (one per token).
Feature Flag(Y/N): N

12. "Send test SMS" button → Flow C trigger
Start: POST /onboard/test-sms with {practice_id,to}.
End: enqueues Flow C request; toast shows "sent".
Feature Flag(Y/N): N

⸻

Phase 3 — Twilio/A2P + Template Library — MVP
13. TrustHub registration (manual)
Start: Twilio console.
End: approved brand/campaign; IDs captured in Secrets/Notes.
Feature Flag(Y/N): N

14. Persist template IDs (EN/ES)
Start: config loader writes to templates table.
End: test queries confirm presence; returns template_id by name/locale.
Feature Flag(Y/N): N

15. Twilio inbound webhook + verification
Start: POST /webhooks/twilio/inbound.
End: Twilio signature validated; request rejected if invalid.
Feature Flag(Y/N): N

16. STOP normalization EN/ES + instant suppression
Start: parser for {STOP, END, QUIT, UNSUBSCRIBE, CANCEL; ALTO, CANCELAR}.
End: sets patients.opted_out=true; writes events(type='stop'); returns 200.
Feature Flag(Y/N): N

⸻

Phase 4 — Flow C (Onboarding) — MVP
17. Flow C: proof SMS send
Start: n8n Webhook node receives {practice_id,to}.
End: sends via approved template; writes events(type='proof_sms_ok') or proof_sms_fail with code.
Feature Flag(Y/N): N

18. Concierge reminder at 24h stall
Start: n8n scheduled check for practices with onboarding_started but not onboarding_completed in 24h.
End: sends email+SMS nudge; writes events(type='onboarding_concierge_nudge').
Feature Flag(Y/N): N

⸻

Phase 5 — Connectors — MVP
19. Google Calendar OAuth start/callback
Start: routes /connectors/gcal/auth, /connectors/gcal/callback.
End: token stored (scoped), events(type='gcal_connected').
Feature Flag(Y/N): Y

20. GCal watcher (poll)
Start: 15-min poll or watch; filter event.end past hour.
End: upsert patient, insert visit (idempotent); write events(type='visit_ingested', payload=source_id).
Feature Flag(Y/N): Y

21. Outlook/Graph OAuth start/callback
Start: routes /connectors/outlook/auth, /connectors/outlook/callback.
End: token stored; events(type='outlook_connected').
Feature Flag(Y/N): Y

22. Outlook watcher (poll/subscription)
Start: Graph Calendar subscription or poll.
End: upsert patient, insert visit; event logged visit_ingested.
Feature Flag(Y/N): Y

23. CSV upload endpoint
Start: POST /connectors/csv/upload (multipart).
End: validated rows → patients/visits; returns counts & rejects; events(type='csv_uploaded').
Feature Flag(Y/N): Y

24. Front-Desk POST endpoint
Start: POST /connectors/frontdesk with per-practice token.
End: upsert patient, insert visit; events(type='frontdesk_visit').
Feature Flag(Y/N): Y

24a) Front-Desk daily rate limit + abuse guard (per practice)
• Start: Introduce per-practice limiter (e.g., frontdesk_daily_quota default 500) enforced in the Front-Desk POST handler. Store counters in DB (atomic) or fast KV; return 429 when exceeded.
• End: Requests over the quota return 429 with JSON {error:'rate_limited'}; write events(type='frontdesk_rate_limited'). Add basic jitter/backoff advice in response.
• Size: one handler edit + small helper + migration for default in settings if desired (<50 KB).
• Test tip: Seed quota to 2 in test; send 3 POSTs → last returns 429; verify event row exists.
Feature Flag(Y/N): Y

⸻

Phase 6 — Queue/Outbox + Flow A (Fulfillment) — MVP
25. Queue writer on visit create
Start: on visit insert, enqueue jobs(type='fulfillment', payload={practice_id,visit_id}).
End: record jobs row; unit test asserts enqueue on visit.
Feature Flag(Y/N): N

26. n8n Flow A: fetch & normalize
Start: flow pulls job, retrieves practice/settings/patient.
End: skip duplicates by (practice_id, patient_id, occurred_at::date); write events(type='dedupe_skip') when skipped.
Feature Flag(Y/N): N

27. Quiet hours + daily cap enforcement
Start: function node uses settings and practice TZ.
End: either delays or continues; events(type='send_delayed'|'cap_reached').
Feature Flag(Y/N): N

28. Locale detection & template pick
Start: choose locale from settings.default_locale (fallback EN).
End: resolves template_id for locale; write events(type='template_selected').
Feature Flag(Y/N): N

29. Initial send (SMS)
Start: Twilio SendMessage with template; store provider_msg_id.
End: insert review_requests with sent_at; write events(type='send_ok'|'send_fail', payload=code).
Feature Flag(Y/N): N

30. Reminder path (48h)
Start: wait 48h; check clicked/opted_out.
End: send reminder or skip; write events(type='reminder_sent'|'reminder_skipped').
Feature Flag(Y/N): N

31. Email fallback when SMS blocked
Start: branch on Twilio error codes or A2P pending.
End: send SES email; events(type='fallback_email_sent').
Feature Flag(Y/N): N

32. Idempotency guard
Start: pre-send check by (patient_id, visit_id, channel).
End: log events(type='repeat_send_blocked') if duplicate.
Feature Flag(Y/N): N

⸻

Phase 7 — Tracking & Compliance — MVP
33. Click redirect with hashed telemetry
Start: GET /r/:review_request_id.
End: insert events(type='clicked', ip_hash, ua_hash); 302 to GBP.
Feature Flag(Y/N): N

34. Twilio status callbacks
Start: POST /webhooks/twilio/status.
End: map to events(type='delivered'|'failed', payload=code) and update review_requests.provider_status.
Feature Flag(Y/N): N

35. Opt-out audit query
Start: SQL view for last 7d STOPs by practice.
End: returns counts; used by digest + alerting.
Feature Flag(Y/N): N

⸻

Phase 8 — GBP Reviews Ingest (Flow D) — MVP
36. Place ID resolver
Start: function to derive Place ID from settings.review_link.
End: persists source_place_id per practice.
Feature Flag(Y/N): Y

37. Nightly reviews fetch + upsert
Start: n8n HTTP node with backoff & cache.
End: insert new reviews (unique by external_review_id); write events(type='reviews_fetched').
Feature Flag(Y/N): Y

38. Daily snapshot writer
Start: compute totals & rating distributions.
End: insert review_snapshots (unique per date); events(type='reviews_snapshot').
Feature Flag(Y/N): Y

39. Baseline capture (first run)
Start: if baseline missing.
End: write practice_baselines with total & average; events(type='reviews_baselined').
Feature Flag(Y/N): Y

⸻

Phase 9 — Weekly Digest v1 — MVP
40. Digest SQL (7-day window)
Start: SQL that returns sent, delivered, clicked, CTR, opt-outs, reviews_added_7d, top quotes (from reviews).
End: query passes in psql; returns rows for sample practice.
Feature Flag(Y/N): Y

41. Cron Sun 07:00 PT + SES template
Start: n8n cron + SES call.
End: email delivered; write events(type='digest_sent').
Feature Flag(Y/N): Y

⸻

Phase 10 — SLA & Guarantees — MVP
42. TTL breach job (48h)
Start: scheduled job computes first_review_request_sent_at - stripe_checkout_at.
End: writes events(type='sla_breach') for breaches.
Feature Flag(Y/N): N

43. +10 reviews/30d credit calculator
Start: monthly job compares latest review_snapshots.total_reviews vs baseline.
End: if <10, enqueue credit action (stub); write events(type='guarantee_failed').
Feature Flag(Y/N): N

⸻

Phase 11 — Observability & Cost Guardrails — MVP
44. CloudWatch alarms: webhooks 5xx
Start: alarms on /webhooks/stripe, /webhooks/twilio/*, /onboard.
End: alerts to email/Slack channel.
Feature Flag(Y/N): N

45. Alarms: queue depth & STOP spikes
Start: metrics for jobs backlog and STOP count per hour.
End: alarms fire on thresholds; alerts captured.
Feature Flag(Y/N): N

46. SMS spend monitor
Start: daily job sums Twilio unit costs per practice.
End: alert when weekly spend/practice > $0.70; events(type='cost_guardrail_hit').
Feature Flag(Y/N): N

⸻

Phase 12 — Hardening & Nice-to-haves — Post-MVP (defer if time tight)
47. Delivery webhooks → engagements mirror
Start: map status to engagements(event='delivered'|'failed').
End: data parity with events.
Feature Flag(Y/N): N

48. Front-Desk rate-limit + abuse guard
Start: add per-practice daily cap & 429 logic.
End: test sends halt past threshold; event logged.
Feature Flag(Y/N): Y

49. Demo microsite seed
Start: static page with leaderboard & "text me demo" (stub).
End: not linked in prod; behind env flag.
Feature Flag(Y/N): Y

50. Benchmark email scaffolding
Start: cron skeleton + SQL for peer velocity (no send).
End: disabled by default; flagged as experimental.
Feature Flag(Y/N): Y

⸻

What changed vs your previous docs/tasks.md
	•	Added missing instrumentation for onboarding start/completion/proof outcomes (Tasks 8, 11, 17).
	•	STOP handling upgraded to EN/ES with normalization + audit (Tasks 15–16).
	•	Flow C now logs proof OK/FAIL and adds concierge reminders (Tasks 17–18).
	•	Outlook connector is in with auth + watch (Tasks 21–22).
	•	Flow A split into template selection, locale, email fallback, idempotency (Tasks 28–32).
	•	Tracking now hashes IP/UA and handles Twilio status callbacks (Tasks 33–34).
	•	Flow D (reviews ingest) + snapshots/baseline added to power top quotes & +10 reviews/30d (Tasks 36–39; 42–43).
	•	Observability expanded to SLA breach and cost guardrails + STOP spike alarms (Tasks 44–46).

⸻

Quick “what’s MVP” checklist
	•	MVP Tasks: 1–46
	•	Post-MVP Tasks: 47–50

Everything above is sized to fit comfortably under a ~100 MB commit per task (mostly code/text/sql), single-concern, and testable in isolation.