
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
import type { Json } from '@/integrations/supabase/types';
import { parseApplicationAnswers, type ParsedApplicationAnswers } from '@/types/yff-application';

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
 * Complete Idea Stage evaluation prompts with exact 1:1 mapping
 */
const evaluationPrompts = {
  tell_us_about_idea: `
ROLE: You are an expert startup evaluator for Young Founders Floor, reviewing participant responses.
OBJECTIVE: Assess the participant's business-idea articulation for maximum clarity, originality, and feasibility so evaluators can distinguish truly innovative, actionable ventures from generic or vague submissions.
INSTRUCTIONS:
Base every judgment solely on the applicant's text; never add outside facts or assumptions. The response is limited to 300 words; ignore length overruns when scoring content quality.
EVALUATION CRITERIA:
Problem–Solution Fit – Precise statement of a meaningful problem and a logical solution.
Innovation – Novelty or differentiated approach versus existing alternatives.
Realism – Plausible execution path given typical resource and market constraints.
Communication Clarity – Specific, concrete language that avoids jargon and vagueness.
SCORING GUIDELINES (1–10):
9–10 = Clear + Unique + Realistic – exact problem, innovative solution, feasible plan.
7–8 = Clear but common – well-articulated idea with standard market approach.
5–6 = Somewhat clear – basic concept with partial ambiguity or limited novelty.
2–4 = Vague – unclear problem/solution, generic buzzwords, or implausible claims.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: …
– Areas for Improvement: …`,

  problem_statement: `
ROLE: You are an expert startup evaluator for Young Founders Floor, reviewing participant responses.
OBJECTIVE: Ensure each participant articulates the problem their business idea addresses with maximum specificity, significance, and credibility. The aim is to encourage responses that are not only clear but also supported by concrete data, quantifiable impact, and a demonstration of why the problem is important and worth solving.
INSTRUCTIONS:
Only use information provided in the applicant's response; do not introduce or reference external facts beyond their answer.
The response is limited to 300 words; focus on content quality, not length.
EVALUATION CRITERIA:
Problem Specificity — Clear definition of the pain point, not a vague or generic issue.
Significance — Demonstrates the problem's importance on a realistic scale.
Quantifiable Impact — Incorporates relevant data, statistics, or research to substantiate the problem (when supplied by applicant).
Credibility — Uses cited evidence, research, or logical reasoning given in the answer to support claims.
SCORING GUIDELINES (1–10):
9–10: Very specific, significant problem; clearly described with good supporting data and quantified impact.
7–8: Clearly defined problem and significance, but limited supporting data or quantification.
5–6: Somewhat clear problem but missing strong relevance or lacks enough proof/data.
2–4: Vague, generic, or unconvincing; questionable if this is a meaningful problem.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: …
– Areas for Improvement: …`,

  whose_problem: `
ROLE: You are an expert startup evaluator for Young Founders Floor, assessing participant responses on customer understanding and market validation.
OBJECTIVE: Ensure participants demonstrate a nuanced understanding of their target customers, existing solutions, and the market landscape through concrete evidence and supporting research. The goal is to verify that applicants have precisely identified their ideal customer, understand how these customers currently address the problem, recognize real pain points, and can back up their claims with relevant market research or data.
INSTRUCTIONS:
Evaluate using only the information found in the applicant's answer; do not add or assume facts from outside their submission.
The response is limited to 300 words; judge on quality and depth, not length.
EVALUATION CRITERIA:
Customer Definition: Clearly identifies a specific, well-described ideal customer or customer segment (avoid vagueness such as "everyone").
Current Solutions: Provides a detailed, accurate picture of what existing alternatives or workarounds these customers use today (including paid or unpaid/DIY methods).
Pain Evidence: Presents concrete examples or anecdotes of customer frustration, limitations, or dissatisfaction with existing solutions.
Market Research: Supports claims about customer behavior or pain points with relevant market data, user interviews, credible statistics, or third-party research (if any is provided in the answer).
SCORING GUIDELINES (1–10):
9–10: Response offers a detailed description of current solutions, strong evidence of customer pain, and integrates market research/data validation.
7–8: Clearly identifies customer and solutions with some evidence of pain or market validation.
5–6: Demonstrates a basic understanding of the customer and current solution environment; may lack depth or strong evidence.
2–4: Vague, generic, or speculative; no clear customer definition or demonstration of real customer pain.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: …
– Areas for Improvement: …`,

  how_solve_problem: `
ROLE: You are an expert startup evaluator for Young Founders Floor, assessing participant responses on solution effectiveness and clarity.
OBJECTIVE: Ensure participants clearly explain how their solution directly addresses the core problem with a logical, actionable, and realistic approach. The aim is to encourage responses that are focused, feasible, and tailored to solving the stated issue.
INSTRUCTIONS:
Evaluate using only the information found in the applicant's answer; do not add or assume facts from outside their submission.
The response is limited to 300 words; judge on quality and depth, not length.
EVALUATION CRITERIA:
Solution Clarity – Clear, step-by-step explanation of how the solution works and addresses the identified problem.
Logical Connection – Direct, logical link between the solution's features/actions and the core problem's resolution.
Practical Actions – Realistic, specific, and actionable steps and processes that can be implemented by the venture.
Intended Outcomes – Clear articulation of what changes or results are expected if this solution is applied.
SCORING GUIDELINES (1–10):
9–10: Solution is clear, logical, and realistic—each action directly tackles the problem as per industry standards.
7–8: Well-defined solution with a solid problem connection and mostly practical actions.
5–6: Demonstrates a basic approach but has limited detail, depth, or practicality.
2–4: Vague, generic, lacks specificity, or not tailored to the problem.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: …
– Areas for Improvement: …`,

  how_make_money: `
ROLE: You are an expert startup evaluator for Young Founders Floor, assessing participant responses on revenue model viability and business understanding.
OBJECTIVE: Ensure participants present comprehensive, data-backed revenue models that feature multiple streams of income and, where applicable, provide clear Annual Recurring Revenue (ARR) or Monthly Recurring Revenue (MRR) projections. The goal is to determine not just how ventures plan to make money, but that they understand proven models for their industry and can justify their projections with logical calculation or evidence.
INSTRUCTIONS:
Evaluate using only the information provided in the applicant's response; do not supplement or assume facts from outside their submission.
The response is limited to 300 words, with an optional PDF/Excel upload for supporting details.
EVALUATION CRITERIA:
Revenue Streams – Does the venture outline multiple, diversified, and specific ways of generating income (e.g., product sales, subscriptions, services, advertising, licensing, etc.)?
Model Clarity – Is the monetization strategy clearly described and understandable? Does it unambiguously state how money will be earned?
Projections – Are ARR or MRR estimates provided and supported by transparent calculations, logic, or industry-standard methodologies?
Industry Fit – Does the revenue model reflect proven business practices or established monetization patterns for the given sector?
SCORING GUIDELINES (1–10):
9–10: Multiple revenue streams detailed, ARR/MRR projections included with sound justification and methodology that fit industry practice.
7–8: Single, clear revenue stream with a viable model and sound explanation.
5–6: Basic or generic model, projections are present but not well justified or industry-aligned.
2–4: Monetization approach is unclear, implausible, or unsupported.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: …
– Areas for Improvement: …`,

  acquire_customers: `
ROLE: You are an expert startup evaluator for Young Founders Floor, reviewing participant responses about customer acquisition and relationship management at the idea stage.
OBJECTIVE: Ensure each participant presents a deeply developed customer acquisition and relationship strategy that covers first customer acquisition, multi-stage engagement, specific touchpoints, retention planning, and customer satisfaction. The aim is to reward responses that go beyond superficial tactics—demonstrating practical, lifecycle-based thinking appropriate to early-stage startups.
INSTRUCTIONS:
Evaluate responses using only information in the applicant's text; do not introduce or reference external facts from outside their answer.
The response should be concise (max 300 words), but score based on depth, specificity, and actionability, not length.
EVALUATION CRITERIA:
Initial Acquisition Strategy: Clearly identifies how the first paying customers will be approached, engaged, and converted using appropriate channels (digital, field-based, partnerships, etc.), considering constraints typical for idea-stage startups.
Customer Relationship Mapping: Demonstrates comprehensive understanding of the entire customer journey—articulating all key relationship touchpoints from first contact through onboarding, engagement, and ongoing support.
Retention & Satisfaction Planning: Presents specific, actionable plans for building loyalty, ensuring retention, and fostering customer satisfaction—personalized outreach, proactive support, loyalty initiatives, or feedback loops.
Relationship Depth: Shows commitment to ongoing relationship-building (not one-off sales), such as personalized communication, value-added services, or community creation.
Lifecycle Management: Explains how the customer relationship evolves with maturity—touchpoints for nurturing, upselling, gathering feedback, and resolving churn risks.
Practicality & Realism: Uses strategies and touchpoints suited to the venture's resources, customer profile, and early-stage constraints.
SCORING GUIDELINES (1–10):
9–10: Multi-touchpoint acquisition plan plus retention strategy; Deep relationship mapping across lifecycle; Clear, actionable retention/satisfaction tactics; Strategies fit resources/industry; Demonstrates customer-centric thinking.
7–8: Good multi-stage plan with specific acquisition and relationship touchpoints; Good focus on retention but lacks maximum depth or some stages.
5–6: Basic or generic strategy; some touchpoints or retention methods present but not comprehensive.
2–4: Weak or unclear strategy; missing multi-touchpoint planning or depth on retention/satisfaction.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: …
– Areas for Improvement: …`,

  competitors: `
ROLE: You are an expert startup evaluator for Young Founders Floor, assessing participant responses on competitive analysis and differentiation strategy.
OBJECTIVE: Ensure participants demonstrate a thorough, evidence-based understanding of their competitive landscape by accurately identifying at least three direct or indirect competitors, analyzing their strengths and weaknesses, and clearly articulating how their idea is differentiated. The response should reflect clarity, market awareness, and a nuanced grasp of competitive dynamics. If claiming no competitors, credible evidence or data must be provided to support the assertion.
INSTRUCTIONS:
Assess responses based solely on the applicant's text; do not introduce external information or assumptions.
Maximum response length is 300 words; focus on the depth and quality of content rather than sheer length.
EVALUATION CRITERIA:
Competitor Identification: Accurately names at least three direct or indirect competitors aiming to solve a similar problem or serve a similar customer segment.
Competitive Analysis: Provides specific analysis of the competitors' strengths and weaknesses, demonstrating real understanding of the market.
Differentiation: Clearly explains the unique value proposition or advantages that set the applicant's idea apart from competitors.
Market Understanding: Shows evidence of a nuanced and realistic perspective on how the market functions, including overlap, gaps, and dynamics.
No competition claim: If claiming there are no competitors, the answer must include credible market research, patent analysis, or industry data to substantiate the claim.
SCORING GUIDELINES (1–10):
9–10: Identifies at least three competitors, provides detailed analysis, and presents clear, credible points of differentiation; demonstrates strong market understanding.
7–8: Identifies two or more competitors with good analysis and some differentiation; may lack full depth or nuance.
5–6: Demonstrates only basic knowledge of competitors or surface-level differentiation.
1–3: Claims no competition without credible evidence, or provides incomplete/missing competitor identification or analysis.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: …
– Areas for Improvement: …`,

  product_development: `
ROLE: You are an expert startup evaluator for Young Founders Floor, assessing participant responses on product development capability and resource strategy at the idea stage.
OBJECTIVE: Ensure participants demonstrate a deliberate, resource-appropriate, and strategic approach to how their product will be developed at the earliest stage. The response should reveal thoughtful allocation of technical resources (in-house, co-founder, outsource, or hybrid), a realistic match between development approach and product requirements, and practical awareness of the strengths and risks associated with each choice at the idea stage.
INSTRUCTIONS:
Evaluate each response strictly based on the applicant's own text; do not supplement with assumptions or outside information.
The response should focus on how and why this setup is selected, not just state the mode.
Prioritize depth, reasoning, and fit over generic descriptions.
EVALUATION CRITERIA:
Development Mode Clarity: Clearly and unambiguously states the chosen product development model (e.g., solo founder, technical co-founder, in-house team, agency, partner, hybrid).
Strategic Fit: Justifies why this development mode is best for the current stage, considering prototype speed, iteration ability, ownership of IP, and budget constraints.
Resource Alignment: Explains the technical skills available (within founding team or partners) or what gaps exist, and describes actionable plans to fill those gaps where needed.
Risk Awareness: Recognizes potential risks—such as communication breakdown (outsourcing), skills shortages (no tech co-founder), or slow iterations—and includes realistic mitigation steps.
Early-Stage Adaptiveness: Shows the setup supports rapid learning cycles, feedback incorporation, and pivoting—critical for idea-stage development.
Cost & Control Balance: Evaluates how this approach balances upfront cost, speed, and product ownership.
Long-Term Scalability: Comments on whether the setup is intended for MVP/prototype only or is designed for maintainable long-term scaling post-idea stage.
SCORING GUIDELINES (1–10):
9–10: Chosen mode is justified, well-fitted to resources/stage, risks acknowledged, mitigation plans clear, enables rapid iteration, and shows forward planning.
7–8: Clear mode and good reasoning; some strategic fit but may lack in-depth mitigation or long-term view.
5–6: Basic explanation of mode with limited rationale or awareness of risks/challenges; superficial fit to stage or needs.
2–4: Vague, unclear, generic, or mismatched to product needs or stage; lacks reasoning or real strategy.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: …
– Areas for Improvement: …`,

  team_roles: `
ROLE: You are an expert startup evaluator for Young Founders Floor, assessing participant responses on founder-market fit and team capabilities.
OBJECTIVE: Assess whether the founder or founding team has relevant background, domain expertise, and unique advantages necessary for successful execution of the business idea. Responses should illustrate not only who is on the team and their roles, but also why their individual and collective backgrounds, skills, and perspectives make them uniquely qualified to solve the identified problem.
INSTRUCTIONS:
Evaluate strictly on information provided in the participant's text; do not supplement with assumptions or external knowledge.
The response is limited to 300 words; prioritize depth and relevance over length.
EVALUATION CRITERIA:
Relevant Experience: Clearly describes how each founder's and core team member's background and skills are directly linked to the problem/industry.
Domain Expertise: Demonstrates depth of knowledge (technical, sectoral, business) in the specific market or technology area.
Unique Insights: Identifies special perspectives or tangible advantages—such as industry connections, first-hand experience, or proprietary knowledge—that other teams are unlikely to have.
Passion/Commitment: Provides evidence of genuine, sustained interest and the drive to build this solution, such as prior work, motivation, or long-term dedication.
SCORING GUIDELINES (1–10):
9–10: Strong domain expertise, highly relevant experience, clear unique insights, and compelling evidence of passion/commitment.
7–8: Good background with relevant experience and some sector knowledge. Moderate insight and passion.
5–6: Describes some relevant skills but shows limited domain depth or passion.
2–4: Weak founder-market fit; skills and motivation not clearly related to the problem or industry.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: …
– Areas for Improvement: …`,

  when_proceed: `
ROLE: You are an expert startup evaluator for Young Founders Floor, assessing participant responses on the urgency, execution readiness, and commitment regarding their venture timeline.
OBJECTIVE: Rigorously evaluate whether the participant demonstrates a compelling sense of urgency and concrete readiness to begin working on their idea. The aim is to ensure founders provide a specific, actionable timeline that reflects intentional planning, proactive commitment, and a strong bias for action—key indicators of high-potential founders. Responses should move beyond vague intentions and offer tangible evidence of momentum.
INSTRUCTIONS:
Judge strictly on the information provided in the applicant's answer; do not make assumptions or supplement from external knowledge.
Focus on the level of specificity, immediacy, and confidence in the stated timeline and next steps.
Score for action-orientation, resource preparation, and demonstrated momentum, not just verbal eagerness.
EVALUATION CRITERIA:
Timeline Specificity: States an exact start date (e.g., "already working on it," or "commencing August 2025") and/or identifies time-bound, actionable milestones.
Readiness to Execute: Presents evidence of groundwork already laid (partnerships, prototypes, initial hires, resource commitments, etc.), or describes immediate next steps.
Sense of Urgency: Clearly communicates active intent and a strong drive to build quickly, not delayed or passive language.
Proactive Commitment: Shows the founder/team is taking ownership—has adjusted schedules, sourced critical resources, and is prepared to prioritize the venture.
Momentum Evidence: Provides proof of recent progress, pre-launch activities, or decisive preparatory actions.
SCORING GUIDELINES (1–10):
9–10: Initiation is immediate or underway; timeline is precise; concrete proof of action and high commitment.
7–8: Planned start within the next 1–3 months with clear milestones; action-oriented but not yet executing.
5–6: Expresses interest and some intent to proceed but lacks specific dates, milestones, or urgency.
2–4: Vague, generic, or passive; timeline is unclear or commitment is questionable.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: …
– Areas for Improvement: …`
};

/**
 * Question-to-prompt mapping for Idea Stage questions
 */
export const questionPromptMapping: Record<string, string> = {
  // General questions
  ideaDescription: 'tell_us_about_idea',
  
  // Idea Stage questions - exact mapping
  problemSolved: 'problem_statement',
  targetAudience: 'whose_problem', 
  solutionApproach: 'how_solve_problem',
  monetizationStrategy: 'how_make_money',
  customerAcquisition: 'acquire_customers',
  competitors: 'competitors',
  developmentApproach: 'product_development',
  teamInfo: 'team_roles',
  timeline: 'when_proceed'
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
  const parsedAnswers = parseApplicationAnswers(application.answers);
  
  const summaryPrompt = `
You are an expert startup evaluator creating a comprehensive summary of a business idea submission.

Based on the following application responses and their evaluations, create a 200-300 word executive summary covering:

1. Core Problem & Solution Overview
2. Target Market & Customer Validation
3. Business Model & Revenue Approach
4. Team Capabilities & Execution Readiness
5. Overall Assessment & Key Recommendations

Application Details:
- Product Stage: ${parsedAnswers.questionnaire_answers?.productStage || 'Not specified'}
- Overall Score: ${overallScore}/10
- Team Name: ${parsedAnswers.team?.teamName || 'Not specified'}
- Venture Name: ${parsedAnswers.team?.ventureName || 'Not specified'}

Key Application Responses:
- Idea: ${parsedAnswers.questionnaire_answers?.ideaDescription || 'Not provided'}
- Problem: ${parsedAnswers.questionnaire_answers?.problemSolved || 'Not provided'}
- Solution: ${parsedAnswers.questionnaire_answers?.solutionApproach || 'Not provided'}

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
    const parsedAnswers = parseApplicationAnswers(application.answers);
    const answers = parsedAnswers.questionnaire_answers || {};
    
    console.log('Found answers for evaluation:', Object.keys(answers));
    
    // Evaluate each answered question using exact prompt mapping
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
    
    // Save evaluation results - fix Json type conversion
    const { error: insertError } = await supabase
      .from('yff_evaluations')
      .insert({
        application_id: applicationId,
        question_scores: evaluations as unknown as Json,
        overall_score: overallScore,
        idea_summary: ideaSummary,
        evaluation_metadata: {
          evaluated_at: new Date().toISOString(),
          questions_evaluated: Object.keys(evaluations),
          evaluation_count: Object.keys(evaluations).length
        } as unknown as Json
      });

    if (insertError) {
      console.error('Failed to save evaluation:', insertError);
      throw insertError;
    }

    // Update application with evaluation results - fix Json type conversion
    await supabase
      .from('yff_applications')
      .update({
        evaluation_data: evaluations as unknown as Json,
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
      evaluation_data: {} as unknown as Json,
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
