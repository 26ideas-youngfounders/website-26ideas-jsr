
/**
 * @fileoverview Unified Questionnaire Parser
 * 
 * Uses the unified stage detection system to parse questionnaire answers
 * with zero cross-stage contamination and robust error handling.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { ExtendedYffApplication } from '@/types/yff-application';
import { 
  detectUnifiedStage, 
  getQuestionsForUnifiedStage, 
  UnifiedStage,
  StageQuestion 
} from './unified-stage-detector';

export interface UnifiedQuestionAnswer {
  questionId: string;
  questionText: string;
  userAnswer: string;
  hasAnswer: boolean;
  stage: UnifiedStage;
  orderNumber: number;
  aiScore?: number;
  aiStrengths?: string[];
  aiImprovements?: string[];
  aiRawFeedback?: string;
}

export interface UnifiedQuestionnaireResult {
  detectedStage: UnifiedStage | null;
  questions: UnifiedQuestionAnswer[];
  totalQuestions: number;
  answeredQuestions: number;
  stageDetectionInfo: {
    rawStageValue: string | undefined;
    detectionSource: string;
    warnings: string[];
  };
  rawAnswerData: Record<string, any>;
  rawEvaluationData: Record<string, any>;
}

/**
 * Check if answer value is valid and non-empty
 */
const isValidAnswer = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed !== '' && trimmed !== 'undefined' && trimmed !== 'null' && trimmed !== 'N/A';
  }
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
};

/**
 * Extract clean answer text from any data structure
 */
const extractAnswerText = (value: any): string => {
  if (value === null || value === undefined) return 'Not provided';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || 'Not provided';
  }
  if (Array.isArray(value)) {
    const filtered = value.filter(item => item !== null && item !== undefined);
    return filtered.length > 0 ? filtered.join(', ') : 'Not provided';
  }
  if (typeof value === 'object') {
    if ('value' in value) return extractAnswerText(value.value);
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

/**
 * Extract answer data from application with multiple fallback paths
 */
const extractAnswerData = (application: ExtendedYffApplication): Record<string, any> => {
  console.log('📊 EXTRACTING UNIFIED ANSWER DATA for application:', application.application_id);
  
  // Priority 1: answers.questionnaire_answers
  const answersQuestionnaireData = (application.answers as any)?.questionnaire_answers;
  if (answersQuestionnaireData && typeof answersQuestionnaireData === 'object') {
    console.log('✅ USING answers.questionnaire_answers with keys:', Object.keys(answersQuestionnaireData));
    return answersQuestionnaireData;
  }
  
  // Priority 2: yff_team_registrations.questionnaire_answers
  const registrationQuestionnaireData = application.yff_team_registrations?.questionnaire_answers;
  if (registrationQuestionnaireData && typeof registrationQuestionnaireData === 'object') {
    console.log('✅ USING yff_team_registrations.questionnaire_answers with keys:', Object.keys(registrationQuestionnaireData));
    return registrationQuestionnaireData;
  }
  
  // Priority 3: Direct questionnaire_answers
  const directQuestionnaireData = (application as any)?.questionnaire_answers;
  if (directQuestionnaireData && typeof directQuestionnaireData === 'object') {
    console.log('✅ USING direct questionnaire_answers with keys:', Object.keys(directQuestionnaireData));
    return directQuestionnaireData;
  }
  
  console.log('❌ NO QUESTIONNAIRE ANSWERS FOUND');
  return {};
};

/**
 * Extract evaluation data from application
 */
const extractEvaluationData = (application: ExtendedYffApplication): Record<string, any> => {
  console.log('🤖 EXTRACTING UNIFIED EVALUATION DATA for application:', application.application_id);
  
  try {
    const evaluationData = application.evaluation_data;
    if (!evaluationData || typeof evaluationData !== 'object') {
      console.log('❌ NO EVALUATION DATA FOUND');
      return {};
    }
    
    const scores = (evaluationData as any).scores;
    if (!scores || typeof scores !== 'object') {
      console.log('❌ NO SCORES FOUND IN EVALUATION DATA');
      return {};
    }
    
    console.log('✅ FOUND EVALUATION SCORES with keys:', Object.keys(scores));
    return scores;
  } catch (error) {
    console.error('❌ Error extracting evaluation data:', error);
    return {};
  }
};

/**
 * Get AI evaluation for a specific question ID
 */
const getAIEvaluation = (questionId: string, evaluationScores: Record<string, any>): {
  aiScore?: number;
  aiStrengths?: string[];
  aiImprovements?: string[];
  aiRawFeedback?: string;
} => {
  // Try exact match first
  let evaluation = evaluationScores[questionId];
  
  if (!evaluation) {
    // Try with original_question_id mapping
    for (const [key, value] of Object.entries(evaluationScores)) {
      if (typeof value === 'object' && value.original_question_id === questionId) {
        evaluation = value;
        console.log(`🎯 FOUND AI EVALUATION for ${questionId} via original_question_id mapping`);
        break;
      }
    }
  } else {
    console.log(`🎯 FOUND AI EVALUATION for ${questionId} via direct key match`);
  }
  
  if (!evaluation) {
    console.log(`❓ NO AI EVALUATION found for ${questionId}`);
    return {};
  }
  
  return {
    aiScore: evaluation.score,
    aiStrengths: evaluation.strengths,
    aiImprovements: evaluation.areas_for_improvement || evaluation.improvements,
    aiRawFeedback: evaluation.raw_feedback
  };
};

/**
 * Main unified questionnaire parser
 */
export const parseUnifiedQuestionnaire = (application: ExtendedYffApplication): UnifiedQuestionnaireResult => {
  console.log('🚀 STARTING UNIFIED QUESTIONNAIRE PARSING for:', application.application_id);
  
  // Step 1: Use unified stage detection
  const stageDetection = detectUnifiedStage(application);
  const { stage: detectedStage, rawStageValue, detectionSource, warnings } = stageDetection;
  
  if (!detectedStage) {
    console.log('❌ NO STAGE DETECTED - cannot proceed with questionnaire parsing');
    return {
      detectedStage: null,
      questions: [],
      totalQuestions: 0,
      answeredQuestions: 0,
      stageDetectionInfo: { rawStageValue, detectionSource, warnings },
      rawAnswerData: {},
      rawEvaluationData: {}
    };
  }
  
  console.log('✅ UNIFIED STAGE DETECTED:', detectedStage);
  
  // Step 2: Get stage-specific questions using unified system
  const stageQuestions = getQuestionsForUnifiedStage(detectedStage);
  console.log('📋 UNIFIED STAGE QUESTIONS:', stageQuestions.length, 'questions for', detectedStage);
  
  // Step 3: Extract data
  const rawAnswerData = extractAnswerData(application);
  const rawEvaluationData = extractEvaluationData(application);
  
  // Step 4: Process each question for the detected stage
  const questions: UnifiedQuestionAnswer[] = [];
  let answeredCount = 0;
  
  for (const stageQuestion of stageQuestions) {
    const rawAnswer = rawAnswerData[stageQuestion.id];
    const hasAnswer = isValidAnswer(rawAnswer);
    const userAnswer = hasAnswer ? extractAnswerText(rawAnswer) : 'Not provided';
    
    if (hasAnswer) {
      answeredCount++;
      console.log(`✅ UNIFIED QUESTION ${stageQuestion.id}: HAS ANSWER`);
    } else {
      console.log(`❌ UNIFIED QUESTION ${stageQuestion.id}: NO ANSWER`);
    }
    
    // Get AI evaluation for this question
    const aiEvaluation = getAIEvaluation(stageQuestion.id, rawEvaluationData);
    
    questions.push({
      questionId: stageQuestion.id,
      questionText: stageQuestion.label,
      userAnswer,
      hasAnswer,
      stage: detectedStage,
      orderNumber: stageQuestion.order,
      ...aiEvaluation
    });
  }
  
  console.log('🎉 UNIFIED PARSING COMPLETE:', {
    detectedStage,
    totalQuestions: questions.length,
    answeredQuestions: answeredCount,
    warningCount: warnings.length
  });
  
  return {
    detectedStage,
    questions,
    totalQuestions: questions.length,
    answeredQuestions: answeredCount,
    stageDetectionInfo: { rawStageValue, detectionSource, warnings },
    rawAnswerData,
    rawEvaluationData
  };
};
