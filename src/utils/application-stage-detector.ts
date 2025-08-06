
/**
 * @fileoverview Application Stage Detector
 * 
 * Provides authoritative stage detection from application data
 * with strict canonical mapping and zero ambiguity.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { ExtendedYffApplication } from '@/types/yff-application';

export type CanonicalStage = 'idea_stage' | 'early_revenue' | 'mvp_stage';

/**
 * Strict stage name mappings - exact matches only
 */
const STAGE_MAPPINGS: Record<string, CanonicalStage> = {
  'Idea Stage': 'idea_stage',
  'idea stage': 'idea_stage',
  'IDEA STAGE': 'idea_stage',
  'Idea': 'idea_stage',
  'Early Revenue': 'early_revenue',
  'early revenue': 'early_revenue',
  'EARLY REVENUE': 'early_revenue',
  'MVP Stage': 'mvp_stage',
  'mvp stage': 'mvp_stage',
  'MVP STAGE': 'mvp_stage',
  'MVP': 'mvp_stage'
};

/**
 * Extract canonical stage from productStage field with strict mapping
 */
export const extractCanonicalStage = (productStage: string | undefined): CanonicalStage | null => {
  console.log('🎯 EXTRACTING CANONICAL STAGE from productStage:', productStage);
  
  if (!productStage || typeof productStage !== 'string') {
    console.log('❌ NO PRODUCT STAGE PROVIDED');
    return null;
  }
  
  // Split by common delimiters and take first segment
  const primarySegment = productStage.split(/[\/,|]/).map(s => s.trim())[0];
  console.log('📋 PRIMARY SEGMENT:', primarySegment);
  
  // Check exact mapping
  if (STAGE_MAPPINGS[primarySegment]) {
    const canonicalStage = STAGE_MAPPINGS[primarySegment];
    console.log('✅ CANONICAL STAGE DETECTED:', canonicalStage);
    return canonicalStage;
  }
  
  console.log('❌ NO CANONICAL STAGE MAPPING FOUND for:', primarySegment);
  return null;
};

/**
 * Detect user's application stage with authoritative priority
 */
export const detectApplicationStage = (application: ExtendedYffApplication): {
  stage: CanonicalStage | null;
  rawProductStage: string | undefined;
  detectionSource: string;
  warnings: string[];
} => {
  console.log('🔍 DETECTING APPLICATION STAGE for:', application.application_id);
  
  const warnings: string[] = [];
  
  // Primary source: answers.questionnaire_answers.productStage
  const answersProductStage = (application.answers as any)?.questionnaire_answers?.productStage;
  if (answersProductStage) {
    const stage = extractCanonicalStage(answersProductStage);
    if (stage) {
      console.log('✅ STAGE DETECTED FROM answers.questionnaire_answers.productStage');
      return {
        stage,
        rawProductStage: answersProductStage,
        detectionSource: 'answers.questionnaire_answers.productStage',
        warnings
      };
    } else {
      warnings.push(`Could not map productStage "${answersProductStage}" to canonical stage`);
    }
  }
  
  // Secondary source: yff_team_registrations.productStage
  const registrationProductStage = application.yff_team_registrations?.productStage;
  if (registrationProductStage) {
    const stage = extractCanonicalStage(registrationProductStage);
    if (stage) {
      warnings.push('Stage detected from yff_team_registrations, not answers');
      console.log('⚠️ STAGE DETECTED FROM yff_team_registrations.productStage');
      return {
        stage,
        rawProductStage: registrationProductStage,
        detectionSource: 'yff_team_registrations.productStage',
        warnings
      };
    } else {
      warnings.push(`Could not map yff_team_registrations.productStage "${registrationProductStage}" to canonical stage`);
    }
  }
  
  // Tertiary fallback sources
  const fallbackSources = [
    { field: application.stage, name: 'application.stage' },
    { field: application.selected_stage, name: 'application.selected_stage' },
    { field: application.yff_team_registrations?.stage, name: 'yff_team_registrations.stage' }
  ];
  
  for (const source of fallbackSources) {
    if (source.field && typeof source.field === 'string') {
      const stage = extractCanonicalStage(source.field);
      if (stage) {
        warnings.push(`Stage detected from fallback source: ${source.name}`);
        console.log('🔄 FALLBACK STAGE DETECTION:', stage, 'from', source.name);
        return {
          stage,
          rawProductStage: source.field,
          detectionSource: source.name,
          warnings
        };
      }
    }
  }
  
  warnings.push('No valid stage could be detected from any source');
  console.log('❌ NO STAGE DETECTED');
  
  return {
    stage: null,
    rawProductStage: undefined,
    detectionSource: 'none',
    warnings
  };
};
