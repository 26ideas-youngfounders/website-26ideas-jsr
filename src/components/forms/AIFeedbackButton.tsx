
/**
 * AI Feedback Button Component
 * 
 * Provides AI-powered feedback on questionnaire answers
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
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
  canRetry?: boolean;
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
  const [lastError, setLastError] = useState<string | null>(null);

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
    if (isLoading) return;
    
    setIsLoading(true);
    setLastError(null);
    
    try {
      // Get the system prompt with the user's answer
      const prompt = getSystemPrompt(questionId, userAnswer);
      
      console.log('🤖 Requesting AI feedback for question:', questionId);
      console.log('🤖 Answer length:', userAnswer.length);
      
      const { data, error } = await supabase.functions.invoke('ai-feedback', {
        body: {
          prompt: prompt,
          answer: userAnswer,
          questionId: questionId
        }
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        throw new Error(error.message || 'Failed to call AI feedback service');
      }

      console.log('✅ AI feedback received:', data);
      
      // Check if this is an error response with a user-friendly message
      if (data.error && data.message) {
        setLastError(data.message);
        onFeedbackReceived({
          ...data,
          message: data.message
        });
      } else {
        onFeedbackReceived(data);
        setHasReceived(true);
        setLastError(null);
      }
      
    } catch (error) {
      console.error('❌ Error getting AI feedback:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLastError(errorMessage);
      
      // Provide fallback feedback
      onFeedbackReceived({
        score: "N/A",
        strengths: [],
        improvements: [],
        rawFeedback: "",
        questionId: questionId,
        timestamp: new Date().toISOString(),
        message: "Unable to get feedback at the moment. Please try again later.",
        error: errorMessage,
        canRetry: true
      });
      
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) return "Getting Feedback...";
    if (lastError && !hasReceived) return "Retry Feedback";
    if (hasReceived) return "Get New Feedback";
    return "AI Feedback";
  };

  const getButtonIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (lastError && !hasReceived) return <RefreshCw className="h-4 w-4" />;
    return <Sparkles className="h-4 w-4" />;
  };

  const getButtonVariant = () => {
    if (lastError && !hasReceived) return "outline";
    return "outline";
  };

  return (
    <Button
      type="button"
      variant={getButtonVariant()}
      size="sm"
      onClick={handleGetFeedback}
      disabled={disabled || isLoading}
      className={`mt-2 gap-2 text-xs ${lastError && !hasReceived ? 'border-amber-300 text-amber-700 hover:bg-amber-50' : ''}`}
    >
      {getButtonIcon()}
      {getButtonText()}
    </Button>
  );
};
