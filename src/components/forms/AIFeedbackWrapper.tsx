
/**
 * AI Feedback Wrapper Component
 * 
 * Simplified wrapper that shows AI feedback buttons for ALL questions
 * Every single question in the YFF questionnaire gets an AI feedback button
 */

import React from 'react';
import { AIFeedbackButton, AIFeedbackResponse } from './AIFeedbackButton';
import { hasAIFeedback, getSystemPrompt } from '@/utils/ai-question-prompts';

interface AIFeedbackWrapperProps {
  baseQuestionId: string;
  questionText?: string;
  userAnswer: string;
  currentStage?: 'idea' | 'early_revenue';
  onFeedbackReceived: (feedback: AIFeedbackResponse) => void;
  disabled?: boolean;
  minCharacters?: number;
}

/**
 * Wrapper component that shows AI feedback button for ALL questions
 * No exceptions, no fallback logic - every question gets AI feedback
 */
export const AIFeedbackWrapper: React.FC<AIFeedbackWrapperProps> = ({
  baseQuestionId,
  questionText,
  userAnswer,
  currentStage = 'idea',
  onFeedbackReceived,
  disabled = false,
  minCharacters = 10
}) => {
  console.log('🔍 AIFeedbackWrapper - Processing:', {
    baseQuestionId,
    questionText: questionText?.substring(0, 50),
    currentStage,
    answerLength: userAnswer?.length || 0,
    minCharacters
  });
  
  // Ensure userAnswer is defined
  const answer = userAnswer || '';
  
  // Check minimum length requirement
  const meetMinLength = answer.length >= minCharacters;
  
  // EVERY question has AI feedback, so we only check length requirement
  const shouldShowButton = meetMinLength;

  console.log('🔍 AIFeedbackWrapper Decision:', {
    baseQuestionId,
    answerLength: answer.length,
    minCharacters,
    meetMinLength,
    shouldShowButton,
    hasPrompt: hasAIFeedback(baseQuestionId)
  });

  // Always render the wrapper div to maintain consistent spacing
  return (
    <div className="mt-2">
      {shouldShowButton && (
        <AIFeedbackButton
          questionId={baseQuestionId}
          questionText={questionText}
          userAnswer={answer}
          onFeedbackReceived={onFeedbackReceived}
          disabled={disabled}
        />
      )}
    </div>
  );
};
