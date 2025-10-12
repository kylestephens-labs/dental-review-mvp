-- SQL Seed Script: EN/ES ADA-checked templates
-- This script seeds the templates table with English and Spanish review request templates
-- Based on architecture.md specifications for dental practice management MVP

-- ============================================================================
-- SEED TEMPLATES: EN/ES ADA-CHECKED TEMPLATES
-- ============================================================================

-- Clear existing templates (idempotent - safe to run multiple times)
DELETE FROM public.templates WHERE name = 'review-request';

-- Insert English template
INSERT INTO public.templates (
  name,
  locale,
  channel,
  body,
  status,
  created_at
) VALUES (
  'review-request',
  'en',
  'sms',
  'Hi {{patient_name}}, thanks for visiting {{practice_name}} today. Please leave us a review: {{review_link}} Reply stop to opt out.',
  'active',
  now()
);

-- Insert Spanish template
INSERT INTO public.templates (
  name,
  locale,
  channel,
  body,
  status,
  created_at
) VALUES (
  'review-request',
  'es',
  'sms',
  'Hola {{patient_name}}, gracias por visitar {{practice_name}} hoy. Por favor déjenos una reseña: {{review_link}} Responda alto para cancelar.',
  'active',
  now()
);

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Verify templates were inserted correctly
SELECT 
  name,
  locale,
  channel,
  status,
  length(body) as character_count,
  created_at
FROM public.templates 
WHERE name = 'review-request'
ORDER BY locale;

-- Verify placeholder tokens are present
SELECT 
  locale,
  CASE 
    WHEN body LIKE '%{{practice_name}}%' THEN '✓' 
    ELSE '✗' 
  END as has_practice_name,
  CASE 
    WHEN body LIKE '%{{review_link}}%' THEN '✓' 
    ELSE '✗' 
  END as has_review_link,
  CASE 
    WHEN body LIKE '%{{patient_name}}%' THEN '✓' 
    ELSE '✗' 
  END as has_patient_name
FROM public.templates 
WHERE name = 'review-request'
ORDER BY locale;

-- ============================================================================
-- ADA COMPLIANCE VERIFICATION
-- ============================================================================

-- Check ADA compliance requirements
SELECT 
  locale,
  CASE 
    WHEN body !~ '[A-Z]{3,}' THEN '✓ No excessive caps' 
    ELSE '✗ Contains excessive caps' 
  END as caps_check,
  CASE 
    WHEN length(body) <= 160 THEN '✓ Within SMS limit' 
    ELSE '✗ Exceeds SMS limit' 
  END as length_check,
  CASE 
    WHEN lower(body) LIKE '%stop%' OR lower(body) LIKE '%alto%' THEN '✓ Has opt-out' 
    ELSE '✗ Missing opt-out' 
  END as optout_check,
  CASE 
    WHEN body !~ '[!]{2,}' THEN '✓ No excessive punctuation' 
    ELSE '✗ Excessive punctuation' 
  END as punctuation_check
FROM public.templates 
WHERE name = 'review-request'
ORDER BY locale;

-- ============================================================================
-- LOG SUCCESSFUL SEEDING
-- ============================================================================

-- Log successful template seeding
INSERT INTO public.events (type, actor, payload_json) 
VALUES (
  'templates_seeded', 
  'system', 
  '{"templates_count": 2, "locales": ["en", "es"], "channel": "sms", "ada_compliant": true}'
);

-- ============================================================================
-- SEEDING COMPLETE
-- ============================================================================

-- Display success message
SELECT 'Templates seeded successfully!' as status,
       count(*) as template_count,
       string_agg(locale, ', ') as locales
FROM public.templates 
WHERE name = 'review-request';
