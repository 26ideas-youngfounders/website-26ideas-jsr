
/**
 * @fileoverview Stage-Aware Question Parser
 * 
 * Dynamically fetches and displays questionnaire answers based on the user's selected stage
 * (Idea Stage, Early Revenue, etc.) with proper question mapping and AI scoring integration.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { ExtendedYffApplication } from '@/types/yff-application';

/**
 * Question mappings for different stages
 */
export const STAGE_QUESTION_MAPPINGS = {
  idea_stage: {
    'tell_us_about_idea': 'Tell us about your idea',
    'idea_description': 'Tell us about your idea',
    'problem_statement': 'What problem does your idea solve?',
    'target_audience': 'Who is your target audience?',
    'solution_approach': 'How does your idea solve this problem?',
    'unique_value': 'What makes your idea unique?',
    'market_size': 'What is the size of your target market?',
    'business_model': 'What is your business model?',
    'team_background': 'Tell us about your team',
    'development_plan': 'What is your development plan?',
    'funding_needs': 'What are your funding needs?'
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
 * Detect the user's selected stage from application data
 */
const detectUserStage = (application: ExtendedYffApplication): ApplicationStage | null => {
  console.log('🔍 DETECTING USER STAGE for application:', application.application_id);
  
  // Check common stage fields
  const possibleStageFields = [
    application.stage,
    application.selected_stage,
    application.application_stage,
    (application as any).user_stage,
    application.yff_team_registrations?.stage,
    application.yff_team_registrations?.selected_stage
  ];
  
  for (const stageField of possibleStageFields) {
    if (stageField && typeof stageField === 'string') {
      const normalizedStage = stageField.toLowerCase().replace(/\s+/g, '_');
      console.log('📋 FOUND STAGE FIELD:', stageField, '-> normalized:', normalizedStage);
      
      if (normalizedStage.includes('idea')) {
        console.log('✅ DETECTED STAGE: idea_stage');
        return 'idea_stage';
      }
      if (normalizedStage.includes('early') && normalizedStage.includes('revenue')) {
        console.log('✅ DETECTED STAGE: early_revenue');
        return 'early_revenue';
      }
      if (normalizedStage.includes('mvp')) {
        console.log('✅ DETECTED STAGE: mvp_stage');
        return 'mvp_stage';
      }
    }
  }
  
  // Fallback: Try to detect from question keys present in data
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
  
  for (const [stage, questionMap] of Object.entries(STAGE_QUESTION_MAPPINGS)) {
    const stageKeys = Object.keys(questionMap);
    const matches = stageKeys.filter(key => answerKeys.includes(key)).length;
    stageMatches[stage as ApplicationStage] = matches;
    console.log(`📊 STAGE ${stage} matches:`, matches, 'out of', stageKeys.length);
  }
  
  // Return stage with highest match count
  const detectedStage = Object.entries(stageMatches).reduce((max, [stage, count]) => 
    count > max.count ? { stage: stage as ApplicationStage, count } : max,
    { stage: null as ApplicationStage | null, count: 0 }
  ).stage;
  
  console.log('🎯 DETECTED STAGE FROM KEYS:', detectedStage);
  return detectedStage || 'early_revenue'; // Default fallback
};

/**
 * Extract answer data from various possible locations
 */
const extractAnswerData = (application: ExtendedYffApplication): any => {
  const possibleSources = [
    application.answers,
    application.yff_team_registrations,
    (application as any).questionnaire_answers,
    (application as any).form_responses,
    (application as any).submission_data
  ];
  
  for (const source of possibleSources) {
    if (source && typeof source === 'object' && Object.keys(source).length > 0) {
      console.log('✅ USING ANSWER DATA SOURCE:', Object.keys(source));
      return source;
    }
  }
  
  console.log('❌ NO ANSWER DATA FOUND');
  return null;
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
  const keyMapping: Record<string, string> = {
    'idea_description': 'tell_us_about_idea',
    'problem_statement': 'early_revenue_problem',
    'target_audience': 'early_revenue_target',
    'solution_approach': 'early_revenue_how_solve',
    'business_model': 'early_revenue_monetization',
    'unique_value': 'early_revenue_competitors',
    'market_size': 'early_revenue_development',
    'team_background': 'early_revenue_team',
    'development_plan': 'early_revenue_timeline',
    'funding_needs': 'early_revenue_stage'
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
    warnings.push('Could not detect user stage - using Early Revenue as default');
  }
  
  const stage = detectedStage || 'early_revenue';
  const questionMap = STAGE_QUESTION_MAPPINGS[stage];
  
  console.log('📋 USING STAGE:', stage, 'with', Object.keys(questionMap).length, 'questions');
  
  // Extract answer data
  const answerData = extractAnswerData(application);
  const rawData = answerData || {};
  
  // Parse evaluation data
  const evaluationData = parseEvaluationData(application.evaluation_data);
  const evaluationScores = evaluationData.scores || {};
  
  // Process each question for the detected stage
  let answeredCount = 0;
  
  for (const [questionKey, questionText] of Object.entries(questionMap)) {
    const rawAnswer = answerData?.[questionKey];
    const hasAnswer = isValidAnswer(rawAnswer);
    const userAnswer = hasAnswer ? extractAnswerText(rawAnswer) : 'Not provided';
    
    if (hasAnswer) {
      answeredCount++;
    }
    
    // Get AI evaluation data
    const evalKey = getEvaluationKey(questionKey);
    const aiEvaluation = evaluationScores[evalKey] || evaluationScores[questionKey];
    
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
    
    console.log(`📝 QUESTION ${questionKey}:`, hasAnswer ? '✅ HAS ANSWER' : '❌ NO ANSWER', aiEvaluation?.score ? `(Score: ${aiEvaluation.score}/10)` : '(No AI score)');
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
