
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
 * Generates system prompt for problem statement analysis with STRICT formatting requirements
 */
const getProblemStatementPrompt = (answer: string): string => {
  return `Analyze this startup problem statement and provide specific feedback in this format:

CRITICAL FORMATTING REQUIREMENTS - NO EXCEPTIONS:
- EVERY bullet must be a single, complete line—never split across multiple lines or followed by a fragment.
- Use ONLY dash-based (- ) or numbered lists. NO asterisks (*), NO line breaks within bullets.
- Each bullet point must contain a full, complete idea that stands alone on ONE line.
- NEVER continue a bullet on a new line or split an idea across multiple bullets.
- NEVER produce an orphaned bullet with just a few words at the end.

EXAMPLE OF CORRECT FORMAT:
**Strengths in your current response:**
- This is a complete point that stays on one line and contains a full idea.
- Another complete point about market validation that doesn't break or continue elsewhere.

EXAMPLE OF INCORRECT FORMAT (DO NOT DO THIS):
**Strengths in your current response:**
- This is a point that starts here
  but continues on another line (WRONG)
- Another point
  with fragments (WRONG)

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
 * Generates system prompt for target audience analysis with STRICT formatting requirements
 */
const getTargetAudiencePrompt = (answer: string): string => {
  return `Analyze this target audience description and provide feedback in this format:

CRITICAL FORMATTING REQUIREMENTS - NO EXCEPTIONS:
- EVERY bullet must be a single, complete line—never split across multiple lines or followed by a fragment.
- Use ONLY dash-based (- ) or numbered lists. NO asterisks (*), NO line breaks within bullets.
- Each bullet point must contain a full, complete idea that stands alone on ONE line.
- NEVER continue a bullet on a new line or split an idea across multiple bullets.
- NEVER produce an orphaned bullet with just a few words at the end.

EXAMPLE OF CORRECT FORMAT:
**Strengths in your current response:**
- This is a complete point about demographic specificity that stays on one line.
- Another complete point about market understanding that doesn't split or continue.

EXAMPLE OF INCORRECT FORMAT (DO NOT DO THIS):
**Strengths in your current response:**
- Good demographic targeting
  but needs more detail (WRONG)
- Market size is
  well researched (WRONG)

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
 * Generates system prompt for solution approach analysis with STRICT formatting requirements
 */
const getSolutionApproachPrompt = (answer: string): string => {
  return `Analyze this solution approach and provide feedback in this format:

CRITICAL FORMATTING REQUIREMENTS - NO EXCEPTIONS:
- EVERY bullet must be a single, complete line—never split across multiple lines or followed by a fragment.
- Use ONLY dash-based (- ) or numbered lists. NO asterisks (*), NO line breaks within bullets.
- Each bullet point must contain a full, complete idea that stands alone on ONE line.
- NEVER continue a bullet on a new line or split an idea across multiple bullets.
- NEVER produce an orphaned bullet with just a few words at the end.

EXAMPLE OF CORRECT FORMAT:
**Strengths in your current response:**
- This is a complete point about innovation and feasibility that stays on one line.
- Another complete point about problem-solution fit that doesn't break or continue elsewhere.

EXAMPLE OF INCORRECT FORMAT (DO NOT DO THIS):
**Strengths in your current response:**
- Good technical approach
  with solid foundation (WRONG)
- Solution addresses the problem
  effectively (WRONG)

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
 * Includes MANDATORY formatting requirements to prevent orphaned bullets
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
      return `Analyze this answer and provide constructive feedback with STRICT formatting requirements:

CRITICAL FORMATTING REQUIREMENTS - NO EXCEPTIONS:
- EVERY bullet must be a single, complete line—never split across multiple lines or followed by a fragment.
- Use ONLY dash-based (- ) or numbered lists. NO asterisks (*), NO line breaks within bullets.
- Each bullet point must contain a full, complete idea that stands alone on ONE line.
- NEVER continue a bullet on a new line or split an idea across multiple bullets.
- NEVER produce an orphaned bullet with just a few words at the end.

Answer to analyze: "${answer}"`;
  }
};
