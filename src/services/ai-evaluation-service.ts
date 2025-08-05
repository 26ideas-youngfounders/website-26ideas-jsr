
/**
 * @fileoverview AI Evaluation Service
 * 
 * Provides comprehensive AI evaluation functionality for YFF applications
 * with automatic scoring on submission and detailed question-by-question analysis.
 * Enhanced to handle both Idea and Early Revenue stages properly.
 * 
 * @version 2.1.0
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';
import { AIComprehensiveScoringService } from './ai-comprehensive-scoring-service';

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
 * Enhanced evaluation function with better stage detection
 */
export const evaluateApplication = async (applicationId: string): Promise<EvaluationResult> => {
  console.log(`🚀 Starting AI evaluation for application: ${applicationId}`);
  
  try {
    // Fetch application details to determine stage
    const { data: appData, error: fetchError } = await supabase
      .from('yff_applications')
      .select('application_round, answers')
      .eq('application_id', applicationId)
      .single();
    
    if (fetchError || !appData) {
      throw new Error(`Application not found: ${applicationId}`);
    }
    
    console.log('📊 Application data retrieved:', {
      applicationId,
      applicationRound: appData.application_round,
      hasAnswers: !!appData.answers
    });
    
    // Use the comprehensive scoring service
    const result = await AIComprehensiveScoringService.evaluateApplication(applicationId);
    
    console.log(`✅ AI evaluation completed for ${applicationId} with score: ${result.overall_score}`);
    
    return {
      overall_score: result.overall_score,
      question_scores: result.question_scores,
      evaluation_completed_at: result.evaluation_completed_at,
      evaluation_status: result.evaluation_status,
      idea_summary: result.idea_summary
    };
    
  } catch (error) {
    console.error(`❌ AI evaluation failed for ${applicationId}:`, error);
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
 * Enhanced evaluation data retrieval with better error handling
 */
export const getApplicationEvaluation = async (applicationId: string): Promise<EvaluationResult | null> => {
  try {
    console.log(`🔍 Fetching evaluation for application: ${applicationId}`);
    
    const { data, error } = await supabase
      .from('yff_applications')
      .select('evaluation_data, overall_score, evaluation_completed_at, evaluation_status, application_round, answers')
      .eq('application_id', applicationId)
      .single();

    if (error) {
      console.error('❌ Failed to fetch evaluation:', error);
      throw error;
    }

    if (!data) {
      console.log(`⚠️ No application data found for: ${applicationId}`);
      return null;
    }

    console.log('📊 Application data retrieved:', {
      hasEvaluationData: !!data.evaluation_data,
      overallScore: data.overall_score,
      evaluationStatus: data.evaluation_status,
      applicationRound: data.application_round
    });

    if (!data.evaluation_data) {
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

    console.log('📋 Parsed evaluation data:', evaluationData);

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
 * Trigger automatic evaluation on application submission with enhanced logging
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
