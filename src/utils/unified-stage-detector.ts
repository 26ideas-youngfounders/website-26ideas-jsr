
/**
 * @fileoverview Unified Stage Detection System
 * 
 * Single source of truth for stage detection across all components.
 * Handles both "Early Revenue" and "Idea Stage / MLP / Working Prototype" formats.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { ExtendedYffApplication } from '@/types/yff-application';

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
  
  // Handle "Idea Stage / MLP / Working Prototype" and variations
  if (trimmed === "Idea Stage / MLP / Working Prototype" || 
      trimmed.startsWith("Idea Stage") || 
      trimmed === "Idea Stage") {
    console.log('✅ DETECTED: Idea Stage');
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
 * Unified stage detection function - single source of truth
 */
export const detectUnifiedStage = (application: ExtendedYffApplication): {
  stage: UnifiedStage | null;
  rawStageValue: string | undefined;
  detectionSource: string;
  warnings: string[];
} => {
  console.log('🔍 UNIFIED STAGE DETECTION for application:', application.application_id);
  
  const warnings: string[] = [];
  
  // Priority 1: answers.questionnaire_answers.productStage
  const answersProductStage = (application.answers as any)?.questionnaire_answers?.productStage;
  if (answersProductStage) {
    const stage = extractUnifiedStage(answersProductStage);
    if (stage) {
      console.log('✅ STAGE FOUND in answers.questionnaire_answers.productStage:', stage);
      return {
        stage,
        rawStageValue: answersProductStage,
        detectionSource: 'answers.questionnaire_answers.productStage',
        warnings
      };
    } else {
      warnings.push(`Could not parse stage from answers.questionnaire_answers.productStage: "${answersProductStage}"`);
    }
  }
  
  // Priority 2: yff_team_registrations.productStage
  const registrationProductStage = application.yff_team_registrations?.productStage;
  if (registrationProductStage) {
    const stage = extractUnifiedStage(registrationProductStage);
    if (stage) {
      console.log('✅ STAGE FOUND in yff_team_registrations.productStage:', stage);
      return {
        stage,
        rawStageValue: registrationProductStage,
        detectionSource: 'yff_team_registrations.productStage',
        warnings
      };
    } else {
      warnings.push(`Could not parse stage from yff_team_registrations.productStage: "${registrationProductStage}"`);
    }
  }
  
  // Priority 3: Direct questionnaire_answers.productStage
  const directQuestionnaireStage = (application as any)?.questionnaire_answers?.productStage;
  if (directQuestionnaireStage) {
    const stage = extractUnifiedStage(directQuestionnaireStage);
    if (stage) {
      console.log('✅ STAGE FOUND in questionnaire_answers.productStage:', stage);
      return {
        stage,
        rawStageValue: directQuestionnaireStage,
        detectionSource: 'questionnaire_answers.productStage',
        warnings
      };
    } else {
      warnings.push(`Could not parse stage from questionnaire_answers.productStage: "${directQuestionnaireStage}"`);
    }
  }
  
  // Priority 4: Other stage fields
  const fallbackStageFields = [
    { value: application.stage, source: 'application.stage' },
    { value: application.selected_stage, source: 'application.selected_stage' },
    { value: (application as any)?.productStage, source: 'application.productStage' }
  ];
  
  for (const field of fallbackStageFields) {
    if (field.value && typeof field.value === 'string') {
      const stage = extractUnifiedStage(field.value);
      if (stage) {
        warnings.push(`Stage detected from fallback field: ${field.source}`);
        console.log('⚠️ FALLBACK STAGE DETECTION:', stage, 'from', field.source);
        return {
          stage,
          rawStageValue: field.value,
          detectionSource: field.source,
          warnings
        };
      }
    }
  }
  
  warnings.push('No valid stage could be detected from any source');
  console.log('❌ NO UNIFIED STAGE DETECTED');
  
  return {
    stage: null,
    rawStageValue: undefined,
    detectionSource: 'none',
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
