
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
 * Get the correct question ID based on the stage and base question ID
 */
const getQuestionId = (baseQuestionId: string, currentStage?: 'idea' | 'early_revenue'): string => {
  console.log('🔍 AIFeedbackWrapper - baseQuestionId:', baseQuestionId, 'currentStage:', currentStage);
  
  // Direct mapping for questions that should use their exact ID
  const questionIdMap: Record<string, string> = {
    // General questions (same for both stages)
    'ideaDescription': 'ideaDescription',
    'idea_description': 'ideaDescription',
    'tell_us_about_idea': 'ideaDescription',
    
    // Core business questions
    'problemSolved': 'problemSolved',
    'problem_solved': 'problemSolved',
    'problem_statement': 'problemSolved',
    
    'targetAudience': 'targetAudience',
    'target_audience': 'targetAudience',
    'whose_problem': 'targetAudience',
    
    'solutionApproach': 'solutionApproach',
    'solution_approach': 'solutionApproach',
    'how_solve_problem': 'solutionApproach',
    
    'monetizationStrategy': 'monetizationStrategy',
    'monetization_strategy': 'monetizationStrategy',
    'how_make_money': 'monetizationStrategy',
    'making_money': 'monetizationStrategy',
    
    'customerAcquisition': 'customerAcquisition',
    'customer_acquisition': 'customerAcquisition',
    'acquire_customers': 'customerAcquisition',
    'acquiring_customers': 'customerAcquisition',
    
    'payingCustomers': 'payingCustomers',
    'paying_customers': 'payingCustomers',
    'first_paying_customers': 'payingCustomers',
    
    'workingDuration': 'workingDuration',
    'working_duration': 'workingDuration',
    'how_long_working': 'workingDuration',
    
    'competitors': 'competitors',
    'competitor_analysis': 'competitors',
    'list_competitors': 'competitors',
    
    'developmentApproach': 'developmentApproach',
    'development_approach': 'developmentApproach',
    'product_development': 'developmentApproach',
    'how_developing_product': 'developmentApproach',
    
    'teamInfo': 'teamInfo',
    'team_info': 'teamInfo',
    'team_roles': 'teamInfo',
    'who_on_team': 'teamInfo',
    
    'timeline': 'timeline',
    'when_proceed': 'timeline',
    'proceed_timeline': 'timeline'
  };

  // Get the mapped question ID
  const mappedId = questionIdMap[baseQuestionId] || baseQuestionId;
  
  console.log('🔍 AIFeedbackWrapper - mapped to:', mappedId);
  console.log('🔍 AIFeedbackWrapper - hasAIFeedback check:', hasAIFeedback(mappedId));
  
  return mappedId;
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
  const hasFeedbackAvailable = hasAIFeedback(questionId);
  const meetMinLength = userAnswer.length >= minCharacters;
  const shouldShowButton = hasFeedbackAvailable && meetMinLength;

  console.log('🔍 AIFeedbackWrapper Debug:', {
    baseQuestionId,
    questionId,
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
          questionId={questionId}
          userAnswer={userAnswer}
          onFeedbackReceived={onFeedbackReceived}
          disabled={disabled}
        />
      )}
    </div>
  );
};
