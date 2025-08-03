
/**
 * AI Feedback Wrapper Component
 * 
 * Handles dynamic display of AI feedback buttons using the three-tier resolution system
 * Ensures comprehensive coverage of all questions with available prompts
 */

import React from 'react';
import { AIFeedbackButton, AIFeedbackResponse } from './AIFeedbackButton';
import { hasAIFeedback, resolvePromptKey, debugMappingSystem } from '@/utils/ai-question-prompts';

interface AIFeedbackWrapperProps {
  baseQuestionId?: string;
  questionText?: string;
  userAnswer: string;
  currentStage?: 'idea' | 'early_revenue';
  onFeedbackReceived: (feedback: AIFeedbackResponse) => void;
  disabled?: boolean;
  minCharacters?: number;
}

/**
 * Wrapper component that conditionally shows AI feedback button
 * Uses comprehensive three-tier resolution system to match questions to prompts
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
  // Debug the mapping system on first render
  React.useEffect(() => {
    debugMappingSystem();
  }, []);

  console.log('🔍 AIFeedbackWrapper - Processing:', {
    baseQuestionId,
    questionText: questionText?.substring(0, 50) + '...',
    currentStage,
    answerLength: userAnswer.length,
    minCharacters
  });
  
  // Use the three-tier resolution system
  const promptKey = resolvePromptKey(baseQuestionId, questionText);
  const hasFeedbackAvailable = hasAIFeedback(baseQuestionId, questionText);
  const meetMinLength = userAnswer.length >= minCharacters;
  const shouldShowButton = hasFeedbackAvailable && meetMinLength;

  console.log('🔍 AIFeedbackWrapper Resolution:', {
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
      {shouldShowButton && (
        <AIFeedbackButton
          questionId={baseQuestionId}
          questionText={questionText}
          userAnswer={userAnswer}
          onFeedbackReceived={onFeedbackReceived}
          disabled={disabled}
        />
      )}
    </div>
  );
};
