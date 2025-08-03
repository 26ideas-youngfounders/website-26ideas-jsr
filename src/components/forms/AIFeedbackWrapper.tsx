
/**
 * AI Feedback Wrapper Component
 * 
 * Zero tolerance wrapper - EVERY question gets an AI feedback button
 * Uses universal question mapping system for 100% coverage
 */

import React from 'react';
import { AIFeedbackButton, AIFeedbackResponse } from './AIFeedbackButton';

interface AIFeedbackWrapperProps {
  baseQuestionId: string;
  questionText?: string;
  userAnswer: string;
  currentStage?: 'idea' | 'early_revenue';
  onFeedbackReceived: (feedback: AIFeedbackResponse) => void;
  disabled?: boolean;
  minCharacters?: number;
  // Accept registration data to determine stage if not explicitly provided
  registration?: any;
}

/**
 * Zero Tolerance Wrapper - AI feedback for EVERY question
 * No exceptions, no fallback logic - every question gets AI feedback
 */
export const AIFeedbackWrapper: React.FC<AIFeedbackWrapperProps> = ({
  baseQuestionId,
  questionText,
  userAnswer,
  currentStage,
  onFeedbackReceived,
  disabled = false,
  minCharacters = 10,
  registration
}) => {
  // Determine stage from props or registration data
  const determinedStage = currentStage || (registration?.product_stage === 'early_revenue' ? 'early_revenue' : 'idea');
  
  console.log('🔍 AIFeedbackWrapper - Processing:', {
    baseQuestionId,
    questionText: questionText?.substring(0, 50),
    currentStage,
    determinedStage,
    registrationStage: registration?.product_stage,
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
    shouldShowButton: shouldShowButton && answer.length >= minCharacters,
    finalStage: determinedStage
  });

  // Always render the wrapper div to maintain consistent spacing
  return (
    <div className="mt-2">
      {shouldShowButton && (
        <AIFeedbackButton
          questionId={baseQuestionId}
          questionText={questionText}
          userAnswer={answer}
          stage={determinedStage}
          onFeedbackReceived={onFeedbackReceived}
          disabled={disabled}
        />
      )}
    </div>
  );
};
