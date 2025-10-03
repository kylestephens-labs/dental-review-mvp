-- Ensure the form column exists in the leads table
-- This migration specifically addresses the PGRST204 schema cache error

-- Add the form column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' 
    AND column_name = 'form' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN form JSONB NOT NULL DEFAULT '{}';
  END IF;
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';