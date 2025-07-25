
import React from 'react';
import { cn } from '@/lib/utils';
import { countWords } from '@/utils/registration-validation';

interface WordCounterProps {
  text: string;
  maxWords?: number;
  className?: string;
}

/**
 * Word counter component that displays current word count and limit
 */
export const WordCounter: React.FC<WordCounterProps> = ({ 
  text, 
  maxWords = 300, 
  className 
}) => {
  const wordCount = countWords(text);
  const isOverLimit = wordCount > maxWords;
  
  return (
    <div className={cn(
      "text-sm mt-1",
      isOverLimit ? "text-red-600" : "text-gray-500",
      className
    )}>
      <span className={isOverLimit ? "font-medium" : ""}>
        {wordCount} / {maxWords} words
      </span>
      {isOverLimit && (
        <span className="ml-2 text-red-600 font-medium">
          (Over limit by {wordCount - maxWords} words)
        </span>
      )}
    </div>
  );
};
