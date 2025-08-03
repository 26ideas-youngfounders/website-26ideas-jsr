/**
 * AI Feedback System Prompts Configuration
 * 
 * Maps question IDs to their respective system prompts for AI feedback
 */

export interface QuestionPromptConfig {
  systemPrompt: string;
  enabled: boolean;
  minCharacters: number;
}

/**
 * Generates system prompt for problem statement analysis
 */
const getProblemStatementPrompt = (answer: string): string => {
  return `Analyze this startup problem statement and provide specific feedback in this format:

CRITICAL FORMATTING REQUIREMENTS:
- Never use * at the start of any line. Only use dashes (- ) or numbers (1. , 2. ) for list items.
- Use bold markdown (**text**) for all section headings
- Each bullet/list item must be a single, complete idea or sentence on ONE line.
- Never continue a list item on another line or split an idea across multiple bullets.
- If feedback is long, use only one bullet per point—no breaks, no carrying over.
- All list items must be self-contained and readable on their own.

EXAMPLE OF CORRECT FORMAT:
**Strengths in your current response:**
- This is a complete point that stays on one line.
- Another full point that doesn't break across lines.

**Strengths in your current response:**
- First strength with specific details about clarity and specificity
- Second strength highlighting market potential aspects

**Areas for improvement:**
- First improvement suggestion with concrete examples
- Second suggestion for strengthening the problem statement
- Third actionable recommendation for better validation

Focus on: clarity of the problem, target audience specificity, market size indication, urgency/pain level, and validation evidence. Be constructive and encouraging while providing actionable advice.

Problem statement to analyze: "${answer}"`;
};

/**
 * Generates system prompt for target audience analysis
 */
const getTargetAudiencePrompt = (answer: string): string => {
  return `Analyze this target audience description and provide feedback in this format:

CRITICAL FORMATTING REQUIREMENTS:
- Never use * at the start of any line. Only use dashes (- ) or numbers (1. , 2. ) for list items.
- Use bold markdown (**text**) for all section headings
- Each bullet/list item must be a single, complete idea or sentence on ONE line.
- Never continue a list item on another line or split an idea across multiple bullets.
- If feedback is long, use only one bullet per point—no breaks, no carrying over.
- All list items must be self-contained and readable on their own.

**Strengths in your current response:**
- First strength about demographic specificity
- Second strength regarding market understanding

**Areas for improvement:**
- First improvement suggestion with concrete examples
- Second suggestion for better audience precision
- Third actionable recommendation for persona development

Focus on: demographic specificity, behavioral characteristics, market size, accessibility, and willingness to pay. Encourage more detailed persona development.

Target audience description: "${answer}"`;
};

/**
 * Generates system prompt for solution approach analysis
 */
const getSolutionApproachPrompt = (answer: string): string => {
  return `Analyze this solution approach and provide feedback in this format:

CRITICAL FORMATTING REQUIREMENTS:
- Never use * at the start of any line. Only use dashes (- ) or numbers (1. , 2. ) for list items.
- Use bold markdown (**text**) for all section headings
- Each bullet/list item must be a single, complete idea or sentence on ONE line.
- Never continue a list item on another line or split an idea across multiple bullets.
- If feedback is long, use only one bullet per point—no breaks, no carrying over.
- All list items must be self-contained and readable on their own.

**Strengths in your current response:**
- First strength about innovation and feasibility
- Second strength regarding problem-solution fit

**Areas for improvement:**
- First improvement suggestion with concrete examples
- Second suggestion for strengthening the solution
- Third actionable recommendation for better validation

Focus on: problem-solution fit, technical feasibility, competitive differentiation, scalability, and user experience. Encourage specificity and validation.

Solution approach: "${answer}"`;
};

export const questionPrompts: Record<string, QuestionPromptConfig> = {
  problemSolved: {
    systemPrompt: getProblemStatementPrompt(''), // Will be replaced with actual answer
    enabled: true,
    minCharacters: 10
  },
  targetAudience: {
    systemPrompt: getTargetAudiencePrompt(''), // Will be replaced with actual answer
    enabled: true,
    minCharacters: 10
  },
  solutionApproach: {
    systemPrompt: getSolutionApproachPrompt(''), // Will be replaced with actual answer
    enabled: true,
    minCharacters: 10
  }
};

/**
 * Gets the system prompt for a specific question with the user's answer
 */
export const getSystemPrompt = (questionId: string, answer: string): string => {
  switch (questionId) {
    case 'problemSolved':
      return getProblemStatementPrompt(answer);
    case 'targetAudience':
      return getTargetAudiencePrompt(answer);
    case 'solutionApproach':
      return getSolutionApproachPrompt(answer);
    default:
      return `Analyze this answer and provide constructive feedback: "${answer}"`;
  }
};
