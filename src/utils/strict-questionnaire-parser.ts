
/**
 * @fileoverview Strict Questionnaire Parser
 * 
 * Implements zero cross-stage contamination questionnaire parsing
 * with authoritative stage detection and strict answer mapping.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { ExtendedYffApplication } from '@/types/yff-application';
import {
  AuthoritativeStage,
  getApplicationStage,
  getStageQuestions,
  getStageDisplayName,
  getStageColor,
  validateNoStageMixing
} from './stage-detection-service';

export interface StrictQuestionnaireQuestion {
  questionKey: string;
  questionText: string;
  userAnswer: string;
  hasAnswer: boolean;
  stage: AuthoritativeStage;
  orderIndex: number;
  aiScore?: number;
  aiStrengths?: string[];
  aiImprovements?: string[];
  aiRawFeedback?: string;
}

export interface StrictQuestionnaireResult {
  detectedStage: AuthoritativeStage | null;
  questions: StrictQuestionnaireQuestion[];
  totalQuestions: number;
  answeredQuestions: number;
  stageValidation: {
    isValid: boolean;
    violations: string[];
  };
  detectionInfo: {
    rawProductStage: string | undefined;
    detectionMethod: string;
    warnings: string[];
  };
  rawAnswerData: Record<string, any>;
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
 * Extract answer data from application with strict priority
 */
const extractAnswerData = (application: ExtendedYffApplication): Record<string, any> => {
  console.log('📊 EXTRACTING ANSWER DATA for application:', application.application_id);
  
  // Strict priority: questionnaire_answers only
  const questionnaireAnswers = application.yff_team_registrations?.questionnaire_answers;
  
  if (questionnaireAnswers && typeof questionnaireAnswers === 'object') {
    console.log('✅ USING questionnaire_answers with keys:', Object.keys(questionnaireAnswers));
    return questionnaireAnswers;
  }
  
  console.log('❌ NO questionnaire_answers FOUND');
  return {};
};

/**
 * Parse evaluation data for AI scoring with strict key matching
 */
const parseEvaluationData = (application: ExtendedYffApplication, questionKey: string, stage: AuthoritativeStage): {
  aiScore?: number;
  aiStrengths?: string[];
  aiImprovements?: string[];
  aiRawFeedback?: string;
} => {
  try {
    const evaluationData = application.evaluation_data;
    if (!evaluationData || typeof evaluationData !== 'object') {
      return {};
    }
    
    const scores = (evaluationData as any).scores;
    if (!scores || typeof scores !== 'object') {
      return {};
    }
    
    // Try exact key match first
    let evaluation = scores[questionKey];
    
    if (!evaluation) {
      console.log(`❓ NO AI EVALUATION found for exact key: ${questionKey}`);
      return {};
    }
    
    console.log(`🎯 FOUND AI EVALUATION for ${questionKey}`);
    
    return {
      aiScore: evaluation.score,
      aiStrengths: evaluation.strengths,
      aiImprovements: evaluation.areas_for_improvement || evaluation.improvements,
      aiRawFeedback: evaluation.raw_feedback
    };
  } catch (error) {
    console.error('❌ Error parsing evaluation data:', error);
    return {};
  }
};

/**
 * Main strict questionnaire parser - zero cross-stage contamination
 */
export const parseStrictQuestionnaire = (application: ExtendedYffApplication): StrictQuestionnaireResult => {
  console.log('🚀 STARTING STRICT QUESTIONNAIRE PARSING for:', application.application_id);
  
  // Step 1: Authoritative stage detection
  const stageDetection = getApplicationStage(application);
  const { stage: detectedStage, rawProductStage, detectionMethod, warnings } = stageDetection;
  
  if (!detectedStage) {
    console.log('❌ NO STAGE DETECTED - cannot proceed with questionnaire parsing');
    return {
      detectedStage: null,
      questions: [],
      totalQuestions: 0,
      answeredQuestions: 0,
      stageValidation: { isValid: false, violations: ['No stage could be detected'] },
      detectionInfo: { rawProductStage, detectionMethod, warnings },
      rawAnswerData: {}
    };
  }
  
  console.log('✅ DETECTED STAGE:', detectedStage);
  
  // Step 2: Get strict question set for this stage only
  const stageQuestions = getStageQuestions(detectedStage);
  const questionKeys = Object.keys(stageQuestions);
  
  console.log('📋 STAGE QUESTIONS:', questionKeys.length, 'questions for', detectedStage);
  
  // Step 3: Extract answer data
  const rawAnswerData = extractAnswerData(application);
  const availableAnswerKeys = Object.keys(rawAnswerData);
  
  console.log('🔑 AVAILABLE ANSWER KEYS:', availableAnswerKeys);
  
  // Step 4: Validate no cross-stage contamination
  const stageValidation = validateNoStageMixing(detectedStage, availableAnswerKeys);
  if (!stageValidation.isValid) {
    console.warn('⚠️ STAGE VALIDATION VIOLATIONS:', stageValidation.violations);
  }
  
  // Step 5: Process questions strictly for this stage
  const questions: StrictQuestionnaireQuestion[] = [];
  let answeredCount = 0;
  
  questionKeys.forEach((questionKey, index) => {
    const questionText = stageQuestions[questionKey];
    const rawAnswer = rawAnswerData[questionKey];
    const hasAnswer = isValidAnswer(rawAnswer);
    const userAnswer = extractAnswerText(rawAnswer);
    
    if (hasAnswer) {
      answeredCount++;
      console.log(`✅ QUESTION ${questionKey}: HAS ANSWER`);
    } else {
      console.log(`❌ QUESTION ${questionKey}: NO ANSWER`);
    }
    
    // Get AI evaluation for this exact question key
    const aiEvaluation = parseEvaluationData(application, questionKey, detectedStage);
    
    questions.push({
      questionKey,
      questionText,
      userAnswer,
      hasAnswer,
      stage: detectedStage,
      orderIndex: index,
      ...aiEvaluation
    });
  });
  
  console.log('🎉 STRICT PARSING COMPLETE:', {
    detectedStage,
    totalQuestions: questions.length,
    answeredQuestions: answeredCount,
    validationIssues: stageValidation.violations.length
  });
  
  return {
    detectedStage,
    questions,
    totalQuestions: questions.length,
    answeredQuestions: answeredCount,
    stageValidation,
    detectionInfo: { rawProductStage, detectionMethod, warnings },
    rawAnswerData
  };
};
