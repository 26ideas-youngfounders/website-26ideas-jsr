
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

export const questionPrompts: Record<string, QuestionPromptConfig> = {
  problemSolved: {
    systemPrompt: `Analyze this startup problem statement and provide specific feedback in this format:

SCORE: [Rate from 1-10 based on clarity, specificity, and market potential]

STRENGTHS:
- [List 2-3 specific strengths of this problem statement]

AREAS FOR IMPROVEMENT:
- [List 2-3 specific suggestions to make the problem statement stronger]

Focus on: clarity of the problem, target audience specificity, market size indication, urgency/pain level, and validation evidence. Be constructive and encouraging while providing actionable advice.

Problem statement to analyze: "${answer}"`,
    enabled: true,
    minCharacters: 10
  },
  targetAudience: {
    systemPrompt: `Analyze this target audience description and provide feedback in this format:

SCORE: [Rate from 1-10 based on specificity, market understanding, and accessibility]

STRENGTHS:
- [List 2-3 specific strengths of this target audience definition]

AREAS FOR IMPROVEMENT:
- [List 2-3 specific suggestions to make the target audience more precise]

Focus on: demographic specificity, behavioral characteristics, market size, accessibility, and willingness to pay. Encourage more detailed persona development.

Target audience description: "${answer}"`,
    enabled: true,
    minCharacters: 10
  },
  solutionApproach: {
    systemPrompt: `Analyze this solution approach and provide feedback in this format:

SCORE: [Rate from 1-10 based on innovation, feasibility, and problem fit]

STRENGTHS:
- [List 2-3 specific strengths of this solution approach]

AREAS FOR IMPROVEMENT:
- [List 2-3 specific suggestions to strengthen the solution]

Focus on: problem-solution fit, technical feasibility, competitive differentiation, scalability, and user experience. Encourage specificity and validation.

Solution approach: "${answer}"`,
    enabled: true,
    minCharacters: 10
  }
};
