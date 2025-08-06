
/**
 * @fileoverview Unified Stage Detection System
 * 
 * Single source of truth for stage detection across all components.
 * Handles both "Early Revenue" and "Idea Stage / MLP / Working Prototype" formats.
 * Fixed to properly access nested data structures with safe property access.
 * 
 * @version 1.1.0
 * @author 26ideas Development Team
 */

import { ExtendedYffApplication, parseApplicationAnswers } from '@/types/yff-application';

export type UnifiedStage = 'idea_stage' | 'early_revenue' | 'mvp_stage';

export interface StageQuestion {
  id: string;
  label: string;
  order: number;
}

/**
 * Authoritative stage question mappings
 */
export const UNIFIED_STAGE_QUESTIONS: Record<UnifiedStage, StageQuestion[]> = {
  idea_stage: [
    { id: "ideaDescription", label: "Tell us about your idea", order: 1 },
    { id: "problemSolved", label: "What problem does your idea solve?", order: 2 },
    { id: "targetAudience", label: "Whose problem does your idea solve for?", order: 3 },
    { id: "solutionApproach", label: "How does your idea solve this problem?", order: 4 },
    { id: "monetizationStrategy", label: "How does your idea make money?", order: 5 },
    { id: "customerAcquisition", label: "How will you acquire your first customers?", order: 6 },
    { id: "competitors", label: "List 3 potential competitors", order: 7 },
    { id: "developmentApproach", label: "How will you develop the product?", order: 8 },
    { id: "teamInfo", label: "Who is on your team?", order: 9 },
    { id: "timeline", label: "When do you plan to proceed?", order: 10 }
  ],
  early_revenue: [
    { id: "tell_us_about_idea", label: "Tell us about your idea", order: 1 },
    { id: "early_revenue_problem", label: "What problem does your idea solve?", order: 2 },
    { id: "early_revenue_target", label: "Whose problem does your idea solve for?", order: 3 },
    { id: "early_revenue_how_solve", label: "How does your idea solve this problem?", order: 4 },
    { id: "early_revenue_monetization", label: "How do you plan to make money from this idea?", order: 5 },
    { id: "early_revenue_customers", label: "How do you plan to acquire first paying customers?", order: 6 },
    { id: "early_revenue_competitors", label: "List 3 potential competitors for your idea", order: 7 },
    { id: "early_revenue_development", label: "What is your approach to product development?", order: 8 },
    { id: "early_revenue_team", label: "Who is on your team, and what are their roles?", order: 9 },
    { id: "early_revenue_timeline", label: "When do you plan to proceed with the idea?", order: 10 }
  ],
  mvp_stage: [
    { id: "tell_us_about_idea", label: "Tell us about your idea", order: 1 },
    { id: "mvp_description", label: "Describe your MVP", order: 2 },
    { id: "user_feedback", label: "What feedback have you received from users?", order: 3 },
    { id: "traction_metrics", label: "What traction have you achieved?", order: 4 },
    { id: "revenue_model", label: "What is your revenue model?", order: 5 },
    { id: "growth_strategy", label: "What is your growth strategy?", order: 6 },
    { id: "competitive_advantage", label: "What is your competitive advantage?", order: 7 },
    { id: "team_expansion", label: "How do you plan to expand your team?", order: 8 },
    { id: "funding_requirements", label: "What are your funding requirements?", order: 9 },
    { id: "milestones", label: "What are your key milestones?", order: 10 }
  ]
};

/**
 * Extract canonical stage from any stage string value
 * Fixed to properly handle "Idea Stage / MLP / Working Prototype"
 */
export const extractUnifiedStage = (stageValue: string | undefined): UnifiedStage | null => {
  console.log('🎯 UNIFIED STAGE EXTRACTION from:', stageValue);
  
  if (!stageValue || typeof stageValue !== 'string') {
    console.log('❌ NO STAGE VALUE PROVIDED');
    return null;
  }
  
  const trimmed = stageValue.trim();
  console.log('📋 TRIMMED STAGE VALUE:', trimmed);
  
  // Handle exact "Early Revenue" format
  if (trimmed === "Early Revenue") {
    console.log('✅ DETECTED: Early Revenue');
    return 'early_revenue';
  }
  
  // Handle "Idea Stage / MLP / Working Prototype" and ALL variations
  if (trimmed === "Idea Stage / MLP / Working Prototype" || 
      trimmed.includes("Idea Stage") || 
      trimmed === "Idea Stage" ||
      trimmed.includes("MLP") ||
      trimmed.includes("Working Prototype")) {
    console.log('✅ DETECTED: Idea Stage (includes MLP/Working Prototype)');
    return 'idea_stage';
  }
  
  // Handle MVP variations
  if (trimmed === "MVP Stage" || trimmed === "MVP" || 
      trimmed === "Minimum Viable Product" || trimmed.startsWith("MVP")) {
    console.log('✅ DETECTED: MVP Stage');
    return 'mvp_stage';
  }
  
  console.log('❌ NO UNIFIED STAGE MATCH FOUND for:', trimmed);
  return null;
};

/**
 * Safely parse nested data structure with detailed logging
 */
const safelyAccessProductStage = (application: ExtendedYffApplication): {
  productStage: string | undefined;
  source: string;
  debugInfo: any;
} => {
  console.log('🔍 DEBUGGING APPLICATION STRUCTURE:');
  console.log('🔍 APPLICATION KEYS:', Object.keys(application));
  console.log('🔍 APPLICATION.ANSWERS TYPE:', typeof application.answers);
  console.log('🔍 APPLICATION.ANSWERS:', application.answers);
  
  // Method 1: Direct access to answers.questionnaire_answers.productStage
  try {
    if (application.answers && typeof application.answers === 'object') {
      const answers = application.answers;
      console.log('🔍 ANSWERS OBJECT KEYS:', Object.keys(answers));
      
      if (answers.questionnaire_answers && typeof answers.questionnaire_answers === 'object') {
        const questionnaireAnswers = answers.questionnaire_answers;
        console.log('🔍 QUESTIONNAIRE_ANSWERS KEYS:', Object.keys(questionnaireAnswers));
        
        const productStage = questionnaireAnswers.productStage;
        console.log('🎯 FOUND PRODUCTSTAGE VIA DIRECT ACCESS:', productStage);
        
        if (productStage && typeof productStage === 'string') {
          return {
            productStage,
            source: 'answers.questionnaire_answers.productStage',
            debugInfo: { method: 'direct_access', keys: Object.keys(questionnaireAnswers) }
          };
        }
      }
    }
  } catch (error) {
    console.log('❌ ERROR IN DIRECT ACCESS:', error);
  }
  
  // Method 2: Parse answers as JSON string if needed
  try {
    if (typeof application.answers === 'string') {
      console.log('🔍 ANSWERS IS STRING, PARSING...');
      const parsedAnswers = JSON.parse(application.answers);
      console.log('🔍 PARSED ANSWERS:', parsedAnswers);
      
      const productStage = parsedAnswers?.questionnaire_answers?.productStage;
      console.log('🎯 FOUND PRODUCTSTAGE VIA JSON PARSING:', productStage);
      
      if (productStage && typeof productStage === 'string') {
        return {
          productStage,
          source: 'parsed answers.questionnaire_answers.productStage',
          debugInfo: { method: 'json_parse', parsedKeys: Object.keys(parsedAnswers) }
        };
      }
    }
  } catch (error) {
    console.log('❌ ERROR IN JSON PARSING:', error);
  }
  
  // Method 3: Check yff_team_registrations
  try {
    if (application.yff_team_registrations) {
      console.log('🔍 YFF_TEAM_REGISTRATIONS:', application.yff_team_registrations);
      
      // Direct productStage field
      const directProductStage = application.yff_team_registrations.productStage;
      console.log('🎯 YFF_TEAM_REGISTRATIONS.PRODUCTSTAGE:', directProductStage);
      
      if (directProductStage && typeof directProductStage === 'string') {
        return {
          productStage: directProductStage,
          source: 'yff_team_registrations.productStage',
          debugInfo: { method: 'team_registration_direct' }
        };
      }
      
      // Check questionnaire_answers within yff_team_registrations
      let questionnaireAnswers = application.yff_team_registrations.questionnaire_answers;
      
      if (typeof questionnaireAnswers === 'string') {
        questionnaireAnswers = JSON.parse(questionnaireAnswers);
      }
      
      if (questionnaireAnswers && typeof questionnaireAnswers === 'object') {
        const productStage = (questionnaireAnswers as any).productStage;
        console.log('🎯 YFF_TEAM_REGISTRATIONS.QUESTIONNAIRE_ANSWERS.PRODUCTSTAGE:', productStage);
        
        if (productStage && typeof productStage === 'string') {
          return {
            productStage,
            source: 'yff_team_registrations.questionnaire_answers.productStage',
            debugInfo: { method: 'team_registration_nested' }
          };
        }
      }
    }
  } catch (error) {
    console.log('❌ ERROR IN YFF_TEAM_REGISTRATIONS ACCESS:', error);
  }
  
  // Method 4: Alternative paths
  const alternativePaths = [
    { 
      getter: () => (application as any)?.questionnaire_answers?.productStage, 
      name: 'application.questionnaire_answers.productStage' 
    },
    { 
      getter: () => application?.productStage, 
      name: 'application.productStage' 
    },
    { 
      getter: () => application?.stage, 
      name: 'application.stage' 
    },
    { 
      getter: () => application?.selected_stage, 
      name: 'application.selected_stage' 
    }
  ];
  
  for (const path of alternativePaths) {
    try {
      const value = path.getter();
      console.log(`🎯 ALTERNATIVE PATH ${path.name}:`, value);
      
      if (value && typeof value === 'string') {
        return {
          productStage: value,
          source: path.name,
          debugInfo: { method: 'alternative_path' }
        };
      }
    } catch (error) {
      console.log(`❌ ERROR IN ALTERNATIVE PATH ${path.name}:`, error);
    }
  }
  
  console.log('❌ NO PRODUCTSTAGE FOUND IN ANY LOCATION');
  return {
    productStage: undefined,
    source: 'none',
    debugInfo: { 
      applicationKeys: Object.keys(application),
      answersType: typeof application.answers,
      teamRegistrationsExists: !!application.yff_team_registrations
    }
  };
};

/**
 * Unified stage detection function - single source of truth with enhanced data access
 */
export const detectUnifiedStage = (application: ExtendedYffApplication): {
  stage: UnifiedStage | null;
  rawStageValue: string | undefined;
  detectionSource: string;
  warnings: string[];
} => {
  console.log('🔍 UNIFIED STAGE DETECTION for application:', application.application_id);
  
  const warnings: string[] = [];
  
  // Use the safe access function
  const accessResult = safelyAccessProductStage(application);
  const { productStage, source, debugInfo } = accessResult;
  
  console.log('🎯 PRODUCT STAGE ACCESS RESULT:', accessResult);
  
  if (productStage) {
    const stage = extractUnifiedStage(productStage);
    if (stage) {
      console.log('✅ UNIFIED STAGE SUCCESSFULLY DETECTED:', stage);
      return {
        stage,
        rawStageValue: productStage,
        detectionSource: source,
        warnings
      };
    } else {
      warnings.push(`Could not extract unified stage from productStage: "${productStage}"`);
    }
  } else {
    warnings.push('No productStage value found in any expected location');
    warnings.push(`Debug info: ${JSON.stringify(debugInfo)}`);
  }
  
  console.log('❌ NO UNIFIED STAGE DETECTED');
  
  return {
    stage: null,
    rawStageValue: productStage,
    detectionSource: source,
    warnings
  };
};

/**
 * Get questions for a specific stage
 */
export const getQuestionsForUnifiedStage = (stage: UnifiedStage): StageQuestion[] => {
  return UNIFIED_STAGE_QUESTIONS[stage] || [];
};

/**
 * Get stage display name
 */
export const getUnifiedStageDisplayName = (stage: UnifiedStage): string => {
  const displayNames: Record<UnifiedStage, string> = {
    idea_stage: 'Idea Stage',
    early_revenue: 'Early Revenue',
    mvp_stage: 'MVP Stage'
  };
  return displayNames[stage];
};

/**
 * Get stage color for UI display
 */
export const getUnifiedStageColor = (stage: UnifiedStage): string => {
  const colors: Record<UnifiedStage, string> = {
    idea_stage: 'bg-purple-100 text-purple-700 border-purple-200',
    early_revenue: 'bg-blue-100 text-blue-700 border-blue-200',
    mvp_stage: 'bg-green-100 text-green-700 border-green-200'
  };
  return colors[stage];
};
