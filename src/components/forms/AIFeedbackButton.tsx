
/**
 * AI Feedback Button Component
 * 
 * Zero tolerance implementation - EVERY question gets an AI feedback button
 * Uses universal question mapping to handle ANY questionId variation
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { normalizeQuestionId } from '@/utils/ai-question-prompts';

interface AIFeedbackButtonProps {
  questionId: string;
  questionText?: string;
  userAnswer: string;
  onFeedbackReceived: (feedback: AIFeedbackResponse) => void;
  stage?: string; // "idea" or "early_revenue"
  disabled?: boolean;
}

export interface AIFeedbackResponse {
  score: string;
  strengths: string[];
  improvements: string[];
  rawFeedback: string;
  questionId: string;
  timestamp: string;
  message?: string;
  error?: string;
  canRetry?: boolean;
}

/**
 * AI Feedback Button - Zero Tolerance Implementation
 * Shows for ALL questions when answer is 10+ characters - NO EXCEPTIONS
 */
export const AIFeedbackButton: React.FC<AIFeedbackButtonProps> = ({
  questionId,
  questionText,
  userAnswer,
  onFeedbackReceived,
  stage,
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasReceived, setHasReceived] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Ensure userAnswer is defined
  const answer = userAnswer || '';
  
  // ALWAYS normalize to get the correct prompt key
  const normalizedQuestionId = normalizeQuestionId(questionId, questionText, stage);

  console.log('🤖 AIFeedbackButton render:', {
    originalQuestionId: questionId,
    normalizedQuestionId,
    stage,
    stageType: typeof stage,
    stageValue: stage,
    questionText: questionText?.substring(0, 50) || 'undefined',
    answerLength: answer.length
  });

  // Enhanced stage debugging
  if (stage === undefined) {
    console.warn('⚠️ AIFeedbackButton: stage is undefined!', {
      originalQuestionId: questionId,
      questionText: questionText?.substring(0, 50)
    });
  }

  // ALWAYS show button if answer is long enough - NO EXCEPTIONS
  if (answer.length < 10) {
    console.log('❌ AIFeedbackButton hidden - answer too short:', { 
      answerLength: answer.length 
    });
    return null;
  }

  const handleGetFeedback = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setLastError(null);
    
    try {
      console.log('🤖 Requesting AI feedback:', {
        originalQuestionId: questionId,
        normalizedQuestionId,
        stage,
        answerLength: answer.length
      });
      
      const { data, error } = await supabase.functions.invoke('ai-feedback', {
        body: {
          questionId: normalizedQuestionId, // Use the normalized ID
          userAnswer: answer.trim()
        }
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        throw new Error(error.message || 'Failed to call AI feedback service');
      }

      console.log('✅ AI feedback received:', data);
      
      // Check if this is an error response with a user-friendly message
      if (data.error && data.message) {
        setLastError(data.message);
        onFeedbackReceived({
          score: "N/A",
          strengths: [],
          improvements: [],
          rawFeedback: "",
          questionId: normalizedQuestionId,
          timestamp: new Date().toISOString(),
          message: data.message,
          error: data.error,
          canRetry: data.code === 'RATE_LIMITED' || data.code === 'SERVICE_BUSY'
        });
      } else if (data.error) {
        // Handle specific error codes
        let userMessage = "Unable to get feedback at the moment. Please try again later.";
        let canRetry = true;
        
        switch (data.code) {
          case 'FEEDBACK_NOT_ENABLED':
            userMessage = "AI feedback is not available for this question.";
            canRetry = false;
            break;
          case 'INVALID_ANSWER_LENGTH':
            userMessage = "Please provide a more detailed answer (at least 10 characters).";
            canRetry = false;
            break;
          case 'RATE_LIMITED':
            userMessage = data.error || "You've reached the limit for AI feedback. Please try again later.";
            canRetry = true;
            break;
          case 'SERVICE_BUSY':
            userMessage = data.error || "AI service is temporarily busy. Please try again in a few minutes.";
            canRetry = true;
            break;
          default:
            userMessage = data.error || "Unable to get feedback at the moment. Please try again later.";
        }
        
        setLastError(userMessage);
        onFeedbackReceived({
          score: "N/A",
          strengths: [],
          improvements: [],
          rawFeedback: "",
          questionId: normalizedQuestionId,
          timestamp: new Date().toISOString(),
          message: userMessage,
          error: data.error,
          canRetry: canRetry
        });
      } else {
        // Success case - parse the feedback response
        const result = {
          score: data.score || "N/A",
          strengths: data.strengths || [],
          improvements: data.improvements || [],
          rawFeedback: data.feedback || data.rawFeedback || "",
          questionId: normalizedQuestionId,
          timestamp: data.timestamp || new Date().toISOString()
        };
        
        onFeedbackReceived(result);
        setHasReceived(true);
        setLastError(null);
      }
      
    } catch (error) {
      console.error('❌ Error getting AI feedback:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLastError(errorMessage);
      
      // Provide fallback feedback
      onFeedbackReceived({
        score: "N/A",
        strengths: [],
        improvements: [],
        rawFeedback: "",
        questionId: normalizedQuestionId,
        timestamp: new Date().toISOString(),
        message: "Unable to get feedback at the moment. Please try again later.",
        error: errorMessage,
        canRetry: true
      });
      
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) return "Getting Feedback...";
    if (lastError && !hasReceived) return "Retry Feedback";
    if (hasReceived) return "Get New Feedback";
    return "AI Feedback";
  };

  const getButtonIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (lastError && !hasReceived) return <RefreshCw className="h-4 w-4" />;
    return <Sparkles className="h-4 w-4" />;
  };

  return (
    <div className="ai-feedback-section">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleGetFeedback}
        disabled={disabled || isLoading}
        className={`mt-2 gap-2 text-xs bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 ${
          lastError && !hasReceived ? 'border-amber-300 text-amber-700 hover:bg-amber-50' : ''
        }`}
      >
        {getButtonIcon()}
        {getButtonText()}
      </Button>
      
      {lastError && (
        <div className="error-message text-red-600 mt-2 text-sm">
          {lastError}
        </div>
      )}
    </div>
  );
};
