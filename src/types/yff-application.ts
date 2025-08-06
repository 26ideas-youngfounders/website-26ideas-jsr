/**
 * @fileoverview Unified YFF Application Types - Single Source of Truth
 * 
 * This file establishes a canonical type hierarchy for YFF applications,
 * preventing type mismatches by deriving all application types from the
 * base Supabase type definition.
 */

import { Database } from '@/integrations/supabase/types';
import type { YffFormData } from './yff-form';

// Define Json type to match Supabase's Json type structure
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

/**
 * SINGLE SOURCE OF TRUTH: Base YFF Application from Supabase
 * All other application types MUST derive from this canonical definition
 */
export type BaseYffApplication = Database['public']['Tables']['yff_applications']['Row'];
export type BaseYffApplicationInsert = Database['public']['Tables']['yff_applications']['Insert'];
export type BaseYffApplicationUpdate = Database['public']['Tables']['yff_applications']['Update'];

/**
 * Standardized individuals interface - consistent across all application types
 */
export interface YffApplicationIndividuals {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  country_code?: string;
  country_iso_code?: string;
}

/**
 * CANONICAL APPLICATION TYPE: Extended from Supabase base with additional fields
 * This is the primary type all components should use
 */
export interface YffApplication extends BaseYffApplication {
  created_at: string;
  updated_at: string;
  evaluation_status: string;
  overall_score: number;
  evaluation_completed_at?: string | null;
  evaluation_data: Record<string, any>;
  individuals?: YffApplicationIndividuals | null;
}

/**
 * DERIVED TYPE: For applications with guaranteed individual data
 */
export interface YffApplicationWithIndividual extends YffApplication {
  individuals: YffApplicationIndividuals;
}

/**
 * DERIVED TYPE: For dialog components - uses Pick to select only needed fields
 * This ensures type safety while only including required properties
 */
export interface DialogApplication extends Pick<YffApplication, 
  | 'application_id'
  | 'individual_id'
  | 'status'
  | 'application_round'
  | 'answers'
  | 'cumulative_score'
  | 'reviewer_scores'
  | 'submitted_at'
  | 'created_at'
  | 'updated_at'
  | 'evaluation_status'
  | 'overall_score'
  | 'evaluation_completed_at'
  | 'evaluation_data'
> {
  individuals?: YffApplicationIndividuals | null;
}

/**
 * DERIVED TYPE: For insert operations
 */
export interface YffApplicationInsert extends BaseYffApplicationInsert {
  created_at?: string;
  updated_at?: string;
  evaluation_status?: string;
  overall_score?: number;
  evaluation_completed_at?: string | null;
  evaluation_data?: Record<string, any>;
}

/**
 * DERIVED TYPE: For update operations
 */
export interface YffApplicationUpdate extends BaseYffApplicationUpdate {
  created_at?: string;
  updated_at?: string;
  evaluation_status?: string;
  overall_score?: number;
  evaluation_completed_at?: string | null;
  evaluation_data?: Record<string, any>;
}

/**
 * Type for parsed application answers
 */
export interface ParsedApplicationAnswers {
  questionnaire_answers?: Record<string, any>;
  team?: Record<string, any>;
  [key: string]: any;
}

/**
 * Safely parse application answers from Json type
 */
export const parseApplicationAnswers = (answers: any): ParsedApplicationAnswers => {
  if (typeof answers === 'string') {
    try {
      return JSON.parse(answers) as ParsedApplicationAnswers;
    } catch {
      return {};
    }
  }
  
  if (typeof answers === 'object' && answers !== null) {
    return answers as ParsedApplicationAnswers;
  }
  
  return {};
};

/**
 * Safely parse evaluation data from Json type
 */
export const parseEvaluationData = (data: any): Record<string, any> => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as Record<string, any>;
    } catch {
      return {};
    }
  }
  
  if (typeof data === 'object' && data !== null) {
    return data as Record<string, any>;
  }
  
  return {};
};

/**
 * Type-safe conversion from YffApplication to DialogApplication
 */
export const convertToDialogApplication = (app: YffApplication): DialogApplication => {
  return {
    application_id: app.application_id,
    individual_id: app.individual_id,
    status: app.status,
    application_round: app.application_round,
    answers: app.answers,
    cumulative_score: app.cumulative_score,
    reviewer_scores: app.reviewer_scores,
    submitted_at: app.submitted_at,
    created_at: app.created_at,
    updated_at: app.updated_at,
    evaluation_status: app.evaluation_status,
    overall_score: app.overall_score,
    evaluation_completed_at: app.evaluation_completed_at,
    evaluation_data: app.evaluation_data,
    individuals: app.individuals
  };
};

/**
 * Converts form data to JSON format compatible with Supabase
 * @param formData - The form data to convert
 * @returns JSON object compatible with Supabase Json type
 */
export const convertFormDataToJson = (formData: YffFormData): Record<string, any> => {
  return Object.fromEntries(
    Object.entries(formData).map(([key, value]) => [key, value])
  );
};

/**
 * Question evaluation interface for AI scoring - Enhanced version
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
 * AI evaluation result interface - structured scoring results
 */
export interface AIEvaluationResult {
  overall_score: number;
  question_scores: Record<string, QuestionEvaluation>;
  idea_summary?: string;
  evaluation_completed_at: string;
  evaluation_status: 'completed' | 'failed' | 'processing';
}

/**
 * Individual question scoring result from AI - Enhanced version
 */
export interface QuestionScoringResult {
  questionId: string;
  originalQuestionId?: string;
  questionText?: string;
  userAnswer?: string;
  score: number;
  strengths: string[];
  areas_for_improvement: string[];
  raw_feedback: string;
}

/**
 * Comprehensive evaluation data structure stored in database
 * Compatible with Supabase Json type
 */
export interface EvaluationData {
  [key: string]: Json; // Add index signature for Json compatibility
  scores: Record<string, {
    score: number;
    strengths: string[];
    areas_for_improvement: string[];
    raw_feedback: string;
    question_text?: string;
    user_answer?: string;
    original_question_id?: string;
  }>;
  average_score: number;
  evaluation_summary?: string;
  evaluation_completed_at: string;
  evaluation_status: 'pending' | 'processing' | 'completed' | 'failed';
  evaluation_metadata: {
    total_questions: number;
    questions_scored: number;
    model_used: string;
    evaluation_version: string;
  };
}

/**
 * System prompt mapping for different application stages
 */
export interface StagePromptMapping {
  [questionKey: string]: string;
}

/**
 * Application stage types
 */
export type ApplicationStage = 'idea' | 'early_revenue';

/**
 * Get system prompts for a specific application stage
 */
export const getStagePrompts = (stage: ApplicationStage): StagePromptMapping => {
  // This will be populated with the actual prompt mappings
  // Based on the stage (idea vs early_revenue)
  return {};
};

/**
 * Safe type guard to ensure evaluation data is an object
 */
export const ensureEvaluationDataIsObject = (data: Json): Record<string, any> => {
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    return data as Record<string, any>;
  }
  
  // Fallback to empty object if data is not a proper object
  return {};
};

/**
 * Question display order for Idea Stage applications
 */
export const IDEA_STAGE_QUESTION_ORDER = [
  'tell_us_about_idea',
  'problem_statement',
  'whose_problem',
  'how_solve_problem',
  'how_make_money',
  'acquire_customers',
  'competitors',
  'product_development',
  'team_roles',
  'when_proceed'
];

/**
 * Helper function to get ordered questions for display
 */
export const getOrderedQuestions = (evaluationData: Record<string, any>): Array<{
  key: string;
  data: any;
}> => {
  const orderedQuestions: Array<{ key: string; data: any }> = [];
  
  // First, add questions in the defined order
  IDEA_STAGE_QUESTION_ORDER.forEach(questionKey => {
    if (evaluationData[questionKey]) {
      orderedQuestions.push({
        key: questionKey,
        data: evaluationData[questionKey]
      });
    }
  });
  
  // Then add any remaining questions not in the defined order
  Object.entries(evaluationData).forEach(([key, data]) => {
    if (!IDEA_STAGE_QUESTION_ORDER.includes(key)) {
      orderedQuestions.push({
        key,
        data
      });
    }
  });
  
  return orderedQuestions;
};
