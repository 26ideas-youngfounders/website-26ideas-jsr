
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

/**
 * Comprehensive Evaluation Edge Function
 * 
 * Handles complete AI evaluation of YFF applications with proper error handling
 * and status updates.
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

    const { applicationId, questions } = await req.json();

    if (!applicationId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'applicationId is required',
        code: 'MISSING_APPLICATION_ID'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🎯 Starting comprehensive evaluation for: ${applicationId}`);

    // Update status to processing
    await supabase
      .from('yff_applications')
      .update({ 
        evaluation_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId);

    let questionsToEvaluate = questions;

    // If questions not provided, fetch and extract from application
    if (!questionsToEvaluate || questionsToEvaluate.length === 0) {
      console.log('🔍 No questions provided, fetching application data...');
      
      const { data: application, error: fetchError } = await supabase
        .from('yff_applications')
        .select('*')
        .eq('application_id', applicationId)
        .single();

      if (fetchError || !application) {
        throw new Error(`Failed to fetch application: ${fetchError?.message || 'Application not found'}`);
      }

      // Extract questions from application answers
      questionsToEvaluate = await extractQuestionsFromApplication(application);
    }

    if (!questionsToEvaluate || questionsToEvaluate.length === 0) {
      throw new Error('No valid questions found for evaluation');
    }

    console.log(`📋 Evaluating ${questionsToEvaluate.length} questions`);

    // Evaluate each question
    const questionScores: Record<string, any> = {};
    let totalScore = 0;

    for (const question of questionsToEvaluate) {
      try {
        console.log(`🔍 Evaluating question: ${question.questionId}`);
        
        const systemPrompt = getSystemPromptForQuestion(question.questionId, question.stage);
        
        if (!systemPrompt) {
          console.log(`⚠️ No system prompt found for question: ${question.questionId}, skipping...`);
          continue;
        }

        const evaluation = await callOpenAIForEvaluation(systemPrompt, question.userAnswer);
        
        if (evaluation) {
          const parsedEvaluation = parseEvaluationResponse(evaluation);
          
          questionScores[question.questionId] = {
            score: parsedEvaluation.score,
            strengths: parsedEvaluation.strengths,
            areas_for_improvement: parsedEvaluation.improvements,
            raw_feedback: evaluation,
            question_text: question.questionText,
            user_answer: question.userAnswer
          };
          
          totalScore += parsedEvaluation.score;
          console.log(`✅ Question ${question.questionId} scored: ${parsedEvaluation.score}/10`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to evaluate question ${question.questionId}:`, error);
        // Continue with other questions even if one fails
      }
    }

    const averageScore = questionsToEvaluate.length > 0 ? totalScore / questionsToEvaluate.length : 0;

    console.log(`📊 Evaluation completed. Average score: ${averageScore.toFixed(1)}/10`);

    // Update application with results
    const { error: updateError } = await supabase
      .from('yff_applications')
      .update({
        evaluation_status: 'completed',
        overall_score: averageScore,
        evaluation_data: questionScores,
        evaluation_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId);

    if (updateError) {
      throw new Error(`Failed to update application: ${updateError.message}`);
    }

    console.log(`✅ Application ${applicationId} evaluation completed successfully`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        overall_score: averageScore,
        question_scores: questionScores,
        evaluation_completed_at: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Comprehensive evaluation failed:', error);
    
    // Try to update status to failed if we have the applicationId
    try {
      const { applicationId } = await req.clone().json();
      if (applicationId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('yff_applications')
          .update({ 
            evaluation_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('application_id', applicationId);
      }
    } catch (updateError) {
      console.error('Failed to update status to failed:', updateError);
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Comprehensive evaluation failed',
      message: error.message,
      code: 'EVALUATION_ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Extract questions from application data
 */
async function extractQuestionsFromApplication(application: any): Promise<any[]> {
  try {
    const answers = typeof application.answers === 'string' 
      ? JSON.parse(application.answers)
      : application.answers;

    const questions: any[] = [];

    // Determine stage
    const stage = getApplicationStage(answers);
    console.log('🔍 Determined application stage:', stage);

    // Extract questionnaire answers
    const questionnaireAnswers = answers.questionnaire_answers || {};

    // Enhanced question mapping for both stages
    const questionMappings = [
      // Universal questions
      { id: 'tell_us_about_idea', text: 'Tell us about your idea' },
      
      // Stage-specific problem questions
      { 
        id: stage === 'early_revenue' ? 'early_revenue_problem' : 'problem_statement',
        text: 'What problem does your idea solve?'
      },
      
      // Stage-specific target audience questions
      { 
        id: stage === 'early_revenue' ? 'early_revenue_whose_problem' : 'whose_problem',
        text: stage === 'early_revenue' ? 'Who are your target customers?' : 'Whose problem are you solving?'
      },
      
      // Stage-specific solution questions
      { 
        id: stage === 'early_revenue' ? 'early_revenue_how_solve' : 'how_solve_problem',
        text: stage === 'early_revenue' ? 'How does your solution address the problem?' : 'How does your idea solve this problem?'
      },
      
      // Stage-specific monetization questions
      { 
        id: stage === 'early_revenue' ? 'early_revenue_making_money' : 'how_make_money',
        text: stage === 'early_revenue' ? 'How are you making money?' : 'How will you make money?'
      },
      
      // Stage-specific customer acquisition questions
      { 
        id: stage === 'early_revenue' ? 'early_revenue_acquiring_customers' : 'acquire_customers',
        text: stage === 'early_revenue' ? 'How are you acquiring paying customers?' : 'How will you acquire your first customers?'
      },
      
      // Early revenue specific questions
      ...(stage === 'early_revenue' ? [
        { id: 'early_revenue_working_duration', text: 'Since when have you been working on this?' },
      ] : []),
      
      // Stage-specific team questions
      { 
        id: stage === 'early_revenue' ? 'early_revenue_team' : 'team_roles',
        text: stage === 'early_revenue' ? 'Tell us about your team composition' : 'Tell us about your team'
      },
      
      // Stage-specific competitor questions
      { 
        id: stage === 'early_revenue' ? 'early_revenue_competitors' : 'competitors',
        text: stage === 'early_revenue' ? 'Who are your main competitors?' : 'Who are your competitors?'
      },
      
      // Stage-specific product development questions
      { 
        id: stage === 'early_revenue' ? 'early_revenue_product_development' : 'product_development',
        text: stage === 'early_revenue' ? 'How are you developing your product?' : 'How will you develop your product?'
      },
      
      // Idea stage specific questions
      ...(stage === 'idea' ? [
        { id: 'when_proceed', text: 'When do you want to proceed?' }
      ] : [])
    ];

    // Extract answers for each mapped question
    for (const mapping of questionMappings) {
      const possibleKeys = [
        mapping.id,
        mapping.id.replace('early_revenue_', ''),
        mapping.text.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
      ];

      let answer = '';

      // Try to find the answer with various key formats
      for (const key of possibleKeys) {
        if (questionnaireAnswers[key] && typeof questionnaireAnswers[key] === 'string' && questionnaireAnswers[key].trim()) {
          answer = questionnaireAnswers[key].trim();
          break;
        }
      }

      if (answer && answer.length >= 10) { // Minimum answer length
        questions.push({
          questionId: mapping.id,
          questionText: mapping.text,
          userAnswer: answer,
          stage
        });
      }
    }

    return questions;

  } catch (error) {
    console.error('❌ Error extracting questions:', error);
    return [];
  }
}

/**
 * Determine application stage from answers
 */
function getApplicationStage(answers: any): 'idea' | 'early_revenue' {
  const questionnaireAnswers = answers.questionnaire_answers || {};
  
  // Check for early revenue indicators
  const earlyRevenueIndicators = [
    'early_revenue_making_money',
    'early_revenue_acquiring_customers',
    'early_revenue_working_duration',
    'payingCustomers',
    'customerAcquisition'
  ];
  
  const hasEarlyRevenueAnswers = earlyRevenueIndicators.some(key => 
    questionnaireAnswers[key] && 
    typeof questionnaireAnswers[key] === 'string' && 
    questionnaireAnswers[key].trim().length > 0
  );
  
  return hasEarlyRevenueAnswers ? 'early_revenue' : 'idea';
}

/**
 * Get system prompt for question evaluation
 */
function getSystemPromptForQuestion(questionId: string, stage: string): string | null {
  const prompts: Record<string, string> = {
    // Idea stage prompts
    'tell_us_about_idea': `ROLE: You are an expert startup evaluator for Young Founders Floor, assessing participant responses on idea clarity, problem identification, and solution articulation for idea-stage ventures.

OBJECTIVE: Ensure each participant clearly articulates their business idea with maximum clarity, demonstrating understanding of the problem-solution fit and market opportunity.

EVALUATION CRITERIA:
- Idea Clarity: Is the business concept clearly explained and easy to understand?
- Problem Understanding: Does the response show deep understanding of the problem being solved?
- Solution Articulation: Is the proposed solution well-defined and logical?
- Market Awareness: Does the participant show understanding of their target market?

SCORING GUIDELINES (1–10):
9–10: Crystal clear idea with excellent problem-solution articulation
7–8: Well-defined idea with good problem understanding
5–6: Basic idea explanation with some clarity issues
2–4: Unclear or poorly articulated idea

RESPONSE FORMAT:
SCORE: [X/10]
FEEDBACK:
**Strengths in your current response:**
- [List specific strengths]
**Areas for improvement:**
- [List specific areas to improve]`,

    'problem_statement': `ROLE: You are an expert startup evaluator for Young Founders Floor, assessing participant responses on problem identification and validation for idea-stage ventures.

OBJECTIVE: Ensure each participant demonstrates clear understanding and validation of the problem they aim to solve.

EVALUATION CRITERIA:
- Problem Definition: Is the problem clearly defined and specific?
- Problem Validation: Is there evidence of research or validation?
- Market Size: Understanding of how many people face this problem?
- Problem Urgency: Is this a pressing problem that needs solving?

SCORING GUIDELINES (1–10):
9–10: Well-researched, clearly defined problem with strong validation
7–8: Clear problem with some validation evidence
5–6: Basic problem identification with limited depth
2–4: Vague or poorly defined problem

RESPONSE FORMAT:
SCORE: [X/10]
FEEDBACK:
**Strengths in your current response:**
- [List specific strengths]
**Areas for improvement:**
- [List specific areas to improve]`,

    'early_revenue_acquiring_customers': `ROLE: You are an expert startup evaluator for Young Founders Floor, assessing participant responses on customer delivery, feedback mechanisms, and actionable learning in early-revenue ventures.

OBJECTIVE: Ensure each participant articulates their product/service delivery process with maximum clarity, structure, and integration of customer feedback.

EVALUATION CRITERIA:
- Structured Delivery Process: Clear, step-by-step process for delivering to paying customers
- Systematic Feedback Collection: Organized, repeatable feedback mechanisms
- Meaningful Customer Insights: Specific, actionable insights from customer feedback
- Actionable Learning Integration: How insights have improved the product/service
- Customer Engagement Quality: Evidence of genuine, ongoing engagement with paying customers

SCORING GUIDELINES (1–10):
9–10: Structured delivery; robust feedback mechanisms; clear actionable learning
7–8: Well-defined delivery; solid feedback collection; evidence of learning
5–6: Basic delivery and feedback methods; limited insights
2–4: Weak delivery; superficial feedback; little learning evidence

RESPONSE FORMAT:
SCORE: [X/10]
FEEDBACK:
**Strengths in your current response:**
- [List specific strengths]
**Areas for improvement:**
- [List specific areas to improve]`
  };

  return prompts[questionId] || null;
}

/**
 * Call OpenAI API for evaluation
 */
async function callOpenAIForEvaluation(systemPrompt: string, userAnswer: string): Promise<string | null> {
  try {
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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userAnswer }
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;

  } catch (error) {
    console.error('OpenAI API call failed:', error);
    return null;
  }
}

/**
 * Parse evaluation response from AI
 */
function parseEvaluationResponse(evaluation: string): { score: number; strengths: string[]; improvements: string[] } {
  const scoreMatch = evaluation.match(/SCORE:\s*(\d+(?:\.\d+)?)/i);
  const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;

  const strengthsMatch = evaluation.match(/\*\*Strengths in your current response:\*\*(.*?)(?=\*\*Areas for improvement:\*\*|$)/is);
  const strengths = strengthsMatch ? 
    strengthsMatch[1].split(/[-•]\s*/).filter(s => s.trim().length > 0).map(s => s.trim()) : [];

  const improvementsMatch = evaluation.match(/\*\*Areas for improvement:\*\*(.*?)$/is);
  const improvements = improvementsMatch ? 
    improvementsMatch[1].split(/[-•]\s*/).filter(s => s.trim().length > 0).map(s => s.trim()) : [];

  return {
    score,
    strengths: strengths.slice(0, 5),
    improvements: improvements.slice(0, 5)
  };
}
