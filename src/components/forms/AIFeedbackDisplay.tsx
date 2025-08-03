
/**
 * AI Feedback Display Component
 * 
 * Shows AI-generated feedback in a styled card format with enhanced formatting
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Sparkles, TrendingUp, Target, AlertTriangle, RefreshCw } from 'lucide-react';
import { AIFeedbackResponse } from './AIFeedbackButton';
import './ai-feedback-styles.css';

interface AIFeedbackDisplayProps {
  feedback: AIFeedbackResponse;
  onDismiss: () => void;
  onRetry?: () => void;
}

/**
 * Custom markdown components for consistent styling
 */
const markdownComponents = {
  h3: ({ children }: { children: React.ReactNode }) => {
    const childText = children?.toString() || '';
    let iconAndColor = { icon: '', colorClass: 'text-gray-700' };
    
    if (childText.toLowerCase().includes('strength')) {
      iconAndColor = { icon: '✅', colorClass: 'text-green-700' };
    } else if (childText.toLowerCase().includes('improvement')) {
      iconAndColor = { icon: '🔧', colorClass: 'text-orange-700' };
    } else if (childText.toLowerCase().includes('tip')) {
      iconAndColor = { icon: '💡', colorClass: 'text-blue-700' };
    }
    
    return (
      <h3 className={`${iconAndColor.colorClass} font-semibold mb-2 mt-4 first:mt-0 flex items-center gap-2 border-b border-gray-200 pb-1`}>
        <span>{iconAndColor.icon}</span>
        {children}
      </h3>
    );
  },
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="font-semibold text-gray-800">{children}</strong>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="space-y-2 ml-4 my-2">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="space-y-2 ml-4 my-2 list-decimal">{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="text-gray-700 leading-relaxed relative pl-2">
      <span className="absolute left-0 top-0 text-blue-500 font-bold">•</span>
      {children}
    </li>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="text-gray-700 leading-relaxed mb-3">{children}</p>
  )
};

/**
 * Display component for AI-generated feedback with scoring and suggestions
 */
export const AIFeedbackDisplay: React.FC<AIFeedbackDisplayProps> = ({
  feedback,
  onDismiss,
  onRetry
}) => {
  // Handle error cases with retry option
  if (feedback.error || feedback.message) {
    const isRetryable = feedback.canRetry !== false;
    const isRateLimit = feedback.message?.includes('limit') || feedback.message?.includes('busy') || feedback.error?.includes('RATE_LIMITED');
    
    return (
      <Card className={`mt-3 ${isRateLimit ? 'border-orange-200 bg-orange-50' : 'border-amber-200 bg-amber-50'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className={`text-sm font-medium flex items-center gap-2 ${isRateLimit ? 'text-orange-800' : 'text-amber-800'}`}>
              <AlertTriangle className="h-4 w-4" />
              AI Feedback
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className={`h-6 w-6 p-0 ${isRateLimit ? 'text-orange-600 hover:text-orange-800' : 'text-amber-600 hover:text-amber-800'}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className={`text-sm mb-3 ${isRateLimit ? 'text-orange-700' : 'text-amber-700'}`}>
            {feedback.message || `Error: ${feedback.error}`}
          </p>
          
          {isRetryable && onRetry && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="gap-2 text-xs"
              >
                <RefreshCw className="h-3 w-3" />
                Try Again
              </Button>
            </div>
          )}
          
          {isRateLimit && (
            <div className="text-xs text-orange-600 mt-2 p-2 bg-orange-100 rounded">
              💡 Tip: AI feedback has usage limits to ensure fair access for all users. Your answers are automatically saved.
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-3 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Feedback
            {feedback.score !== "N/A" && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                Score: {feedback.score}/10
              </span>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Structured Strengths and Improvements Sections */}
        {feedback.strengths.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-green-700 flex items-center gap-2 mb-2 border-b border-green-200 pb-1">
              <TrendingUp className="h-4 w-4" />
              Strengths
            </h4>
            <ul className="space-y-2 ml-4">
              {feedback.strengths.map((strength, index) => (
                <li key={index} className="text-sm text-green-700 flex items-start gap-2 leading-relaxed">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {feedback.improvements.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-orange-700 flex items-center gap-2 mb-2 border-b border-orange-200 pb-1">
              <Target className="h-4 w-4" />
              Areas for Improvement
            </h4>
            <ul className="space-y-2 ml-4">
              {feedback.improvements.map((improvement, index) => (
                <li key={index} className="text-sm text-orange-700 flex items-start gap-2 leading-relaxed">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Enhanced Raw Feedback with Markdown Rendering */}
        {feedback.strengths.length === 0 && feedback.improvements.length === 0 && feedback.rawFeedback && (
          <div className="ai-feedback-content prose prose-sm max-w-none">
            <ReactMarkdown components={markdownComponents}>
              {feedback.rawFeedback}
            </ReactMarkdown>
          </div>
        )}

        <div className="text-xs text-blue-500 mt-4 pt-3 border-t border-blue-200 bg-blue-50/50 rounded p-2">
          💡 This feedback is generated by AI to help improve your answer. Feel free to use these suggestions as inspiration!
        </div>
      </CardContent>
    </Card>
  );
};
