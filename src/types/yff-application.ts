
/**
 * @fileoverview YFF Application Types and Conversion Utilities
 * 
 * Handles conversion between form data formats and database storage
 */

import { YffFormData } from './yff-form';

/**
 * Interface for YFF Application stored in database
 */
export interface YffApplication {
  application_id: string;
  individual_id: string;
  answers: Record<string, any>;
  status: 'draft' | 'submitted' | 'reviewed' | 'accepted' | 'rejected';
  evaluation_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Extended YFF Application with additional fields for evaluation
 */
export interface ExtendedYffApplication extends YffApplication {
  overall_score?: number;
  evaluation_data?: EvaluationData | Record<string, any>;
  evaluation_completed_at?: string;
  individuals?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  yff_team_registrations?: any[];
}

/**
 * YFF Application with individual data for admin views
 */
export interface YffApplicationWithIndividual extends YffApplication {
  overall_score?: number;
  evaluation_data?: EvaluationData | Record<string, any>;
  evaluation_completed_at?: string;
  individuals?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

/**
 * Question evaluation result interface
 */
export interface QuestionEvaluation {
  score: number;
  strengths: string[];
  improvements: string[];
  questionText?: string;
  userAnswer?: string;
  raw_feedback?: string;
}

/**
 * Question scoring result for AI evaluation
 */
export interface QuestionScoringResult {
  questionId: string;
  originalQuestionId?: string;
  questionText: string;
  score: number;
  strengths: string[];
  areas_for_improvement: string[];
  raw_feedback: string;
  userAnswer: string;
}

/**
 * AI Evaluation result interface
 */
export interface AIEvaluationResult {
  overall_score: number;
  question_scores: Record<string, QuestionEvaluation>;
  idea_summary?: string;
  evaluation_completed_at: string;
  evaluation_status: 'completed' | 'failed';
}

/**
 * Evaluation data structure for database storage
 */
export interface EvaluationData {
  scores: Record<string, {
    score: number;
    strengths: string[];
    areas_for_improvement: string[];
    raw_feedback: string;
    question_text: string;
    user_answer: string;
    original_question_id?: string;
  }>;
  average_score: number;
  evaluation_completed_at: string;
  evaluation_status: string;
  evaluation_metadata?: {
    total_questions: number;
    questions_scored: number;
    model_used: string;
    evaluation_version: string;
  };
}

/**
 * Parse application answers from various formats
 */
export const parseApplicationAnswers = (answers: any): Record<string, any> => {
  console.log('🔍 Parsing application answers:', {
    type: typeof answers,
    isString: typeof answers === 'string',
    hasData: Boolean(answers)
  });

  if (!answers) {
    console.warn('⚠️ No answers provided to parseApplicationAnswers');
    return {};
  }

  if (typeof answers === 'string') {
    try {
      const parsed = JSON.parse(answers);
      console.log('✅ Successfully parsed JSON answers');
      return parsed || {};
    } catch (error) {
      console.error('❌ Failed to parse JSON answers:', error);
      return {};
    }
  }

  if (typeof answers === 'object' && answers !== null) {
    console.log('✅ Answers already in object format');
    return answers;
  }

  console.warn('⚠️ Unexpected answers format:', typeof answers);
  return {};
};

/**
 * Parse evaluation data ensuring it's in proper format
 */
export const parseEvaluationData = (evaluationData: any): EvaluationData => {
  console.log('🔍 Parsing evaluation data:', {
    type: typeof evaluationData,
    hasData: Boolean(evaluationData)
  });

  if (!evaluationData) {
    return {
      scores: {},
      average_score: 0,
      evaluation_completed_at: '',
      evaluation_status: 'pending'
    };
  }

  if (typeof evaluationData === 'string') {
    try {
      const parsed = JSON.parse(evaluationData);
      return parsed as EvaluationData;
    } catch (error) {
      console.error('❌ Failed to parse evaluation data JSON:', error);
      return {
        scores: {},
        average_score: 0,
        evaluation_completed_at: '',
        evaluation_status: 'failed'
      };
    }
  }

  if (typeof evaluationData === 'object' && evaluationData !== null) {
    return evaluationData as EvaluationData;
  }

  return {
    scores: {},
    average_score: 0,
    evaluation_completed_at: '',
    evaluation_status: 'pending'
  };
};

/**
 * Get ordered questions from evaluation scores
 */
export const getOrderedQuestions = (scores: Record<string, any>): Array<{ key: string; data: any }> => {
  const questionOrder = [
    'tell_us_about_idea',
    'problem_statement',
    'whose_problem',
    'how_solve_problem',
    'how_make_money',
    'acquire_customers',
    'early_revenue_acquiring_customers',
    'competitors',
    'product_development',
    'team_roles',
    'when_proceed'
  ];

  const orderedQuestions: Array<{ key: string; data: any }> = [];
  const remainingKeys = new Set(Object.keys(scores));

  // Add questions in defined order
  for (const questionId of questionOrder) {
    if (scores[questionId]) {
      orderedQuestions.push({
        key: questionId,
        data: scores[questionId]
      });
      remainingKeys.delete(questionId);
    }
  }

  // Add any remaining questions
  for (const key of remainingKeys) {
    orderedQuestions.push({
      key,
      data: scores[key]
    });
  }

  return orderedQuestions;
};

/**
 * Ensure evaluation data is an object format
 */
export const ensureEvaluationDataIsObject = (evaluationData: any): EvaluationData | Record<string, any> => {
  if (!evaluationData) {
    return {};
  }

  if (typeof evaluationData === 'string') {
    try {
      return JSON.parse(evaluationData);
    } catch (error) {
      console.error('❌ Failed to parse evaluation data as JSON:', error);
      return {};
    }
  }

  return evaluationData;
};

/**
 * Convert YffFormData to JSON format for database storage
 */
export const convertFormDataToJson = (formData: YffFormData): Record<string, any> => {
  console.log('🔄 Converting form data to JSON:', {
    hasFormData: Boolean(formData),
    hasAnswers: Boolean(formData?.answers),
    formDataKeys: formData ? Object.keys(formData) : 'none'
  });

  if (!formData) {
    console.warn('⚠️ No form data provided to convertFormDataToJson');
    return {};
  }

  if (!formData.answers) {
    console.warn('⚠️ No answers in form data');
    return {};
  }

  const answers = formData.answers;
  console.log('📋 Processing answers:', {
    answerKeys: Object.keys(answers),
    answerCount: Object.keys(answers).length
  });

  const result: Record<string, any> = {};

  // Convert each answer, handling different data types
  for (const [key, value] of Object.entries(answers)) {
    console.log(`📝 Processing answer [${key}]:`, {
      type: typeof value,
      value: value,
      isNull: value === null,
      isUndefined: value === undefined,
      isEmpty: value === ''
    });

    if (value === null || value === undefined) {
      console.log(`⚠️ Skipping null/undefined value for key: ${key}`);
      continue;
    }

    // Handle different value types
    if (typeof value === 'string') {
      if (value.trim() === '') {
        console.log(`⚠️ Skipping empty string for key: ${key}`);
        continue;
      }
      result[key] = value.trim();
    } else if (typeof value === 'object') {
      // Handle arrays and objects
      if (Array.isArray(value)) {
        if (value.length > 0) {
          result[key] = value;
        } else {
          console.log(`⚠️ Skipping empty array for key: ${key}`);
        }
      } else {
        // Handle objects (like team member data)
        const cleanedObject = cleanObject(value);
        if (Object.keys(cleanedObject).length > 0) {
          result[key] = cleanedObject;
        } else {
          console.log(`⚠️ Skipping empty object for key: ${key}`);
        }
      }
    } else {
      // Handle other types (numbers, booleans, etc.)
      result[key] = value;
    }
  }

  console.log('✅ Conversion complete:', {
    originalKeys: Object.keys(answers),
    resultKeys: Object.keys(result),
    resultCount: Object.keys(result).length
  });

  return result;
};

/**
 * Clean an object by removing null, undefined, and empty string values
 */
const cleanObject = (obj: any): Record<string, any> => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }

  const cleaned: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      const cleanedNested = cleanObject(value);
      if (Object.keys(cleanedNested).length > 0) {
        cleaned[key] = cleanedNested;
      }
    } else if (Array.isArray(value) && value.length > 0) {
      cleaned[key] = value;
    } else if (typeof value === 'string' && value.trim() !== '') {
      cleaned[key] = value.trim();
    } else if (typeof value !== 'string') {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
};

/**
 * Convert database JSON back to form data format
 */
export const convertJsonToFormData = (jsonData: Record<string, any>): Partial<YffFormData> => {
  console.log('🔄 Converting JSON to form data:', jsonData);
  
  return {
    answers: jsonData
  };
};
