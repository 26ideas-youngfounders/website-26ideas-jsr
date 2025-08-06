
/**
 * @fileoverview Admin Question Parser Utility - Enhanced Debug Version
 * 
 * Robust parsing and extraction of questionnaire answers from YFF applications
 * for admin dashboard display with comprehensive error handling and validation.
 * 
 * @version 2.0.0 - Debug Enhanced
 * @author 26ideas Development Team
 */

import { ExtendedYffApplication } from '@/types/yff-application';

/**
 * Map questionnaire keys to human-readable questions (Early Revenue Stage)
 */
export const EARLY_REVENUE_QUESTION_MAP: Record<string, string> = {
  // Core idea questions
  'tell_us_about_idea': 'Tell us about your idea',
  'ideaDescription': 'Tell us about your idea',
  'idea': 'Tell us about your idea',
  
  // Problem and solution
  'early_revenue_problem': 'What problem does your idea solve?',
  'problemSolved': 'What problem does your idea solve?',
  'problem_statement': 'What problem does your idea solve?',
  'problem': 'What problem does your idea solve?',
  
  'early_revenue_target': 'Whose problem does your idea solve for?',
  'targetAudience': 'Whose problem does your idea solve for?',
  'whose_problem': 'Whose problem does your idea solve for?',
  'target': 'Whose problem does your idea solve for?',
  
  'early_revenue_how_solve': 'How does your idea solve this problem?',
  'solutionApproach': 'How does your idea solve this problem?',
  'how_solve_problem': 'How does your idea solve this problem?',
  'solution': 'How does your idea solve this problem?',
  
  // Business model
  'early_revenue_monetization': 'How do you plan to make money from this idea?',
  'monetizationStrategy': 'How do you plan to make money from this idea?',
  'how_make_money': 'How do you plan to make money from this idea?',
  'revenue': 'How do you plan to make money from this idea?',
  
  'early_revenue_customers': 'How do you plan to acquire first paying customers?',
  'customerAcquisition': 'How do you plan to acquire first paying customers?',
  'acquire_customers': 'How do you plan to acquire first paying customers?',
  'customers': 'How do you plan to acquire first paying customers?',
  
  // Competition and development
  'early_revenue_competitors': 'List 3 potential competitors for your idea',
  'competitors': 'List 3 potential competitors for your idea',
  'competition': 'List 3 potential competitors for your idea',
  
  'early_revenue_development': 'What is your approach to product development?',
  'developmentApproach': 'What is your approach to product development?',
  'product_development': 'What is your approach to product development?',
  'development': 'What is your approach to product development?',
  
  // Team and timeline
  'early_revenue_team': 'Who is on your team, and what are their roles?',
  'teamInfo': 'Who is on your team, and what are their roles?',
  'team_roles': 'Who is on your team, and what are their roles?',
  'team': 'Who is on your team, and what are their roles?',
  
  'early_revenue_timeline': 'When do you plan to proceed with the idea?',
  'timeline': 'When do you plan to proceed with the idea?',
  'when_proceed': 'When do you plan to proceed with the idea?',
  
  // Product stage
  'early_revenue_stage': 'What stage is your product currently in?',
  'productStage': 'What stage is your product currently in?',
  'product_stage': 'What stage is your product currently in?',
  'stage': 'What stage is your product currently in?'
};

export interface ParsedQuestionAnswer {
  questionKey: string;
  questionText: string;
  userAnswer: string;
  isValid: boolean;
  parseWarnings: string[];
}

export interface QuestionParsingResult {
  parsedQuestions: ParsedQuestionAnswer[];
  totalFound: number;
  validAnswers: number;
  parsingErrors: string[];
  rawDataStructure: any;
}

/**
 * Helper function to get nested values safely
 */
const getNestedValue = (obj: any, path: string): any => {
  try {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  } catch {
    return undefined;
  }
};

/**
 * Check if answer value is valid for display
 */
const isValidAnswerValue = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    if (value._type === 'undefined' || value.value === 'undefined' || value.value === null) {
      return false;
    }
    if ('value' in value) return isValidAnswerValue(value.value);
    return Object.keys(value).length > 0;
  }
  const stringValue = String(value).trim();
  return stringValue !== '' && stringValue !== 'undefined' && stringValue !== 'null';
};

/**
 * Extract display value from complex answer structures
 */
const extractAnswerValue = (value: any): string => {
  if (value === null || value === undefined) return 'Not provided';
  if (Array.isArray(value)) return value.map(item => extractAnswerValue(item)).join(', ');
  if (typeof value === 'object') {
    if ('value' in value && value.value !== undefined && value.value !== null) {
      return extractAnswerValue(value.value);
    }
    try {
      const entries = Object.entries(value)
        .filter(([key, val]) => isValidAnswerValue(val))
        .map(([key, val]) => `${key}: ${extractAnswerValue(val)}`);
      if (entries.length > 0) return entries.join('; ');
    } catch (error) {
      // Fallback for complex objects
    }
    return JSON.stringify(value, null, 2);
  }
  return String(value).trim();
};

/**
 * Extract questionnaire data from application with comprehensive debugging
 */
const extractDataFromApplication = (application: ExtendedYffApplication): any => {
  console.log('🔍 FULL APPLICATION OBJECT:', JSON.stringify(application, null, 2));
  
  // Log every top-level property
  Object.keys(application).forEach(key => {
    console.log(`📋 TOP-LEVEL KEY: ${key}`, typeof (application as any)[key], (application as any)[key]);
  });
  
  // Specifically check for common questionnaire locations
  const potentialPaths = [
    'answers',
    'questionnaire_answers', 
    'yff_team_registrations.questionnaire_answers',
    'application_data',
    'form_data',
    'submission_data',
    'form_responses',
    'questionnaire_data'
  ];
  
  potentialPaths.forEach(path => {
    const value = getNestedValue(application, path);
    if (value) {
      console.log(`🎯 FOUND DATA AT: ${path}`, JSON.stringify(value, null, 2));
    }
  });

  // Try multiple data sources in order of preference
  const possibleDataSources = [
    application.answers,
    application.yff_team_registrations?.questionnaire_answers,
    (application as any).form_responses,
    (application as any).submission_data,
    (application as any).questionnaire_data,
    application.yff_team_registrations, // Sometimes answers are directly in team registration
    application // Sometimes answers are directly in application
  ];
  
  for (const source of possibleDataSources) {
    if (source && typeof source === 'object') {
      console.log('🔍 CHECKING DATA SOURCE:', JSON.stringify(source, null, 2));
      return source;
    }
    if (typeof source === 'string') {
      try {
        const parsed = JSON.parse(source);
        console.log('🔍 PARSED STRING DATA SOURCE:', JSON.stringify(parsed, null, 2));
        return parsed;
      } catch {
        // Continue to next source
      }
    }
  }
  
  console.log('❌ NO VALID DATA SOURCE FOUND');
  return null;
};

/**
 * Comprehensive questionnaire answer parser with enhanced debugging
 */
export const parseQuestionnaireAnswers = (application: ExtendedYffApplication): QuestionParsingResult => {
  console.log('🔍 PARSING: Starting comprehensive questionnaire parsing with enhanced debugging');
  console.log('📋 Application ID:', application.application_id);
  
  const parsingErrors: string[] = [];
  const parsedQuestions: ParsedQuestionAnswer[] = [];
  let rawDataStructure: any = {};

  try {
    // Get the actual data structure with comprehensive debugging
    const questionnaireData = extractDataFromApplication(application);
    
    if (!questionnaireData) {
      parsingErrors.push('No questionnaire data found in application');
      return { 
        parsedQuestions: [], 
        totalFound: 0, 
        validAnswers: 0, 
        parsingErrors, 
        rawDataStructure: application 
      };
    }

    rawDataStructure = questionnaireData;
    console.log('📊 EXTRACTED QUESTIONNAIRE DATA:', JSON.stringify(questionnaireData, null, 2));

    // Direct property matching - check ALL properties in the data
    Object.entries(questionnaireData).forEach(([key, value]) => {
      console.log(`🔍 PROCESSING KEY: ${key}`, typeof value, value);
      
      // Skip non-answer keys
      const skipKeys = ['id', 'created_at', 'updated_at', 'individual_id', 'application_id', 'team_members'];
      if (skipKeys.includes(key)) {
        console.log(`⏭️ SKIPPING NON-ANSWER KEY: ${key}`);
        return;
      }

      // Find matching question text
      const questionText = EARLY_REVENUE_QUESTION_MAP[key] || 
                          TEAM_REGISTRATION_QUESTIONS[key] || 
                          key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').toLowerCase();
      
      if (isValidAnswerValue(value)) {
        console.log(`✅ ADDING VALID QUESTION: ${key} -> ${questionText}`);
        parsedQuestions.push({
          questionKey: key,
          questionText: questionText.charAt(0).toUpperCase() + questionText.slice(1),
          userAnswer: extractAnswerValue(value),
          isValid: true,
          parseWarnings: []
        });
      } else {
        console.log(`❌ INVALID VALUE FOR KEY: ${key}`, value);
      }
    });

    // Sort questions by a logical order
    const questionOrder = [
      'tell_us_about_idea',
      'early_revenue_stage',
      'early_revenue_problem',
      'early_revenue_target',
      'early_revenue_how_solve',
      'early_revenue_monetization',
      'early_revenue_customers',
      'early_revenue_competitors',
      'early_revenue_development',
      'early_revenue_team',
      'early_revenue_timeline'
    ];
    
    parsedQuestions.sort((a, b) => {
      const orderA = questionOrder.indexOf(a.questionKey);
      const orderB = questionOrder.indexOf(b.questionKey);
      
      if (orderA !== -1 && orderB !== -1) {
        return orderA - orderB;
      }
      if (orderA !== -1) return -1;
      if (orderB !== -1) return 1;
      return a.questionKey.localeCompare(b.questionKey);
    });

  } catch (error) {
    console.error('❌ PARSING: Critical parsing error:', error);
    parsingErrors.push(`Critical parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const validAnswers = parsedQuestions.filter(q => q.isValid).length;
  
  console.log(`🎉 PARSING COMPLETE: Found ${parsedQuestions.length} questions, ${validAnswers} valid`);
  
  if (parsedQuestions.length === 0) {
    parsingErrors.push('No valid questionnaire answers found in any data source');
    console.log('🔍 RAW DATA for debugging:', rawDataStructure);
  }

  return {
    parsedQuestions,
    totalFound: parsedQuestions.length,
    validAnswers,
    parsingErrors,
    rawDataStructure
  };
};

/**
 * Get evaluation key mapping for AI scores
 */
export const getEvaluationKey = (questionKey: string): string => {
  const keyMapping: Record<string, string> = {
    'ideaDescription': 'tell_us_about_idea',
    'idea': 'tell_us_about_idea',
    'problemSolved': 'early_revenue_problem',
    'problem': 'early_revenue_problem',
    'targetAudience': 'early_revenue_target',
    'target': 'early_revenue_target',
    'solutionApproach': 'early_revenue_how_solve',
    'solution': 'early_revenue_how_solve',
    'monetizationStrategy': 'early_revenue_monetization',
    'revenue': 'early_revenue_monetization',
    'customerAcquisition': 'early_revenue_customers',
    'customers': 'early_revenue_customers',
    'competitors': 'early_revenue_competitors',
    'developmentApproach': 'early_revenue_development',
    'development': 'early_revenue_development',
    'teamInfo': 'early_revenue_team',
    'team': 'early_revenue_team',
    'timeline': 'early_revenue_timeline',
    'productStage': 'early_revenue_stage',
    'stage': 'early_revenue_stage'
  };
  
  return keyMapping[questionKey] || questionKey;
};

/**
 * Team registration questions that should always show (with placeholders for blank answers)
 */
export const TEAM_REGISTRATION_QUESTIONS: Record<string, string> = {
  'full_name': 'Full Name',
  'email': 'Email Address',
  'phone_number': 'Phone Number',
  'date_of_birth': 'Date of Birth',
  'current_city': 'Current City',
  'state': 'State/Province',
  'institution_name': 'Institution Name',
  'course_program': 'Course/Program',
  'current_year_of_study': 'Current Year of Study',
  'expected_graduation': 'Expected Graduation',
  'venture_name': 'Venture Name',
  'industry_sector': 'Industry Sector',
  'number_of_team_members': 'Number of Team Members',
  'website': 'Website URL',
  'linkedin_profile': 'LinkedIn Profile',
  'social_media_handles': 'Social Media Handles',
  'gender': 'Gender',
  'pin_code': 'Pin Code',
  'permanent_address': 'Permanent Address',
  'country_code': 'Country Code',
  'team_name': 'Team Name',
  'referral_id': 'Referral ID'
};
