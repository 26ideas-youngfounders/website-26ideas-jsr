
/**
 * @fileoverview Conversational AI Feedback Component
 * 
 * Provides a chat-style interface for AI feedback on questionnaire answers.
 * Integrates with OpenAI to provide dynamic, actionable improvement suggestions.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MessageCircle, Edit3, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AIFeedbackResponse, ChatMessage } from '@/types/ai-feedback';

interface ConversationalAIFeedbackProps {
  answer: string;
  questionId: string;
  systemPrompt: string;
  onEditRequest: () => void;
  onAcceptAndContinue: () => void;
  hasBeenReviewed: boolean;
}

/**
 * Conversational AI Feedback Component
 * 
 * Provides a chat-style interface for receiving and responding to AI feedback.
 * Handles API calls, error states, and user interactions.
 * 
 * @param props - Component props
 * @returns {JSX.Element} The conversational feedback interface
 */
export const ConversationalAIFeedback: React.FC<ConversationalAIFeedbackProps> = ({
  answer,
  questionId,
  systemPrompt,
  onEditRequest,
  onAcceptAndContinue,
  hasBeenReviewed,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFeedback, setLastFeedback] = useState<AIFeedbackResponse | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  /**
   * Get AI feedback for the current answer
   */
  const getFeedback = async (retryCount = 0) => {
    if (!answer.trim()) {
      toast.error('Please provide an answer before requesting feedback.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🤖 Requesting AI feedback for answer:', answer.substring(0, 100) + '...');

      const prompt = `${systemPrompt}

USER'S ANSWER:
"${answer}"

Please provide feedback in this format:
SCORE: [1-10]
STRENGTHS:
- [strength 1]
- [strength 2]
AREAS FOR IMPROVEMENT:
- [improvement 1]
- [improvement 2]`;

      const { data, error: functionError } = await supabase.functions.invoke('ai-feedback', {
        body: {
          prompt,
          answer,
          questionId,
        },
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to get AI feedback');
      }

      const feedback: AIFeedbackResponse = data;
      console.log('✅ Received AI feedback:', feedback);

      setLastFeedback(feedback);

      // Handle rate limit case
      if ((feedback as any).isRateLimit && retryCount < 3) {
        toast.info('High demand detected - will retry automatically in 3 seconds...', {
          description: 'The AI is experiencing high usage. Please wait a moment.',
        });
        
        // Auto-retry after 3 seconds
        setTimeout(() => {
          getFeedback(retryCount + 1);
        }, 3000);
        return;
      }

      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: answer,
        timestamp: new Date().toISOString(),
      };

      // Add AI response message
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: feedback.rawFeedback || 'Feedback received successfully!',
        timestamp: new Date().toISOString(),
        feedback,
      };

      setMessages(prev => [...prev, userMessage, aiMessage]);

      // Show appropriate toast based on feedback quality
      if ((feedback as any).isRateLimit) {
        toast.warning('Temporary feedback provided', {
          description: 'Try "Get Fresh Feedback" again in a few seconds for detailed analysis.',
        });
      } else if (feedback.score !== 'N/A' && feedback.strengths.length > 0) {
        toast.success('Detailed AI feedback received!', {
          description: 'Review the suggestions and decide whether to edit or continue.',
        });
      } else {
        toast.info('Basic feedback received', {
          description: 'Some suggestions provided - try again for more detailed analysis.',
        });
      }

    } catch (error) {
      console.error('❌ Error getting AI feedback:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      
      toast.error('Failed to get AI feedback', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle retry after error
   */
  const handleRetry = () => {
    setError(null);
    getFeedback();
  };

  /**
   * Render AI feedback details
   */
  const renderFeedbackDetails = (feedback: AIFeedbackResponse) => (
    <div className="space-y-4 mt-4">
      {feedback.score !== 'N/A' && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-lg px-3 py-1">
            Score: {feedback.score}/10
          </Badge>
          {(feedback as any).isRateLimit && (
            <Badge variant="outline" className="text-yellow-600">
              Quick Response
            </Badge>
          )}
        </div>
      )}

      {feedback.strengths.length > 0 && (
        <div>
          <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Strengths
          </h4>
          <ul className="space-y-1">
            {feedback.strengths.map((strength, index) => (
              <li key={index} className="text-sm text-green-600 flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.improvements.length > 0 && (
        <div>
          <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Areas for Improvement
          </h4>
          <ul className="space-y-1">
            {feedback.improvements.map((improvement, index) => (
              <li key={index} className="text-sm text-orange-600 flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(feedback as any).isRateLimit && (
        <Alert>
          <RefreshCw className="h-4 w-4" />
          <AlertDescription>
            This was a quick response due to high demand. Click "Get Fresh Feedback" below for more detailed analysis.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          AI Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={handleRetry}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Chat Messages */}
        {messages.length > 0 && (
          <ScrollArea className="h-[400px] w-full border rounded-md p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="text-sm font-medium mb-1">
                      {message.type === 'user' ? 'Your Answer' : 'AI Feedback'}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                    {message.feedback && renderFeedbackDetails(message.feedback)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {/* Get Feedback Button */}
          {messages.length === 0 && !isLoading && (
            <Button 
              onClick={() => getFeedback()}
              disabled={!answer.trim()}
              className="w-full"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Get AI Feedback
            </Button>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Getting AI feedback...</span>
            </div>
          )}

          {/* Action Buttons after feedback */}
          {messages.length > 0 && !isLoading && (
            <>
              <Separator />
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  onClick={onEditRequest}
                  className="flex-1"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit My Answer
                </Button>
                <Button 
                  onClick={onAcceptAndContinue}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept & Continue
                </Button>
              </div>
              
              {/* Get New Feedback Button */}
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => getFeedback()}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {lastFeedback && (lastFeedback as any).isRateLimit 
                  ? 'Get Detailed Feedback' 
                  : 'Get Fresh Feedback'}
              </Button>
            </>
          )}
        </div>

        {/* Review Requirement Notice */}
        {!hasBeenReviewed && messages.length === 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You must review your answer with AI feedback before continuing to the next question.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
