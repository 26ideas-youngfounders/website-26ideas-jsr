
/**
 * @fileoverview Client-side AI Question Prompts and Normalization
 * 
 * This file must be kept in sync with the server-side version in supabase/functions/ai-feedback/ai-question-prompts.ts
 */

/**
 * Universal question mapping system - client-side version
 * Must match the server-side normalizeQuestionId function exactly
 */
export const normalizeQuestionId = (questionId: string, questionText?: string, stage?: string): string => {
  // Enhanced direct mappings for all possible variations
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
    
    // Monetization - ENHANCED MAPPING FOR EARLY REVENUE - CRITICAL FIX
    "how_make_money": stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money",
    "making_money": stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money",
    "monetizationStrategy": stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money",
    "monetization_strategy": stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money", 
    "revenue_model": stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money",
    "how_making_money": stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money",
    "idea_making_money": stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money",
    "generate_revenue": stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money",
    "solve_problem_money": stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money",
    "money_solving": stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money",
    
    // Customer acquisition - ENHANCED MAPPING
    "acquire_customers": stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers",
    "acquiring_customers": stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers",
    "customerAcquisition": stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers",
    "customer_acquisition": stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers",
    "first_paying_customers": stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers",
    "paying_customers": stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers",
    "how_acquiring_customers": stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers",
    "how_are_you_acquiring": stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers",
    "acquiring_first_paying": stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers",
    "how_acquiring_first_paying": stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers",
    "how_many_paying_customers": stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers",
    "payingCustomers": stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers",
    
    // Duration/Timeline - ENHANCED MAPPING
    "working_duration": "early_revenue_working_duration",
    "workingDuration": "early_revenue_working_duration",
    "how_long_working": "early_revenue_working_duration",
    "duration": "early_revenue_working_duration",
    "how_long_been_working": "early_revenue_working_duration",
    "since_when_working": "early_revenue_working_duration",
    "been_working_on": "early_revenue_working_duration",
    "when_proceed": "when_proceed",
    "timeline": "when_proceed",
    "proceed_timeline": "when_proceed",
    
    // Competitors
    "competitors": stage === "early_revenue" ? "early_revenue_competitors" : "competitors",
    "competitor_analysis": stage === "early_revenue" ? "early_revenue_competitors" : "competitors",
    "list_competitors": stage === "early_revenue" ? "early_revenue_competitors" : "competitors",
    "competition": stage === "early_revenue" ? "early_revenue_competitors" : "competitors",
    
    // Product development
    "product_development": stage === "early_revenue" ? "early_revenue_product_development" : "product_development",
    "developmentApproach": stage === "early_revenue" ? "early_revenue_product_development" : "product_development",
    "development_approach": stage === "early_revenue" ? "early_revenue_product_development" : "product_development",
    "tech_approach": stage === "early_revenue" ? "early_revenue_product_development" : "product_development",
    
    // Team
    "team_roles": stage === "early_revenue" ? "early_revenue_team" : "team_roles",
    "teamInfo": stage === "early_revenue" ? "early_revenue_team" : "team_roles",
    "team_info": stage === "early_revenue" ? "early_revenue_team" : "team_roles",
    "who_on_team": stage === "early_revenue" ? "early_revenue_team" : "team_roles",
    "team": stage === "early_revenue" ? "early_revenue_team" : "team_roles"
  };
  
  console.log('🔍 Client normalizing question ID:', {
    originalId: questionId,
    stage,
    questionText: questionText?.substring(0, 50)
  });
  
  // First, try direct mapping
  if (mappings[questionId]) {
    const normalizedId = mappings[questionId];
    console.log('✅ Client direct mapping found:', normalizedId);
    return normalizedId;
  }
  
  // Enhanced fallback based on question text - MORE SPECIFIC MAPPINGS
  if (questionText) {
    const lowerText = questionText.toLowerCase();
    let fallbackId = "tell_us_about_idea"; // default
    
    if (lowerText.includes("tell us about your idea")) fallbackId = "tell_us_about_idea";
    else if (lowerText.includes("what problem does your idea solve")) fallbackId = stage === "early_revenue" ? "early_revenue_problem" : "problem_statement";
    else if (lowerText.includes("whose problem")) fallbackId = stage === "early_revenue" ? "early_revenue_whose_problem" : "whose_problem";
    else if (lowerText.includes("how does your idea solve")) fallbackId = stage === "early_revenue" ? "early_revenue_how_solve" : "how_solve_problem";
    // ENHANCED MONETIZATION TEXT MATCHING - CRITICAL FIX
    else if (lowerText.includes("make money") || lowerText.includes("making money") || lowerText.includes("generate revenue")) fallbackId = stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money";
    else if (lowerText.includes("money by solving") || lowerText.includes("money solving")) fallbackId = stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money";
    else if (lowerText.includes("idea making money")) fallbackId = stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money";
    else if (lowerText.includes("revenue") && lowerText.includes("problem")) fallbackId = stage === "early_revenue" ? "early_revenue_making_money" : "how_make_money";
    else if (lowerText.includes("acquiring") && (lowerText.includes("customers") || lowerText.includes("paying"))) fallbackId = stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers";
    else if (lowerText.includes("acquire") && lowerText.includes("customers")) fallbackId = stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers";
    else if (lowerText.includes("first paying customers")) fallbackId = stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers";
    else if (lowerText.includes("paying customers")) fallbackId = stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers";
    else if (lowerText.includes("how many") && lowerText.includes("paying")) fallbackId = stage === "early_revenue" ? "early_revenue_acquiring_customers" : "acquire_customers";
    else if (lowerText.includes("how long") && lowerText.includes("working")) fallbackId = "early_revenue_working_duration";
    else if (lowerText.includes("since when") && lowerText.includes("working")) fallbackId = "early_revenue_working_duration";
    else if (lowerText.includes("been working on")) fallbackId = "early_revenue_working_duration";
    else if (lowerText.includes("competitors")) fallbackId = stage === "early_revenue" ? "early_revenue_competitors" : "competitors";
    else if (lowerText.includes("developing the product")) fallbackId = stage === "early_revenue" ? "early_revenue_product_development" : "product_development";
    else if (lowerText.includes("team") && lowerText.includes("roles")) fallbackId = stage === "early_revenue" ? "early_revenue_team" : "team_roles";
    else if (lowerText.includes("when") && lowerText.includes("proceed")) fallbackId = "when_proceed";
    
    console.log('📝 Client text-based fallback:', fallbackId, 'for text:', lowerText.substring(0, 50));
    return fallbackId;
  }
  
  // Final fallback - return a default
  console.log('⚠️ Client using default fallback for questionId:', questionId);
  return "tell_us_about_idea";
};

/**
 * Client-side helper functions
 */
export const hasAIFeedback = (): boolean => {
  // EVERY question has AI feedback - no exceptions
  return true;
};
