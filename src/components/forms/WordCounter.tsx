
/**
 * @fileoverview Word Counter Component
 * 
 * Displays live word count with visual feedback for limits.
 * Used in questionnaire forms to enforce word limits.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';

interface WordCounterProps {
  currentCount: number;
  maxWords: number;
  className?: string;
}

/**
 * Word Counter Component
 * 
 * Shows current word count with color-coded feedback based on limit.
 * 
 * @param props - Component props
 * @returns {JSX.Element} Word counter display
 */
export const WordCounter: React.FC<WordCounterProps> = ({
  currentCount,
  maxWords,
  className = '',
}) => {
  // Determine color based on word count
  const getVariant = () => {
    const percentage = (currentCount / maxWords) * 100;
    
    if (currentCount > maxWords) return 'destructive';
    if (percentage >= 90) return 'secondary';
    return 'default';
  };

  const isOverLimit = currentCount > maxWords;

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <Badge variant={getVariant()}>
        {currentCount} / {maxWords} words
        {isOverLimit && ' (Over limit!)'}
      </Badge>
      {isOverLimit && (
        <span className="text-sm text-red-600 font-medium">
          Please reduce by {currentCount - maxWords} words
        </span>
      )}
    </div>
  );
};

/**
 * Utility function to count words in text
 * 
 * @param text - Text to count words in
 * @returns {number} Number of words
 */
export const countWords = (text: string): number => {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
};
