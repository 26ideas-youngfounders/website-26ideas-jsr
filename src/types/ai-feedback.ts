
/**
 * @fileoverview AI Feedback Types
 * 
 * Type definitions for the AI-powered feedback system
 * used in the YFF questionnaire.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

/**
 * AI Feedback Response from OpenAI API
 */
export interface AIFeedbackResponse {
  score: string;
  strengths: string[];
  improvements: string[];
  rawFeedback: string;
  questionId: string;
  timestamp: string;
  message?: string;
  error?: string;
}

/**
 * Chat message in the conversational UI
 */
export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
  feedback?: AIFeedbackResponse;
}

/**
 * Question configuration for AI feedback
 */
export interface QuestionConfig {
  id: string;
  title: string;
  placeholder: string;
  maxWords: number;
  systemPrompt: string;
}

/**
 * Feedback request payload
 */
export interface FeedbackRequest {
  prompt: string;
  answer: string;
  questionId: string;
}

/**
 * Answer state for tracking user progress
 */
export interface AnswerState {
  content: string;
  wordCount: number;
  hasBeenReviewed: boolean;
  isSubmitted: boolean;
}
