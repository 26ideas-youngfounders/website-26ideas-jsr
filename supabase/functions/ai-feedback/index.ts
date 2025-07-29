
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
            content: 'You are an expert startup evaluator for the Young Founders Floor competition. Provide constructive, actionable feedback on business plan answers. Always format your response with clear sections: SCORE, STRENGTHS, and AREAS FOR IMPROVEMENT.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`OpenAI API error ${response.status}:`, errorData);
      
      // Handle specific error cases
      if (response.status === 429) {
        return new Response(JSON.stringify({
          score: "N/A",
          strengths: [],
          improvements: [
            "Your answer shows effort, but I need a moment to provide detailed feedback",
            "Please try again in a few seconds for comprehensive analysis",
            "Consider expanding on your unique value proposition while you wait"
          ],
          rawFeedback: "I'm currently experiencing high demand and need a moment to analyze your response properly. Please click 'Get Fresh Feedback' again in a few seconds for detailed evaluation of your business idea.",
          questionId: questionId,
          timestamp: new Date().toISOString(),
          message: "High demand - please retry in a few seconds for detailed feedback",
          isRateLimit: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
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
    
    // Return a helpful fallback response
    const fallbackResult = {
      score: "N/A",
      strengths: [
        "You've provided a response that shows you're thinking about your idea",
        "Taking the initiative to seek feedback demonstrates good entrepreneurial mindset"
      ],
      improvements: [
        "Consider providing more specific details about your target market",
        "Elaborate on what problem your idea solves and for whom",
        "Describe what makes your approach unique or different",
        "Include information about your planned execution strategy",
        "Think about potential revenue models or monetization approaches"
      ],
      rawFeedback: "I'm having trouble connecting to provide detailed feedback right now, but here are some general suggestions to strengthen your business idea description: Be more specific about the problem you're solving, your target audience, and what makes your solution unique. Consider adding details about market size, competition, and your go-to-market strategy.",
      questionId: req.body?.questionId || questionId || "unknown",
      timestamp: new Date().toISOString(),
      message: "Feedback service temporarily unavailable - here are some general improvement suggestions",
      error: error.message
    };

    return new Response(JSON.stringify(fallbackResult), {
      status: 200, // Return 200 so the frontend doesn't treat it as a complete failure
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
