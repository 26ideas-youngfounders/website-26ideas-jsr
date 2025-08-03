
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
 * Universal bullet integrity instructions - MANDATORY for ALL prompts
 * This prevents orphaned bullets from being generated at the source
 */
const BULLET_INTEGRITY_INSTRUCTIONS = `
BULLET INTEGRITY REQUIREMENT - MANDATORY:
- Each bullet/list item ("- Example feedback here") MUST be a COMPLETE, self-contained point, all on a SINGLE line.
- Do NOT split a single bullet point across multiple lines—never spill part of a point onto a new line.
- NEVER emit "orphaned" bullets or lines (e.g. a bullet with just a few words separated from its main point).
- If a bullet point is long, continue the sentence on the same line; if a new point is needed, start a new dash.
- Use ONLY dash-style ("- ") bullets. NO asterisks (*), NO numbered lists, NO other markers.

BAD EXAMPLE (Do NOT do this):
- Good point start
continued here
- Next full point
orphaned words

GOOD EXAMPLE (Do this):
- This is a complete and correctly formatted bullet point, with nothing split over two lines.
- This is another, equally well-formed bullet that contains its entire thought on one line.

RESPONSE FORMAT TEMPLATE:
**Strengths in your current response:**
- [bullet 1: single line, complete point]
- [bullet 2: single line, complete point]

**Areas for improvement:**
- [bullet 1: single line, complete point]
- [bullet 2: single line, complete point]
`;

/**
 * Generates system prompt for problem statement analysis with BULLETPROOF formatting requirements
 */
const getProblemStatementPrompt = (answer: string): string => {
  return `Analyze this startup problem statement and provide specific feedback in this exact format:

${BULLET_INTEGRITY_INSTRUCTIONS}

**Strengths in your current response:**
- [First strength with specific details about clarity and specificity - complete thought on one line]
- [Second strength highlighting market potential aspects - complete thought on one line]

**Areas for improvement:**
- [First improvement suggestion with concrete examples - complete thought on one line]
- [Second suggestion for strengthening the problem statement - complete thought on one line]
- [Third actionable recommendation for better validation - complete thought on one line]

Focus on: clarity of the problem, target audience specificity, market size indication, urgency/pain level, and validation evidence. Be constructive and encouraging while providing actionable advice.

Problem statement to analyze: "${answer}"`;
};

/**
 * Generates system prompt for target audience analysis with BULLETPROOF formatting requirements
 */
const getTargetAudiencePrompt = (answer: string): string => {
  return `Analyze this target audience description and provide feedback in this exact format:

${BULLET_INTEGRITY_INSTRUCTIONS}

**Strengths in your current response:**
- [First strength about demographic specificity - complete thought on one line]
- [Second strength regarding market understanding - complete thought on one line]

**Areas for improvement:**
- [First improvement suggestion with concrete examples - complete thought on one line]
- [Second suggestion for better audience precision - complete thought on one line]
- [Third actionable recommendation for persona development - complete thought on one line]

Focus on: demographic specificity, behavioral characteristics, market size, accessibility, and willingness to pay. Encourage more detailed persona development.

Target audience description: "${answer}"`;
};

/**
 * Generates system prompt for solution approach analysis with BULLETPROOF formatting requirements
 */
const getSolutionApproachPrompt = (answer: string): string => {
  return `Analyze this solution approach and provide feedback in this exact format:

${BULLET_INTEGRITY_INSTRUCTIONS}

**Strengths in your current response:**
- [First strength about innovation and feasibility - complete thought on one line]
- [Second strength regarding problem-solution fit - complete thought on one line]

**Areas for improvement:**
- [First improvement suggestion with concrete examples - complete thought on one line]
- [Second suggestion for strengthening the solution - complete thought on one line]
- [Third actionable recommendation for better validation - complete thought on one line]

Focus on: problem-solution fit, technical feasibility, competitive differentiation, scalability, and user experience. Encourage specificity and validation.

Solution approach: "${answer}"`;
};

/**
 * Generates system prompt for monetization strategy analysis with BULLETPROOF formatting requirements
 */
const getMonetizationPrompt = (answer: string): string => {
  return `Analyze this monetization strategy and provide feedback in this exact format:

${BULLET_INTEGRITY_INSTRUCTIONS}

**Strengths in your current response:**
- [First strength about revenue model clarity - complete thought on one line]
- [Second strength regarding market fit or pricing strategy - complete thought on one line]

**Areas for improvement:**
- [First improvement suggestion about revenue diversification - complete thought on one line]
- [Second suggestion for pricing validation or market research - complete thought on one line]
- [Third actionable recommendation for scaling revenue - complete thought on one line]

Focus on: revenue model viability, pricing strategy, market validation, scalability, and competitive positioning.

Monetization strategy: "${answer}"`;
};

/**
 * Generates system prompt for customer acquisition analysis with BULLETPROOF formatting requirements
 */
const getCustomerAcquisitionPrompt = (answer: string): string => {
  return `Analyze this customer acquisition approach and provide feedback in this exact format:

${BULLET_INTEGRITY_INSTRUCTIONS}

**Strengths in your current response:**
- [First strength about acquisition strategy clarity - complete thought on one line]
- [Second strength regarding channel selection or targeting - complete thought on one line]

**Areas for improvement:**
- [First improvement suggestion about channel optimization - complete thought on one line]
- [Second suggestion for customer retention or conversion - complete thought on one line]
- [Third actionable recommendation for scaling acquisition - complete thought on one line]

Focus on: acquisition channels, cost effectiveness, customer lifetime value, conversion rates, and scalable growth strategies.

Customer acquisition approach: "${answer}"`;
};

/**
 * Generates system prompt for team composition analysis with BULLETPROOF formatting requirements
 */
const getTeamPrompt = (answer: string): string => {
  return `Analyze this team composition and provide feedback in this exact format:

${BULLET_INTEGRITY_INSTRUCTIONS}

**Strengths in your current response:**
- [First strength about team skills or experience - complete thought on one line]
- [Second strength regarding team balance or complementary abilities - complete thought on one line]

**Areas for improvement:**
- [First improvement suggestion about skill gaps or hiring needs - complete thought on one line]
- [Second suggestion for team development or role clarity - complete thought on one line]
- [Third actionable recommendation for team growth - complete thought on one line]

Focus on: skill coverage, experience relevance, team balance, leadership, and growth potential.

Team composition: "${answer}"`;
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
  },
  monetizationStrategy: {
    systemPrompt: getMonetizationPrompt(''), // Will be replaced with actual answer
    enabled: true,
    minCharacters: 10
  },
  customerAcquisition: {
    systemPrompt: getCustomerAcquisitionPrompt(''), // Will be replaced with actual answer
    enabled: true,
    minCharacters: 10
  },
  teamInfo: {
    systemPrompt: getTeamPrompt(''), // Will be replaced with actual answer
    enabled: true,
    minCharacters: 10
  }
};

/**
 * Gets the system prompt for a specific question with the user's answer
 * ALL prompts include MANDATORY bullet integrity requirements
 */
export const getSystemPrompt = (questionId: string, answer: string): string => {
  switch (questionId) {
    case 'problemSolved':
    case 'problem_statement':
    case 'early_revenue_problem':
      return getProblemStatementPrompt(answer);
    case 'targetAudience':
    case 'whose_problem':
    case 'early_revenue_whose_problem':
      return getTargetAudiencePrompt(answer);
    case 'solutionApproach':
    case 'how_solve_problem':
    case 'early_revenue_how_solve':
      return getSolutionApproachPrompt(answer);
    case 'monetizationStrategy':
    case 'how_make_money':
    case 'early_revenue_making_money':
      return getMonetizationPrompt(answer);
    case 'customerAcquisition':
    case 'acquire_customers':
    case 'early_revenue_acquiring_customers':
      return getCustomerAcquisitionPrompt(answer);
    case 'teamInfo':
    case 'team_roles':
    case 'early_revenue_team':
      return getTeamPrompt(answer);
    default:
      return `Analyze this answer and provide constructive feedback with BULLETPROOF formatting:

${BULLET_INTEGRITY_INSTRUCTIONS}

**Strengths in your current response:**
- [First strength - complete thought on one line]
- [Second strength - complete thought on one line]

**Areas for improvement:**
- [First improvement suggestion - complete thought on one line]
- [Second improvement suggestion - complete thought on one line]

Answer to analyze: "${answer}"`;
  }
};
