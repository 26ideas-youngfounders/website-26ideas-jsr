
/**
 * @fileoverview Stage-Aware Question Parser
 * 
 * Dynamically fetches and displays questionnaire answers based on the user's selected stage
 * (Idea Stage, Early Revenue, etc.) with proper question mapping and AI scoring integration.
 * 
 * @version 1.1.0
 * @author 26ideas Development Team
 */

import { ExtendedYffApplication } from '@/types/yff-application';

/**
 * Question mappings for different stages with their actual data keys
 */
export const STAGE_QUESTION_MAPPINGS = {
  idea_stage: {
    'tell_us_about_idea': 'Tell us about your idea',
    'problem_statement': 'What problem does your idea solve?',
    'whose_problem': 'Whose problem does your idea solve for?',
    'how_solve_problem': 'How does your idea solve this problem?',
    'how_make_money': 'How do you plan to make money from this idea?',
    'acquire_customers': 'How do you plan to acquire first paying customers?',
    'competitors': 'List 3 potential competitors for your idea',
    'product_development': 'What is your approach to product development?',
    'team_roles': 'Who is on your team, and what are their roles?',
    'when_proceed': 'When do you plan to proceed with the idea?'
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
} as const;

export type ApplicationStage = keyof typeof STAGE_QUESTION_MAPPINGS;

export interface StageAwareQuestion {
  questionKey: string;
  questionText: string;
  userAnswer: string;
  hasAnswer: boolean;
  stage: ApplicationStage;
  aiScore?: number;
  aiStrengths?: string[];
  aiImprovements?: string[];
  aiRawFeedback?: string;
}

export interface StageAwareParsingResult {
  detectedStage: ApplicationStage | null;
  questions: StageAwareQuestion[];
  totalQuestions: number;
  answeredQuestions: number;
  warnings: string[];
  rawData: any;
}

/**
 * Extract answer data from various possible locations
 */
const extractAnswerData = (application: ExtendedYffApplication): any => {
  console.log('📊 EXTRACTING ANSWER DATA from application:', application.application_id);
  
  const possibleSources = [
    application.answers,
    application.yff_team_registrations,
    (application as any).questionnaire_answers,
    (application as any).form_responses,
    (application as any).submission_data
  ];
  
  for (const source of possibleSources) {
    if (source && typeof source === 'object' && Object.keys(source).length > 0) {
      console.log('✅ USING ANSWER DATA SOURCE with keys:', Object.keys(source));
      return source;
    }
  }
  
  console.log('❌ NO ANSWER DATA FOUND');
  return null;
};

/**
 * Smart stage detection based on available answer keys
 */
const detectUserStage = (application: ExtendedYffApplication): ApplicationStage | null => {
  console.log('🔍 DETECTING USER STAGE for application:', application.application_id);
  
  // First, check explicit stage fields
  const possibleStageFields = [
    application.stage,
    application.selected_stage,
    application.application_stage,
    application.user_stage,
    application.yff_team_registrations?.stage,
    application.yff_team_registrations?.selected_stage,
    application.yff_team_registrations?.application_stage,
    application.yff_team_registrations?.user_stage
  ];
  
  for (const stageField of possibleStageFields) {
    if (stageField && typeof stageField === 'string') {
      const normalizedStage = stageField.toLowerCase().replace(/\s+/g, '_');
      console.log('📋 FOUND EXPLICIT STAGE FIELD:', stageField, '-> normalized:', normalizedStage);
      
      if (normalizedStage.includes('idea')) {
        console.log('✅ DETECTED EXPLICIT STAGE: idea_stage');
        return 'idea_stage';
      }
      if (normalizedStage.includes('early') && normalizedStage.includes('revenue')) {
        console.log('✅ DETECTED EXPLICIT STAGE: early_revenue');
        return 'early_revenue';
      }
      if (normalizedStage.includes('mvp')) {
        console.log('✅ DETECTED EXPLICIT STAGE: mvp_stage');
        return 'mvp_stage';
      }
    }
  }
  
  // Fallback: Detect stage from available answer keys
  const answerData = extractAnswerData(application);
  if (!answerData) {
    console.log('❌ NO STAGE DETECTED: No answer data available');
    return null;
  }
  
  const answerKeys = Object.keys(answerData);
  console.log('🔑 AVAILABLE ANSWER KEYS:', answerKeys);
  
  // Count matches for each stage
  const stageMatches = {
    idea_stage: 0,
    early_revenue: 0,
    mvp_stage: 0
  };
  
  // Check for stage-specific question keys
  for (const [stage, questionMap] of Object.entries(STAGE_QUESTION_MAPPINGS)) {
    const stageKeys = Object.keys(questionMap);
    const matches = stageKeys.filter(key => answerKeys.includes(key)).length;
    stageMatches[stage as ApplicationStage] = matches;
    console.log(`📊 STAGE ${stage} matches:`, matches, 'out of', stageKeys.length, 'questions');
  }
  
  // Also check for early_revenue prefixed keys as indicators
  const earlyRevenueKeys = answerKeys.filter(key => key.startsWith('early_revenue_')).length;
  if (earlyRevenueKeys > 0) {
    stageMatches.early_revenue += earlyRevenueKeys;
    console.log(`📊 Found ${earlyRevenueKeys} early_revenue prefixed keys`);
  }
  
  // Return stage with highest match count
  const bestMatch = Object.entries(stageMatches).reduce((max, [stage, count]) => 
    count > max.count ? { stage: stage as ApplicationStage, count } : max,
    { stage: null as ApplicationStage | null, count: 0 }
  );
  
  console.log('🎯 STAGE MATCH RESULTS:', stageMatches);
  console.log('🎯 BEST MATCH:', bestMatch);
  
  if (bestMatch.stage && bestMatch.count > 0) {
    console.log('✅ DETECTED STAGE FROM KEYS:', bestMatch.stage);
    return bestMatch.stage;
  }
  
  // Final fallback - if we have any answers but can't detect stage, assume idea_stage
  // since "tell_us_about_idea" is a common key that might exist
  if (answerKeys.includes('tell_us_about_idea')) {
    console.log('🔄 FALLBACK: Using idea_stage due to tell_us_about_idea key');
    return 'idea_stage';
  }
  
  console.log('❌ NO STAGE DETECTED: Using early_revenue as final fallback');
  return 'early_revenue';
};

/**
 * Check if answer value is valid
 */
const isValidAnswer = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed !== '' && trimmed !== 'undefined' && trimmed !== 'null';
  }
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

/**
 * Extract clean answer text from complex data structures
 */
const extractAnswerText = (value: any): string => {
  if (value === null || value === undefined) return 'Not provided';
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') {
    if ('value' in value) return extractAnswerText(value.value);
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

/**
 * Parse evaluation data for AI scoring
 */
const parseEvaluationData = (evaluationData: any): Record<string, any> => {
  try {
    if (!evaluationData) return {};
    if (typeof evaluationData === 'string') {
      return JSON.parse(evaluationData);
    }
    if (typeof evaluationData === 'object') {
      return evaluationData;
    }
    return {};
  } catch (error) {
    console.error('❌ Error parsing evaluation data:', error);
    return {};
  }
};

/**
 * Get evaluation key mapping for AI scores
 */
const getEvaluationKey = (questionKey: string): string => {
  // Try the original key first, then common mappings
  const keyMapping: Record<string, string> = {
    'problem_statement': 'early_revenue_problem',
    'whose_problem': 'early_revenue_target',
    'how_solve_problem': 'early_revenue_how_solve',
    'how_make_money': 'early_revenue_monetization',
    'acquire_customers': 'early_revenue_customers',
    'competitors': 'early_revenue_competitors',
    'product_development': 'early_revenue_development',
    'team_roles': 'early_revenue_team',
    'when_proceed': 'early_revenue_timeline'
  };
  
  return keyMapping[questionKey] || questionKey;
};

/**
 * Main function to parse questionnaire answers based on detected stage
 */
export const parseStageAwareQuestions = (application: ExtendedYffApplication): StageAwareParsingResult => {
  console.log('🚀 STARTING STAGE-AWARE QUESTION PARSING for:', application.application_id);
  
  const warnings: string[] = [];
  const questions: StageAwareQuestion[] = [];
  
  // Detect user's stage
  const detectedStage = detectUserStage(application);
  if (!detectedStage) {
    warnings.push('Could not detect user stage - using early_revenue as default');
  }
  
  const stage = detectedStage || 'early_revenue';
  const questionMap = STAGE_QUESTION_MAPPINGS[stage];
  
  console.log('📋 USING STAGE:', stage, 'with', Object.keys(questionMap).length, 'questions');
  
  // Extract answer data
  const answerData = extractAnswerData(application);
  const rawData = answerData || {};
  
  if (!answerData) {
    warnings.push('No answer data found in application');
    console.log('❌ NO ANSWER DATA - returning empty result');
    return {
      detectedStage: stage,
      questions: [],
      totalQuestions: Object.keys(questionMap).length,
      answeredQuestions: 0,
      warnings,
      rawData: {}
    };
  }
  
  // Parse evaluation data
  const evaluationData = parseEvaluationData(application.evaluation_data);
  const evaluationScores = evaluationData.scores || {};
  
  console.log('🤖 EVALUATION SCORES AVAILABLE:', Object.keys(evaluationScores));
  
  // Process each question for the detected stage
  let answeredCount = 0;
  
  for (const [questionKey, questionText] of Object.entries(questionMap)) {
    const rawAnswer = answerData[questionKey];
    const hasAnswer = isValidAnswer(rawAnswer);
    const userAnswer = hasAnswer ? extractAnswerText(rawAnswer) : 'Not provided';
    
    if (hasAnswer) {
      answeredCount++;
      console.log(`✅ QUESTION ${questionKey}: HAS ANSWER`);
    } else {
      console.log(`❌ QUESTION ${questionKey}: NO ANSWER`);
    }
    
    // Get AI evaluation data - try multiple key variations
    const possibleEvalKeys = [
      questionKey,
      getEvaluationKey(questionKey),
      questionKey.toLowerCase(),
      questionKey.replace(/_/g, '')
    ];
    
    let aiEvaluation = null;
    for (const evalKey of possibleEvalKeys) {
      if (evaluationScores[evalKey]) {
        aiEvaluation = evaluationScores[evalKey];
        console.log(`🎯 FOUND AI EVALUATION for ${questionKey} using key: ${evalKey}`);
        break;
      }
    }
    
    if (!aiEvaluation) {
      console.log(`❓ NO AI EVALUATION found for ${questionKey}`);
    }
    
    questions.push({
      questionKey,
      questionText,
      userAnswer,
      hasAnswer,
      stage,
      aiScore: aiEvaluation?.score,
      aiStrengths: aiEvaluation?.strengths,
      aiImprovements: aiEvaluation?.areas_for_improvement || aiEvaluation?.improvements,
      aiRawFeedback: aiEvaluation?.raw_feedback
    });
  }
  
  console.log('🎉 STAGE-AWARE PARSING COMPLETE:', {
    stage,
    totalQuestions: questions.length,
    answeredQuestions: answeredCount,
    warnings: warnings.length
  });
  
  return {
    detectedStage: stage,
    questions: questions.sort((a, b) => {
      const keys = Object.keys(questionMap);
      return keys.indexOf(a.questionKey) - keys.indexOf(b.questionKey);
    }),
    totalQuestions: questions.length,
    answeredQuestions: answeredCount,
    warnings,
    rawData
  };
};
