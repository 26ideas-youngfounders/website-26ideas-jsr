
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
  shouldShowFeedback: boolean;
}

/**
 * Custom hook for managing AI feedback state and user interactions
 */
export const useAIFeedback = (): UseAIFeedbackReturn => {
  const [feedback, setFeedback] = useState<AIFeedbackResponse | null>(null);

  const handleFeedbackReceived = useCallback((newFeedback: AIFeedbackResponse) => {
    setFeedback(newFeedback);
  }, []);

  const handleDismiss = useCallback(() => {
    setFeedback(null);
  }, []);

  const shouldShowFeedback = Boolean(feedback);

  return {
    feedback,
    setFeedback,
    handleFeedbackReceived,
    handleDismiss,
    shouldShowFeedback
  };
};
