
/**
 * AI Feedback Wrapper Component
 * 
 * Handles dynamic display of AI feedback buttons based on question availability and user stage
 */

import React from 'react';
import { AIFeedbackButton, AIFeedbackResponse } from './AIFeedbackButton';
import { hasAIFeedback } from '@/utils/ai-question-prompts';

interface AIFeedbackWrapperProps {
  baseQuestionId: string;
  userAnswer: string;
  currentStage?: 'idea' | 'early_revenue';
  onFeedbackReceived: (feedback: AIFeedbackResponse) => void;
  disabled?: boolean;
  minCharacters?: number;
}

/**
 * Get the correct question ID based on the stage
 */
const getQuestionId = (baseQuestionId: string, currentStage?: 'idea' | 'early_revenue'): string => {
  // Map of base question IDs to their actual IDs in the prompt mapping
  const questionIdMapping: Record<string, { idea: string; early_revenue: string }> = {
    'ideaDescription': { idea: 'ideaDescription', early_revenue: 'ideaDescription' },
    'problemSolved': { idea: 'problemSolved', early_revenue: 'problemSolved' },
    'targetAudience': { idea: 'targetAudience', early_revenue: 'targetAudience' },
    'solutionApproach': { idea: 'solutionApproach', early_revenue: 'solutionApproach' },
    'monetizationStrategy': { idea: 'monetizationStrategy', early_revenue: 'monetizationStrategy' },
    'customerAcquisition': { idea: 'customerAcquisition', early_revenue: 'customerAcquisition' },
    'payingCustomers': { idea: 'payingCustomers', early_revenue: 'payingCustomers' },
    'workingDuration': { idea: 'workingDuration', early_revenue: 'workingDuration' },
    'competitors': { idea: 'competitors', early_revenue: 'competitors' },
    'developmentApproach': { idea: 'developmentApproach', early_revenue: 'developmentApproach' },
    'teamInfo': { idea: 'teamInfo', early_revenue: 'teamInfo' },
    'timeline': { idea: 'timeline', early_revenue: 'timeline' }
  };

  // Check if we have a mapping for this question
  const mapping = questionIdMapping[baseQuestionId];
  if (mapping) {
    return currentStage === 'early_revenue' ? mapping.early_revenue : mapping.idea;
  }

  // Fallback to the base question ID
  return baseQuestionId;
};

/**
 * Wrapper component that conditionally shows AI feedback button
 */
export const AIFeedbackWrapper: React.FC<AIFeedbackWrapperProps> = ({
  baseQuestionId,
  userAnswer,
  currentStage = 'idea',
  onFeedbackReceived,
  disabled = false,
  minCharacters = 10
}) => {
  const questionId = getQuestionId(baseQuestionId, currentStage);
  
  // Check if AI feedback is available for this question
  const shouldShowButton = hasAIFeedback(questionId) && userAnswer.length >= minCharacters;

  if (!shouldShowButton) {
    return null;
  }

  return (
    <AIFeedbackButton
      questionId={questionId}
      userAnswer={userAnswer}
      onFeedbackReceived={onFeedbackReceived}
      disabled={disabled}
    />
  );
};
