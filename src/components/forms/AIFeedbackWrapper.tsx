
/**
 * AI Feedback Wrapper Component
 * 
 * Handles dynamic display of AI feedback buttons based on question availability and user stage
 * Uses comprehensive question mapping system to ensure all questions with prompts show feedback buttons
 */

import React from 'react';
import { AIFeedbackButton, AIFeedbackResponse } from './AIFeedbackButton';
import { hasAIFeedback, getPromptKey } from '@/utils/ai-question-mapping';

interface AIFeedbackWrapperProps {
  baseQuestionId: string;
  userAnswer: string;
  currentStage?: 'idea' | 'early_revenue';
  onFeedbackReceived: (feedback: AIFeedbackResponse) => void;
  disabled?: boolean;
  minCharacters?: number;
  questionText?: string; // Optional question text for fallback resolution
}

/**
 * Wrapper component that conditionally shows AI feedback button
 * Uses comprehensive mapping system to resolve question identifiers to prompt keys
 */
export const AIFeedbackWrapper: React.FC<AIFeedbackWrapperProps> = ({
  baseQuestionId,
  userAnswer,
  currentStage = 'idea',
  onFeedbackReceived,
  disabled = false,
  minCharacters = 10,
  questionText
}) => {
  console.log('🔍 AIFeedbackWrapper - Input:', {
    baseQuestionId,
    currentStage,
    answerLength: userAnswer.length,
    questionText: questionText?.substring(0, 50) + '...'
  });
  
  // Use the comprehensive mapping system to resolve the prompt key
  const promptKey = getPromptKey(baseQuestionId, questionText);
  const hasFeedbackAvailable = promptKey ? hasAIFeedback(baseQuestionId, questionText) : false;
  const meetMinLength = userAnswer.length >= minCharacters;
  const shouldShowButton = hasFeedbackAvailable && meetMinLength;

  console.log('🔍 AIFeedbackWrapper Debug:', {
    baseQuestionId,
    promptKey,
    currentStage,
    answerLength: userAnswer.length,
    minCharacters,
    hasFeedbackAvailable,
    meetMinLength,
    shouldShowButton
  });

  // Always render the wrapper div to maintain consistent spacing
  return (
    <div className="mt-2">
      {shouldShowButton && promptKey && (
        <AIFeedbackButton
          questionId={promptKey}
          userAnswer={userAnswer}
          onFeedbackReceived={onFeedbackReceived}
          disabled={disabled}
        />
      )}
    </div>
  );
};
