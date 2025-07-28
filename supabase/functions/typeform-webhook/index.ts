
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TypeformAnswer {
  field: {
    id: string;
    type: string;
    ref: string;
  };
  type: string;
  text?: string;
  email?: string;
  url?: string;
  date?: string;
  number?: number;
  boolean?: boolean;
  choice?: {
    label: string;
    other?: string;
  };
  choices?: {
    labels: string[];
    other?: string;
  };
}

interface TypeformSubmission {
  event_id: string;
  event_type: string;
  form_response: {
    form_id: string;
    token: string;
    landed_at: string;
    submitted_at: string;
    definition: {
      id: string;
      title: string;
      fields: Array<{
        id: string;
        title: string;
        type: string;
        ref: string;
        properties: any;
      }>;
    };
    answers: TypeformAnswer[];
  };
}

/**
 * Extract user email from Typeform answers
 */
function extractUserEmail(answers: TypeformAnswer[]): string | null {
  const emailAnswer = answers.find(answer => 
    answer.type === 'email' || 
    answer.field.type === 'email' ||
    answer.email
  );
  return emailAnswer?.email || emailAnswer?.text || null;
}

/**
 * Parse Typeform answers into structured data
 */
function parseTypeformAnswers(answers: TypeformAnswer[], fields: any[]): Record<string, any> {
  const parsedData: Record<string, any> = {};
  
  answers.forEach(answer => {
    const field = fields.find(f => f.id === answer.field.id);
    const fieldTitle = field?.title || answer.field.ref || answer.field.id;
    
    let value: any;
    
    switch (answer.type) {
      case 'text':
      case 'email':
      case 'url':
        value = answer.text || answer.email || answer.url;
        break;
      case 'number':
        value = answer.number;
        break;
      case 'boolean':
        value = answer.boolean;
        break;
      case 'date':
        value = answer.date;
        break;
      case 'choice':
        value = answer.choice?.label;
        if (answer.choice?.other) {
          value += ` (Other: ${answer.choice.other})`;
        }
        break;
      case 'choices':
        value = answer.choices?.labels?.join(', ');
        if (answer.choices?.other) {
          value += ` (Other: ${answer.choices.other})`;
        }
        break;
      default:
        value = answer.text || JSON.stringify(answer);
    }
    
    parsedData[fieldTitle] = value;
  });
  
  return parsedData;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 Typeform webhook received:', req.method);

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    // Parse the webhook payload
    const payload: TypeformSubmission = await req.json();
    console.log('📋 Typeform payload received:', JSON.stringify(payload, null, 2));

    // Validate required fields
    if (!payload.form_response || !payload.form_response.form_id) {
      console.error('❌ Invalid payload: missing form_response or form_id');
      return new Response('Invalid payload', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    const { form_response } = payload;
    
    // Extract user email from answers
    const userEmail = extractUserEmail(form_response.answers);
    console.log('👤 User email extracted:', userEmail);

    // Parse answers into structured data
    const formData = parseTypeformAnswers(
      form_response.answers,
      form_response.definition.fields
    );
    console.log('📊 Parsed form data:', formData);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user is registered in our system
    let userIdentified = false;
    if (userEmail) {
      const { data: individual } = await supabase
        .from('individuals')
        .select('individual_id, email')
        .eq('email', userEmail)
        .single();
      
      if (individual) {
        userIdentified = true;
        console.log('✅ User identified:', individual.email);
        
        // Update user's typeform_registered status
        await supabase
          .from('individuals')
          .update({ typeform_registered: true })
          .eq('individual_id', individual.individual_id);
        
        console.log('🎯 Updated user typeform_registered status');
      }
    }

    // Store the submission in database
    const { data: submission, error } = await supabase
      .from('typeform_submissions')
      .insert({
        typeform_id: form_response.form_id,
        submission_id: form_response.token,
        form_data: formData,
        submitted_at: form_response.submitted_at,
        user_email: userEmail,
        user_identified: userIdentified
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return new Response('Database error', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log('✅ Typeform submission stored successfully:', submission.id);

    return new Response(JSON.stringify({ 
      success: true, 
      submission_id: submission.id 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
