/**
 * @fileoverview Extended YFF Application Types
 * 
 * Extends the auto-generated Supabase types to include columns that exist
 * in the database but may not be reflected in the generated types.
 * This resolves TypeScript errors when working with timestamp columns.
 */

import { Database } from '@/integrations/supabase/types';
import type { YffFormData } from './yff-form';

// Define Json type to match Supabase's Json type structure
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// Base type from Supabase
export type BaseYffApplication = Database['public']['Tables']['yff_applications']['Row'];
export type BaseYffApplicationInsert = Database['public']['Tables']['yff_applications']['Insert'];
export type BaseYffApplicationUpdate = Database['public']['Tables']['yff_applications']['Update'];

/**
 * Standardized individuals interface - consistent across all application types
 */
export interface YffApplicationIndividuals {
  first_name: string;
  last_name: string;
  email?: string; // Optional to handle cases where email might not be present
  phone_number?: string;
  country_code?: string;
  country_iso_code?: string;
}

// Extended types that include the missing timestamp columns and related data
export interface ExtendedYffApplication extends Omit<BaseYffApplication, 'evaluation_completed_at'> {
  created_at: string;
  updated_at: string;
  evaluation_status: string; // Required field, not optional
  overall_score: number; // Made required to match base type
  evaluation_completed_at?: string | null;
  evaluation_data: Record<string, any>; // Make required to match base type
  individuals?: YffApplicationIndividuals | null;
}

export interface ExtendedYffApplicationInsert extends BaseYffApplicationInsert {
  created_at?: string;
  updated_at?: string;
  evaluation_status?: string;
  overall_score?: number;
  evaluation_completed_at?: string | null;
  evaluation_data?: Record<string, any>;
}

export interface ExtendedYffApplicationUpdate extends BaseYffApplicationUpdate {
  created_at?: string;
  updated_at?: string;
  evaluation_status?: string;
  overall_score?: number;
  evaluation_completed_at?: string | null;
  evaluation_data?: Record<string, any>;
}

/**
 * Type for applications with joined individual data (used in queries with joins)
 * Now using the standardized individuals interface
 */
export interface YffApplicationWithIndividual extends ExtendedYffApplication {
  individuals: YffApplicationIndividuals | null;
}

/**
 * Main YffApplication type that matches the component expectations
 * Uses the same standardized individuals interface
 */
export interface YffApplication extends ExtendedYffApplication {
  individuals?: YffApplicationIndividuals | null;
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
