/**
 * @fileoverview AI Comprehensive Scoring Service
 * 
 * Provides advanced AI-based scoring for YFF applications with detailed
 * question-by-question evaluation, structured feedback, and comprehensive
 * analysis capabilities.
 * 
 * @version 2.0.0
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';

export interface QuestionScore {
  score: number;
  strengths: string[];
  areas_for_improvement: string[];
  raw_feedback?: string;
  question_text?: string;
  user_answer?: string;
}

export interface ComprehensiveEvaluationResult {
  overall_score: number;
  question_scores: Record<string, QuestionScore>;
  evaluation_completed_at: string;
  evaluation_status: string;
  idea_summary?: string;
  evaluation_metadata: {
    model_used: string;
    evaluation_version: string;
    questions_scored: number;
    processing_time_ms: number;
  };
}

/**
 * AI Comprehensive Scoring Service
 */
export class AIComprehensiveScoringService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 2000;

  /**
   * Evaluate application with comprehensive AI scoring
   */
  static async evaluateApplication(applicationId: string): Promise<ComprehensiveEvaluationResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🚀 Starting comprehensive evaluation for: ${applicationId}`);
      
      // Fetch application data
      const { data: application, error: fetchError } = await supabase
        .from('yff_applications')
        .select('*')
        .eq('application_id', applicationId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch application: ${fetchError.message}`);
      }

      if (!application) {
        throw new Error(`Application not found: ${applicationId}`);
      }

      // Extract and parse answers
      const answers = this.parseApplicationAnswers(application.answers);
      console.log(`📝 Parsed ${Object.keys(answers).length} answers for evaluation`);

      // Evaluate each question
      const questionScores: Record<string, QuestionScore> = {};
      const evaluationPromises = Object.entries(answers).map(async ([questionKey, answer]) => {
        if (this.isValidAnswer(answer)) {
          try {
            const score = await this.evaluateQuestion(questionKey, answer);
            questionScores[questionKey] = score;
            console.log(`✅ Evaluated ${questionKey}: ${score.score}/10`);
          } catch (error) {
            console.error(`❌ Failed to evaluate ${questionKey}:`, error);
            // Continue with other questions even if one fails
          }
        }
      });

      await Promise.all(evaluationPromises);

      // Calculate overall score
      const scores = Object.values(questionScores).map(q => q.score);
      const overallScore = scores.length > 0 
        ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10
        : 0;

      // Generate idea summary
      const ideaSummary = this.generateIdeaSummary(answers);

      const processingTime = Date.now() - startTime;
      const completedAt = new Date().toISOString();

      // Prepare evaluation data
      const evaluationData = {
        scores: questionScores,
        average_score: overallScore,
        idea_summary: ideaSummary,
        evaluation_completed_at: completedAt,
        evaluation_status: 'completed',
        evaluation_metadata: {
          model_used: 'gpt-4',
          evaluation_version: '2.0.0',
          questions_scored: Object.keys(questionScores).length,
          processing_time_ms: processingTime
        }
      };

      // Update application with results and status
      const { error: updateError } = await supabase
        .from('yff_applications')
        .update({
          evaluation_data: evaluationData,
          overall_score: overallScore,
          evaluation_status: 'completed',
          evaluation_completed_at: completedAt,
          updated_at: new Date().toISOString()
        })
        .eq('application_id', applicationId);

      if (updateError) {
        console.error(`❌ Failed to update evaluation results:`, updateError);
        throw new Error(`Failed to save evaluation: ${updateError.message}`);
      }

      console.log(`✅ Comprehensive evaluation completed for ${applicationId}: ${overallScore}/10`);

      return {
        overall_score: overallScore,
        question_scores: questionScores,
        evaluation_completed_at: completedAt,
        evaluation_status: 'completed',
        idea_summary: ideaSummary,
        evaluation_metadata: evaluationData.evaluation_metadata
      };

    } catch (error) {
      console.error(`❌ Comprehensive evaluation failed for ${applicationId}:`, error);
      
      // Update status to failed
      await supabase
        .from('yff_applications')
        .update({
          evaluation_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('application_id', applicationId);
        
      throw error;
    }
  }

  /**
   * Parse application answers from various formats
   */
  private static parseApplicationAnswers(answers: any): Record<string, any> {
    if (!answers) return {};
    
    let parsedAnswers: any = {};
    
    // Handle different answer formats
    if (typeof answers === 'string') {
      try {
        parsedAnswers = JSON.parse(answers);
      } catch {
        return {};
      }
    } else {
      parsedAnswers = answers;
    }
    
    // Extract questionnaire answers if they exist
    const questionnaireAnswers = parsedAnswers.questionnaire_answers || parsedAnswers.questionnaire || parsedAnswers;
    
    // Flatten nested structures
    const flatAnswers: Record<string, any> = {};
    
    const flatten = (obj: any, prefix = '') => {
      Object.entries(obj || {}).forEach(([key, value]) => {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          flatten(value, newKey);
        } else if (this.isValidAnswer(value)) {
          flatAnswers[newKey] = value;
        }
      });
    };
    
    flatten(questionnaireAnswers);
    
    return flatAnswers;
  }
  
  /**
   * Check if answer is valid for evaluation
   */
  private static isValidAnswer(answer: any): boolean {
    if (!answer) return false;
    if (typeof answer === 'string') return answer.trim().length > 0;
    if (Array.isArray(answer)) return answer.length > 0;
    if (typeof answer === 'object') return Object.keys(answer).length > 0;
    return false;
  }
  
  /**
   * Evaluate individual question using AI
   */
  private static async evaluateQuestion(questionKey: string, answer: any): Promise<QuestionScore> {
    const answerText = typeof answer === 'string' ? answer : JSON.stringify(answer);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-evaluation', {
        body: { 
          question: questionKey,
          answer: answerText,
          evaluationType: 'comprehensive'
        }
      });

      if (error) throw error;

      return {
        score: data.score || 0,
        strengths: data.strengths || [],
        areas_for_improvement: data.areas_for_improvement || [],
        raw_feedback: data.feedback,
        question_text: this.getQuestionText(questionKey),
        user_answer: answerText
      };
    } catch (error) {
      console.error(`Failed to evaluate question ${questionKey}:`, error);
      return {
        score: 0,
        strengths: [],
        areas_for_improvement: ['Evaluation failed - please try again'],
        question_text: this.getQuestionText(questionKey),
        user_answer: answerText
      };
    }
  }
  
  /**
   * Get human-readable question text
   */
  private static getQuestionText(questionKey: string): string {
    const questionMap: Record<string, string> = {
      'idea': 'Tell us about your idea',
      'stage': 'What stage is your product/service currently at?',
      'problem': 'What problem does your idea solve?',
      'target': 'Whose problem does your idea solve for?',
      'solution': 'How does your idea solve this problem?',
      'revenue': 'How does your idea plan to make money?',
      'customers': 'How do you plan to acquire first paying customers?',
      'competitors': 'List 3 potential competitors',
      'development': 'How are you developing the product?',
      'team': 'Who is on your team and their roles?',
      'timeline': 'When/Since when have you been working on the idea?'
    };
    
    return questionMap[questionKey] || questionKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  /**
   * Generate idea summary from answers
   */
  private static generateIdeaSummary(answers: Record<string, any>): string {
    const ideaText = answers.idea || answers['questionnaire_answers.idea'] || '';
    if (typeof ideaText === 'string' && ideaText.length > 0) {
      return ideaText.substring(0, 200) + (ideaText.length > 200 ? '...' : '');
    }
    return 'No idea description provided';
  }
}
