
/**
 * @fileoverview Conversational Questionnaire Component
 * 
 * A conversational interface for collecting questionnaire responses
 * with AI-powered feedback and dynamic word counting.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ConversationalAIFeedback } from './ConversationalAIFeedback';
import { WordCounter, countWords } from './WordCounter';
import { QuestionConfig, AnswerState } from '@/types/ai-feedback';
import { toast } from 'sonner';

interface ConversationalQuestionnaireProps {
  question: QuestionConfig;
  onAnswer: (answer: string) => void;
  onNext: () => void;
  initialAnswer?: string;
}

/**
 * Conversational Questionnaire Component
 * 
 * Manages the flow between answer input, AI feedback, and progression.
 * Enforces word limits and review requirements.
 * 
 * @param props - Component props
 * @returns {JSX.Element} The conversational questionnaire interface
 */
export const ConversationalQuestionnaire: React.FC<ConversationalQuestionnaireProps> = ({
  question,
  onAnswer,
  onNext,
  initialAnswer = '',
}) => {
  const [answerState, setAnswerState] = useState<AnswerState>({
    content: initialAnswer,
    wordCount: countWords(initialAnswer),
    hasBeenReviewed: false,
    isSubmitted: false,
  });
  
  const [currentView, setCurrentView] = useState<'input' | 'feedback'>('input');

  // Update word count when content changes
  useEffect(() => {
    setAnswerState(prev => ({
      ...prev,
      wordCount: countWords(prev.content),
    }));
  }, [answerState.content]);

  /**
   * Handle answer text change
   */
  const handleAnswerChange = (value: string) => {
    const wordCount = countWords(value);
    
    // Prevent input if over word limit
    if (wordCount > question.maxWords) {
      toast.error(`Maximum ${question.maxWords} words allowed`);
      return;
    }

    setAnswerState(prev => ({
      ...prev,
      content: value,
      wordCount,
    }));

    // Notify parent of answer change
    onAnswer(value);
  };

  /**
   * Handle request for feedback
   */
  const handleGetFeedback = () => {
    if (!answerState.content.trim()) {
      toast.error('Please provide an answer before requesting feedback.');
      return;
    }
    
    if (answerState.wordCount < 10) {
      toast.error('Please provide a more detailed answer (at least 10 words).');
      return;
    }

    setCurrentView('feedback');
  };

  /**
   * Handle edit request from feedback view
   */
  const handleEditRequest = () => {
    setCurrentView('input');
    toast.info('You can now edit your answer and get fresh feedback.');
  };

  /**
   * Handle accept and continue from feedback view
   */
  const handleAcceptAndContinue = () => {
    setAnswerState(prev => ({
      ...prev,
      hasBeenReviewed: true,
      isSubmitted: true,
    }));
    
    toast.success('Answer accepted! Moving to next question.');
    onNext();
  };

  /**
   * Handle direct next without feedback (if already reviewed)
   */
  const handleNext = () => {
    if (!answerState.hasBeenReviewed) {
      toast.error('Please get AI feedback on your answer before continuing.');
      return;
    }
    
    onNext();
  };

  const isOverWordLimit = answerState.wordCount > question.maxWords;
  const canRequestFeedback = answerState.content.trim().length > 0 && !isOverWordLimit;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Question Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {question.title}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Input View */}
      {currentView === 'input' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`question-${question.id}`} className="text-base font-medium">
                Your Answer
              </Label>
              <Textarea
                id={`question-${question.id}`}
                placeholder={question.placeholder}
                value={answerState.content}
                onChange={(e) => handleAnswerChange(e.target.value)}
                className="min-h-[200px] resize-none text-base"
                disabled={answerState.isSubmitted}
              />
            </div>

            {/* Word Counter */}
            <WordCounter 
              currentCount={answerState.wordCount} 
              maxWords={question.maxWords}
              className="justify-end"
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleGetFeedback}
                disabled={!canRequestFeedback}
                className="flex-1"
              >
                Get AI Feedback
              </Button>
              
              {answerState.hasBeenReviewed && (
                <Button
                  variant="outline"
                  onClick={handleNext}
                  className="flex-1"
                >
                  Skip Feedback & Continue
                </Button>
              )}
            </div>

            {/* Help Text */}
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Provide a detailed answer (minimum 10 words)</p>
              <p>• AI feedback will help improve your response</p>
              <p>• You can edit and get feedback multiple times</p>
              {!answerState.hasBeenReviewed && (
                <p className="text-orange-600 font-medium">
                  • AI review is required before proceeding
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback View */}
      {currentView === 'feedback' && (
        <ConversationalAIFeedback
          answer={answerState.content}
          questionId={question.id}
          systemPrompt={question.systemPrompt}
          onEditRequest={handleEditRequest}
          onAcceptAndContinue={handleAcceptAndContinue}
          hasBeenReviewed={answerState.hasBeenReviewed}
        />
      )}
    </div>
  );
};
