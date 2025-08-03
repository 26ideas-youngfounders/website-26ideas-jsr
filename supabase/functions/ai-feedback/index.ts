import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Import the AI question prompts configuration from the local file
import { getSystemPrompt, hasAIFeedback } from "./ai-question-prompts.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced rate limiting - stores user attempts by questionId and timestamp
const rateLimiter = new Map<string, number[]>();
const RATE_LIMIT = 3; // requests per question per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Check rate limit for specific question and user combination
 */
function checkRateLimit(questionId: string, userIdentifier: string): boolean {
  const now = Date.now();
  const key = `${questionId}_${userIdentifier}`;
  const userRequests = rateLimiter.get(key) || [];
  
  // Clean old requests outside the rate window
  const recentRequests = userRequests.filter((time: number) => now - time < RATE_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimiter.set(key, recentRequests);
  return true;
}

/**
 * Sanitize user input to prevent injection attacks
 */
function sanitizeInput(input: string): string {
  // Remove potentially harmful characters while preserving meaningful content
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Call OpenAI API with retry logic and proper error handling
 */
async function callOpenAIWithRetry(systemPrompt: string, userAnswer: string, maxRetries = 3): Promise<any> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`OpenAI API attempt ${attempt}/${maxRetries}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Using the recommended model
          messages: [
            { 
              role: 'system', 
              content: systemPrompt
            },
            { 
              role: 'user', 
              content: userAnswer 
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
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
        throw new Error('No feedback content received from AI service');
      }

      console.log('OpenAI API success on attempt', attempt);
      return data;
      
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
  
  throw lastError || new Error('Failed to get AI feedback after multiple attempts');
}

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
        error: 'AI feedback service is not properly configured. Please contact support.',
        code: 'SERVICE_CONFIG_ERROR'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { questionId, userAnswer } = await req.json();

    // Input validation
    if (!questionId || typeof questionId !== 'string') {
      return new Response(JSON.stringify({
        error: 'questionId is required and must be a string',
        code: 'INVALID_QUESTION_ID'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!userAnswer || typeof userAnswer !== 'string' || userAnswer.trim().length < 10) {
      return new Response(JSON.stringify({
        error: 'User answer must be at least 10 characters long',
        code: 'INVALID_ANSWER_LENGTH'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if AI feedback is available for this question
    if (!hasAIFeedback(questionId)) {
      console.log(`AI feedback not enabled for question: ${questionId}`);
      return new Response(JSON.stringify({
        error: 'AI feedback not available for this question',
        code: 'FEEDBACK_NOT_ENABLED'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the system prompt for this question
    const systemPrompt = getSystemPrompt(questionId);
    if (!systemPrompt) {
      console.error(`System prompt configuration error for question: ${questionId}`);
      return new Response(JSON.stringify({
        error: 'System prompt configuration error',
        code: 'PROMPT_CONFIG_ERROR'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting based on questionId and timestamp
    const userIdentifier = `${questionId}_${new Date().toISOString().slice(0, 10)}`;
    if (!checkRateLimit(questionId, userIdentifier)) {
      console.log(`Rate limit exceeded for question: ${questionId}`);
      return new Response(JSON.stringify({
        error: 'You have reached the AI feedback limit for this question (3 per hour). Please try again later.',
        code: 'RATE_LIMITED',
        retryAfter: 3600 // 1 hour in seconds
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize user input
    const sanitizedAnswer = sanitizeInput(userAnswer);

    console.log('AI Feedback Request:', { 
      questionId, 
      answerLength: sanitizedAnswer.length,
      timestamp: new Date().toISOString()
    });

    // Call OpenAI API with dynamic system prompt
    const data = await callOpenAIWithRetry(systemPrompt, sanitizedAnswer);
    const feedback = data.choices[0]?.message?.content;

    if (!feedback) {
      throw new Error('AI service returned an empty response');
    }

    // Parse the feedback to extract score, strengths, and improvements
    const scoreMatch = feedback.match(/SCORE:\s*(\d+(?:\.\d+)?)/i);
    const score = scoreMatch ? scoreMatch[1] : "N/A";

    const strengthsMatch = feedback.match(/\*\*Strengths in your current response:\*\*(.*?)(?=\*\*Areas for improvement:\*\*|$)/is);
    const strengths = strengthsMatch ? 
      strengthsMatch[1].split(/[-•]\s*/).filter(s => s.trim().length > 0).map(s => s.trim()) : [];

    const improvementsMatch = feedback.match(/\*\*Areas for improvement:\*\*(.*?)(?=\*\*Quick tip:\*\*|$)/is);
    const improvements = improvementsMatch ? 
      improvementsMatch[1].split(/[-•]\s*/).filter(s => s.trim().length > 0).map(s => s.trim()) : [];

    const result = {
      feedback: feedback,
      score: score,
      strengths: strengths.slice(0, 5),
      improvements: improvements.slice(0, 5),
      rawFeedback: feedback,
      questionId: questionId,
      timestamp: new Date().toISOString()
    };

    console.log('AI Feedback Success:', { 
      questionId, 
      score, 
      strengthsCount: strengths.length, 
      improvementsCount: improvements.length 
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-feedback function:', error);
    
    // Determine user-friendly error message based on error type
    let userMessage = "Unable to generate feedback at this time. Please try again later.";
    let errorCode = "INTERNAL_ERROR";
    let statusCode = 500;
    let retryAfter: number | undefined;
    
    if (error.message.includes('busy due to high demand')) {
      userMessage = "AI service is temporarily busy due to high demand. Please try again in a few minutes.";
      errorCode = "SERVICE_BUSY";
      statusCode = 429;
      retryAfter = 180;
    } else if (error.message.includes('configuration error')) {
      userMessage = "AI feedback service is temporarily unavailable. Please try again later.";
      errorCode = "SERVICE_CONFIG_ERROR";
    } else if (error.message.includes('timed out')) {
      userMessage = "AI service request timed out. Please check your connection and try again.";
      errorCode = "REQUEST_TIMEOUT";
    }
    
    const fallbackResult = {
      error: userMessage,
      code: errorCode,
      questionId: "unknown",
      timestamp: new Date().toISOString(),
      ...(retryAfter && { retryAfter })
    };

    return new Response(JSON.stringify(fallbackResult), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
