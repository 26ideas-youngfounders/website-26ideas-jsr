
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { prompt, answer, questionId } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

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
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const feedbackText = data.choices[0].message.content;

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

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-feedback function:', error);
    
    // Return a fallback response instead of failing completely
    const fallbackResult = {
      score: "N/A",
      strengths: [],
      improvements: [],
      message: "Feedback temporarily unavailable. Your answer has been saved.",
      error: error.message,
      questionId: req.body?.questionId || "unknown",
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(fallbackResult), {
      status: 200, // Return 200 so the frontend doesn't treat it as a complete failure
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
