
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple rate limiting - in production you'd use Redis or similar
const rateLimiter = new Map();
const RATE_LIMIT = 5; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimiter.get(userId) || [];
  
  // Clean old requests
  const recentRequests = userRequests.filter((time: number) => now - time < RATE_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimiter.set(userId, recentRequests);
  return true;
}

async function callOpenAIWithRetry(prompt: string, maxRetries = 3): Promise<any> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`OpenAI API attempt ${attempt}/${maxRetries}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
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
              content: 'You are an expert startup evaluator for the Young Founders Floor competition. Provide constructive, actionable feedback on business plan answers.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        // Rate limited - wait before retry
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
        console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt}/${maxRetries}`);
        
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
      console.log('OpenAI API success on attempt', attempt);
      return data;
      
    } catch (error) {
      console.error(`OpenAI API attempt ${attempt} failed:`, error);
      lastError = error as Error;
      
      if (error.name === 'AbortError') {
        lastError = new Error('AI service request timed out. Please try again.');
      }
      
      // Don't retry on certain errors
      if (error.message.includes('Invalid API key') || error.message.includes('insufficient_quota')) {
        break;
      }
      
      // Wait before retry (except on last attempt)
      if (attempt < maxRetries) {
        const waitTime = 1000 * attempt; // Linear backoff for other errors
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
    const { prompt, answer, questionId } = await req.json();

    console.log('AI Feedback Request:', { 
      questionId, 
      answerLength: answer?.length || 0,
      timestamp: new Date().toISOString()
    });

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('AI feedback service is not properly configured. Please contact support.');
    }

    // Simple rate limiting based on question ID as user identifier
    const rateLimitKey = `${questionId}_${new Date().toISOString().slice(0, 10)}`;
    if (!checkRateLimit(rateLimitKey)) {
      throw new Error('You have reached the AI feedback limit. Please try again in a few minutes.');
    }

    if (!prompt || !answer) {
      throw new Error('Missing required information for AI feedback.');
    }

    if (answer.length < 10) {
      throw new Error('Please provide a longer answer (at least 10 characters) to receive meaningful feedback.');
    }

    const data = await callOpenAIWithRetry(prompt);
    const feedbackText = data.choices[0]?.message?.content;

    if (!feedbackText) {
      throw new Error('AI service returned an empty response. Please try again.');
    }

    // Parse the feedback to extract score, strengths, and improvements
    const scoreMatch = feedbackText.match(/SCORE:\s*(\d+(?:\.\d+)?)/i);
    const score = scoreMatch ? scoreMatch[1] : "N/A";

    const strengthsMatch = feedbackText.match(/STRENGTHS:(.*?)(?=AREAS FOR IMPROVEMENT:|$)/is);
    const strengths = strengthsMatch ? 
      strengthsMatch[1].split(/[-•]\s*/).filter(s => s.trim().length > 0).map(s => s.trim()) : [];

    const improvementsMatch = feedbackText.match(/AREAS FOR IMPROVEMENT:(.*?)$/is);
    const improvements = improvementsMatch ? 
      improvementsMatch[1].split(/[-•]\s*/).filter(s => s.trim().length > 0).map(s => s.trim()) : [];

    const result = {
      score: score,
      strengths: strengths.slice(0, 5), // Limit to 5 strengths
      improvements: improvements.slice(0, 5), // Limit to 5 improvements
      rawFeedback: feedbackText,
      questionId: questionId,
      timestamp: new Date().toISOString()
    };

    console.log('AI Feedback Success:', { questionId, score, strengthsCount: strengths.length, improvementsCount: improvements.length });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-feedback function:', error);
    
    // Determine user-friendly error message
    let userMessage = "Feedback temporarily unavailable. Your answer has been saved.";
    
    if (error.message.includes('busy due to high demand')) {
      userMessage = "AI service is temporarily busy due to high demand. Please try again in a few minutes.";
    } else if (error.message.includes('reached the AI feedback limit')) {
      userMessage = error.message;
    } else if (error.message.includes('timed out')) {
      userMessage = "AI service request timed out. Please check your connection and try again.";
    } else if (error.message.includes('not properly configured')) {
      userMessage = "AI feedback service is temporarily unavailable. Please try again later.";
    } else if (error.message.includes('longer answer')) {
      userMessage = error.message;
    }
    
    const fallbackResult = {
      score: "N/A",
      strengths: [],
      improvements: [],
      message: userMessage,
      error: error.message,
      questionId: req.body?.questionId || "unknown",
      timestamp: new Date().toISOString(),
      canRetry: !error.message.includes('not properly configured')
    };

    return new Response(JSON.stringify(fallbackResult), {
      status: 200, // Return 200 so the frontend doesn't treat it as a complete failure
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
