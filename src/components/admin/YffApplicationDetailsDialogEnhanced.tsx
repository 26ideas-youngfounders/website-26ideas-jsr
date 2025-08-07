/**
 * @fileoverview Enhanced YFF Application Details Dialog with AI Scoring
 * 
 * Displays comprehensive application details with separate sections for:
 * - Team Registration Information (ALWAYS VISIBLE)
 * - Questionnaire answers (from yff_team_registrations.questionnaire_answers)
 * 
 * @version 1.19.0
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
 * Map questionnaire keys to human-readable questions
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
 * COMPREHENSIVE Team registration field mapping with user-friendly labels
 */
const TEAM_REGISTRATION_FIELD_MAPPING: Record<string, { label: string; icon?: any }> = {
  'full_name': { label: 'Full Name', icon: User },
  'email': { label: 'Email Address', icon: Mail },
  'phone_number': { label: 'Phone Number', icon: Phone },
  'country_code': { label: 'Country Code', icon: Globe },
  'date_of_birth': { label: 'Date of Birth', icon: Calendar },
  'current_city': { label: 'Current City', icon: MapPin },
  'state': { label: 'State/Province', icon: MapPin },
  'pin_code': { label: 'Pin Code', icon: MapPin },
  'permanent_address': { label: 'Permanent Address', icon: MapPin },
  'institution_name': { label: 'Institution Name', icon: BookOpen },
  'course_program': { label: 'Course/Program', icon: BookOpen },
  'current_year_of_study': { label: 'Current Year of Study', icon: BookOpen },
  'expected_graduation': { label: 'Expected Graduation', icon: Calendar },
  'team_name': { label: 'Team Name', icon: Users },
  'venture_name': { label: 'Venture Name', icon: Award },
  'number_of_team_members': { label: 'Number of Team Members', icon: Users },
  'industry_sector': { label: 'Industry Sector', icon: TrendingUp },
  'website': { label: 'Website URL', icon: Globe },
  'linkedin_profile': { label: 'LinkedIn Profile', icon: User },
  'social_media_handles': { label: 'Social Media Handles', icon: User },
  'gender': { label: 'Gender', icon: User },
  'referral_id': { label: 'Referral ID', icon: Award }
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
 * ENHANCED: Robust unwrapping function for ALL data structures
 */
const deepUnwrapValue = (value: any, depth = 0): any => {
  console.log(`🔧 Deep unwrapping (depth ${depth}):`, value, 'Type:', typeof value);
  
  // Prevent infinite recursion
  if (depth > 10) {
    console.warn('🚨 Max unwrapping depth reached');
    return value;
  }
  
  // Handle null/undefined
  if (value === null || value === undefined) {
    return null;
  }
  
  // Handle wrapped values with _type property
  if (typeof value === 'object' && value !== null && '_type' in value) {
    console.log(`🔧 Found _type wrapper at depth ${depth}:`, value._type, 'Value:', value.value);
    
    // If the wrapper indicates undefined/null, return null
    if (value._type === 'undefined' || value.value === 'undefined' || value.value === null) {
      return null;
    }
    
    // Recursively unwrap the inner value
    return deepUnwrapValue(value.value, depth + 1);
  }
  
  // Handle arrays - unwrap each element
  if (Array.isArray(value)) {
    return value.map(item => deepUnwrapValue(item, depth + 1));
  }
  
  // Handle objects - unwrap each property
  if (typeof value === 'object' && value !== null) {
    const unwrapped: any = {};
    Object.entries(value).forEach(([key, val]) => {
      unwrapped[key] = deepUnwrapValue(val, depth + 1);
    });
    return unwrapped;
  }
  
  return value;
};

/**
 * ROBUST: Safe parsing function for application answers
 */
const safeParseAnswers = (answers: any) => {
  try {
    console.log('🔍 Parsing application answers:', answers);
    
    // First unwrap completely
    const unwrappedAnswers = deepUnwrapValue(answers);
    console.log('🔍 Fully unwrapped answers:', unwrappedAnswers);
    
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
 * ROBUST: Safe parsing function for evaluation data
 */
const safeParseEvaluationData = (evaluationData: any) => {
  try {
    console.log('🔍 Parsing evaluation data:', evaluationData);
    
    const unwrappedData = deepUnwrapValue(evaluationData);
    console.log('🔍 Fully unwrapped evaluation data:', unwrappedData);
    
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
 * ENHANCED: Check if a value has meaningful content
 */
const hasValidContent = (value: any): boolean => {
  const unwrapped = deepUnwrapValue(value);
  
  if (unwrapped === null || unwrapped === undefined) {
    return false;
  }
  
  if (Array.isArray(unwrapped)) {
    return unwrapped.length > 0 && unwrapped.some(item => hasValidContent(item));
  }
  
  if (typeof unwrapped === 'object') {
    return Object.keys(unwrapped).length > 0;
  }
  
  const stringValue = String(unwrapped).trim();
  return stringValue !== '' && 
         stringValue !== 'undefined' && 
         stringValue !== 'null' &&
         stringValue !== '0' &&
         stringValue !== 'false';
};

/**
 * ENHANCED: Extract display value for rendering
 */
const extractDisplayValue = (value: any): string => {
  const unwrapped = deepUnwrapValue(value);
  
  if (!hasValidContent(unwrapped)) {
    return 'Not provided';
  }
  
  if (Array.isArray(unwrapped)) {
    const validItems = unwrapped.filter(item => hasValidContent(item));
    return validItems.map(item => extractDisplayValue(item)).join(', ');
  }
  
  if (typeof unwrapped === 'object') {
    try {
      const entries = Object.entries(unwrapped)
        .filter(([key, val]) => hasValidContent(val))
        .map(([key, val]) => `${key}: ${extractDisplayValue(val)}`);
      
      if (entries.length > 0) {
        return entries.join('; ');
      }
      
      return JSON.stringify(unwrapped, null, 2);
    } catch (error) {
      return String(unwrapped);
    }
  }
  
  return String(unwrapped).trim();
};

/**
 * COMPREHENSIVE: Extract team registration data with robust handling
 */
const extractTeamRegistrationData = (application: ExtendedYffApplication) => {
  console.log('🏢 TEAM REGISTRATION BLOCK - Starting extraction for:', application.application_id);
  console.log('🏢 Raw yff_team_registrations:', application.yff_team_registrations);
  
  // Handle array vs single object structure
  let registrationSource = application.yff_team_registrations;
  
  // If it's an array, take the first element
  if (Array.isArray(registrationSource)) {
    console.log('🏢 Found array structure, taking first element');
    registrationSource = registrationSource[0];
  }
  
  console.log('🏢 Registration source after array handling:', registrationSource);
  
  // Deep unwrap the registration data
  const unwrappedRegistration = deepUnwrapValue(registrationSource);
  console.log('🏢 Fully unwrapped registration data:', unwrappedRegistration);
  
  // If we still don't have data, try fallback from answers
  let finalRegistrationData = unwrappedRegistration;
  
  if (!finalRegistrationData || Object.keys(finalRegistrationData).length === 0) {
    console.log('🏢 No registration data found, trying fallback from answers');
    const parsedAnswers = safeParseAnswers(application.answers);
    finalRegistrationData = parsedAnswers.team || {};
    console.log('🏢 Fallback registration data:', finalRegistrationData);
  }
  
  if (!finalRegistrationData) {
    console.error('🚨 NO REGISTRATION DATA FOUND for application:', application.application_id);
    return null;
  }
  
  console.log('🏢 Final registration data keys:', Object.keys(finalRegistrationData));
  return finalRegistrationData;
};

/**
 * Extract questionnaire answers from registration data
 */
const extractQuestionnaireAnswers = (registrationData: any): Record<string, any> => {
  console.log('📝 Extracting questionnaire answers from:', registrationData);
  
  if (!registrationData) return {};
  
  const results: Record<string, any> = {};
  
  // Check for questionnaire_answers field
  if (registrationData.questionnaire_answers) {
    console.log('📝 Found questionnaire_answers field');
    let questionnaireData = registrationData.questionnaire_answers;
    
    // Parse if it's a string
    if (typeof questionnaireData === 'string') {
      try {
        questionnaireData = JSON.parse(questionnaireData);
      } catch (e) {
        console.error('❌ Failed to parse questionnaire JSON:', e);
        return {};
      }
    }
    
    // Extract individual questions
    if (typeof questionnaireData === 'object' && questionnaireData !== null) {
      Object.entries(questionnaireData).forEach(([questionKey, answer]) => {
        if (hasValidContent(answer)) {
          results[questionKey] = answer;
        }
      });
    }
  }
  
  // Also check for direct questionnaire fields in registration data
  const knownQuestionKeys = Object.keys(QUESTIONNAIRE_KEY_TO_QUESTION);
  knownQuestionKeys.forEach(key => {
    if (registrationData[key] && hasValidContent(registrationData[key]) && !results[key]) {
      results[key] = registrationData[key];
    }
  });
  
  console.log('📝 Final questionnaire answers:', Object.keys(results));
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

export const YffApplicationDetailsDialogEnhanced: React.FC<YffApplicationDetailsDialogEnhancedProps> = ({
  application,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  // Extract team registration data with robust handling
  const teamRegistrationData = useMemo(() => {
    return extractTeamRegistrationData(application);
  }, [application]);

  // Parse evaluation data
  const evaluationData = useMemo(() => {
    console.log('🔧 Processing evaluation data for:', application.application_id);
    return safeParseEvaluationData(application.evaluation_data);
  }, [application.evaluation_data, application.application_id]);
  
  // Extract questionnaire answers
  const questionnaireAnswers = useMemo(() => {
    console.log('📝 Processing questionnaire answers for:', application.application_id);
    return extractQuestionnaireAnswers(teamRegistrationData);
  }, [teamRegistrationData, application.application_id]);

  // Process questionnaire answers for display
  const answeredQuestionnaireQuestions = useMemo(() => {
    console.log('🗂️ Processing questionnaire questions...');
    
    const answeredQuestions: Array<{
      questionKey: string;
      questionText: string;
      userAnswer: string;
      score?: number;
      strengths?: string[];
      improvements?: string[];
      rawFeedback?: string;
    }> = [];

    Object.entries(questionnaireAnswers || {}).forEach(([questionKey, userAnswer]) => {
      if (hasValidContent(userAnswer)) {
        const answerString = extractDisplayValue(userAnswer);
        
        // Get human-readable question text
        const questionText = QUESTIONNAIRE_KEY_TO_QUESTION[questionKey] || 
          questionKey.charAt(0).toUpperCase() + questionKey.slice(1).replace(/([A-Z])/g, ' $1');
        
        // Look up evaluation score
        const evalKey = getEvaluationKey(questionKey);
        const evaluationScore = evaluationData.scores?.[evalKey] || 
                              evaluationData.scores?.[questionKey] ||
                              evaluationData.scores?.[questionKey.toLowerCase()];
        
        answeredQuestions.push({
          questionKey,
          questionText,
          userAnswer: answerString,
          score: evaluationScore?.score,
          strengths: evaluationScore?.strengths,
          improvements: evaluationScore?.areas_for_improvement,
          rawFeedback: evaluationScore?.raw_feedback
        });
      }
    });

    console.log(`✅ Final: ${answeredQuestions.length} questions will be displayed`);
    return answeredQuestions;
  }, [questionnaireAnswers, evaluationData.scores]);

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
                {teamRegistrationData?.venture_name || 'Unnamed Venture'} • {teamRegistrationData?.full_name || application.individuals?.first_name + ' ' + application.individuals?.last_name || 'Unknown Applicant'}
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

          {/* ALWAYS VISIBLE: Team Registration Information */}
          <Card className="border-2 border-green-200 bg-green-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-green-600" />
                Team Registration Information
                <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700">
                  Core Details
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                All registration fields submitted by the applicant
              </p>
            </CardHeader>
            <CardContent>
              {teamRegistrationData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(TEAM_REGISTRATION_FIELD_MAPPING).map(([fieldKey, fieldConfig]) => {
                    const fieldValue = teamRegistrationData[fieldKey];
                    const displayValue = extractDisplayValue(fieldValue);
                    const hasValue = hasValidContent(fieldValue);
                    const IconComponent = fieldConfig.icon;
                    
                    return (
                      <div 
                        key={fieldKey} 
                        className={`p-3 rounded-lg border ${hasValue ? 'bg-white border-green-200' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <div className="flex items-start gap-3">
                          {IconComponent && (
                            <IconComponent className={`h-4 w-4 mt-0.5 flex-shrink-0 ${hasValue ? 'text-green-600' : 'text-gray-400'}`} />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-700">
                                {fieldConfig.label}:
                              </span>
                              {hasValue ? (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                  Provided
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-gray-500">
                                  Missing
                                </Badge>
                              )}
                            </div>
                            <p className={`text-sm break-words ${hasValue ? 'text-gray-800' : 'text-gray-500 italic'}`}>
                              {displayValue}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <p className="text-red-600 font-medium">No Team Registration Data Found</p>
                  <p className="text-sm text-red-500 mt-2">
                    Registration data is missing for application ID: {application.application_id}
                  </p>
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-left">
                    <p className="text-xs text-red-600 font-mono">
                      Debug Info: yff_team_registrations = {JSON.stringify(application.yff_team_registrations, null, 2)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Questionnaire Answers with AI Scoring */}
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

          {/* Team Members */}
          {teamRegistrationData?.team_members && Array.isArray(teamRegistrationData.team_members) && teamRegistrationData.team_members.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members ({teamRegistrationData.team_members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamRegistrationData.team_members.map((member: any, index: number) => (
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
