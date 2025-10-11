# Task: task-mgmry7hz-p8qqx - SQL migration 001: core tables

## Status: pending

## Priority: P0

## Agent: cursor

## Created: 2025-10-11T21:15:29.015Z
## Last Updated: 2025-10-11T21:47:07.946Z

## Overview
Create SQL migration 001 with core database tables for dental practice management system

## Goal
Establish the foundational database schema with all core tables, indexes, constraints, and RLS policies needed for the dental MVP

## Acceptance Criteria
- [ ] Create practices table with id, name, phone, email, city, tz, status, created_at, stripe_checkout_at, first_review_request_sent_at
- [ ] Create settings table with practice_id FK, review_link, quiet_hours_start/end, daily_cap, sms_sender, email_sender, default_locale, brand_assets_json, billing_json
- [ ] Create templates table with id, name, locale, channel, body, status, created_at and unique constraint on (name, locale, channel)
- [ ] Create patients table with id, practice_id FK, first_name, mobile_e164 (encrypted), email, opted_out, first_seen_at
- [ ] Create visits table with id, practice_id FK, patient_id FK, occurred_at and unique constraint on (practice_id, patient_id, occurred_at::date)
- [ ] Create review_requests table with id, practice_id FK, patient_id FK, visit_id FK, channel, template_id FK, locale, variant, sent_at, status, provider_msg_id, provider_status, send_error_code, send_error_msg
- [ ] Create engagements table with id, review_request_id FK, event, occurred_at, meta_json
- [ ] Create events table with id, practice_id FK, type, actor, payload_json, occurred_at, ip_hash, ua_hash
- [ ] Create jobs table with id, type, payload_json, status, attempts, available_at, last_error, created_at
- [ ] Create reviews table with id, practice_id FK, source, source_place_id, external_review_id, author_name, rating, text, url, published_at, fetched_at and unique constraint on (practice_id, source, external_review_id)
- [ ] Create review_snapshots table with id, practice_id FK, snapshot_date, total_reviews, average_rating, five_star, four_star, three_star, two_star, one_star, fetched_at and unique constraint on (practice_id, snapshot_date)
- [ ] Create practice_baselines table with practice_id PK FK, baseline_date, baseline_total, baseline_average, created_at
- [ ] Add all required indexes for performance (practice_id, patient_id, sent_at DESC, etc.)
- [ ] Enable RLS on all tables
- [ ] Add triggers for updated_at timestamps
- [ ] Migration runs successfully with psql -f scripts/migrations/001_init.sql

## Definition of Ready
- [ ] Database architecture is understood from docs/dentist_project/architecture.md
- [ ] Core table requirements are clear from architecture document
- [ ] Indexing strategy is defined for performance
- [ ] RLS policies are understood
- [ ] Migration file location is established

## Definition of Done
- [ ] All 12 core tables created with proper structure
- [ ] All foreign key relationships established
- [ ] All unique constraints and indexes created
- [ ] RLS enabled on all tables
- [ ] Triggers for updated_at timestamps working
- [ ] Migration file created at scripts/migrations/001_init.sql
- [ ] Migration runs successfully with psql -f
- [ ] All tests pass
- [ ] Documentation updated

## Files Affected
- scripts/migrations/001_init.sql
- docs/dentist_project/architecture.md (reference)
- supabase/migrations/ (if using Supabase migrations)

## Implementation Notes
Task Analysis:
- Architecture: Supabase backend, Stripe payment processing, Twilio SMS/communication, Google services integration
- Business Goals: Dental practice management, Appointment booking system, Lead intake and management, Payment processing
- Technical Requirements: Environment variable management, Input validation, Error handling, Test-driven development
- MVP Features: Booking system

This task is critical for the dental MVP as it ensures all external service integrations are properly configured before deployment.

## Review Feedback
[Review feedback will be added here]

## Feedback Resolution Status
✅ Resolved

## Error Context
[Error context will be added here]

## Git Context
- Branch: [Branch to be set]
- Commit: [Commit to be set]
- PR: [PR to be set]
