
/**
 * @fileoverview Question Splitter Utility
 * 
 * Handles splitting of merged questionnaire answers into individual question-answer pairs
 * with robust parsing logic and fallback mechanisms.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

/**
 * Question patterns for different questionnaire stages
 */
export const QUESTION_PATTERNS = {
  early_revenue: [
    { key: 'tell_us_about_idea', question: 'Tell us about your idea', patterns: ['idea', 'tell us about', 'what is your'] },
    { key: 'early_revenue_problem', question: 'What problem does your idea solve?', patterns: ['problem', 'what problem', 'solve'] },
    { key: 'early_revenue_target', question: 'Whose problem does your idea solve for?', patterns: ['whose problem', 'target', 'audience', 'customer'] },
    { key: 'early_revenue_how_solve', question: 'How does your idea solve this problem?', patterns: ['how solve', 'solution', 'approach'] },
    { key: 'early_revenue_monetization', question: 'How do you plan to make money from this idea?', patterns: ['monetization', 'make money', 'revenue', 'business model'] },
    { key: 'early_revenue_customers', question: 'How do you plan to acquire first paying customers?', patterns: ['acquire customers', 'first customers', 'customer acquisition'] },
    { key: 'early_revenue_competitors', question: 'List 3 potential competitors for your idea', patterns: ['competitors', 'competition', 'competitive'] },
    { key: 'early_revenue_development', question: 'What is your approach to product development?', patterns: ['product development', 'development approach', 'build'] },
    { key: 'early_revenue_team', question: 'Who is on your team, and what are their roles?', patterns: ['team', 'team members', 'roles'] },
    { key: 'early_revenue_timeline', question: 'When do you plan to proceed with the idea?', patterns: ['timeline', 'when', 'schedule'] },
    { key: 'early_revenue_stage', question: 'What stage is your product currently in?', patterns: ['stage', 'current stage', 'development stage'] }
  ]
};

export interface SplitAnswer {
  questionKey: string;
  questionText: string;
  userAnswer: string;
  confidence: 'high' | 'medium' | 'low';
  splitMethod: 'direct_match' | 'pattern_match' | 'delimiter_split' | 'ai_assist' | 'fallback';
  warnings: string[];
}

export interface SplittingResult {
  splitAnswers: SplitAnswer[];
  totalQuestions: number;
  successfulSplits: number;
  warnings: string[];
  usedAutoSplitting: boolean;
  rawData: any;
}

/**
 * Common delimiters used to separate questions/answers
 */
const COMMON_DELIMITERS = [
  /Q\d+[:\.\)]\s*/gi,        // Q1: Q2. Q3)
  /\d+[\.\)]\s*/g,           // 1. 2. 3)
  /Question\s*\d+[:\.\)]\s*/gi, // Question 1: Question 2.
  /\n\s*\n/g,                // Double line breaks
  /\*\*.*?\*\*/g,            // **Question text**
  /#{1,3}\s*/g               // ### Markdown headers
];

/**
 * Check if text contains question patterns
 */
const containsQuestionPattern = (text: string, patterns: string[]): boolean => {
  const lowerText = text.toLowerCase();
  return patterns.some(pattern => lowerText.includes(pattern.toLowerCase()));
};

/**
 * Extract individual answers from merged text using delimiters
 */
const splitByDelimiters = (text: string): string[] => {
  let segments = [text];
  
  // Try each delimiter pattern
  for (const delimiter of COMMON_DELIMITERS) {
    const newSegments: string[] = [];
    
    for (const segment of segments) {
      const parts = segment.split(delimiter);
      if (parts.length > 1) {
        newSegments.push(...parts.filter(part => part.trim().length > 10));
      } else {
        newSegments.push(segment);
      }
    }
    
    if (newSegments.length > segments.length) {
      segments = newSegments;
      break;
    }
  }
  
  return segments.map(s => s.trim()).filter(s => s.length > 0);
};

/**
 * Match text segments to specific questions using patterns
 */
const matchSegmentToQuestion = (segment: string, questionPatterns: typeof QUESTION_PATTERNS.early_revenue): { match: any; confidence: 'high' | 'medium' | 'low' } | null => {
  const lowerSegment = segment.toLowerCase();
  
  // High confidence: exact pattern match
  for (const questionDef of questionPatterns) {
    if (containsQuestionPattern(segment, questionDef.patterns)) {
      return { match: questionDef, confidence: 'high' };
    }
  }
  
  // Medium confidence: partial keyword match
  for (const questionDef of questionPatterns) {
    const keywordMatches = questionDef.patterns.filter(pattern => 
      lowerSegment.includes(pattern.toLowerCase())
    );
    
    if (keywordMatches.length > 0) {
      return { match: questionDef, confidence: 'medium' };
    }
  }
  
  return null;
};

/**
 * Main function to split questionnaire answers
 */
export const splitQuestionnaireAnswers = (rawData: any, stage: 'early_revenue' | 'idea_stage' = 'early_revenue'): SplittingResult => {
  console.log('🔀 STARTING QUESTION SPLITTING:', { rawData, stage });
  
  const questionPatterns = QUESTION_PATTERNS[stage];
  const splitAnswers: SplitAnswer[] = [];
  const warnings: string[] = [];
  let usedAutoSplitting = false;

  try {
    // First, try direct property matching (best case)
    let directMatches = 0;
    for (const questionDef of questionPatterns) {
      const directValue = rawData[questionDef.key];
      if (directValue && typeof directValue === 'string' && directValue.trim().length > 0) {
        splitAnswers.push({
          questionKey: questionDef.key,
          questionText: questionDef.question,
          userAnswer: directValue.trim(),
          confidence: 'high',
          splitMethod: 'direct_match',
          warnings: []
        });
        directMatches++;
      }
    }

    console.log('✅ DIRECT MATCHES FOUND:', directMatches);

    // If we have good direct matches, use them
    if (directMatches >= Math.floor(questionPatterns.length * 0.6)) {
      // Add missing questions with empty answers
      for (const questionDef of questionPatterns) {
        if (!splitAnswers.find(sa => sa.questionKey === questionDef.key)) {
          splitAnswers.push({
            questionKey: questionDef.key,
            questionText: questionDef.question,
            userAnswer: 'Not provided',
            confidence: 'high',
            splitMethod: 'direct_match',
            warnings: ['No answer provided for this question']
          });
        }
      }

      return {
        splitAnswers: splitAnswers.sort((a, b) => {
          const orderA = questionPatterns.findIndex(q => q.key === a.questionKey);
          const orderB = questionPatterns.findIndex(q => q.key === b.questionKey);
          return orderA - orderB;
        }),
        totalQuestions: questionPatterns.length,
        successfulSplits: directMatches,
        warnings,
        usedAutoSplitting: false,
        rawData
      };
    }

    // If direct matching failed, try to find merged text
    console.log('🔍 LOOKING FOR MERGED TEXT...');
    
    const possibleMergedFields = Object.entries(rawData).filter(([key, value]) => 
      typeof value === 'string' && 
      value.length > 100 && 
      !questionPatterns.some(q => q.key === key)
    );

    if (possibleMergedFields.length > 0) {
      usedAutoSplitting = true;
      warnings.push('Answers appear to be merged. Attempting automatic splitting based on detected patterns.');

      for (const [fieldKey, mergedText] of possibleMergedFields) {
        console.log('🔀 SPLITTING MERGED FIELD:', fieldKey, 'Length:', (mergedText as string).length);
        
        // Split the merged text
        const segments = splitByDelimiters(mergedText as string);
        console.log('📋 SEGMENTS FOUND:', segments.length);

        // Match segments to questions
        const usedQuestions = new Set<string>();
        
        for (const segment of segments) {
          if (segment.length < 10) continue; // Skip very short segments
          
          const match = matchSegmentToQuestion(segment, questionPatterns);
          if (match && !usedQuestions.has(match.match.key)) {
            splitAnswers.push({
              questionKey: match.match.key,
              questionText: match.match.question,
              userAnswer: segment.trim(),
              confidence: match.confidence,
              splitMethod: 'pattern_match',
              warnings: match.confidence === 'low' ? ['Answer matching has low confidence'] : []
            });
            usedQuestions.add(match.match.key);
          }
        }

        // If we still have unmatched segments and questions, use order-based matching
        if (segments.length > usedQuestions.size) {
          const remainingQuestions = questionPatterns.filter(q => !usedQuestions.has(q.key));
          const remainingSegments = segments.filter(segment => 
            !splitAnswers.some(sa => sa.userAnswer === segment.trim())
          );

          const minLength = Math.min(remainingQuestions.length, remainingSegments.length);
          for (let i = 0; i < minLength; i++) {
            splitAnswers.push({
              questionKey: remainingQuestions[i].key,
              questionText: remainingQuestions[i].question,
              userAnswer: remainingSegments[i].trim(),
              confidence: 'low',
              splitMethod: 'fallback',
              warnings: ['Answer assigned based on order - please verify accuracy']
            });
            usedQuestions.add(remainingQuestions[i].key);
          }
        }
      }
    }

    // Add any missing questions
    for (const questionDef of questionPatterns) {
      if (!splitAnswers.find(sa => sa.questionKey === questionDef.key)) {
        splitAnswers.push({
          questionKey: questionDef.key,
          questionText: questionDef.question,
          userAnswer: 'Not provided',
          confidence: 'high',
          splitMethod: 'direct_match',
          warnings: ['No answer found for this question']
        });
      }
    }

  } catch (error) {
    console.error('❌ ERROR IN QUESTION SPLITTING:', error);
    warnings.push(`Error during splitting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    // Fallback: create empty answers for all questions
    for (const questionDef of questionPatterns) {
      splitAnswers.push({
        questionKey: questionDef.key,
        questionText: questionDef.question,
        userAnswer: 'Error: Could not parse answer',
        confidence: 'low',
        splitMethod: 'fallback',
        warnings: ['Error occurred during answer parsing']
      });
    }
  }

  // Sort by question order
  const sortedAnswers = splitAnswers.sort((a, b) => {
    const orderA = questionPatterns.findIndex(q => q.key === a.questionKey);
    const orderB = questionPatterns.findIndex(q => q.key === b.questionKey);
    return orderA - orderB;
  });

  console.log('🎉 SPLITTING COMPLETE:', {
    total: sortedAnswers.length,
    successful: sortedAnswers.filter(sa => sa.userAnswer !== 'Not provided').length,
    autoSplitting: usedAutoSplitting
  });

  return {
    splitAnswers: sortedAnswers,
    totalQuestions: questionPatterns.length,
    successfulSplits: splitAnswers.filter(sa => sa.userAnswer !== 'Not provided' && sa.userAnswer !== 'Error: Could not parse answer').length,
    warnings,
    usedAutoSplitting,
    rawData
  };
};
