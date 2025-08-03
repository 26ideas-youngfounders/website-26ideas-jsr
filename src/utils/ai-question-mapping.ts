
/**
 * @fileoverview AI Question Mapping Utilities
 * 
 * Maps frontend question identifiers to AI prompt keys
 * This ensures AI feedback buttons appear for all questions with available prompts
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { hasAIFeedback as hasPrompt } from './ai-question-prompts';

/**
 * Comprehensive mapping of frontend question identifiers to AI prompt keys
 * This handles all possible variations of question IDs used in the frontend
 */
const QUESTION_ID_TO_PROMPT_KEY_MAP: Record<string, string> = {
  // General/Common Questions (used across both stages)
  'ideaDescription': 'ideaDescription',
  'idea_description': 'ideaDescription',
  'tell_us_about_idea': 'ideaDescription',
  
  // Core Business Questions
  'problemSolved': 'problemSolved',
  'problem_solved': 'problemSolved',
  'problem_statement': 'problemSolved',
  'what_problem': 'problemSolved',
  
  'targetAudience': 'targetAudience',
  'target_audience': 'targetAudience',
  'whose_problem': 'targetAudience',
  'target_market': 'targetAudience',
  
  'solutionApproach': 'solutionApproach',
  'solution_approach': 'solutionApproach',
  'how_solve_problem': 'solutionApproach',
  'solution': 'solutionApproach',
  
  'monetizationStrategy': 'monetizationStrategy',
  'monetization_strategy': 'monetizationStrategy',
  'how_make_money': 'monetizationStrategy',
  'making_money': 'monetizationStrategy',
  'revenue_model': 'monetizationStrategy',
  
  'customerAcquisition': 'customerAcquisition',
  'customer_acquisition': 'customerAcquisition',
  'acquire_customers': 'customerAcquisition',
  'acquiring_customers': 'customerAcquisition',
  'customer_acquisition_plan': 'customerAcquisition',
  
  'payingCustomers': 'payingCustomers',
  'paying_customers': 'payingCustomers',
  'first_paying_customers': 'payingCustomers',
  'current_customers': 'payingCustomers',
  
  'workingDuration': 'workingDuration',
  'working_duration': 'workingDuration',
  'how_long_working': 'workingDuration',
  'duration': 'workingDuration',
  
  'competitors': 'competitors',
  'competitor_analysis': 'competitors',
  'list_competitors': 'competitors',
  'competition': 'competitors',
  
  'developmentApproach': 'developmentApproach',
  'development_approach': 'developmentApproach',
  'product_development': 'developmentApproach',
  'how_developing_product': 'developmentApproach',
  'tech_approach': 'developmentApproach',
  
  'teamInfo': 'teamInfo',
  'team_info': 'teamInfo',
  'team_roles': 'teamInfo',
  'who_on_team': 'teamInfo',
  'team_members': 'teamInfo',
  'team': 'teamInfo',
  
  'timeline': 'timeline',
  'when_proceed': 'timeline',
  'proceed_timeline': 'timeline',
  'launch_timeline': 'timeline'
};

/**
 * Question text to prompt key mapping for fallback resolution
 * This maps the actual question text shown to users to the correct prompt key
 */
const QUESTION_TEXT_TO_PROMPT_KEY_MAP: Record<string, string> = {
  // General Questions
  "Tell us about your idea": "ideaDescription",
  "Please articulate your business idea with specificity and clarity. Avoid using vague and generic statements.": "ideaDescription",
  
  // Core Business Questions
  "What problem does your idea solve?": "problemSolved",
  "What is the specific problem your business idea aims to solve? Explain its significance, include relevant data or statistics to quantify its impact, and cite any sources or research that support your answer.": "problemSolved",
  
  "Whose problem does your idea solve for?": "targetAudience",
  "Who is your ideal customer, and what solutions do they currently use to address the problem you are solving? Describe how these customers are addressing the problem today, provide evidence of their pain points, and support your answer with relevant market research and data.": "targetAudience",
  
  "How does your idea solve this problem?": "solutionApproach",
  "How does your idea solve the problem? Please explain your approach and the specific actions your solution takes to address this issue.": "solutionApproach",
  
  "How does your idea plan to make money by solving this problem?": "monetizationStrategy",
  "How will your business generate revenue? Please describe all the ways you plan to earn income (e.g., product sales, subscriptions, services, advertising, etc.). Provide your Annual Recurring Revenue (ARR) or Monthly Recurring Revenue (MRR) projections, and explain how you arrived at these numbers.": "monetizationStrategy",
  
  "How do you plan to acquire first paying customers?": "customerAcquisition",
  "How will you build and maintain relationships with your customers? Describe your customer relationship strategy, key touchpoints, and how you plan to ensure customer retention and satisfaction.": "customerAcquisition",
  
  "How many paying customers does your idea already have?": "payingCustomers",
  "How are you currently delivering your product or service to customers and what structured feedback mechanisms have you implemented? Describe your delivery process, feedback collection methods, and key insights gained from customer interactions.": "payingCustomers",
  
  "How long have you been working on this idea?": "workingDuration",
  "Specify the duration for which you and your team have been working on your business idea. Include any relevant milestones or stages you have reached over this period.": "workingDuration",
  
  "List 3 potential competitors in the similar space or attempting to solve a similar problem?": "competitors",
  "Who are your main competitors (both direct and indirect), and how does your idea stand out from them? Identify two existing competitors, explain their strengths and weaknesses, and describe the specific ways your idea is different or better. If you believe there are no competitors in this space, please support this claim with credible data or evidence.": "competitors",
  
  "How are you developing the product: in-house, with a technical co-founder, or outsourcing to an agency/partner?": "developmentApproach",
  "How are you developing the product: in-house, with a technical co-founder, or outsourcing to an agency/partner? Specify your product development approach. Clearly state whether you are building the product in-house (using your own team or resources), in partnership with a technical co-founder, or by outsourcing the work to an external agency or development partner. If your approach is hybrid or changed over time, explain how and why.": "developmentApproach",
  
  "Who is on your team, and what are their roles?": "teamInfo",
  "Describe how you/your team's background, skills, and experience uniquely qualify you to tackle this problem. What insights or advantages do you/your team have that make you the right person to build this solution?": "teamInfo",
  
  "When do you plan to proceed with the idea?": "timeline",
  "Please specify your planned timeline or schedule for moving forward with your business idea, including key milestones or phases if applicable.": "timeline"
};

/**
 * Resolves a question identifier or text to the correct AI prompt key
 * This function handles all variations and fallbacks to ensure maximum coverage
 * 
 * @param questionIdentifier - The question ID, name, or actual text
 * @param questionText - Optional fallback question text for resolution
 * @returns The resolved prompt key, or null if no mapping exists
 */
export const resolvePromptKey = (
  questionIdentifier: string, 
  questionText?: string
): string | null => {
  console.log('🔍 Resolving prompt key for:', questionIdentifier, 'with text:', questionText?.substring(0, 50));
  
  // First, try direct ID mapping
  let promptKey = QUESTION_ID_TO_PROMPT_KEY_MAP[questionIdentifier];
  
  if (promptKey) {
    console.log('✅ Found prompt key via ID mapping:', promptKey);
    return promptKey;
  }
  
  // If no direct mapping, try question text mapping
  if (questionText) {
    promptKey = QUESTION_TEXT_TO_PROMPT_KEY_MAP[questionText.trim()];
    
    if (promptKey) {
      console.log('✅ Found prompt key via text mapping:', promptKey);
      return promptKey;
    }
    
    // Try partial text matching for sub-questions
    for (const [text, key] of Object.entries(QUESTION_TEXT_TO_PROMPT_KEY_MAP)) {
      if (questionText.includes(text) || text.includes(questionText)) {
        console.log('✅ Found prompt key via partial text match:', key);
        return key;
      }
    }
  }
  
  // Last resort: use the identifier as-is if it has a prompt
  if (hasPrompt(questionIdentifier)) {
    console.log('✅ Using identifier as-is:', questionIdentifier);
    return questionIdentifier;
  }
  
  console.log('❌ No prompt key found for:', questionIdentifier);
  return null;
};

/**
 * Enhanced version of hasAIFeedback that uses the mapping system
 * 
 * @param questionIdentifier - The question ID or identifier
 * @param questionText - Optional question text for fallback resolution
 * @returns True if AI feedback is available for this question
 */
export const hasAIFeedback = (
  questionIdentifier: string, 
  questionText?: string
): boolean => {
  const promptKey = resolvePromptKey(questionIdentifier, questionText);
  const result = promptKey ? hasPrompt(promptKey) : false;
  
  console.log('🔍 hasAIFeedback result:', {
    questionIdentifier,
    promptKey,
    hasPrompt: result
  });
  
  return result;
};

/**
 * Gets the resolved prompt key for use with the AI feedback system
 * 
 * @param questionIdentifier - The question ID or identifier
 * @param questionText - Optional question text for fallback resolution
 * @returns The prompt key to use with the AI system, or null if none found
 */
export const getPromptKey = (
  questionIdentifier: string, 
  questionText?: string
): string | null => {
  return resolvePromptKey(questionIdentifier, questionText);
};

/**
 * Debug function to validate all mappings
 */
export const debugMappings = () => {
  console.log('🔍 Question ID mappings:', Object.keys(QUESTION_ID_TO_PROMPT_KEY_MAP).length);
  console.log('🔍 Question text mappings:', Object.keys(QUESTION_TEXT_TO_PROMPT_KEY_MAP).length);
  
  // Check for any missing mappings
  const allPromptKeys = Object.values(QUESTION_ID_TO_PROMPT_KEY_MAP).concat(
    Object.values(QUESTION_TEXT_TO_PROMPT_KEY_MAP)
  );
  
  const uniqueKeys = [...new Set(allPromptKeys)];
  console.log('🔍 Unique prompt keys referenced:', uniqueKeys);
  
  // Validate that all referenced keys have prompts
  const missingPrompts = uniqueKeys.filter(key => !hasPrompt(key));
  if (missingPrompts.length > 0) {
    console.warn('⚠️ Missing prompts for keys:', missingPrompts);
  }
};
