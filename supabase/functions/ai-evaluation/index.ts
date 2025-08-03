
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * AI Evaluation Service for YFF Applications
 * 
 * Provides comprehensive evaluation using OpenAI GPT models
 * with structured scoring and detailed feedback.
 */

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Environment variable validation
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY environment variable not configured');
      return new Response(JSON.stringify({
        error: 'AI evaluation service is not properly configured. Please contact support.',
        code: 'SERVICE_CONFIG_ERROR'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { systemPrompt, userAnswer } = await req.json();

    // Input validation
    if (!systemPrompt || typeof systemPrompt !== 'string') {
      return new Response(JSON.stringify({
        error: 'systemPrompt is required and must be a string',
        code: 'INVALID_SYSTEM_PROMPT'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!userAnswer || typeof userAnswer !== 'string' || userAnswer.trim().length < 5) {
      return new Response(JSON.stringify({
        error: 'User answer must be at least 5 characters long',
        code: 'INVALID_ANSWER_LENGTH'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize user input
    const sanitizedAnswer = userAnswer
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();

    console.log('AI Evaluation Request:', { 
      answerLength: sanitizedAnswer.length,
      timestamp: new Date().toISOString()
    });

    // Call OpenAI API with retry logic
    let lastError: Error | null = null;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`OpenAI API attempt ${attempt}/${maxRetries}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for evaluations
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: systemPrompt
              },
              { 
                role: 'user', 
                content: sanitizedAnswer 
              }
            ],
            temperature: 0.3, // Lower temperature for more consistent evaluations
            max_tokens: 800, // More tokens for detailed evaluation feedback
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle specific HTTP status codes
        if (response.status === 401) {
          console.error('OpenAI API authentication failed - check API key configuration');
          throw new Error('AI service configuration error');
        }

        if (response.status === 429) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`Rate limited by OpenAI, waiting ${waitTime}ms before retry ${attempt}/${maxRetries}`);
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          throw new Error('AI service is temporarily busy due to high demand. Please try again in a few minutes.');
        }

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.choices?.[0]?.message?.content) {
          throw new Error('No evaluation content received from AI service');
        }

        console.log('OpenAI API success on attempt', attempt);
        
        const evaluation = data.choices[0].message.content;
        
        return new Response(JSON.stringify({
          evaluation: evaluation,
          timestamp: new Date().toISOString(),
          model: 'gpt-4o-mini',
          usage: data.usage
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      } catch (error) {
        console.error(`OpenAI API attempt ${attempt} failed:`, error);
        lastError = error as Error;
        
        if (error.name === 'AbortError') {
          lastError = new Error('AI service request timed out. Please try again.');
        }
        
        // Don't retry on certain errors
        if (error.message.includes('configuration error') || error.message.includes('authentication failed')) {
          break;
        }
        
        // Wait before retry (except on last attempt)
        if (attempt < maxRetries) {
          const waitTime = 1000 * attempt;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    throw lastError || new Error('Failed to get AI evaluation after multiple attempts');

  } catch (error) {
    console.error('Error in ai-evaluation function:', error);
    
    // Determine user-friendly error message based on error type
    let userMessage = "Unable to generate evaluation at this time. Please try again later.";
    let errorCode = "INTERNAL_ERROR";
    let statusCode = 500;
    let retryAfter: number | undefined;
    
    if (error.message.includes('busy due to high demand')) {
      userMessage = "AI service is temporarily busy due to high demand. Please try again in a few minutes.";
      errorCode = "SERVICE_BUSY";
      statusCode = 429;
      retryAfter = 300; // 5 minutes
    } else if (error.message.includes('configuration error')) {
      userMessage = "AI evaluation service is temporarily unavailable. Please try again later.";
      errorCode = "SERVICE_CONFIG_ERROR";
    } else if (error.message.includes('timed out')) {
      userMessage = "AI service request timed out. Please check your connection and try again.";
      errorCode = "REQUEST_TIMEOUT";
    }
    
    const fallbackResult = {
      error: userMessage,
      code: errorCode,
      timestamp: new Date().toISOString(),
      ...(retryAfter && { retryAfter })
    };

    return new Response(JSON.stringify(fallbackResult), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
