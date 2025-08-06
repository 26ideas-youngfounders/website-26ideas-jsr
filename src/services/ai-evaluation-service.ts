
/**
 * @fileoverview AI Evaluation Service
 * 
 * Provides comprehensive AI evaluation functionality for YFF applications
 * with automatic scoring on submission and detailed question-by-question analysis.
 * 
 * @version 2.0.0
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';
import { AIComprehensiveScoringService, type QuestionScore } from './ai-comprehensive-scoring-service';

export interface QuestionEvaluation {
  score: number;
  strengths: string[];
  improvements: string[];
  raw_feedback?: string;
}

export interface EvaluationResult {
  overall_score: number;
  question_scores: Record<string, QuestionEvaluation>;
  evaluation_completed_at: string;
  evaluation_status: string;
  idea_summary?: string;
}

/**
 * Convert QuestionScore to QuestionEvaluation format
 */
const convertQuestionScore = (questionScore: QuestionScore): QuestionEvaluation => ({
  score: questionScore.score,
  strengths: questionScore.strengths,
  improvements: questionScore.areas_for_improvement, // Map areas_for_improvement to improvements
  raw_feedback: questionScore.raw_feedback
});

/**
 * Evaluate application using comprehensive AI scoring
 */
export const evaluateApplication = async (applicationId: string): Promise<EvaluationResult> => {
  console.log(`🚀 Starting AI evaluation for application: ${applicationId}`);
  
  try {
    // Set status to processing at start
    await supabase
      .from('yff_applications')
      .update({ 
        evaluation_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId);

    // Use the comprehensive scoring service
    const result = await AIComprehensiveScoringService.evaluateApplication(applicationId);
    
    // Convert question scores to match our interface
    const questionScores: Record<string, QuestionEvaluation> = {};
    Object.entries(result.question_scores).forEach(([key, score]) => {
      questionScores[key] = convertQuestionScore(score);
    });

    // Update status to completed after successful evaluation
    const { error: updateError } = await supabase
      .from('yff_applications')
      .update({
        evaluation_status: 'completed',
        evaluation_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId);

    if (updateError) {
      console.error(`❌ Failed to update evaluation status to completed:`, updateError);
    } else {
      console.log(`✅ Evaluation status updated to completed for ${applicationId}`);
    }
    
    console.log(`✅ AI evaluation completed for ${applicationId} with score: ${result.overall_score}`);
    
    return {
      overall_score: result.overall_score,
      question_scores: questionScores,
      evaluation_completed_at: result.evaluation_completed_at,
      evaluation_status: 'completed', // Ensure we return completed status
      idea_summary: result.idea_summary
    };
    
  } catch (error) {
    console.error(`❌ AI evaluation failed for ${applicationId}:`, error);
    
    // Update status to failed on error
    await supabase
      .from('yff_applications')
      .update({
        evaluation_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId);
    
    throw new Error(`AI evaluation failed: ${error.message}`);
  }
};

/**
 * Re-evaluate application (same as evaluate but with different messaging)
 */
export const reEvaluateApplication = async (applicationId: string): Promise<EvaluationResult> => {
  console.log(`🔄 Starting AI re-evaluation for application: ${applicationId}`);
  return evaluateApplication(applicationId);
};

/**
 * Get existing evaluation data for an application
 */
export const getApplicationEvaluation = async (applicationId: string): Promise<EvaluationResult | null> => {
  try {
    console.log(`🔍 Fetching evaluation for application: ${applicationId}`);
    
    const { data, error } = await supabase
      .from('yff_applications')
      .select('evaluation_data, overall_score, evaluation_completed_at, evaluation_status')
      .eq('application_id', applicationId)
      .single();

    if (error) {
      console.error('❌ Failed to fetch evaluation:', error);
      throw error;
    }

    if (!data || !data.evaluation_data) {
      console.log(`⚠️ No evaluation data found for application: ${applicationId}`);
      return null;
    }

    // Parse evaluation data safely
    let evaluationData;
    if (typeof data.evaluation_data === 'string') {
      try {
        evaluationData = JSON.parse(data.evaluation_data);
      } catch (parseError) {
        console.error('❌ Failed to parse evaluation data:', parseError);
        return null;
      }
    } else {
      evaluationData = data.evaluation_data;
    }

    // Transform the data to match our interface
    const questionScores: Record<string, QuestionEvaluation> = {};
    
    if (evaluationData.scores && typeof evaluationData.scores === 'object') {
      Object.entries(evaluationData.scores).forEach(([questionId, scoreData]: [string, any]) => {
        if (scoreData && typeof scoreData === 'object') {
          questionScores[questionId] = {
            score: scoreData.score || 0,
            strengths: Array.isArray(scoreData.strengths) ? scoreData.strengths : [],
            improvements: Array.isArray(scoreData.areas_for_improvement) ? scoreData.areas_for_improvement : [],
            raw_feedback: scoreData.raw_feedback
          };
        }
      });
    }

    const result: EvaluationResult = {
      overall_score: data.overall_score || evaluationData.average_score || 0,
      question_scores: questionScores,
      evaluation_completed_at: data.evaluation_completed_at || evaluationData.evaluation_completed_at,
      evaluation_status: data.evaluation_status || evaluationData.evaluation_status || 'completed',
      idea_summary: evaluationData.idea_summary
    };

    console.log(`✅ Retrieved evaluation for ${applicationId}:`, {
      score: result.overall_score,
      questionsCount: Object.keys(result.question_scores).length
    });

    return result;

  } catch (error) {
    console.error(`❌ Error fetching evaluation for ${applicationId}:`, error);
    return null;
  }
};

/**
 * Trigger automatic evaluation on application submission
 */
export const triggerEvaluationOnSubmission = async (applicationId: string): Promise<void> => {
  try {
    console.log(`🎯 Triggering automatic evaluation for new submission: ${applicationId}`);
    
    // Start evaluation in background (don't await to avoid blocking submission)
    evaluateApplication(applicationId).catch(error => {
      console.error(`❌ Background evaluation failed for ${applicationId}:`, error);
    });
    
    console.log(`✅ Background evaluation triggered for: ${applicationId}`);
    
  } catch (error) {
    console.error(`❌ Failed to trigger evaluation for ${applicationId}:`, error);
    // Don't throw here - we don't want to block the submission process
  }
};
