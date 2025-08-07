/**
 * @fileoverview Enhanced YFF Application Details Dialog with AI Scoring
 * 
 * Displays comprehensive application details with separate sections for:
 * - Questionnaire answers (from yff_team_registrations.questionnaire_answers)
 * - Team registration data (all questions, including blank ones)
 * 
 * @version 1.18.0
 * @author 26ideas Development Team
 */

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  User, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle,
  Brain,
  FileText,
  Users,
  BookOpen,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  Award,
  TrendingUp,
  ClipboardList
} from 'lucide-react';
import { ExtendedYffApplication } from '@/types/yff-application';

interface YffApplicationDetailsDialogEnhancedProps {
  application: ExtendedYffApplication;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Map questionnaire keys to human-readable questions (FIXED: removed duplicates)
 */
const QUESTIONNAIRE_KEY_TO_QUESTION: Record<string, string> = {
  'ideaDescription': 'Tell us about your idea',
  'problemSolved': 'What problem does your idea solve?',
  'targetAudience': 'Whose problem does your idea solve for?',
  'solutionApproach': 'How does your idea solve this problem?',
  'monetizationStrategy': 'How do you plan to make money from this idea?',
  'customerAcquisition': 'How do you plan to acquire customers?',
  'competitors': 'List 3 potential competitors for your idea',
  'developmentApproach': 'What is your approach to product development?',
  'teamInfo': 'Who is on your team, and what are their roles?',
  'timeline': 'When do you plan to proceed with the idea?',
  'productStage': 'What stage is your product currently in?',
  'teaminfo': 'Who is on your team, and what are their roles?',
  'problemStatement': 'What problem does your idea solve?',
  'whoseProblem': 'Whose problem does your idea solve for?',
  'howSolveProblem': 'How does your idea solve this problem?',
  'howMakeMoney': 'How do you plan to make money from this idea?',
  'acquireCustomers': 'How do you plan to acquire customers?',
  'productDevelopment': 'What is your approach to product development?',
  'whenProceed': 'When do you plan to proceed with the idea?',
  'tell_us_about_idea': 'Tell us about your idea',
  'product_stage': 'What stage is your product/service currently at?',
  'problem_statement': 'What problem does your idea solve?',
  'whose_problem': 'Whose problem does your idea solve for?',
  'how_solve_problem': 'How does your idea solve this problem?',
  'how_make_money': 'How do you plan to make money from this idea?',
  'acquire_customers': 'How do you plan to acquire first paying customers?',
  'product_development': 'How are you developing the product?',
  'team_roles': 'Who is on your team and their roles?',
  'when_proceed': 'When/Since when have you been working on the idea?'
};

/**
 * Team registration questions that should always show (with placeholders for blank answers)
 */
const TEAM_REGISTRATION_QUESTIONS: Record<string, string> = {
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

/**
 * Get score color based on value
 */
const getScoreColor = (score?: number): string => {
  if (!score) return 'text-gray-400';
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-yellow-600';
  if (score >= 4) return 'text-orange-600';
  return 'text-red-600';
};

/**
 * Get score background color for badges
 */
const getScoreBadgeColor = (score?: number): "default" | "secondary" | "destructive" | "outline" => {
  if (!score) return 'outline';
  if (score >= 8) return 'default';
  if (score >= 6) return 'secondary';
  if (score >= 4) return 'secondary';
  return 'destructive';
};

/**
 * ENHANCED: Safe unwrapping function for wrapped data values
 */
const safeUnwrapValue = (value: any): any => {
  console.log('🔧 Unwrapping value:', value, 'Type:', typeof value);
  
  // Handle null/undefined
  if (value === null || value === undefined) {
    return null;
  }
  
  // Handle wrapped values with _type property
  if (typeof value === 'object' && value !== null) {
    if ('_type' in value) {
      console.log('🔧 Found _type wrapper:', value._type, 'Value:', value.value);
      // If the wrapper indicates undefined/null, return null
      if (value._type === 'undefined' || value.value === 'undefined' || value.value === null) {
        return null;
      }
      // Otherwise return the wrapped value
      return value.value !== undefined ? value.value : value;
    }
  }
  
  return value;
};

/**
 * ENHANCED: Safe parsing function for application answers with better unwrapping
 */
const safeParseAnswers = (answers: any) => {
  try {
    console.log('🔍 ENHANCED parsing application answers:', answers);
    
    // First unwrap if needed
    const unwrappedAnswers = safeUnwrapValue(answers);
    console.log('🔍 Unwrapped answers:', unwrappedAnswers);
    
    if (!unwrappedAnswers) return { team: {}, questionnaire_answers: {} };
    
    if (typeof unwrappedAnswers === 'string') {
      const parsed = JSON.parse(unwrappedAnswers);
      console.log('📋 Parsed JSON answers:', parsed);
      return parsed;
    }
    
    if (typeof unwrappedAnswers === 'object') {
      console.log('📋 Direct object answers:', unwrappedAnswers);
      return unwrappedAnswers;
    }
    
    return { team: {}, questionnaire_answers: {} };
  } catch (error) {
    console.error('❌ Error parsing answers:', error);
    return { team: {}, questionnaire_answers: {} };
  }
};

/**
 * ENHANCED: Safe parsing function for evaluation data with unwrapping
 */
const safeParseEvaluationData = (evaluationData: any) => {
  try {
    console.log('🔍 ENHANCED parsing evaluation data:', evaluationData);
    
    const unwrappedData = safeUnwrapValue(evaluationData);
    console.log('🔍 Unwrapped evaluation data:', unwrappedData);
    
    if (!unwrappedData) return { scores: {} };
    
    if (typeof unwrappedData === 'string') {
      const parsed = JSON.parse(unwrappedData);
      console.log('📊 Parsed evaluation data:', parsed);
      return parsed;
    }
    
    if (typeof unwrappedData === 'object') {
      console.log('📊 Direct object evaluation data:', unwrappedData);
      return unwrappedData;
    }
    
    return { scores: {} };
  } catch (error) {
    console.error('❌ Error parsing evaluation data:', error);
    return { scores: {} };
  }
};

/**
 * ENHANCED: More permissive validation that handles wrapped data types correctly
 */
const isValidAnswer = (value: any): boolean => {
  // First unwrap the value
  const unwrapped = safeUnwrapValue(value);
  
  // Handle null and undefined after unwrapping
  if (unwrapped === null || unwrapped === undefined) {
    return false;
  }
  
  // Handle arrays
  if (Array.isArray(unwrapped)) {
    return unwrapped.length > 0;
  }
  
  // Handle objects
  if (typeof unwrapped === 'object') {
    const keys = Object.keys(unwrapped);
    return keys.length > 0;
  }
  
  // Handle primitives (strings, numbers, booleans)
  const stringValue = String(unwrapped).trim();
  
  // Only exclude truly empty or meaningless values
  return stringValue !== '' && 
         stringValue !== 'undefined' && 
         stringValue !== 'null';
};

/**
 * ENHANCED: Extract display value with better handling for wrapped and complex objects
 */
const extractValue = (value: any): string => {
  const unwrapped = safeUnwrapValue(value);
  
  if (unwrapped === null || unwrapped === undefined) {
    return 'Not provided';
  }
  
  if (Array.isArray(unwrapped)) {
    return unwrapped.map(item => extractValue(item)).join(', ');
  }
  
  if (typeof unwrapped === 'object') {
    try {
      const entries = Object.entries(unwrapped)
        .filter(([key, val]) => isValidAnswer(val))
        .map(([key, val]) => `${key}: ${extractValue(val)}`);
      
      if (entries.length > 0) {
        return entries.join('; ');
      }
    } catch (error) {
      // Fallback for complex objects
    }
    
    return JSON.stringify(unwrapped, null, 2);
  }
  
  return String(unwrapped).trim();
};

/**
 * COMPLETELY REWRITTEN: Extract all individual questions from questionnaire answers
 */
const parseQuestionnaireAnswers = (teamRegistrationData: any): Record<string, any> => {
  console.log('🔍 PARSING questionnaire answers from:', teamRegistrationData);
  
  if (!teamRegistrationData) {
    console.log('❌ No team registration data provided');
    return {};
  }
  
  const results: Record<string, any> = {};
  
  // Function to extract questions from any object structure
  const extractQuestions = (obj: any, depth = 0) => {
    if (!obj || typeof obj !== 'object' || depth > 5) return;
    
    // Check for direct questionnaire_answers field
    if (obj.questionnaire_answers) {
      console.log(`📝 Found questionnaire_answers at depth ${depth}:`, obj.questionnaire_answers);
      
      let questionnaireData = obj.questionnaire_answers;
      
      // Parse if it's a string
      if (typeof questionnaireData === 'string') {
        try {
          questionnaireData = JSON.parse(questionnaireData);
          console.log(`📝 Parsed questionnaire JSON:`, questionnaireData);
        } catch (e) {
          console.error(`❌ Failed to parse questionnaire JSON:`, e);
          return;
        }
      }
      
      // Extract individual questions
      if (typeof questionnaireData === 'object' && questionnaireData !== null) {
        Object.entries(questionnaireData).forEach(([questionKey, answer]) => {
          if (isValidAnswer(answer)) {
            results[questionKey] = answer;
            console.log(`✅ Added question: ${questionKey}`);
          }
        });
      }
    }
    
    // Look for known question keys directly in the object
    const knownQuestionKeys = Object.keys(QUESTIONNAIRE_KEY_TO_QUESTION);
    knownQuestionKeys.forEach(key => {
      if (obj[key] && isValidAnswer(obj[key]) && !results[key]) {
        results[key] = obj[key];
        console.log(`✅ Found direct question: ${key}`);
      }
    });
    
    // Recursively search nested objects
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && key !== 'questionnaire_answers') {
        extractQuestions(value, depth + 1);
      }
    });
  };
  
  extractQuestions(teamRegistrationData);
  
  console.log(`🎉 FINAL: Found ${Object.keys(results).length} questionnaire answers`);
  console.log(`📋 Questions found:`, Object.keys(results));
  
  return results;
};

/**
 * Map question keys to evaluation keys for scoring lookup
 */
const getEvaluationKey = (questionKey: string): string => {
  const keyMapping: Record<string, string> = {
    'ideaDescription': 'tell_us_about_idea',
    'problemSolved': 'problem_statement',
    'targetAudience': 'whose_problem',
    'solutionApproach': 'how_solve_problem',
    'monetizationStrategy': 'how_make_money',
    'customerAcquisition': 'acquire_customers',
    'developmentApproach': 'product_development',
    'teamInfo': 'team_roles',
    'timeline': 'when_proceed',
    'competitors': 'competitors',
    'productStage': 'product_development'
  };
  
  return keyMapping[questionKey] || questionKey;
};

/**
 * ENHANCED: Get team registration data with ultra permissive validation and proper unwrapping
 */
const getTeamRegistrationValue = (data: any, key: string): { value: string; hasAnswer: boolean } => {
  console.log(`🔍 ENHANCED getting team registration value for ${key}:`, data?.[key]);
  
  if (!data) {
    return { value: 'No data available', hasAnswer: false };
  }

  const rawValue = data[key];
  const unwrappedValue = safeUnwrapValue(rawValue);
  const hasAnswer = isValidAnswer(unwrappedValue);
  const extractedValue = hasAnswer ? extractValue(unwrappedValue) : 'Not provided';
  
  console.log(`📋 ENHANCED team field ${key}: unwrapped=${JSON.stringify(unwrappedValue)}, hasAnswer=${hasAnswer}, value="${extractedValue}"`);
  
  return {
    value: extractedValue,
    hasAnswer
  };
};

export const YffApplicationDetailsDialogEnhanced: React.FC<YffApplicationDetailsDialogEnhancedProps> = ({
  application,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  // ENHANCED: Safe parsing of application data with better unwrapping
  const parsedAnswers = useMemo(() => {
    console.log('🔧 ENHANCED processing application answers for:', application.application_id);
    console.log('🔧 Raw application.answers:', application.answers);
    return safeParseAnswers(application.answers);
  }, [application.answers, application.application_id]);

  const evaluationData = useMemo(() => {
    console.log('🔧 ENHANCED processing evaluation data for:', application.application_id);
    console.log('🔧 Raw evaluation_data:', application.evaluation_data);
    return safeParseEvaluationData(application.evaluation_data);
  }, [application.evaluation_data, application.application_id]);
  
  const teamAnswers = parsedAnswers.team || {};
  
  // ENHANCED: Parse questionnaire answers with proper extraction and unwrapping
  const questionnaireAnswers = useMemo(() => {
    console.log('🔧 ENHANCED PROCESSING questionnaire parsing for application:', application.application_id);
    console.log('🔧 Raw team registration data:', application.yff_team_registrations);
    
    // First try to get from team registration data with unwrapping
    if (application.yff_team_registrations) {
      const unwrappedTeamReg = safeUnwrapValue(application.yff_team_registrations);
      console.log('🔧 Unwrapped team registration:', unwrappedTeamReg);
      
      if (unwrappedTeamReg) {
        const parsed = parseQuestionnaireAnswers(unwrappedTeamReg);
        if (Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
    }
    
    // Fallback to parsed answers structure
    const fallback = parsedAnswers.questionnaire_answers || {};
    console.log('🔧 Using fallback questionnaire answers:', fallback);
    return fallback;
  }, [application.yff_team_registrations, parsedAnswers.questionnaire_answers, application.application_id]);
  
  console.log('📝 ENHANCED FINAL questionnaire answers:', questionnaireAnswers);
  console.log('📊 ENHANCED Final evaluation scores:', evaluationData.scores);

  /**
   * FIXED: Process questionnaire answers with proper iteration
   */
  const answeredQuestionnaireQuestions = useMemo(() => {
    console.log('🗂️ Processing questionnaire questions...');
    console.log('🔍 Questionnaire answers to process:', questionnaireAnswers);
    
    const answeredQuestions: Array<{
      questionKey: string;
      questionText: string;
      userAnswer: string;
      score?: number;
      strengths?: string[];
      improvements?: string[];
      rawFeedback?: string;
    }> = [];

    // Process all entries in questionnaireAnswers
    Object.entries(questionnaireAnswers || {}).forEach(([questionKey, userAnswer], index) => {
      console.log(`\n🔍 [${index + 1}] Processing question: "${questionKey}"`);
      console.log(`🔍 [${index + 1}] Raw answer:`, userAnswer);
      
      if (isValidAnswer(userAnswer)) {
        const answerString = extractValue(userAnswer);
        
        // Get human-readable question text
        const questionText = QUESTIONNAIRE_KEY_TO_QUESTION[questionKey] || 
          questionKey.charAt(0).toUpperCase() + questionKey.slice(1).replace(/([A-Z])/g, ' $1');
        
        // Look up evaluation score
        const evalKey = getEvaluationKey(questionKey);
        const evaluationScore = evaluationData.scores?.[evalKey] || 
                              evaluationData.scores?.[questionKey] ||
                              evaluationData.scores?.[questionKey.toLowerCase()];
        
        console.log(`✅ [${index + 1}] ADDING question: "${questionKey}" -> "${questionText}"`);
        console.log(`📊 [${index + 1}] Score:`, evaluationScore?.score);
        
        answeredQuestions.push({
          questionKey,
          questionText,
          userAnswer: answerString,
          score: evaluationScore?.score,
          strengths: evaluationScore?.strengths,
          improvements: evaluationScore?.areas_for_improvement,
          rawFeedback: evaluationScore?.raw_feedback
        });
      } else {
        console.log(`❌ [${index + 1}] SKIPPED invalid answer: "${questionKey}"`);
      }
    });

    console.log(`\n🎉 FINAL: ${answeredQuestions.length} questions will be displayed`);
    
    return answeredQuestions;
  }, [questionnaireAnswers, evaluationData.scores]);

  /**
   * ENHANCED: Process team registration data with ultra permissive validation and proper unwrapping
   */
  const teamRegistrationData = useMemo(() => {
    console.log('🗂️ ENHANCED ULTRA PERMISSIVE team registration processing...');
    console.log('🔍 Team registration source data:', application.yff_team_registrations);
    console.log('🔍 Fallback team answers:', teamAnswers);
    
    const teamData: Array<{
      questionKey: string;
      questionText: string;
      userAnswer: string;
      hasAnswer: boolean;
    }> = [];

    // ENHANCED: Unwrap the team registration data properly
    const unwrappedTeamReg = safeUnwrapValue(application.yff_team_registrations);
    console.log('🔍 ENHANCED unwrapped team registration:', unwrappedTeamReg);
    
    // Use unwrapped team registration data with fallback to teamAnswers
    const teamRegData = unwrappedTeamReg || teamAnswers;
    console.log('🔍 ENHANCED final team data source:', teamRegData);

    Object.entries(TEAM_REGISTRATION_QUESTIONS).forEach(([questionKey, questionText]) => {
      const { value, hasAnswer } = getTeamRegistrationValue(teamRegData, questionKey);
      
      console.log(`📋 ENHANCED team field ${questionKey}: hasAnswer=${hasAnswer}, value="${value}"`);
      
      teamData.push({
        questionKey,
        questionText,
        userAnswer: value,
        hasAnswer
      });
    });

    const answeredCount = teamData.filter(item => item.hasAnswer).length;
    console.log(`✅ ENHANCED team registration: ${answeredCount}/${teamData.length} fields have answers`);
    
    return teamData;
  }, [application.yff_team_registrations, teamAnswers]);

  /**
   * Handle dialog trigger click
   */
  const handleDialogTrigger = () => {
    console.log('👆 Dialog trigger clicked for application:', application.application_id);
    setOpen(true);
  };

  const DialogButton = () => (
    <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleDialogTrigger}>
      <Eye className="h-3 w-3" />
      View Details
    </Button>
  );

  const dialogContent = (
    <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0 overflow-hidden" aria-describedby="dialog-description">
      <DialogHeader className="px-6 py-4 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <DialogTitle className="text-xl font-semibold">
                Application Details with AI Scoring
              </DialogTitle>
              <DialogDescription id="dialog-description" className="text-sm text-muted-foreground mt-1">
                {application.yff_team_registrations?.venture_name || teamAnswers.ventureName || 'Unnamed Venture'} • {application.yff_team_registrations?.full_name || teamAnswers.fullName || application.individuals?.first_name + ' ' + application.individuals?.last_name || 'Unknown Applicant'}
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              ID: {application.application_id.slice(0, 8)}...
            </Badge>
            <Badge variant={application.evaluation_status === 'completed' ? 'default' : 'outline'}>
              {application.evaluation_status || 'pending'}
            </Badge>
          </div>
        </div>
      </DialogHeader>

      <ScrollArea className="flex-1 h-full">
        <div className="p-6 space-y-6">
          {/* Overall Score Summary */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI Evaluation Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(application.overall_score)}`}>
                    {application.overall_score?.toFixed(1) || '—'}
                    <span className="text-lg text-muted-foreground">/10</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Overall Score</p>
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={application.evaluation_status === 'completed' ? 'default' : 'secondary'} className="ml-2">
                        {application.evaluation_status || 'pending'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Answered Questions:</span>
                      <span className="ml-2 font-medium">{answeredQuestionnaireQuestions.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Submitted:</span>
                      <span className="ml-2 font-medium">
                        {application.submitted_at ? 
                          new Date(application.submitted_at).toLocaleDateString() : 
                          new Date(application.created_at).toLocaleDateString()
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Application Round:</span>
                      <span className="ml-2 font-medium">{application.application_round || 'current'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FIXED: Questionnaire Answers - Now shows ALL questions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Questionnaire Answers with AI Scoring
                <Badge variant="secondary" className="ml-2 text-xs">
                  {answeredQuestionnaireQuestions.length} answered
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                All questions from the YFF questionnaire that the participant answered
              </p>
            </CardHeader>
            <CardContent>
              {answeredQuestionnaireQuestions.length > 0 ? (
                <div className="space-y-6">
                  {answeredQuestionnaireQuestions.map((item, index) => (
                    <div key={item.questionKey} className="border rounded-lg p-4 bg-blue-50/30">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              Q{index + 1}
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                              Answered
                            </Badge>
                            {item.score !== undefined && (
                              <Badge variant={getScoreBadgeColor(item.score)} className="text-xs">
                                <Brain className="h-3 w-3 mr-1" />
                                {item.score}/10
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {item.questionKey}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-2">
                            {item.questionText}
                          </h4>
                        </div>
                      </div>

                      {/* User's Answer */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Applicant's Answer</span>
                        </div>
                        <div className="p-3 rounded border bg-white border-blue-200">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-800">
                            {item.userAnswer}
                          </p>
                        </div>
                      </div>

                      {/* AI Feedback */}
                      {(item.strengths || item.improvements || item.rawFeedback) && (
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Strengths */}
                          {item.strengths && item.strengths.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                Strengths
                              </h5>
                              <div className="bg-green-50 p-3 rounded border border-green-200">
                                <ul className="space-y-1">
                                  {item.strengths.map((strength: string, i: number) => (
                                    <li key={i} className="text-sm text-green-800">
                                      • {strength}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* Areas for Improvement */}
                          {item.improvements && item.improvements.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-orange-700 mb-2 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                Areas for Improvement
                              </h5>
                              <div className="bg-orange-50 p-3 rounded border border-orange-200">
                                <ul className="space-y-1">
                                  {item.improvements.map((improvement: string, i: number) => (
                                    <li key={i} className="text-sm text-orange-800">
                                      • {improvement}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {item.score === undefined && (
                        <div className="text-center py-2">
                          <p className="text-sm text-gray-500">AI evaluation pending for this answer</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No questionnaire answers found</p>
                  <p className="text-sm text-gray-400 mt-2">
                    No valid questionnaire answers were found in the application data
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Registration Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Team Registration Information
                <Badge variant="outline" className="ml-2 text-xs">
                  {teamRegistrationData.filter(item => item.hasAnswer).length} of {teamRegistrationData.length} completed
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                All team registration fields
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teamRegistrationData.map((item) => (
                  <div key={item.questionKey} className={`p-3 rounded border ${item.hasAnswer ? 'bg-green-50/50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-medium text-gray-700">{item.questionText}:</span>
                      {item.hasAnswer ? (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          Provided
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          Not Provided
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm break-words ${item.hasAnswer ? 'text-gray-800' : 'text-gray-500 italic'}`}>
                      {item.userAnswer}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          {((application.yff_team_registrations?.team_members && Array.isArray(application.yff_team_registrations.team_members) && application.yff_team_registrations.team_members.length > 0) ||
            (Array.isArray(teamAnswers.teamMembers) && teamAnswers.teamMembers.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members ({(application.yff_team_registrations?.team_members?.length || teamAnswers.teamMembers?.length || 0)})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(application.yff_team_registrations?.team_members || teamAnswers.teamMembers || []).map((member: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50/50">
                      <h4 className="font-semibold text-sm mb-3 text-gray-700">
                        Team Member {index + 2}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-muted-foreground">Name:</span>
                          <span className="ml-2">{member.fullName || member.full_name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Email:</span>
                          <span className="ml-2 break-words">{member.email || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Institution:</span>
                          <span className="ml-2">{member.institutionName || member.institution_name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Course:</span>
                          <span className="ml-2">{member.courseProgram || member.course_program || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </DialogContent>
  );

  // If controlled, render just the dialog content
  if (controlledOpen !== undefined) {
    return (
      <Dialog open={isOpen} onOpenChange={setOpen}>
        {dialogContent}
      </Dialog>
    );
  }

  // Otherwise render with trigger button
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DialogButton />
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
};

export default YffApplicationDetailsDialogEnhanced;
