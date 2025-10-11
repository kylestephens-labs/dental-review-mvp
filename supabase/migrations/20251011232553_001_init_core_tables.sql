-- SQL Migration 001: Core Tables for Dental Practice Management MVP
-- Based on architecture.md specifications
-- Creates practices, settings, patients, visits, review_requests, engagements, events with indexes/uniqs

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Practices table - core practice information
CREATE TABLE IF NOT EXISTS public.practices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  city TEXT,
  tz TEXT DEFAULT 'America/Los_Angeles', -- Olson timezone ID
  status TEXT DEFAULT 'provisioning' NOT NULL, -- provisioning, active, suspended
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  stripe_checkout_at TIMESTAMPTZ, -- TTL start timestamp
  first_review_request_sent_at TIMESTAMPTZ -- TTL end timestamp
);

-- Settings table - practice configuration
CREATE TABLE IF NOT EXISTS public.settings (
  practice_id UUID PRIMARY KEY REFERENCES public.practices(id) ON DELETE CASCADE,
  review_link TEXT, -- Google Business Profile review URL
  quiet_hours_start SMALLINT DEFAULT 8, -- Hour (0-23)
  quiet_hours_end SMALLINT DEFAULT 20, -- Hour (0-23)
  daily_cap INTEGER DEFAULT 50, -- Max SMS per day
  sms_sender TEXT DEFAULT 'DentalCare', -- Twilio sender name
  email_sender TEXT DEFAULT 'noreply@dentalcare.com', -- SES sender
  default_locale TEXT DEFAULT 'en' NOT NULL, -- en, es
  brand_assets_json JSONB DEFAULT '{}', -- Logo, colors, etc.
  billing_json JSONB DEFAULT '{}', -- Stripe metadata
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Templates table - SMS/email templates
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- template identifier
  locale TEXT NOT NULL, -- en, es
  channel TEXT NOT NULL, -- sms, email
  body TEXT NOT NULL, -- template content with placeholders
  status TEXT DEFAULT 'active' NOT NULL, -- active, inactive, testing
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(name, locale, channel)
);

-- Patients table - patient information
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_id UUID NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  mobile_e164 BYTEA, -- Encrypted phone number (E.164 format)
  email TEXT,
  opted_out BOOLEAN DEFAULT false NOT NULL,
  first_seen_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Visits table - appointment/visit records
CREATE TABLE IF NOT EXISTS public.visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_id UUID NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL,
  occurred_date DATE NOT NULL, -- Computed column for unique constraint
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  -- Idempotency constraint: one visit per patient per day
  UNIQUE(practice_id, patient_id, occurred_date)
);

-- Review requests table - SMS/email send records
CREATE TABLE IF NOT EXISTS public.review_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_id UUID NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES public.visits(id) ON DELETE CASCADE,
  channel TEXT NOT NULL, -- sms, email
  template_id UUID REFERENCES public.templates(id),
  locale TEXT DEFAULT 'en' NOT NULL,
  variant TEXT DEFAULT 'default', -- A/B test variant
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' NOT NULL, -- pending, sent, delivered, failed, stopped
  provider_msg_id TEXT, -- Twilio/SES message ID
  provider_status TEXT, -- delivery status from provider
  send_error_code TEXT,
  send_error_msg TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  -- Unique provider message ID constraint
  UNIQUE(provider_msg_id)
);

-- Engagements table - click tracking and interactions
CREATE TABLE IF NOT EXISTS public.engagements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_request_id UUID NOT NULL REFERENCES public.review_requests(id) ON DELETE CASCADE,
  event TEXT NOT NULL, -- clicked, delivered, failed, stopped
  occurred_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  meta_json JSONB DEFAULT '{}' -- Additional event metadata
);

-- Events table - system events and instrumentation
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_id UUID REFERENCES public.practices(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- stripe_checkout, onboarding_started, send_ok, etc.
  actor TEXT DEFAULT 'system', -- system, user, webhook, etc.
  payload_json JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  ip_hash TEXT, -- Hashed IP address for privacy
  ua_hash TEXT -- Hashed user agent for privacy
);

-- Jobs table - outbox/queue for async processing
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- fulfillment, reminder, digest, etc.
  payload_json JSONB NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL, -- pending, processing, completed, failed
  attempts INTEGER DEFAULT 0 NOT NULL,
  available_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================================
-- GBP REVIEW INGEST TABLES (Flow D)
-- ============================================================================

-- Reviews table - Google Business Profile reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_id UUID NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  source TEXT DEFAULT 'google' NOT NULL, -- google, yelp, etc.
  source_place_id TEXT NOT NULL, -- Google Place ID
  external_review_id TEXT NOT NULL, -- Provider's review ID
  author_name TEXT,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  url TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  -- Unique constraint to prevent duplicates
  UNIQUE(practice_id, source, external_review_id)
);

-- Review snapshots table - daily review metrics
CREATE TABLE IF NOT EXISTS public.review_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_id UUID NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_reviews INTEGER DEFAULT 0 NOT NULL,
  average_rating NUMERIC(3,2) DEFAULT 0.00 NOT NULL,
  five_star INTEGER DEFAULT 0 NOT NULL,
  four_star INTEGER DEFAULT 0 NOT NULL,
  three_star INTEGER DEFAULT 0 NOT NULL,
  two_star INTEGER DEFAULT 0 NOT NULL,
  one_star INTEGER DEFAULT 0 NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  -- One snapshot per practice per day
  UNIQUE(practice_id, snapshot_date)
);

-- Practice baselines table - initial review counts for guarantees
CREATE TABLE IF NOT EXISTS public.practice_baselines (
  practice_id UUID PRIMARY KEY REFERENCES public.practices(id) ON DELETE CASCADE,
  baseline_date DATE NOT NULL,
  baseline_total INTEGER DEFAULT 0 NOT NULL,
  baseline_average NUMERIC(3,2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Practices indexes
CREATE INDEX IF NOT EXISTS idx_practices_status ON public.practices(status);
CREATE INDEX IF NOT EXISTS idx_practices_created_at ON public.practices(created_at DESC);

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_settings_practice_id ON public.settings(practice_id);

-- Templates indexes
CREATE INDEX IF NOT EXISTS idx_templates_name_locale ON public.templates(name, locale);
CREATE INDEX IF NOT EXISTS idx_templates_status ON public.templates(status);

-- Patients indexes
CREATE INDEX IF NOT EXISTS idx_patients_practice_id ON public.patients(practice_id);
CREATE INDEX IF NOT EXISTS idx_patients_opted_out ON public.patients(opted_out);
CREATE INDEX IF NOT EXISTS idx_patients_email ON public.patients(email) WHERE email IS NOT NULL;

-- Visits indexes
CREATE INDEX IF NOT EXISTS idx_visits_practice_id ON public.visits(practice_id);
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON public.visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_occurred_at ON public.visits(occurred_at DESC);

-- Review requests indexes (high volume)
CREATE INDEX IF NOT EXISTS idx_review_requests_practice_id ON public.review_requests(practice_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_patient_id ON public.review_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_sent_at ON public.review_requests(sent_at DESC) WHERE sent_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_review_requests_status ON public.review_requests(status);
CREATE INDEX IF NOT EXISTS idx_review_requests_provider_msg_id ON public.review_requests(provider_msg_id) WHERE provider_msg_id IS NOT NULL;

-- Engagements indexes
CREATE INDEX IF NOT EXISTS idx_engagements_review_request_id ON public.engagements(review_request_id);
CREATE INDEX IF NOT EXISTS idx_engagements_event ON public.engagements(event);
CREATE INDEX IF NOT EXISTS idx_engagements_occurred_at ON public.engagements(occurred_at DESC);

-- Events indexes (high volume)
CREATE INDEX IF NOT EXISTS idx_events_practice_id ON public.events(practice_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type);
CREATE INDEX IF NOT EXISTS idx_events_occurred_at ON public.events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_actor ON public.events(actor);

-- Jobs indexes
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON public.jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_available_at ON public.jobs(available_at);
CREATE INDEX IF NOT EXISTS idx_jobs_attempts ON public.jobs(attempts);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_practice_id ON public.reviews(practice_id);
CREATE INDEX IF NOT EXISTS idx_reviews_published_at ON public.reviews(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_source ON public.reviews(source);

-- Review snapshots indexes
CREATE INDEX IF NOT EXISTS idx_review_snapshots_practice_id ON public.review_snapshots(practice_id);
CREATE INDEX IF NOT EXISTS idx_review_snapshots_date ON public.review_snapshots(snapshot_date DESC);

-- Practice baselines indexes
CREATE INDEX IF NOT EXISTS idx_practice_baselines_practice_id ON public.practice_baselines(practice_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_baselines ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to set occurred_date from occurred_at
CREATE OR REPLACE FUNCTION set_occurred_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.occurred_date = DATE(NEW.occurred_at);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to set occurred_date from occurred_at
CREATE TRIGGER set_visits_occurred_date BEFORE INSERT OR UPDATE ON public.visits
    FOR EACH ROW EXECUTE FUNCTION set_occurred_date();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.practices IS 'Core practice information for dental practices';
COMMENT ON TABLE public.settings IS 'Practice-specific configuration and settings';
COMMENT ON TABLE public.templates IS 'SMS and email templates for review requests';
COMMENT ON TABLE public.patients IS 'Patient information with encrypted phone numbers';
COMMENT ON TABLE public.visits IS 'Appointment/visit records with idempotency constraints';
COMMENT ON TABLE public.review_requests IS 'Review request send records with provider tracking';
COMMENT ON TABLE public.engagements IS 'Patient engagement tracking (clicks, deliveries, etc.)';
COMMENT ON TABLE public.events IS 'System events for instrumentation and KPIs';
COMMENT ON TABLE public.jobs IS 'Outbox/queue for async job processing';
COMMENT ON TABLE public.reviews IS 'Google Business Profile reviews with deduplication';
COMMENT ON TABLE public.review_snapshots IS 'Daily review metrics snapshots';
COMMENT ON TABLE public.practice_baselines IS 'Baseline review counts for guarantee calculations';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log successful migration
INSERT INTO public.events (type, actor, payload_json) 
VALUES ('migration_completed', 'system', '{"migration": "001_init_core_tables", "tables_created": 12}');
