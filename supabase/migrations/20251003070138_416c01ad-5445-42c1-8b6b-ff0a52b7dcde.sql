-- Create leads table to store form submissions
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  business_name TEXT NOT NULL,
  city TEXT NOT NULL,
  source TEXT DEFAULT 'web' NOT NULL,
  form JSONB NOT NULL
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public form submission)
CREATE POLICY "Allow anonymous inserts" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_business_name ON public.leads(business_name);
CREATE INDEX idx_leads_city ON public.leads(city);