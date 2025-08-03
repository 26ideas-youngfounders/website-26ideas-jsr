
/**
 * Hook for managing AI Feedback state and interactions
 * Updated to work with the comprehensive question mapping system
 */

import { useState, useCallback } from 'react';
import { AIFeedbackResponse } from '@/components/forms/AIFeedbackButton';

interface UseAIFeedbackReturn {
  feedback: AIFeedbackResponse | null;
  setFeedback: (feedback: AIFeedbackResponse | null) => void;
  handleFeedbackReceived: (feedback: AIFeedbackResponse) => void;
  handleDismiss: () => void;
  handleRetry: (() => void) | null;
  shouldShowFeedback: boolean;
  isError: boolean;
  isRetryable: boolean;
}

/**
 * Custom hook for managing AI feedback state and user interactions
 * Works with the enhanced question mapping system
 */
export const useAIFeedback = (retryCallback?: () => void): UseAIFeedbackReturn => {
  const [feedback, setFeedback] = useState<AIFeedbackResponse | null>(null);

  const handleFeedbackReceived = useCallback((newFeedback: AIFeedbackResponse) => {
    console.log('🤖 AI Feedback received:', newFeedback);
    setFeedback(newFeedback);
  }, []);

  const handleDismiss = useCallback(() => {
    console.log('🤖 AI Feedback dismissed');
    setFeedback(null);
  }, []);

  const handleRetry = useCallback(() => {
    if (feedback?.canRetry && retryCallback) {
      console.log('🤖 AI Feedback retry triggered');
      setFeedback(null);
      retryCallback();
    }
  }, [feedback, retryCallback]);

  const shouldShowFeedback = Boolean(feedback);
  const isError = Boolean(feedback?.error || feedback?.message);
  const isRetryable = Boolean(feedback?.canRetry);

  return {
    feedback,
    setFeedback,
    handleFeedbackReceived,
    handleDismiss,
    handleRetry: isRetryable ? handleRetry : null,
    shouldShowFeedback,
    isError,
    isRetryable
  };
};
