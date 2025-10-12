-- SQL Migration 002: Queue + Templates + Reviews Enhancement
-- Based on architecture.md specifications
-- Ensures jobs, templates, reviews, review_snapshots, practice_baselines are properly configured
-- Adds any missing columns to settings/review_requests per ARCH
-- Migration is idempotent - can be run multiple times safely

-- ============================================================================
-- IDEMPOTENT MIGRATION: Queue + Templates + Reviews Enhancement
-- ============================================================================

-- Enable required extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENSURE JOBS TABLE EXISTS AND IS PROPERLY CONFIGURED
-- ============================================================================

-- Jobs table - outbox/queue for async processing (idempotent)
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

-- Ensure jobs indexes exist (idempotent)
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON public.jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_available_at ON public.jobs(available_at);
CREATE INDEX IF NOT EXISTS idx_jobs_attempts ON public.jobs(attempts);

-- ============================================================================
-- ENSURE TEMPLATES TABLE EXISTS AND IS PROPERLY CONFIGURED
-- ============================================================================

-- Templates table - SMS/email templates (idempotent)
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

-- Ensure templates indexes exist (idempotent)
CREATE INDEX IF NOT EXISTS idx_templates_name_locale ON public.templates(name, locale);
CREATE INDEX IF NOT EXISTS idx_templates_status ON public.templates(status);

-- ============================================================================
-- ENSURE REVIEWS TABLE EXISTS AND IS PROPERLY CONFIGURED
-- ============================================================================

-- Reviews table - Google Business Profile reviews (idempotent)
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

-- Ensure reviews indexes exist (idempotent)
CREATE INDEX IF NOT EXISTS idx_reviews_practice_id ON public.reviews(practice_id);
CREATE INDEX IF NOT EXISTS idx_reviews_published_at ON public.reviews(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_source ON public.reviews(source);

-- ============================================================================
-- ENSURE REVIEW_SNAPSHOTS TABLE EXISTS AND IS PROPERLY CONFIGURED
-- ============================================================================

-- Review snapshots table - daily review metrics (idempotent)
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

-- Ensure review_snapshots indexes exist (idempotent)
CREATE INDEX IF NOT EXISTS idx_review_snapshots_practice_id ON public.review_snapshots(practice_id);
CREATE INDEX IF NOT EXISTS idx_review_snapshots_date ON public.review_snapshots(snapshot_date DESC);

-- ============================================================================
-- ENSURE PRACTICE_BASELINES TABLE EXISTS AND IS PROPERLY CONFIGURED
-- ============================================================================

-- Practice baselines table - initial review counts for guarantees (idempotent)
CREATE TABLE IF NOT EXISTS public.practice_baselines (
  practice_id UUID PRIMARY KEY REFERENCES public.practices(id) ON DELETE CASCADE,
  baseline_date DATE NOT NULL,
  baseline_total INTEGER DEFAULT 0 NOT NULL,
  baseline_average NUMERIC(3,2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Ensure practice_baselines indexes exist (idempotent)
CREATE INDEX IF NOT EXISTS idx_practice_baselines_practice_id ON public.practice_baselines(practice_id);

-- ============================================================================
-- ENSURE SETTINGS TABLE HAS ALL REQUIRED COLUMNS PER ARCHITECTURE
-- ============================================================================

-- Add any missing columns to settings table (idempotent)
-- Note: All required columns from architecture.md are already present in migration 001
-- This section ensures any additional columns are added if needed

-- Add google_place_id column if it doesn't exist (for GBP integration)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' 
        AND column_name = 'google_place_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.settings ADD COLUMN google_place_id TEXT;
        COMMENT ON COLUMN public.settings.google_place_id IS 'Google Place ID for GBP integration';
    END IF;
END $$;

-- Add review_link_meta column if it doesn't exist (for storing review link metadata)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' 
        AND column_name = 'review_link_meta'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.settings ADD COLUMN review_link_meta JSONB DEFAULT '{}';
        COMMENT ON COLUMN public.settings.review_link_meta IS 'Metadata for review link (Place ID, etc.)';
    END IF;
END $$;

-- ============================================================================
-- ENSURE REVIEW_REQUESTS TABLE HAS ALL REQUIRED COLUMNS PER ARCHITECTURE
-- ============================================================================

-- Add any missing columns to review_requests table (idempotent)
-- Note: All required columns from architecture.md are already present in migration 001
-- This section ensures any additional columns are added if needed

-- Add reminder_sent_at column if it doesn't exist (for tracking reminder sends)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'review_requests' 
        AND column_name = 'reminder_sent_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.review_requests ADD COLUMN reminder_sent_at TIMESTAMPTZ;
        COMMENT ON COLUMN public.review_requests.reminder_sent_at IS 'Timestamp when reminder was sent';
    END IF;
END $$;

-- Add reminder_job_id column if it doesn't exist (for tracking reminder jobs)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'review_requests' 
        AND column_name = 'reminder_job_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.review_requests ADD COLUMN reminder_job_id UUID REFERENCES public.jobs(id);
        COMMENT ON COLUMN public.review_requests.reminder_job_id IS 'Job ID for scheduled reminder';
    END IF;
END $$;

-- ============================================================================
-- ENSURE ROW LEVEL SECURITY IS ENABLED
-- ============================================================================

-- Enable RLS on all tables (idempotent)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_baselines ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- High-volume indexes for review_requests (as specified in architecture)
CREATE INDEX IF NOT EXISTS idx_review_requests_practice_sent_at ON public.review_requests(practice_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_requests_sent_at_partial ON public.review_requests(sent_at DESC) WHERE sent_at IS NOT NULL;

-- Review search index (as specified in architecture)
CREATE INDEX IF NOT EXISTS idx_reviews_practice_published_at ON public.reviews(practice_id, published_at DESC);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.jobs IS 'Outbox/queue for async job processing - idempotent migration 002';
COMMENT ON TABLE public.templates IS 'SMS and email templates for review requests - idempotent migration 002';
COMMENT ON TABLE public.reviews IS 'Google Business Profile reviews with deduplication - idempotent migration 002';
COMMENT ON TABLE public.review_snapshots IS 'Daily review metrics snapshots - idempotent migration 002';
COMMENT ON TABLE public.practice_baselines IS 'Baseline review counts for guarantee calculations - idempotent migration 002';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log successful migration (idempotent - only insert if not already logged)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.events 
        WHERE type = 'migration_completed' 
        AND payload_json->>'migration' = '002_queue_templates_reviews'
    ) THEN
        INSERT INTO public.events (type, actor, payload_json) 
        VALUES ('migration_completed', 'system', '{"migration": "002_queue_templates_reviews", "tables_enhanced": 5, "columns_added": 4}');
    END IF;
END $$;
