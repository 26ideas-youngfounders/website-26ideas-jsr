
/**
 * @fileoverview Strict Stage Detection and Mapping Service
 * 
 * Provides authoritative stage detection and prevents cross-stage contamination
 * in questionnaire answer rendering.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { ExtendedYffApplication } from '@/types/yff-application';

export type AuthoritativeStage = 'idea_stage' | 'early_revenue' | 'mvp_stage';

/**
 * Strict stage name mappings - no fuzzy matching allowed
 */
const STAGE_NAME_MAPPINGS: Record<string, AuthoritativeStage> = {
  // Exact matches for Idea Stage
  'Idea Stage': 'idea_stage',
  'idea stage': 'idea_stage',
  'IDEA STAGE': 'idea_stage',
  'idea_stage': 'idea_stage',
  'Idea': 'idea_stage',
  
  // Exact matches for Early Revenue
  'Early Revenue': 'early_revenue',
  'early revenue': 'early_revenue',
  'EARLY REVENUE': 'early_revenue',
  'early_revenue': 'early_revenue',
  'Revenue': 'early_revenue',
  
  // Exact matches for MVP Stage
  'MVP Stage': 'mvp_stage',
  'mvp stage': 'mvp_stage',
  'MVP STAGE': 'mvp_stage',
  'mvp_stage': 'mvp_stage',
  'MVP': 'mvp_stage',
  'Minimum Viable Product': 'mvp_stage'
};

/**
 * Strict question mappings - each stage has its own exclusive question set
 */
export const STRICT_STAGE_QUESTIONS: Record<AuthoritativeStage, Record<string, string>> = {
  idea_stage: {
    'ideaDescription': 'Tell us about your idea',
    'problemSolved': 'What problem does your idea solve?',
    'targetAudience': 'Whose problem does your idea solve for?',
    'solutionApproach': 'How does your idea solve this problem?',
    'monetizationPlan': 'How do you plan to make money from this idea?',
    'customerAcquisition': 'How do you plan to acquire first paying customers?',
    'competitorAnalysis': 'List 3 potential competitors for your idea',
    'developmentApproach': 'What is your approach to product development?',
    'teamComposition': 'Who is on your team, and what are their roles?',
    'timeline': 'When do you plan to proceed with the idea?'
  },
  early_revenue: {
    'tell_us_about_idea': 'Tell us about your idea',
    'early_revenue_problem': 'What problem does your idea solve?',
    'early_revenue_target': 'Whose problem does your idea solve for?',
    'early_revenue_how_solve': 'How does your idea solve this problem?',
    'early_revenue_monetization': 'How do you plan to make money from this idea?',
    'early_revenue_customers': 'How do you plan to acquire first paying customers?',
    'early_revenue_competitors': 'List 3 potential competitors for your idea',
    'early_revenue_development': 'What is your approach to product development?',
    'early_revenue_team': 'Who is on your team, and what are their roles?',
    'early_revenue_timeline': 'When do you plan to proceed with the idea?',
    'early_revenue_stage': 'What stage is your product currently in?'
  },
  mvp_stage: {
    'tell_us_about_idea': 'Tell us about your idea',
    'mvp_description': 'Describe your MVP',
    'user_feedback': 'What feedback have you received from users?',
    'traction_metrics': 'What traction have you achieved?',
    'revenue_model': 'What is your revenue model?',
    'growth_strategy': 'What is your growth strategy?',
    'competitive_advantage': 'What is your competitive advantage?',
    'team_expansion': 'How do you plan to expand your team?',
    'funding_requirements': 'What are your funding requirements?',
    'milestones': 'What are your key milestones?'
  }
};

/**
 * Extract the primary stage from complex productStage values
 * Uses strict dictionary lookup - no fuzzy matching
 */
export const extractAuthoritativeStage = (productStage: string | undefined): AuthoritativeStage | null => {
  console.log('🎯 EXTRACTING AUTHORITATIVE STAGE from:', productStage);
  
  if (!productStage || typeof productStage !== 'string') {
    console.log('❌ NO PRODUCT STAGE PROVIDED');
    return null;
  }
  
  // Split by common separators and check each part
  const stageParts = productStage.split(/[\/,|]/).map(part => part.trim());
  console.log('🔍 STAGE PARTS:', stageParts);
  
  // Check each part against strict mappings
  for (const part of stageParts) {
    const trimmedPart = part.trim();
    
    // Direct lookup in mappings
    if (STAGE_NAME_MAPPINGS[trimmedPart]) {
      const detectedStage = STAGE_NAME_MAPPINGS[trimmedPart];
      console.log('✅ STRICT MATCH FOUND:', trimmedPart, '->', detectedStage);
      return detectedStage;
    }
  }
  
  console.log('❌ NO STRICT MATCH FOUND for any part of:', productStage);
  return null;
};

/**
 * Get the canonical stage for an application using strict detection
 */
export const getApplicationStage = (application: ExtendedYffApplication): {
  stage: AuthoritativeStage | null;
  rawProductStage: string | undefined;
  detectionMethod: string;
  warnings: string[];
} => {
  console.log('🔍 DETECTING APPLICATION STAGE for:', application.application_id);
  
  const warnings: string[] = [];
  const rawProductStage = application.yff_team_registrations?.productStage;
  
  // Primary detection: productStage field
  if (rawProductStage) {
    const detectedStage = extractAuthoritativeStage(rawProductStage);
    if (detectedStage) {
      console.log('✅ STAGE DETECTED FROM PRODUCT_STAGE:', detectedStage);
      return {
        stage: detectedStage,
        rawProductStage,
        detectionMethod: 'productStage field',
        warnings
      };
    } else {
      warnings.push(`Could not map productStage "${rawProductStage}" to a known stage`);
    }
  } else {
    warnings.push('No productStage field found in yff_team_registrations');
  }
  
  // Fallback detection attempts
  const fallbackFields = [
    application.stage,
    application.selected_stage,
    application.application_stage,
    application.yff_team_registrations?.stage,
    application.yff_team_registrations?.selected_stage
  ];
  
  for (let i = 0; i < fallbackFields.length; i++) {
    const field = fallbackFields[i];
    if (field && typeof field === 'string') {
      const detectedStage = extractAuthoritativeStage(field);
      if (detectedStage) {
        warnings.push(`Stage detected from fallback field ${i + 1}, not productStage`);
        console.log('⚠️ FALLBACK STAGE DETECTION:', detectedStage, 'from field:', field);
        return {
          stage: detectedStage,
          rawProductStage,
          detectionMethod: `fallback field ${i + 1}`,
          warnings
        };
      }
    }
  }
  
  // No stage could be determined
  warnings.push('Could not determine stage from any field - no strict mapping found');
  console.log('❌ NO STAGE COULD BE DETERMINED');
  
  return {
    stage: null,
    rawProductStage,
    detectionMethod: 'none',
    warnings
  };
};

/**
 * Get questions for a specific stage - no cross-contamination
 */
export const getStageQuestions = (stage: AuthoritativeStage): Record<string, string> => {
  return STRICT_STAGE_QUESTIONS[stage] || {};
};

/**
 * Get display name for stage
 */
export const getStageDisplayName = (stage: AuthoritativeStage): string => {
  const displayNames: Record<AuthoritativeStage, string> = {
    idea_stage: 'Idea Stage',
    early_revenue: 'Early Revenue',
    mvp_stage: 'MVP Stage'
  };
  
  return displayNames[stage];
};

/**
 * Get stage color for UI display
 */
export const getStageColor = (stage: AuthoritativeStage): string => {
  const colors: Record<AuthoritativeStage, string> = {
    idea_stage: 'bg-purple-100 text-purple-700 border-purple-200',
    early_revenue: 'bg-blue-100 text-blue-700 border-blue-200',
    mvp_stage: 'bg-green-100 text-green-700 border-green-200'
  };
  
  return colors[stage];
};

/**
 * Validate that we're not mixing stages
 */
export const validateNoStageMixing = (
  detectedStage: AuthoritativeStage,
  answerKeys: string[]
): { isValid: boolean; violations: string[] } => {
  const violations: string[] = [];
  const allowedKeys = Object.keys(STRICT_STAGE_QUESTIONS[detectedStage]);
  
  // Check for keys from other stages
  for (const otherStage of Object.keys(STRICT_STAGE_QUESTIONS) as AuthoritativeStage[]) {
    if (otherStage === detectedStage) continue;
    
    const otherStageKeys = Object.keys(STRICT_STAGE_QUESTIONS[otherStage]);
    const crossContamination = answerKeys.filter(key => 
      otherStageKeys.includes(key) && !allowedKeys.includes(key)
    );
    
    if (crossContamination.length > 0) {
      violations.push(
        `Found ${crossContamination.length} answer keys from ${otherStage}: ${crossContamination.join(', ')}`
      );
    }
  }
  
  return {
    isValid: violations.length === 0,
    violations
  };
};
