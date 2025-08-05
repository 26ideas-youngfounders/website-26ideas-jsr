
/**
 * @fileoverview Extended YFF Application Types
 * 
 * Extends the auto-generated Supabase types to include columns that exist
 * in the database but may not be reflected in the generated types.
 * This resolves TypeScript errors when working with timestamp columns.
 */

import { Database } from '@/integrations/supabase/types';
import type { YffFormData } from './yff-form';

// Base type from Supabase
export type BaseYffApplication = Database['public']['Tables']['yff_applications']['Row'];
export type BaseYffApplicationInsert = Database['public']['Tables']['yff_applications']['Insert'];
export type BaseYffApplicationUpdate = Database['public']['Tables']['yff_applications']['Update'];

// Extended types that include the missing timestamp columns and related data
export interface ExtendedYffApplication extends Omit<BaseYffApplication, 'evaluation_completed_at'> {
  created_at: string;
  updated_at: string;
  evaluation_status: string; // Required field, not optional
  overall_score: number; // Made required to match base type
  evaluation_completed_at?: string | null;
  evaluation_data: Record<string, any>; // Make required to match base type
  individuals?: {
    first_name: string;
    last_name: string;
    email?: string;
  } | null;
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
 */
export interface YffApplicationWithIndividual extends ExtendedYffApplication {
  individuals: {
    first_name: string;
    last_name: string;
    email?: string;
  } | null;
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
 * Question evaluation interface for AI scoring
 */
export interface QuestionEvaluation {
  score: number;
  strengths: string[];
  improvements: string[];
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
 * Individual question scoring result from AI
 */
export interface QuestionScoringResult {
  questionId: string;
  score: number;
  strengths: string[];
  areas_for_improvement: string[];
  raw_feedback: string;
}

/**
 * Comprehensive evaluation data structure stored in database
 */
export interface EvaluationData {
  scores: Record<string, {
    score: number;
    strengths: string[];
    areas_for_improvement: string[];
    raw_feedback: string;
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
