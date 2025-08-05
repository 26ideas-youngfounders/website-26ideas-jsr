
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Comprehensive Evaluation Edge Function
 * 
 * Provides REST API endpoint for triggering comprehensive AI evaluations
 * of YFF applications with full prompt mapping and structured scoring.
 */

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      return new Response(JSON.stringify({
        error: 'OpenAI API key not configured',
        code: 'MISSING_API_KEY'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    console.log(`🔄 Starting comprehensive evaluation for: ${applicationId}`);

    // Fetch application data
    const { data: application, error: fetchError } = await supabase
      .from('yff_applications')
      .select('*')
      .eq('application_id', applicationId)
      .single();

    if (fetchError || !application) {
      return new Response(JSON.stringify({
        error: 'Application not found',
        code: 'APPLICATION_NOT_FOUND'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update status to processing
    await supabase
      .from('yff_applications')
      .update({ 
        evaluation_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId);

    // Parse application answers
    let answers: Record<string, any> = {};
    try {
      if (typeof application.answers === 'string') {
        answers = JSON.parse(application.answers);
      } else if (typeof application.answers === 'object' && application.answers !== null) {
        answers = application.answers as Record<string, any>;
      }
    } catch (error) {
      console.error('Failed to parse application answers:', error);
      answers = {};
    }

    // Define system prompts with exact mapping
    const SYSTEM_PROMPTS: Record<string, string> = {
      tell_us_about_idea: `ROLE: You are an expert startup evaluator for Young Founders Floor, reviewing participant responses.
OBJECTIVE: Assess the participant's business-idea articulation for maximum clarity, originality, and feasibility so evaluators can distinguish truly innovative, actionable ventures from generic or vague submissions.
INSTRUCTIONS: Base every judgment solely on the applicant's text; never add outside facts or assumptions. The response is limited to 300 words; ignore length overruns when scoring content quality.
EVALUATION CRITERIA: Problem–Solution Fit – Precise statement of a meaningful problem and a logical solution. Innovation – Novelty or differentiated approach versus existing alternatives. Realism – Plausible execution path given typical resource and market constraints. Communication Clarity – Specific, concrete language that avoids jargon and vagueness.
SCORING GUIDELINES (1–10): 9–10 = Clear + Unique + Realistic – exact problem, innovative solution, feasible plan. 7–8 = Clear but common – well-articulated idea with standard market approach. 5–6 = Somewhat clear – basic concept with partial ambiguity or limited novelty. 2–4 = Vague – unclear problem/solution, generic buzzwords, or implausible claims.
RESPONSE FORMAT (strict): SCORE: [X/10] FEEDBACK: – Strengths: ... – Areas for Improvement: ...`,

      problem_statement: `ROLE: You are an expert startup evaluator for Young Founders Floor, reviewing participant responses.
OBJECTIVE: Ensure each participant articulates the problem their business idea addresses with maximum specificity, significance, and credibility. The aim is to encourage responses that are not only clear but also supported by concrete data, quantifiable impact, and a demonstration of why the problem is important and worth solving.
INSTRUCTIONS: Only use information provided in the applicant's response; do not introduce or reference external facts beyond their answer. The response is limited to 300 words; focus on content quality, not length.
EVALUATION CRITERIA: Problem Specificity — Clear definition of the pain point, not a vague or generic issue. Significance — Demonstrates the problem's importance on a realistic scale. Quantifiable Impact — Incorporates relevant data, statistics, or research to substantiate the problem (when supplied by applicant). Credibility — Uses cited evidence, research, or logical reasoning given in the answer to support claims.
SCORING GUIDELINES (1–10): 9–10: Very specific, significant problem; clearly described with good supporting data and quantified impact. 7–8: Clearly defined problem and significance, but limited supporting data or quantification. 5–6: Somewhat clear problem but missing strong relevance or lacks enough proof/data. 2–4: Vague, generic, or unconvincing; questionable if this is a meaningful problem.
RESPONSE FORMAT (strict): SCORE: [X/10] FEEDBACK: – Strengths: ... – Areas for Improvement: ...`
    };

    // Score each question
    const scoringResults: Array<{
      questionId: string;
      score: number;
      strengths: string[];
      areas_for_improvement: string[];
      raw_feedback: string;
    }> = [];

    for (const [questionId, answer] of Object.entries(answers)) {
      if (typeof answer === 'string' && answer.trim().length >= 10) {
        const systemPrompt = SYSTEM_PROMPTS[questionId];
        if (systemPrompt) {
          try {
            console.log(`🔍 Scoring question: ${questionId}`);
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openAIApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: answer }
                ],
                temperature: 0.3,
                max_tokens: 800,
              }),
            });

            if (!response.ok) {
              throw new Error(`OpenAI API error: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.choices?.[0]?.message?.content || '';

            // Parse AI response
            const scoreMatch = aiResponse.match(/SCORE:\s*(\d+(?:\.\d+)?)/i);
            const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;

            const strengthsMatch = aiResponse.match(/–\s*Strengths:\s*(.*?)(?=–\s*Areas for Improvement:|$)/is);
            const strengthsText = strengthsMatch ? strengthsMatch[1].trim() : '';
            const strengths = strengthsText ? [strengthsText] : [];

            const improvementsMatch = aiResponse.match(/–\s*Areas for Improvement:\s*(.*?)$/is);
            const improvementsText = improvementsMatch ? improvementsMatch[1].trim() : '';
            const areas_for_improvement = improvementsText ? [improvementsText] : [];

            scoringResults.push({
              questionId,
              score: Math.max(0, Math.min(10, score)),
              strengths,
              areas_for_improvement,
              raw_feedback: aiResponse
            });

          } catch (error) {
            console.error(`❌ Failed to score question ${questionId}:`, error);
            scoringResults.push({
              questionId,
              score: 0,
              strengths: [],
              areas_for_improvement: ['Evaluation failed - please review manually'],
              raw_feedback: `Error: ${error.message}`
            });
          }
        }
      }
    }

    // Calculate overall score
    const overallScore = scoringResults.length > 0 
      ? Math.round((scoringResults.reduce((sum, result) => sum + result.score, 0) / scoringResults.length) * 10) / 10
      : 0;

    // Build evaluation data
    const scores: Record<string, any> = {};
    scoringResults.forEach(result => {
      scores[result.questionId] = {
        score: result.score,
        strengths: result.strengths,
        areas_for_improvement: result.areas_for_improvement,
        raw_feedback: result.raw_feedback
      };
    });

    const evaluationData = {
      scores,
      average_score: overallScore,
      evaluation_completed_at: new Date().toISOString(),
      evaluation_status: 'completed',
      evaluation_metadata: {
        total_questions: Object.keys(SYSTEM_PROMPTS).length,
        questions_scored: scoringResults.length,
        model_used: 'gpt-4o-mini',
        evaluation_version: '1.0'
      }
    };

    // Store results
    const { error: updateError } = await supabase
      .from('yff_applications')
      .update({
        evaluation_data: evaluationData,
        overall_score: overallScore,
        evaluation_status: 'completed',
        evaluation_completed_at: evaluationData.evaluation_completed_at,
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId);

    if (updateError) {
      throw new Error(`Failed to store results: ${updateError.message}`);
    }

    // Create evaluation record
    await supabase
      .from('yff_evaluations')
      .insert({
        application_id: applicationId,
        overall_score: overallScore,
        question_scores: evaluationData.scores,
        evaluation_completed_at: evaluationData.evaluation_completed_at,
        evaluation_metadata: evaluationData.evaluation_metadata
      });

    console.log(`✅ Comprehensive evaluation completed for ${applicationId} with score: ${overallScore}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Evaluation completed successfully with score: ${overallScore}/10`,
      result: {
        overall_score: overallScore,
        questions_scored: scoringResults.length,
        evaluation_completed_at: evaluationData.evaluation_completed_at
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Comprehensive evaluation error:', error);
    
    return new Response(JSON.stringify({
      error: 'Evaluation failed',
      message: error.message,
      code: 'EVALUATION_ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
