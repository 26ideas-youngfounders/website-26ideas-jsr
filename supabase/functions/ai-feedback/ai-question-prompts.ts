
/**
 * @fileoverview Server-side AI Question Prompts Configuration
 * 
 * This file must be kept in sync with the client-side version in src/utils/ai-feedback-prompts.ts
 */

/**
 * Universal question mapping system - server-side version
 * Must match the client-side normalizeQuestionId function exactly
 */
export const normalizeQuestionId = (questionId: string, questionText?: string, stage?: string): string => {
  // Enhanced direct mappings for all possible variations - COMPLETE COVERAGE
  const mappings: Record<string, string> = {
    // Tell us about your idea
    "tell_us_about_idea": "tell_us_about_idea",
    "ideaDescription": "tell_us_about_idea",
    "idea_description": "tell_us_about_idea",
    "business_idea": "tell_us_about_idea",
    
    // Problem statement
    "problem_statement": stage === "early_revenue" ? "early_revenue_problem" : "problem_statement",
    "problemSolved": stage === "early_revenue" ? "early_revenue_problem" : "problem_statement",
    "what_problem": stage === "early_revenue" ? "early_revenue_problem" : "problem_statement",
    "problem_solved": stage === "early_revenue" ? "early_revenue_problem" : "problem_statement",
    
    // Target audience
    "whose_problem": stage === "early_revenue" ? "early_revenue_whose_problem" : "whose_problem",
    "targetAudience": stage === "early_revenue" ? "early_revenue_whose_problem" : "whose_problem",
    "target_audience": stage === "early_revenue" ? "early_revenue_whose_problem" : "whose_problem",
    "target_market": stage === "early_revenue" ? "early_revenue_whose_problem" : "whose_problem",
    
    // Solution approach
    "how_solve_problem": stage === "early_revenue" ? "early_revenue_how_solve" : "how_solve_problem",
    "solutionApproach": stage === "early_revenue" ? "early_revenue_how_solve" : "how_solve_problem",
    "solution_approach": stage === "early_revenue" ? "early_revenue_how_solve" : "how_solve_problem",
    "solution": stage === "early_revenue" ? "early_revenue_how_solve" : "how_solve_problem",
    
    // Monetization
    "how_make_money": stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money",
    "making_money": stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money",
    "monetizationStrategy": stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money",
    "monetization_strategy": stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money",
    "revenue_model": stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money",
    
    // Customer acquisition
    "acquire_customers": stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers",
    "acquiring_customers": stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers",
    "customerAcquisition": stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers",
    "customer_acquisition": stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers",
    "first_paying_customers": stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers",
    
    // Team
    "team_roles": stage === "early_revenue" ? "early_revenue_team" : "team_roles",
    "teamInfo": stage === "early_revenue" ? "early_revenue_team" : "team_roles",
    "team_info": stage === "early_revenue" ? "early_revenue_team" : "team_roles",
    "team": stage === "early_revenue" ? "early_revenue_team" : "team_roles"
  };
  
  console.log('🔍 Server normalizing question ID:', {
    originalId: questionId,
    stage,
    questionText: questionText?.substring(0, 50),
    mappingResult: mappings[questionId] || 'NO_DIRECT_MAPPING'
  });
  
  // Direct mapping first
  if (mappings[questionId]) {
    const normalizedId = mappings[questionId];
    console.log('✅ Server direct mapping found:', normalizedId);
    return normalizedId;
  }
  
  // Text-based fallback
  if (questionText) {
    const lowerText = questionText.toLowerCase();
    let fallbackId = "tell_us_about_idea";
    
    if (lowerText.includes("tell us about your idea")) fallbackId = "tell_us_about_idea";
    else if (lowerText.includes("what problem does your idea solve")) fallbackId = stage === "early_revenue" ? "early_revenue_problem" : "problem_statement";
    else if (lowerText.includes("whose problem")) fallbackId = stage === "early_revenue" ? "early_revenue_whose_problem" : "whose_problem";
    else if (lowerText.includes("how does your idea solve")) fallbackId = stage === "early_revenue" ? "early_revenue_how_solve" : "how_solve_problem";
    else if (lowerText.includes("making money") || lowerText.includes("revenue")) fallbackId = stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money";
    else if (lowerText.includes("acquiring") && lowerText.includes("customers")) fallbackId = stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers";
    else if (lowerText.includes("team") && lowerText.includes("roles")) fallbackId = stage === "early_revenue" ? "early_revenue_team" : "team_roles";
    
    console.log('📝 Server text-based fallback:', fallbackId);
    return fallbackId;
  }
  
  console.log('⚠️ Server using default fallback for questionId:', questionId);
  return "tell_us_about_idea";
};

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
 * Gets system prompt for problem statement analysis
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

Focus on: clarity of the problem, target audience specificity, market size indication, urgency/pain level, and validation evidence.

Problem statement: "${answer}"`;
};

/**
 * Gets system prompt for target audience analysis
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

Focus on: demographic specificity, behavioral characteristics, market size, accessibility, and willingness to pay.

Target audience: "${answer}"`;
};

/**
 * Gets system prompt for solution approach analysis
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

Focus on: problem-solution fit, technical feasibility, competitive differentiation, scalability, and user experience.

Solution approach: "${answer}"`;
};

/**
 * Gets system prompt for monetization strategy analysis
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
 * Gets system prompt for customer acquisition analysis
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

Customer acquisition: "${answer}"`;
};

/**
 * Gets system prompt for team composition analysis
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

/**
 * Server-side system prompt generator with bulletproof formatting
 */
export const getSystemPrompt = (questionId: string, answer?: string): string => {
  const userAnswer = answer || '';
  
  // Normalize the question ID first
  const normalizedId = normalizeQuestionId(questionId);
  
  console.log('🤖 Server generating system prompt for:', {
    originalId: questionId,
    normalizedId,
    hasAnswer: Boolean(userAnswer)
  });
  
  switch (normalizedId) {
    case 'problem_statement':
    case 'early_revenue_problem':
      return getProblemStatementPrompt(userAnswer);
      
    case 'whose_problem':
    case 'early_revenue_whose_problem':
      return getTargetAudiencePrompt(userAnswer);
      
    case 'how_solve_problem':
    case 'early_revenue_how_solve':
      return getSolutionApproachPrompt(userAnswer);
      
    case 'how_make_money':
    case 'early_revenue_making_money':
      return getMonetizationPrompt(userAnswer);
      
    case 'acquire_customers':
    case 'early_revenue_acquiring_customers':
      return getCustomerAcquisitionPrompt(userAnswer);
      
    case 'team_roles':
    case 'early_revenue_team':
      return getTeamPrompt(userAnswer);
      
    default:
      return `Analyze this answer and provide constructive feedback with BULLETPROOF formatting:

${BULLET_INTEGRITY_INSTRUCTIONS}

**Strengths in your current response:**
- [First strength - complete thought on one line]
- [Second strength - complete thought on one line]

**Areas for improvement:**
- [First improvement suggestion - complete thought on one line]
- [Second improvement suggestion - complete thought on one line]

Answer: "${userAnswer}"`;
  }
};

/**
 * Check if AI feedback is available for a question
 */
export const hasAIFeedback = (questionId: string): boolean => {
  // AI feedback is available for all questions
  return true;
};
