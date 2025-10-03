import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessName, city, email, phone } = await req.json();
    
    console.log('Processing lead submission for:', businessName, city);
    console.log('Contact info:', { email, phone });

    // Get n8n webhook URL from environment
    const n8nWebhook = Deno.env.get('N8N_INTAKE_WEBHOOK');
    
    if (n8nWebhook) {
      console.log('Triggering n8n webhook...');
      
      const payload = {
        form: {
          email,
          phone,
        },
        site: {
          businessName,
          city,
        },
        timestamp: new Date().toISOString(),
        source: 'web',
      };

      const response = await fetch(n8nWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('n8n webhook failed:', await response.text());
        throw new Error('Failed to trigger n8n webhook');
      }

      console.log('n8n webhook triggered successfully');
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
