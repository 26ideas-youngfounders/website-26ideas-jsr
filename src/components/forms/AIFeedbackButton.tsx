
/**
 * AI Feedback Button Component
 * 
 * Provides AI-powered feedback on questionnaire answers
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { questionPrompts, getSystemPrompt } from '@/utils/ai-feedback-prompts';

interface AIFeedbackButtonProps {
  questionId: string;
  userAnswer: string;
  onFeedbackReceived: (feedback: AIFeedbackResponse) => void;
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
}

/**
 * AI Feedback Button for getting personalized suggestions on answers
 */
export const AIFeedbackButton: React.FC<AIFeedbackButtonProps> = ({
  questionId,
  userAnswer,
  onFeedbackReceived,
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasReceived, setHasReceived] = useState(false);

  // Check if this question has AI feedback enabled
  const promptConfig = questionPrompts[questionId];
  if (!promptConfig?.enabled) {
    return null;
  }

  // Don't show if answer is too short
  if (userAnswer.length < promptConfig.minCharacters) {
    return null;
  }

  const handleGetFeedback = async () => {
    setIsLoading(true);
    
    try {
      // Get the system prompt with the user's answer
      const prompt = getSystemPrompt(questionId, userAnswer);
      
      console.log('🤖 Requesting AI feedback for question:', questionId);
      
      const { data, error } = await supabase.functions.invoke('ai-feedback', {
        body: {
          prompt: prompt,
          answer: userAnswer,
          questionId: questionId
        }
      });

      if (error) {
        throw error;
      }

      console.log('✅ AI feedback received:', data);
      
      onFeedbackReceived(data);
      setHasReceived(true);
      
    } catch (error) {
      console.error('❌ Error getting AI feedback:', error);
      
      // Provide fallback feedback
      onFeedbackReceived({
        score: "N/A",
        strengths: [],
        improvements: [],
        rawFeedback: "",
        questionId: questionId,
        timestamp: new Date().toISOString(),
        message: "Unable to get feedback at the moment. Please try again later.",
        error: error instanceof Error ? error.message : "Unknown error"
      });
      
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) return "Getting Feedback...";
    if (hasReceived) return "Get New Feedback";
    return "AI Feedback";
  };

  const getButtonIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    return <Sparkles className="h-4 w-4" />;
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleGetFeedback}
      disabled={disabled || isLoading}
      className="mt-2 gap-2 text-xs"
    >
      {getButtonIcon()}
      {getButtonText()}
    </Button>
  );
};
