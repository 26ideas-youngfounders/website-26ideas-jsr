
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Trigger AI Evaluation Edge Function
 * 
 * Called automatically when applications are created to trigger
 * comprehensive AI evaluation in the background.
 */

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { applicationId } = await req.json();

    if (!applicationId) {
      return new Response(JSON.stringify({
        error: 'applicationId is required',
        code: 'MISSING_APPLICATION_ID'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🎯 Triggering AI evaluation for: ${applicationId}`);

    // Call the comprehensive evaluation function
    const { data, error } = await supabase.functions.invoke('comprehensive-evaluation', {
      body: { applicationId }
    });

    if (error) {
      console.error('❌ Failed to trigger comprehensive evaluation:', error);
      throw error;
    }

    console.log(`✅ AI evaluation triggered successfully for: ${applicationId}`);

    return new Response(JSON.stringify({
      success: true,
      message: `AI evaluation triggered for application: ${applicationId}`,
      result: data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in trigger-ai-evaluation function:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to trigger AI evaluation',
      message: error.message,
      code: 'TRIGGER_ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
