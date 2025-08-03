
/**
 * Hook for managing AI Feedback state and interactions
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
 */
export const useAIFeedback = (retryCallback?: () => void): UseAIFeedbackReturn => {
  const [feedback, setFeedback] = useState<AIFeedbackResponse | null>(null);

  const handleFeedbackReceived = useCallback((newFeedback: AIFeedbackResponse) => {
    setFeedback(newFeedback);
  }, []);

  const handleDismiss = useCallback(() => {
    setFeedback(null);
  }, []);

  const handleRetry = useCallback(() => {
    if (feedback?.canRetry && retryCallback) {
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
