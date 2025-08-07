
/**
 * @fileoverview Client-side AI Question Prompts Configuration
 * 
 * Enhanced universal question mapping system for complete AI feedback coverage
 * Now includes all Early Revenue Stage system prompts with bulletproof normalization
 * 
 * This file must be kept in sync with the server-side version in supabase/functions/ai-feedback/ai-question-prompts.ts
 */

/**
 * Universal question mapping system - Enhanced for 100% coverage
 * Maps all possible question ID variations to normalized IDs
 */
export const normalizeQuestionId = (questionId: string, questionText?: string, stage?: string): string => {
  console.log('🔍 Client normalizing question ID:', {
    originalId: questionId,
    stage,
    questionText: questionText?.substring(0, 50)
  });

  // Enhanced direct mappings for all possible variations - COMPLETE COVERAGE
  const mappings: Record<string, string> = {
    // Tell us about your idea (universal)
    "tell_us_about_idea": "tell_us_about_idea",
    "ideaDescription": "tell_us_about_idea",
    "idea_description": "tell_us_about_idea",
    "business_idea": "tell_us_about_idea",
    
    // Problem statement - stage-aware
    "problem_statement": stage === "early_revenue" ? "early_revenue_problem" : "problem_statement",
    "problemSolved": stage === "early_revenue" ? "early_revenue_problem" : "problem_statement",
    "what_problem": stage === "early_revenue" ? "early_revenue_problem" : "problem_statement",
    "problem_solved": stage === "early_revenue" ? "early_revenue_problem" : "problem_statement",
    
    // Target audience - stage-aware
    "whose_problem": stage === "early_revenue" ? "early_revenue_whose_problem" : "whose_problem",
    "targetAudience": stage === "early_revenue" ? "early_revenue_whose_problem" : "whose_problem",
    "target_audience": stage === "early_revenue" ? "early_revenue_whose_problem" : "whose_problem",
    "target_market": stage === "early_revenue" ? "early_revenue_whose_problem" : "whose_problem",
    
    // Solution approach - stage-aware
    "how_solve_problem": stage === "early_revenue" ? "early_revenue_how_solve" : "how_solve_problem",
    "solutionApproach": stage === "early_revenue" ? "early_revenue_how_solve" : "how_solve_problem",
    "solution_approach": stage === "early_revenue" ? "early_revenue_how_solve" : "how_solve_problem",
    "solution": stage === "early_revenue" ? "early_revenue_how_solve" : "how_solve_problem",
    
    // Monetization - stage-aware
    "how_make_money": stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money",
    "making_money": stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money",
    "monetizationStrategy": stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money",
    "monetization_strategy": stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money",
    "revenue_model": stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money",
    
    // Customer acquisition/Paying customers - stage-aware with specific early revenue mappings
    "acquire_customers": stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers",
    "acquiring_customers": stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers",
    "customerAcquisition": stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers",
    "customer_acquisition": stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers",
    "first_paying_customers": "early_revenue_acquiring_customers",
    "paying_customers": "early_revenue_acquiring_customers",
    "payingCustomers": "early_revenue_acquiring_customers",
    "early_revenue_existing_customers": "early_revenue_acquiring_customers",
    
    // Working duration / timeline (Early Revenue specific)
    "working_duration": "early_revenue_working_duration",
    "workingDuration": "early_revenue_working_duration",
    "since_when": "early_revenue_working_duration",
    "duration_working": "early_revenue_working_duration",
    "early_revenue_timeline": "early_revenue_working_duration",
    
    // Team - stage-aware
    "team_roles": stage === "early_revenue" ? "early_revenue_team" : "team_roles",
    "teamInfo": stage === "early_revenue" ? "early_revenue_team" : "team_roles",
    "team_info": stage === "early_revenue" ? "early_revenue_team" : "team_roles",
    "team": stage === "early_revenue" ? "early_revenue_team" : "team_roles",
    
    // Product development - stage-aware
    "product_development": stage === "early_revenue" ? "early_revenue_product_development" : "product_development",
    "developmentApproach": stage === "early_revenue" ? "early_revenue_product_development" : "product_development",
    "development_approach": stage === "early_revenue" ? "early_revenue_product_development" : "product_development",
    
    // Competitors - stage-aware
    "competitors": stage === "early_revenue" ? "early_revenue_competitors" : "competitors",
    "competition": stage === "early_revenue" ? "early_revenue_competitors" : "competitors",
    
    // Idea stage specific mappings
    "when_proceed": "when_proceed"
  };
  
  // Direct mapping first
  if (mappings[questionId]) {
    const normalizedId = mappings[questionId];
    console.log('✅ Client direct mapping found:', normalizedId);
    return normalizedId;
  }
  
  // Enhanced text-based fallback with stage awareness
  if (questionText) {
    const lowerText = questionText.toLowerCase();
    let fallbackId = "tell_us_about_idea";
    
    if (lowerText.includes("tell us about your idea")) {
      fallbackId = "tell_us_about_idea";
    } else if (lowerText.includes("what problem") || lowerText.includes("problem does")) {
      fallbackId = stage === "early_revenue" ? "early_revenue_problem" : "problem_statement";
    } else if (lowerText.includes("whose problem") || lowerText.includes("target")) {
      fallbackId = stage === "early_revenue" ? "early_revenue_whose_problem" : "whose_problem";
    } else if (lowerText.includes("how does your idea solve") || lowerText.includes("solution")) {
      fallbackId = stage === "early_revenue" ? "early_revenue_how_solve" : "how_solve_problem";
    } else if (lowerText.includes("making money") || lowerText.includes("revenue") || lowerText.includes("monetiz")) {
      fallbackId = stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money";
    } else if (lowerText.includes("paying customers") || lowerText.includes("first paying")) {
      fallbackId = "early_revenue_acquiring_customers";
    } else if (lowerText.includes("acquiring") && lowerText.includes("customers")) {
      fallbackId = stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers";
    } else if (lowerText.includes("since when") || lowerText.includes("working duration") || lowerText.includes("how long")) {
      fallbackId = "early_revenue_working_duration";
    } else if (lowerText.includes("team") && (lowerText.includes("roles") || lowerText.includes("composition"))) {
      fallbackId = stage === "early_revenue" ? "early_revenue_team" : "team_roles";
    } else if (lowerText.includes("competitors") || lowerText.includes("competition")) {
      fallbackId = stage === "early_revenue" ? "early_revenue_competitors" : "competitors";
    } else if (lowerText.includes("product development") || lowerText.includes("develop")) {
      fallbackId = stage === "early_revenue" ? "early_revenue_product_development" : "product_development";
    } else if (lowerText.includes("when") && lowerText.includes("proceed")) {
      fallbackId = "when_proceed";
    }
    
    console.log('📝 Client text-based fallback:', fallbackId);
    return fallbackId;
  }
  
  console.log('⚠️ Client using default fallback for questionId:', questionId);
  return "tell_us_about_idea";
};

/**
 * Check if AI feedback is available for a question
 * Now returns true for all questions since we have universal coverage
 */
export const hasAIFeedback = (questionId: string, questionText?: string, stage?: string): boolean => {
  // Normalize the question ID to check if we have a prompt for it
  const normalizedId = normalizeQuestionId(questionId, questionText, stage);
  
  // List of all available prompt IDs
  const availablePrompts = [
    'tell_us_about_idea',
    'problem_statement',
    'whose_problem',
    'how_solve_problem',
    'how_make_money',
    'acquire_customers',
    'competitors',
    'product_development',
    'team_roles',
    'when_proceed',
    // Early revenue stage prompts
    'early_revenue_problem',
    'early_revenue_whose_problem',
    'early_revenue_how_solve',
    'early_revenue_making_money',
    'early_revenue_acquiring_customers',
    'early_revenue_working_duration',
    'early_revenue_team',
    'early_revenue_competitors',
    'early_revenue_product_development'
  ];
  
  const hasPrompt = availablePrompts.includes(normalizedId);
  
  console.log('🔍 AI Feedback availability check:', {
    questionId,
    normalizedId,
    stage,
    hasPrompt
  });
  
  return hasPrompt;
};

/**
 * Get the appropriate stage for AI feedback
 */
export const getAIFeedbackStage = (registration?: any): 'idea' | 'early_revenue' => {
  // Check various possible stage indicators
  if (registration) {
    // Check product_stage field
    if (registration.product_stage === 'early_revenue') {
      return 'early_revenue';
    }
    
    // Check questionnaire answers for stage indication
    if (registration.questionnaire_answers) {
      const answers = typeof registration.questionnaire_answers === 'string' 
        ? JSON.parse(registration.questionnaire_answers)
        : registration.questionnaire_answers;
        
      // Look for early revenue indicators in answers
      if (answers.product_stage === 'early_revenue' || 
          answers.stage === 'early_revenue' ||
          answers.payingCustomers ||
          answers.workingDuration) {
        return 'early_revenue';
      }
    }
  }
  
  return 'idea'; // Default to idea stage
};

/**
 * Enhanced question text extraction for better AI feedback
 */
export const extractQuestionText = (questionId: string, questionText?: string): string => {
  if (questionText && questionText.trim()) {
    return questionText.trim();
  }
  
  // Fallback question texts based on normalized IDs
  const questionTexts: Record<string, string> = {
    'tell_us_about_idea': 'Tell us about your idea',
    'problem_statement': 'What problem does your idea solve?',
    'early_revenue_problem': 'What problem does your idea solve?',
    'whose_problem': 'Whose problem are you solving?',
    'early_revenue_whose_problem': 'Who are your target customers?',
    'how_solve_problem': 'How does your idea solve this problem?',
    'early_revenue_how_solve': 'How does your solution address the problem?',
    'how_make_money': 'How will you make money?',
    'early_revenue_making_money': 'How are you making money?',
    'acquire_customers': 'How will you acquire your first customers?',
    'early_revenue_acquiring_customers': 'How are you acquiring paying customers?',
    'early_revenue_working_duration': 'Since when have you been working on this?',
    'team_roles': 'Tell us about your team',
    'early_revenue_team': 'Tell us about your team composition',
    'competitors': 'Who are your competitors?',
    'early_revenue_competitors': 'Who are your main competitors?',
    'product_development': 'How will you develop your product?',
    'early_revenue_product_development': 'How are you developing your product?',
    'when_proceed': 'When do you want to proceed?'
  };
  
  const normalizedId = normalizeQuestionId(questionId);
  return questionTexts[normalizedId] || questionId;
};
