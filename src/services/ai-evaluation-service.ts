
/**
 * @fileoverview AI Evaluation Service for YFF Applications
 * 
 * Provides comprehensive AI-powered evaluation and scoring for YFF applications
 * with detailed feedback and automated assessment capabilities.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';

export interface QuestionEvaluation {
  score: number; // 1-10
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface ApplicationEvaluation {
  applicationId: string;
  evaluations: Record<string, QuestionEvaluation>;
  overallScore: number;
  ideaSummary: string;
  evaluationStatus: 'pending' | 'completed' | 'failed';
}

/**
 * Comprehensive evaluation prompts for all YFF question types
 * Each prompt follows strict scoring guidelines and response format
 */
const evaluationPrompts = {
  tell_us_about_idea: `
ROLE: You are an expert startup evaluator for Young Founders Floor, reviewing participant responses.
OBJECTIVE: Assess the participant's business-idea articulation for maximum clarity, originality, and feasibility so evaluators can distinguish truly innovative, actionable ventures from generic or vague submissions.
INSTRUCTIONS: Base every judgment solely on the applicant's text; never add outside facts or assumptions. The response is limited to 300 words; ignore length overruns when scoring content quality.

EVALUATION CRITERIA:
• Problem–Solution Fit – Precise statement of a meaningful problem and a logical solution.
• Innovation – Novelty or differentiated approach versus existing alternatives.
• Realism – Plausible execution path given typical resource and market constraints.
• Communication Clarity – Specific, concrete language that avoids jargon and vagueness.

SCORING GUIDELINES (1–10):
• 9–10 = Clear + Unique + Realistic – exact problem, innovative solution, feasible plan.
• 7–8 = Clear but common – well-articulated idea with standard market approach.
• 5–6 = Somewhat clear – basic concept with partial ambiguity or limited novelty.
• 2–4 = Vague – unclear problem/solution, generic buzzwords, or implausible claims.

RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: [List 2-3 specific positive aspects]
– Areas for Improvement: [List 2-3 specific suggestions]`,

  problem_statement: `
ROLE: You are an expert startup evaluator for Young Founders Floor, reviewing participant responses.
OBJECTIVE: Ensure each participant articulates the problem their business idea addresses with maximum specificity, significance, and credibility.

EVALUATION CRITERIA:
• Problem Specificity — Clear definition of the pain point, not a vague or generic issue.
• Significance — Demonstrates the problem's importance on a realistic scale.
• Quantifiable Impact — Incorporates relevant data, statistics, or research to substantiate the problem.
• Credibility — Uses cited evidence, research, or logical reasoning to support claims.

SCORING GUIDELINES (1–10):
• 9–10: Very specific, significant problem; clearly described with good supporting data and quantified impact.
• 7–8: Clearly defined problem and significance, but limited supporting data or quantification.
• 5–6: Somewhat clear problem but missing strong relevance or lacks enough proof/data.
• 2–4: Vague, generic, or unconvincing; questionable if this is a meaningful problem.

RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: [List 2-3 specific positive aspects]
– Areas for Improvement: [List 2-3 specific suggestions]`,

  target_audience: `
ROLE: You are an expert startup evaluator for Young Founders Floor, assessing participant responses on customer understanding and market validation.
OBJECTIVE: Ensure participants demonstrate a nuanced understanding of their target customers, existing solutions, and the market landscape through concrete evidence and supporting research.

EVALUATION CRITERIA:
• Customer Definition: Clearly identifies a specific, well-described ideal customer or customer segment.
• Current Solutions: Provides detailed picture of existing alternatives or workarounds customers use today.
• Pain Evidence: Presents concrete examples of customer frustration, limitations, or dissatisfaction with existing solutions.
• Market Research: Supports claims about customer behavior or pain points with relevant market data or research.

SCORING GUIDELINES (1–10):
• 9–10: Detailed description of current solutions, strong evidence of customer pain, and integrates market research/data validation.
• 7–8: Clearly identifies customer and solutions with some evidence of pain or market validation.
• 5–6: Basic understanding of customer and current solution environment; may lack depth or strong evidence.
• 2–4: Vague, generic, or speculative; no clear customer definition or demonstration of real customer pain.

RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: [List 2-3 specific positive aspects]
– Areas for Improvement: [List 2-3 specific suggestions]`,

  solution_approach: `
ROLE: You are an expert startup evaluator for Young Founders Floor, assessing solution design and technical feasibility.
OBJECTIVE: Evaluate how well participants articulate their solution approach with technical depth, innovation, and realistic implementation strategy.

EVALUATION CRITERIA:
• Solution Clarity: Clear explanation of how the solution works and addresses the identified problem.
• Technical Feasibility: Realistic assessment of technical requirements and implementation challenges.
• Innovation Factor: Unique approach or novel application of existing technologies.
• Implementation Strategy: Thoughtful consideration of development phases, resource requirements, and timeline.

SCORING GUIDELINES (1–10):
• 9–10: Exceptionally clear solution with innovative approach, strong technical understanding, and realistic implementation plan.
• 7–8: Well-defined solution with good technical understanding and feasible implementation strategy.
• 5–6: Basic solution concept with some technical considerations but lacks depth or innovation.
• 2–4: Vague or unrealistic solution approach with poor technical understanding.

RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: [List 2-3 specific positive aspects]
– Areas for Improvement: [List 2-3 specific suggestions]`,

  monetization_strategy: `
ROLE: You are an expert startup evaluator for Young Founders Floor, assessing business model viability and revenue potential.
OBJECTIVE: Evaluate the clarity, feasibility, and market validation of the proposed monetization approach.

EVALUATION CRITERIA:
• Revenue Model Clarity: Clear explanation of how the business will generate revenue.
• Market Validation: Evidence of customer willingness to pay at proposed price points.
• Scalability: Potential for revenue growth and business model scalability.
• Competitive Pricing: Realistic pricing strategy considering market alternatives and customer value.

SCORING GUIDELINES (1–10):
• 9–10: Clear, validated revenue model with strong market evidence and scalable approach.
• 7–8: Well-defined monetization strategy with some market validation and growth potential.
• 5–6: Basic revenue approach with limited validation or scalability considerations.
• 2–4: Unclear or unrealistic monetization strategy with poor market understanding.

RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: [List 2-3 specific positive aspects]
– Areas for Improvement: [List 2-3 specific suggestions]`,

  customer_acquisition: `
ROLE: You are an expert startup evaluator for Young Founders Floor, assessing customer acquisition and marketing strategies.
OBJECTIVE: Evaluate the feasibility and effectiveness of proposed customer acquisition channels and marketing approaches.

EVALUATION CRITERIA:
• Channel Strategy: Clear identification of primary customer acquisition channels.
• Target Market Fit: Alignment between acquisition strategy and target customer behavior.
• Cost Effectiveness: Realistic assessment of customer acquisition costs and lifetime value.
• Execution Plan: Specific, actionable steps for implementing the acquisition strategy.

SCORING GUIDELINES (1–10):
• 9–10: Comprehensive acquisition strategy with multiple validated channels and clear execution plan.
• 7–8: Solid acquisition approach with realistic channels and some market understanding.
• 5–6: Basic acquisition strategy with limited channel diversity or execution detail.
• 2–4: Vague or unrealistic acquisition approach with poor market channel understanding.

RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: [List 2-3 specific positive aspects]
– Areas for Improvement: [List 2-3 specific suggestions]`,

  competitors: `
ROLE: You are an expert startup evaluator for Young Founders Floor, assessing competitive analysis and market positioning.
OBJECTIVE: Evaluate the depth of competitive research and strategic positioning against market alternatives.

EVALUATION CRITERIA:
• Competitive Research: Thorough identification of direct and indirect competitors.
• Differentiation Strategy: Clear articulation of unique value proposition versus competitors.
• Market Positioning: Strategic understanding of market gaps and positioning opportunities.
• Competitive Advantages: Realistic assessment of sustainable competitive advantages.

SCORING GUIDELINES (1–10):
• 9–10: Comprehensive competitive analysis with clear differentiation strategy and strong market positioning.
• 7–8: Good competitive understanding with some differentiation and market insight.
• 5–6: Basic competitive awareness with limited differentiation strategy.
• 2–4: Poor competitive research with unclear positioning or unrealistic claims.

RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: [List 2-3 specific positive aspects]
– Areas for Improvement: [List 2-3 specific suggestions]`,

  product_development: `
ROLE: You are an expert startup evaluator for Young Founders Floor, assessing product development approach and technical execution.
OBJECTIVE: Evaluate the technical strategy, development methodology, and resource planning for product creation.

EVALUATION CRITERIA:
• Development Strategy: Clear approach to product development with defined phases and milestones.
• Technical Resources: Realistic assessment of technical skills, team, and resource requirements.
• MVP Strategy: Thoughtful approach to minimum viable product and iterative development.
• Quality Assurance: Consideration of testing, user feedback, and product refinement processes.

SCORING GUIDELINES (1–10):
• 9–10: Comprehensive development strategy with strong technical planning and iterative approach.
• 7–8: Solid development approach with realistic resource planning and MVP strategy.
• 5–6: Basic development understanding with some technical considerations.
• 2–4: Poor development strategy with unrealistic technical assumptions.

RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: [List 2-3 specific positive aspects]
– Areas for Improvement: [List 2-3 specific suggestions]`,

  team_info: `
ROLE: You are an expert startup evaluator for Young Founders Floor, assessing team composition and capability.
OBJECTIVE: Evaluate team strength, skill diversity, and execution capability for the proposed venture.

EVALUATION CRITERIA:
• Team Composition: Appropriate mix of skills and expertise for the venture requirements.
• Experience Relevance: Team members' backgrounds align with business and technical needs.
• Role Clarity: Clear definition of roles and responsibilities within the team.
• Skill Gaps: Honest assessment of missing skills and plans to address them.

SCORING GUIDELINES (1–10):
• 9–10: Strong, well-rounded team with relevant experience and clear role definitions.
• 7–8: Good team composition with mostly relevant skills and clear responsibilities.
• 5–6: Adequate team with some relevant experience but potential skill gaps.
• 2–4: Weak team composition with significant skill gaps or unclear roles.

RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: [List 2-3 specific positive aspects]
– Areas for Improvement: [List 2-3 specific suggestions]`,

  timeline: `
ROLE: You are an expert startup evaluator for Young Founders Floor, assessing project timeline and execution planning.
OBJECTIVE: Evaluate the realism and strategic planning of the proposed venture timeline and milestones.

EVALUATION CRITERIA:
• Timeline Realism: Realistic assessment of time requirements for key milestones.
• Milestone Definition: Clear, measurable milestones with specific deliverables.
• Resource Planning: Consideration of resource availability and constraints in timeline.
• Risk Assessment: Awareness of potential delays and contingency planning.

SCORING GUIDELINES (1–10):
• 9–10: Realistic timeline with clear milestones, resource planning, and risk consideration.
• 7–8: Good timeline planning with mostly realistic milestones and some resource awareness.
• 5–6: Basic timeline with some milestone definition but limited resource consideration.
• 2–4: Unrealistic timeline with poor milestone planning and no resource awareness.

RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: [List 2-3 specific positive aspects]
– Areas for Improvement: [List 2-3 specific suggestions]`,

  revenue_validation: `
ROLE: You are an expert startup evaluator for Young Founders Floor, assessing early revenue validation and business model execution.
OBJECTIVE: Evaluate the evidence of revenue generation, customer validation, and business model effectiveness for early-revenue stage ventures.

EVALUATION CRITERIA:
• Revenue Evidence: Clear documentation of actual revenue generation and customer payments.
• Customer Validation: Demonstrated product-market fit through paying customer behavior.
• Business Model Effectiveness: Evidence that the monetization strategy is working in practice.
• Growth Indicators: Signs of sustainable revenue growth and customer retention.

SCORING GUIDELINES (1–10):
• 9–10: Strong revenue evidence with clear customer validation and sustainable growth indicators.
• 7–8: Good revenue validation with some customer evidence and growth potential.
• 5–6: Basic revenue generation with limited validation or growth evidence.
• 2–4: Weak revenue validation with questionable business model effectiveness.

RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: [List 2-3 specific positive aspects]
– Areas for Improvement: [List 2-3 specific suggestions]`,

  working_duration: `
ROLE: You are an expert startup evaluator for Young Founders Floor, assessing venture maturity and execution progress.
OBJECTIVE: Evaluate how effectively the team has utilized their working time and what progress indicates about execution capability.

EVALUATION CRITERIA:
• Progress Efficiency: Amount of meaningful progress achieved relative to time invested.
• Learning Velocity: Evidence of rapid learning and iteration based on market feedback.
• Execution Quality: Quality of work produced and milestones achieved during the working period.
• Strategic Focus: Ability to prioritize and focus efforts on high-impact activities.

SCORING GUIDELINES (1–10):
• 9–10: Exceptional progress with efficient execution, rapid learning, and strategic focus.
• 7–8: Good progress with solid execution and evidence of learning from market feedback.
• 5–6: Adequate progress but with some inefficiencies or lack of strategic focus.
• 2–4: Poor progress relative to time invested with limited learning or execution capability.

RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: [List 2-3 specific positive aspects]
– Areas for Improvement: [List 2-3 specific suggestions]`
};

/**
 * Question-to-prompt mapping for both Idea Stage and Early Revenue Stage
 */
export const questionPromptMapping: Record<string, string> = {
  // General questions (both stages)
  ideaDescription: 'tell_us_about_idea',
  
  // Idea Stage questions
  problemSolved: 'problem_statement',
  targetAudience: 'target_audience', 
  solutionApproach: 'solution_approach',
  monetizationStrategy: 'monetization_strategy',
  customerAcquisition: 'customer_acquisition',
  competitors: 'competitors',
  developmentApproach: 'product_development',
  teamInfo: 'team_info',
  timeline: 'timeline',
  
  // Early Revenue Stage questions (with stage-specific prompts where appropriate)
  payingCustomers: 'revenue_validation',
  workingDuration: 'working_duration'
};

/**
 * Parse AI evaluation response into structured format
 */
function parseEvaluationResponse(response: string): QuestionEvaluation {
  console.log('Parsing evaluation response:', response.substring(0, 200) + '...');
  
  // Extract score using regex
  const scoreMatch = response.match(/SCORE:\s*(\d+)\/10/);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
  
  // Extract strengths section
  const strengthsMatch = response.match(/– Strengths:\s*(.*?)(?=– Areas for Improvement:|$)/s);
  const strengthsText = strengthsMatch ? strengthsMatch[1].trim() : '';
  const strengths = strengthsText ? [strengthsText] : [];
  
  // Extract improvements section
  const improvementsMatch = response.match(/– Areas for Improvement:\s*(.*?)$/s);
  const improvementsText = improvementsMatch ? improvementsMatch[1].trim() : '';
  const improvements = improvementsText ? [improvementsText] : [];
  
  console.log('Parsed evaluation:', { score, strengthsCount: strengths.length, improvementsCount: improvements.length });
  
  return {
    score,
    feedback: response,
    strengths,
    improvements
  };
}

/**
 * Calculate average score from evaluations
 */
function calculateAverageScore(evaluations: Record<string, QuestionEvaluation>): number {
  const scores = Object.values(evaluations).map(e => e.score);
  if (scores.length === 0) return 0;
  
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round(average * 10) / 10; // Round to 1 decimal
}

/**
 * Call OpenAI API for evaluation
 */
async function callOpenAIForEvaluation(systemPrompt: string, userAnswer: string): Promise<string> {
  try {
    console.log('Calling OpenAI for evaluation...');
    
    const response = await fetch('/api/ai-evaluation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemPrompt,
        userAnswer,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI evaluation request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.evaluation;
  } catch (error) {
    console.error('Error calling OpenAI for evaluation:', error);
    throw error;
  }
}

/**
 * Generate comprehensive idea summary
 */
async function generateIdeaSummary(application: any, evaluations: Record<string, QuestionEvaluation>): Promise<string> {
  const overallScore = calculateAverageScore(evaluations);
  
  const summaryPrompt = `
You are an expert startup evaluator creating a comprehensive summary of a business idea submission.

Based on the following application responses and their evaluations, create a 200-300 word executive summary covering:

1. Core Problem & Solution Overview
2. Target Market & Customer Validation
3. Business Model & Revenue Approach
4. Team Capabilities & Execution Readiness
5. Overall Assessment & Key Recommendations

Application Details:
- Product Stage: ${application.answers?.questionnaire_answers?.productStage || 'Not specified'}
- Overall Score: ${overallScore}/10
- Team Name: ${application.answers?.team?.teamName || 'Not specified'}
- Venture Name: ${application.answers?.team?.ventureName || 'Not specified'}

Key Application Responses:
- Idea: ${application.answers?.questionnaire_answers?.ideaDescription || 'Not provided'}
- Problem: ${application.answers?.questionnaire_answers?.problemSolved || 'Not provided'}
- Solution: ${application.answers?.questionnaire_answers?.solutionApproach || 'Not provided'}

Provide a balanced, professional executive summary suitable for admin review that highlights both strengths and areas needing attention.
`;

  try {
    const response = await fetch('/api/ai-evaluation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemPrompt: summaryPrompt,
        userAnswer: 'Generate executive summary based on the provided application data.',
      }),
    });

    if (!response.ok) {
      throw new Error(`Summary generation failed: ${response.status}`);
    }

    const data = await response.json();
    return data.evaluation;
  } catch (error) {
    console.error('Error generating idea summary:', error);
    return 'Summary generation failed. Please contact support.';
  }
}

/**
 * Main function to evaluate an application
 */
export async function evaluateApplication(applicationId: string): Promise<ApplicationEvaluation> {
  try {
    console.log('Starting evaluation for application:', applicationId);
    
    // Fetch the application data
    const { data: application, error: fetchError } = await supabase
      .from('yff_applications')
      .select('*')
      .eq('application_id', applicationId)
      .single();

    if (fetchError || !application) {
      throw new Error(`Failed to fetch application: ${fetchError?.message || 'Application not found'}`);
    }

    // Update status to processing
    await supabase
      .from('yff_applications')
      .update({ evaluation_status: 'processing' })
      .eq('application_id', applicationId);

    const evaluations: Record<string, QuestionEvaluation> = {};
    const answers = application.answers?.questionnaire_answers || {};
    
    console.log('Found answers for evaluation:', Object.keys(answers));
    
    // Evaluate each answered question
    for (const [questionId, answer] of Object.entries(answers)) {
      if (answer && typeof answer === 'string' && answer.trim().length >= 10) {
        const promptKey = questionPromptMapping[questionId];
        const systemPrompt = evaluationPrompts[promptKey];
        
        if (systemPrompt) {
          console.log(`Evaluating question: ${questionId} -> ${promptKey}`);
          try {
            const evaluationResponse = await callOpenAIForEvaluation(systemPrompt, answer);
            evaluations[questionId] = parseEvaluationResponse(evaluationResponse);
            console.log(`Completed evaluation for ${questionId}: score ${evaluations[questionId].score}`);
          } catch (error) {
            console.error(`Failed to evaluate question ${questionId}:`, error);
            // Continue with other questions instead of failing completely
          }
        } else {
          console.warn(`No prompt mapping found for question: ${questionId}`);
        }
      }
    }
    
    const overallScore = calculateAverageScore(evaluations);
    console.log(`Overall score calculated: ${overallScore}`);
    
    // Generate idea summary
    const ideaSummary = await generateIdeaSummary(application, evaluations);
    
    // Save evaluation results
    const { error: insertError } = await supabase
      .from('yff_evaluations')
      .insert({
        application_id: applicationId,
        question_scores: evaluations,
        overall_score: overallScore,
        idea_summary: ideaSummary,
        evaluation_metadata: {
          evaluated_at: new Date().toISOString(),
          questions_evaluated: Object.keys(evaluations),
          evaluation_count: Object.keys(evaluations).length
        }
      });

    if (insertError) {
      console.error('Failed to save evaluation:', insertError);
      throw insertError;
    }

    // Update application with evaluation results
    await supabase
      .from('yff_applications')
      .update({
        evaluation_data: evaluations,
        overall_score: overallScore,
        evaluation_status: 'completed',
        evaluation_completed_at: new Date().toISOString()
      })
      .eq('application_id', applicationId);

    console.log('Evaluation completed successfully for application:', applicationId);
    
    return {
      applicationId,
      evaluations,
      overallScore,
      ideaSummary,
      evaluationStatus: 'completed'
    };
    
  } catch (error) {
    console.error('Error evaluating application:', error);
    
    // Update status to failed
    await supabase
      .from('yff_applications')
      .update({ evaluation_status: 'failed' })
      .eq('application_id', applicationId);
    
    throw error;
  }
}

/**
 * Re-evaluate an existing application (admin function)
 */
export async function reEvaluateApplication(applicationId: string): Promise<ApplicationEvaluation> {
  console.log('Re-evaluating application:', applicationId);
  
  // Delete existing evaluation
  await supabase
    .from('yff_evaluations')
    .delete()
    .eq('application_id', applicationId);
  
  // Reset application evaluation status
  await supabase
    .from('yff_applications')
    .update({
      evaluation_status: 'pending',
      evaluation_data: {},
      overall_score: 0,
      evaluation_completed_at: null
    })
    .eq('application_id', applicationId);
  
  // Perform new evaluation
  return await evaluateApplication(applicationId);
}

/**
 * Get evaluation results for an application
 */
export async function getApplicationEvaluation(applicationId: string) {
  const { data, error } = await supabase
    .from('yff_evaluations')
    .select('*')
    .eq('application_id', applicationId)
    .single();

  if (error && error.code !== 'PGRST116') { // Not found error is acceptable
    throw error;
  }

  return data;
}
