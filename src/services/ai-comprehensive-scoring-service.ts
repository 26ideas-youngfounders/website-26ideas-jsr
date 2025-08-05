/**
 * @fileoverview Comprehensive AI Scoring Service
 * 
 * Implements robust backend logic for AI-based evaluation of YFF applications
 * with strict prompt mapping, score extraction, and structured result storage.
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  EvaluationData, 
  QuestionScoringResult,
  AIEvaluationResult,
  parseApplicationAnswers,
  ExtendedYffApplication,
  ensureEvaluationDataIsObject
} from '@/types/yff-application';

/**
 * Complete system prompts mapping - one-to-one question to prompt mapping
 */
const SYSTEM_PROMPTS: Record<string, string> = {
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
– Strengths: ...
– Areas for Improvement: ...`,

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
– Strengths: ...
– Areas for Improvement: ...`,

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
– Strengths: ...
– Areas for Improvement: ...`,

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
– Strengths: ...
– Areas for Improvement: ...`,

  how_make_money: `
ROLE: You are an expert startup evaluator for Young Founders Floor, assessing participant responses on revenue models, monetization strategies, and business viability.
OBJECTIVE: Ensure each participant articulates a realistic, evidence-backed monetization strategy that demonstrates deep understanding of their market, pricing dynamics, and revenue potential. The aim is to distinguish ventures with validated, scalable revenue models from those with purely theoretical or untested approaches.
INSTRUCTIONS:
Use only the information presented in the applicant's answer; do not supplement with external facts or assumptions.
The response is limited to 300 words; prioritize substance and feasibility over length.
EVALUATION CRITERIA:
Revenue Model Clarity: Does the response clearly articulate how the business will generate money, including specific revenue streams?
Market Validation: Has the venture tested or validated their pricing/revenue approach with real customers or market research?
Scalability: Is the monetization strategy scalable and sustainable as the business grows?
Competitive Positioning: Does the pricing strategy account for competitive dynamics and value proposition?
SCORING GUIDELINES (1–10):
9–10: Clear, validated revenue model with market evidence; scalable and competitively positioned.
7–8: Well-defined monetization strategy with some validation or market understanding.
5–6: Basic revenue approach but limited validation or market testing.
2–4: Vague, theoretical, or unvalidated revenue claims.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: ...
– Areas for Improvement: ...`,

  acquire_customers: `
ROLE: You are an expert startup evaluator for Young Founders Floor, assessing participant responses on customer acquisition strategies and growth planning.
OBJECTIVE: Ensure each participant demonstrates a systematic, evidence-based approach to acquiring and retaining customers. The response should show understanding of their target market's behavior, effective channels, and scalable acquisition methods.
INSTRUCTIONS:
Evaluate strictly based on the information in the participant's answer; do not add or assume facts from outside their submission.
The response is limited to 300 words; judge on strategy clarity, evidence, and actionability—not length.
EVALUATION CRITERIA:
Channel Strategy: Does the response identify specific, appropriate channels for reaching their target customers?
Evidence-Based Planning: Are acquisition strategies based on research, testing, or understanding of customer behavior?
Cost Effectiveness: Does the approach consider customer acquisition costs and lifetime value?
Scalability: Can the proposed acquisition methods scale as the business grows?
SCORING GUIDELINES (1–10):
9–10: Comprehensive, evidence-based acquisition strategy; multiple channels with clear rationale and scalability.
7–8: Solid acquisition approach with some evidence and clear channel selection.
5–6: Basic customer acquisition understanding but limited evidence or strategic depth.
2–4: Vague, generic acquisition claims without clear strategy or evidence.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: ...
– Areas for Improvement: ...`,

  team_roles: `
ROLE: You are an expert startup evaluator for Young Founders Floor, assessing participant responses on team composition and founder-market fit.
OBJECTIVE: Assess whether the founder or founding team has the relevant background, domain expertise, and unique advantages necessary for the successful execution of the business idea. Responses should illustrate clear role definitions, complementary skills, and demonstrated capability.
INSTRUCTIONS:
Strictly use the text provided by the applicant; do not supplement with external information.
The response is limited to 300 words; focus on team strength evidence and role clarity.
EVALUATION CRITERIA:
Relevant Experience: Does the team have direct experience in the industry, market, or technology domain?
Domain Expertise: Are there team members with specific skills critical to the venture's success?
Unique Insights: Does the team demonstrate unique knowledge or advantages that competitors lack?
Passion/Commitment: Is there evidence of genuine commitment and understanding of the market/problem?
SCORING GUIDELINES (1–10):
9–10: Exceptional team with highly relevant experience, clear expertise, and unique advantages.
7–8: Strong team with relevant skills and good domain understanding.
5–6: Adequate team composition but may lack some critical skills or deep expertise.
2–4: Weak team composition; missing critical skills or domain knowledge.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: ...
– Areas for Improvement: ...`
};

/**
 * Comprehensive AI Scoring Service Class
 */
export class AIComprehensiveScoringService {
  private static readonly EVALUATION_VERSION = '1.0';
  private static readonly MODEL_NAME = 'gpt-4o-mini';
  
  /**
   * Main evaluation method - processes entire application
   * Enhanced with better error handling and monitoring for background jobs
   */
  static async evaluateApplication(applicationId: string): Promise<AIEvaluationResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Starting comprehensive evaluation for application: ${applicationId}`);
      
      // Validate application ID format first
      if (!applicationId || typeof applicationId !== 'string' || applicationId.trim().length === 0) {
        throw new Error(`Invalid application ID provided: ${applicationId}`);
      }
      
      // Update status to processing with timestamp
      await this.updateEvaluationStatus(applicationId, 'processing');
      
      // Fetch application data with enhanced validation
      const application = await this.fetchApplicationData(applicationId);
      if (!application) {
        // Try to find application with different ID format or log available applications
        await this.logAvailableApplications(applicationId);
        throw new Error(`Application not found: ${applicationId}. Please verify the application exists and you have permission to access it.`);
      }
      
      // Validate application has answers
      if (!application.answers || typeof application.answers !== 'object') {
        throw new Error(`Application ${applicationId} has no valid answers to evaluate`);
      }
      
      // Parse answers with error handling
      const answers = parseApplicationAnswers(application.answers);
      const answerCount = Object.keys(answers).length;
      
      if (answerCount === 0) {
        throw new Error(`Application ${applicationId} has no parseable answers`);
      }
      
      console.log(`📝 Parsed ${answerCount} answers for evaluation`);
      
      // Score each question with progress tracking
      const scoringResults = await this.scoreAllQuestions(answers, applicationId);
      
      if (scoringResults.length === 0) {
        throw new Error(`No questions were successfully scored for application ${applicationId}`);
      }
      
      // Calculate overall score
      const overallScore = this.calculateOverallScore(scoringResults);
      
      // Build comprehensive evaluation data
      const evaluationData = this.buildEvaluationData(scoringResults, overallScore);
      
      // Store results with atomic transaction
      await this.storeEvaluationResults(applicationId, evaluationData);
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ Comprehensive evaluation completed for ${applicationId} with score: ${overallScore} in ${processingTime}ms`);
      
      return {
        overall_score: overallScore,
        question_scores: this.convertToQuestionEvaluations(scoringResults),
        evaluation_completed_at: new Date().toISOString(),
        evaluation_status: 'completed'
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ Comprehensive evaluation failed for ${applicationId} after ${processingTime}ms:`, error);
      
      // Update status to failed with error details
      await this.updateEvaluationStatus(applicationId, 'failed');
      
      // Log detailed error for monitoring
      await this.logEvaluationError(applicationId, error.message, processingTime);
      
      throw error;
    }
  }
  
  /**
   * Score all questions with enhanced error handling and progress tracking
   */
  private static async scoreAllQuestions(
    answers: Record<string, any>, 
    applicationId: string
  ): Promise<QuestionScoringResult[]> {
    const scoringPromises: Promise<QuestionScoringResult>[] = [];
    const questionsToScore: string[] = [];
    
    // Build list of questions to score
    for (const [questionId, answer] of Object.entries(answers)) {
      if (typeof answer === 'string' && answer.trim().length >= 10) {
        const systemPrompt = SYSTEM_PROMPTS[questionId];
        if (systemPrompt) {
          console.log(`📋 Queuing question for scoring: ${questionId}`);
          questionsToScore.push(questionId);
          scoringPromises.push(this.scoreIndividualQuestion(questionId, answer, systemPrompt));
        } else {
          console.warn(`⚠️ No system prompt found for question: ${questionId}`);
        }
      } else {
        console.warn(`⚠️ Skipping question ${questionId}: invalid or too short answer`);
      }
    }
    
    if (questionsToScore.length === 0) {
      throw new Error('No valid questions found to score');
    }
    
    console.log(`🚀 Starting parallel scoring of ${questionsToScore.length} questions for ${applicationId}`);
    
    // Execute all scoring in parallel with enhanced error handling
    const results = await Promise.allSettled(scoringPromises);
    const successfulResults: QuestionScoringResult[] = [];
    const failedResults: string[] = [];
    
    results.forEach((result, index) => {
      const questionId = questionsToScore[index];
      
      if (result.status === 'fulfilled') {
        successfulResults.push(result.value);
        console.log(`✅ Successfully scored question: ${questionId} (score: ${result.value.score})`);
      } else {
        failedResults.push(questionId);
        console.error(`❌ Failed to score question ${questionId}:`, result.reason);
      }
    });
    
    // Log scoring summary
    console.log(`📊 Scoring summary for ${applicationId}: ${successfulResults.length} successful, ${failedResults.length} failed`);
    
    if (failedResults.length > 0) {
      console.warn(`⚠️ Failed questions: ${failedResults.join(', ')}`);
    }
    
    // Require at least 50% success rate
    const successRate = successfulResults.length / questionsToScore.length;
    if (successRate < 0.5) {
      throw new Error(`Too many scoring failures: ${failedResults.length}/${questionsToScore.length} questions failed (${Math.round((1 - successRate) * 100)}% failure rate)`);
    }
    
    return successfulResults;
  }
  
  /**
   * Score individual question with enhanced retry logic
   */
  private static async scoreIndividualQuestion(
    questionId: string, 
    answer: string, 
    systemPrompt: string,
    retryCount: number = 0
  ): Promise<QuestionScoringResult> {
    const maxRetries = 2;
    
    try {
      console.log(`🔍 Scoring question: ${questionId} (attempt ${retryCount + 1}/${maxRetries + 1})`);
      
      const { data, error } = await supabase.functions.invoke('ai-evaluation', {
        body: {
          systemPrompt: systemPrompt,
          userAnswer: answer,
          questionId: questionId // Add for better tracking
        }
      });
      
      if (error) {
        throw new Error(`AI evaluation API error: ${error.message}`);
      }
      
      if (!data?.evaluation) {
        throw new Error('No evaluation received from AI service');
      }
      
      // Parse the AI response with validation
      const parsedResult = this.parseAIResponse(data.evaluation, questionId);
      
      // Validate score range
      if (parsedResult.score < 0 || parsedResult.score > 10) {
        throw new Error(`Invalid score ${parsedResult.score} for question ${questionId} - must be between 0-10`);
      }
      
      return {
        questionId,
        score: parsedResult.score,
        strengths: parsedResult.strengths,
        areas_for_improvement: parsedResult.areas_for_improvement,
        raw_feedback: data.evaluation
      };
      
    } catch (error) {
      if (retryCount < maxRetries) {
        console.warn(`⚠️ Retrying question ${questionId} due to error: ${error.message}`);
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.scoreIndividualQuestion(questionId, answer, systemPrompt, retryCount + 1);
      }
      
      console.error(`❌ Final failure scoring question ${questionId} after ${retryCount + 1} attempts:`, error);
      
      // Return fallback result with error details
      return {
        questionId,
        score: 0,
        strengths: [],
        areas_for_improvement: [`Evaluation failed: ${error.message}`],
        raw_feedback: `Error after ${retryCount + 1} attempts: ${error.message}`
      };
    }
  }
  
  /**
   * Parse AI response with enhanced validation and error context
   */
  private static parseAIResponse(aiResponse: string, questionId?: string): {
    score: number;
    strengths: string[];
    areas_for_improvement: string[];
  } {
    try {
      if (!aiResponse || typeof aiResponse !== 'string') {
        throw new Error('AI response is empty or invalid');
      }
      
      // Extract score with better regex
      const scoreMatch = aiResponse.match(/SCORE:\s*(\d+(?:\.\d+)?)/i);
      if (!scoreMatch) {
        throw new Error('No score found in AI response');
      }
      
      const score = parseFloat(scoreMatch[1]);
      if (isNaN(score)) {
        throw new Error(`Invalid score format: ${scoreMatch[1]}`);
      }
      
      // Extract strengths with better pattern matching
      const strengthsMatch = aiResponse.match(/–\s*Strengths:\s*(.*?)(?=–\s*Areas for Improvement:|$)/is);
      const strengthsText = strengthsMatch ? strengthsMatch[1].trim() : '';
      const strengths = strengthsText ? [strengthsText.replace(/\n\s*-\s*/g, ' ').trim()] : [];
      
      // Extract areas for improvement
      const improvementsMatch = aiResponse.match(/–\s*Areas for Improvement:\s*(.*?)$/is);
      const improvementsText = improvementsMatch ? improvementsMatch[1].trim() : '';
      const areas_for_improvement = improvementsText ? [improvementsText.replace(/\n\s*-\s*/g, ' ').trim()] : [];
      
      // Validate we have some feedback
      if (strengths.length === 0 && areas_for_improvement.length === 0) {
        console.warn(`⚠️ No feedback extracted for question ${questionId || 'unknown'}`);
      }
      
      return {
        score: Math.max(0, Math.min(10, score)), // Ensure score is between 0-10
        strengths,
        areas_for_improvement
      };
      
    } catch (error) {
      const context = questionId ? ` for question ${questionId}` : '';
      console.error(`❌ Failed to parse AI response${context}:`, error);
      console.error('Raw AI response:', aiResponse?.substring(0, 500) + '...');
      
      return {
        score: 0,
        strengths: [],
        areas_for_improvement: [`Failed to parse AI feedback: ${error.message}`]
      };
    }
  }
  
  /**
   * Calculate overall score from individual question scores
   */
  private static calculateOverallScore(results: QuestionScoringResult[]): number {
    if (results.length === 0) return 0;
    
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    const averageScore = totalScore / results.length;
    
    return Math.round(averageScore * 10) / 10; // Round to 1 decimal place
  }
  
  /**
   * Build comprehensive evaluation data structure
   */
  private static buildEvaluationData(
    results: QuestionScoringResult[], 
    overallScore: number
  ): EvaluationData {
    const scores: Record<string, any> = {};
    
    results.forEach(result => {
      scores[result.questionId] = {
        score: result.score,
        strengths: result.strengths,
        areas_for_improvement: result.areas_for_improvement,
        raw_feedback: result.raw_feedback
      };
    });
    
    return {
      scores,
      average_score: overallScore,
      evaluation_completed_at: new Date().toISOString(),
      evaluation_status: 'completed',
      evaluation_metadata: {
        total_questions: Object.keys(SYSTEM_PROMPTS).length,
        questions_scored: results.length,
        model_used: this.MODEL_NAME,
        evaluation_version: this.EVALUATION_VERSION
      }
    } as EvaluationData;
  }
  
  /**
   * Store evaluation results in database
   */
  private static async storeEvaluationResults(
    applicationId: string, 
    evaluationData: EvaluationData
  ): Promise<void> {
    const { error: updateError } = await supabase
      .from('yff_applications')
      .update({
        evaluation_data: evaluationData,
        overall_score: evaluationData.average_score,
        evaluation_status: 'completed',
        evaluation_completed_at: evaluationData.evaluation_completed_at,
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId);
    
    if (updateError) {
      throw new Error(`Failed to store evaluation results: ${updateError.message}`);
    }
    
    // Also create evaluation record
    const { error: insertError } = await supabase
      .from('yff_evaluations')
      .insert({
        application_id: applicationId,
        overall_score: evaluationData.average_score,
        question_scores: evaluationData.scores,
        evaluation_completed_at: evaluationData.evaluation_completed_at,
        evaluation_metadata: evaluationData.evaluation_metadata
      });
    
    if (insertError) {
      console.warn('Failed to create evaluation record:', insertError);
      // Don't throw here as main update succeeded
    }
  }
  
  /**
   * Fetch application data from database with enhanced validation
   */
  private static async fetchApplicationData(applicationId: string): Promise<ExtendedYffApplication | null> {
    console.log(`🔍 Fetching application data for ID: ${applicationId}`);
    
    const { data, error } = await supabase
      .from('yff_applications')
      .select('*')
      .eq('application_id', applicationId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid error on no data
    
    if (error) {
      console.error('❌ Failed to fetch application:', error);
      throw new Error(`Database error fetching application: ${error.message}`);
    }
    
    if (!data) {
      console.warn(`⚠️ No application found with ID: ${applicationId}`);
      return null;
    }
    
    console.log(`✅ Successfully fetched application: ${applicationId}`);
    
    // Safely handle evaluation_data type conversion
    const safeData = {
      ...data,
      evaluation_data: ensureEvaluationDataIsObject(data.evaluation_data)
    } as ExtendedYffApplication;
    
    return safeData;
  }

  /**
   * Log available applications for debugging when application not found
   */
  private static async logAvailableApplications(searchId: string): Promise<void> {
    try {
      console.log(`🔍 Searching for applications similar to: ${searchId}`);
      
      const { data, error } = await supabase
        .from('yff_applications')
        .select('application_id, status, created_at')
        .limit(10);
      
      if (error) {
        console.error('❌ Failed to fetch available applications:', error);
        return;
      }
      
      if (data && data.length > 0) {
        console.log(`📋 Found ${data.length} available applications:`);
        data.forEach((app, index) => {
          console.log(`  ${index + 1}. ID: ${app.application_id} | Status: ${app.status} | Created: ${app.created_at}`);
        });
      } else {
        console.warn('⚠️ No applications found in the database');
      }
    } catch (error) {
      console.error('❌ Error logging available applications:', error);
    }
  }
  
  /**
   * Update evaluation status
   */
  private static async updateEvaluationStatus(
    applicationId: string, 
    status: 'pending' | 'processing' | 'completed' | 'failed'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('yff_applications')
        .update({ 
          evaluation_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('application_id', applicationId);
      
      if (error) {
        console.error(`❌ Failed to update evaluation status to ${status}:`, error);
      } else {
        console.log(`✅ Updated evaluation status to ${status} for application: ${applicationId}`);
      }
    } catch (error) {
      console.error(`❌ Error updating evaluation status:`, error);
    }
  }
  
  /**
   * Convert scoring results to question evaluations format
   */
  private static convertToQuestionEvaluations(
    results: QuestionScoringResult[]
  ): Record<string, { score: number; strengths: string[]; improvements: string[] }> {
    const questionEvaluations: Record<string, any> = {};
    
    results.forEach(result => {
      questionEvaluations[result.questionId] = {
        score: result.score,
        strengths: result.strengths,
        improvements: result.areas_for_improvement
      };
    });
    
    return questionEvaluations;
  }
  
  /**
   * Log evaluation error for monitoring
   */
  private static async logEvaluationError(
    applicationId: string, 
    error: string, 
    processingTimeMs: number
  ): Promise<void> {
    console.error(`🚨 EVALUATION ERROR LOG:`, {
      applicationId,
      error,
      processingTimeMs,
      timestamp: new Date().toISOString(),
      service: 'AI Comprehensive Scoring'
    });
    
    // In production, this would send to error tracking service
  }
  
  /**
   * API endpoint: Trigger evaluation for specific application
   */
  static async triggerEvaluation(applicationId: string): Promise<{
    success: boolean;
    message: string;
    result?: AIEvaluationResult;
  }> {
    try {
      const result = await this.evaluateApplication(applicationId);
      
      return {
        success: true,
        message: `Evaluation completed successfully with score: ${result.overall_score}/10`,
        result
      };
      
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Evaluation failed'
      };
    }
  }
}

/**
 * Helper function to get available system prompts
 */
export const getAvailablePrompts = (): string[] => {
  return Object.keys(SYSTEM_PROMPTS);
};

/**
 * Helper function to get system prompt by question ID
 */
export const getSystemPromptById = (questionId: string): string | null => {
  return SYSTEM_PROMPTS[questionId] || null;
};
