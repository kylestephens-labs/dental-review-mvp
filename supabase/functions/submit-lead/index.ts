import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { business_name, city, source, form } = await req.json();
    
    console.log('Processing lead submission for:', business_name, city);
    console.log('Form data:', form);

    // Insert into database first
    console.log('Inserting lead into database...');
    const { error: dbError } = await supabase
      .from('leads')
      .insert([{
        business_name,
        city,
        source: source || 'web',
        form
      }]);

    if (dbError) {
      console.error('Database insert failed:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log('Lead inserted into database successfully');

    // Get n8n webhook URL from environment
    const n8nWebhook = Deno.env.get('N8N_INTAKE_WEBHOOK');
    
    if (n8nWebhook) {
      console.log('Triggering n8n webhook...');
      
      // Build payload that matches n8n workflow expectations
      const payload = {
        companyName: business_name,
        ownerEmail: "notify@serviceboost.co", // Default owner email - should be configurable
        ownerPhone: "+19282257944", // Default owner phone - should be configurable
        leadName: form.name,
        leadEmail: form.email,
        leadPhone: form.phone,
        leadMessage: form.notes || `Service: ${form.service}${form.preferredDate ? `, Preferred Date: ${form.preferredDate}` : ''}${form.preferredTime ? `, Preferred Time: ${form.preferredTime}` : ''}${form.smsOptIn ? ', SMS Opt-in: Yes' : ''}`,
        timestamp: new Date().toISOString(),
        source: source || 'web',
      };

      const response = await fetch(n8nWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-serviceboost-secret': 'sb_prod_94f1e38e_secret',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('n8n webhook failed:', await response.text());
        throw new Error('Failed to trigger n8n webhook');
      }

      console.log('✅ Lead submitted to production webhook');
    } else {
      console.log('No N8N_INTAKE_WEBHOOK configured, skipping webhook');
    }

    return new Response(
      JSON.stringify({ ok: true, message: 'Lead processed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing lead:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ ok: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
