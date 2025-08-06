/**
 * @fileoverview Enhanced YFF Application Details Dialog with AI Scoring
 * 
 * Displays comprehensive application details with separate sections for:
 * - Complete questionnaire answers (all questions rendered dynamically)
 * - Team registration data (all questions, including blank ones)
 * 
 * @version 2.0.0
 * @author 26ideas Development Team
 */

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, 
  Brain,
  FileText,
  Users,
  ClipboardList,
  MessageSquare,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { ExtendedYffApplication } from '@/types/yff-application';

interface YffApplicationDetailsDialogEnhancedProps {
  application: ExtendedYffApplication;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Map questionnaire keys to human-readable questions (Early Revenue Stage)
 */
const EARLY_REVENUE_QUESTION_MAP: Record<string, string> = {
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

/**
 * Team registration questions that should always show
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

interface ParsedQuestionAnswer {
  questionKey: string;
  questionText: string;
  userAnswer: string;
  isValid: boolean;
  parseWarnings: string[];
}

interface QuestionParsingResult {
  parsedQuestions: ParsedQuestionAnswer[];
  totalFound: number;
  validAnswers: number;
  parsingErrors: string[];
  rawDataStructure: any;
}

/**
 * Check if answer value is valid for display
 */
const isValidAnswerValue = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    // Handle wrapper objects
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
 * Comprehensive questionnaire answer parser
 */
const parseQuestionnaireAnswers = (application: ExtendedYffApplication): QuestionParsingResult => {
  console.log('🔍 PARSING: Starting comprehensive questionnaire parsing');
  console.log('📋 Application ID:', application.application_id);
  
  const parsingErrors: string[] = [];
  const parsedQuestions: ParsedQuestionAnswer[] = [];
  let rawDataStructure: any = {};

  try {
    // Extract data from multiple potential sources
    const dataSources = [
      { name: 'yff_team_registrations', data: application.yff_team_registrations },
      { name: 'answers', data: application.answers },
      { name: 'direct_application', data: application }
    ];

    console.log('🔍 PARSING: Checking data sources...');
    
    for (const source of dataSources) {
      if (!source.data) continue;
      
      console.log(`📂 PARSING: Processing source: ${source.name}`);
      
      // Parse JSON strings if needed
      let sourceData = source.data;
      if (typeof sourceData === 'string') {
        try {
          sourceData = JSON.parse(sourceData);
          console.log(`📋 PARSING: Parsed JSON from ${source.name}`);
        } catch (error) {
          parsingErrors.push(`Failed to parse JSON from ${source.name}`);
          continue;
        }
      }
      
      // Store raw structure for debugging
      if (!rawDataStructure[source.name]) {
        rawDataStructure[source.name] = sourceData;
      }
      
      // Extract questionnaire answers
      const questionnaireData = sourceData.questionnaire_answers || 
                              sourceData.questionnaire || 
                              sourceData;
      
      if (questionnaireData && typeof questionnaireData === 'object') {
        console.log(`📝 PARSING: Found questionnaire data in ${source.name}`);
        
        // Process each potential question
        Object.entries(EARLY_REVENUE_QUESTION_MAP).forEach(([questionKey, questionText]) => {
          // Check if we already have this question
          if (parsedQuestions.some(q => q.questionKey === questionKey)) {
            return;
          }
          
          // Look for the answer in various formats
          const possibleAnswers = [
            questionnaireData[questionKey],
            questionnaireData[questionKey.toLowerCase()],
            questionnaireData[questionKey.toUpperCase()],
            // Check nested structures
            questionnaireData.answers?.[questionKey],
            questionnaireData.responses?.[questionKey]
          ].filter(val => val !== undefined);
          
          const answer = possibleAnswers.find(val => isValidAnswerValue(val));
          
          if (answer) {
            const warnings: string[] = [];
            const extractedAnswer = extractAnswerValue(answer);
            
            if (extractedAnswer === 'Not provided') {
              warnings.push('Answer appears to be empty after extraction');
            }
            
            parsedQuestions.push({
              questionKey,
              questionText,
              userAnswer: extractedAnswer,
              isValid: isValidAnswerValue(answer),
              parseWarnings: warnings
            });
            
            console.log(`✅ PARSING: Added question ${questionKey} from ${source.name}`);
          }
        });
      }
    }
    
    // Sort questions by a logical order (core questions first)
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
      
      // If both are in the order array, sort by position
      if (orderA !== -1 && orderB !== -1) {
        return orderA - orderB;
      }
      
      // If only one is in the order array, prioritize it
      if (orderA !== -1) return -1;
      if (orderB !== -1) return 1;
      
      // Otherwise, sort alphabetically
      return a.questionKey.localeCompare(b.questionKey);
    });

  } catch (error) {
    console.error('❌ PARSING: Critical parsing error:', error);
    parsingErrors.push(`Critical parsing error: ${error.message}`);
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
const getEvaluationKey = (questionKey: string): string => {
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
 * Safe parsing function for evaluation data
 */
const safeParseEvaluationData = (evaluationData: any) => {
  try {
    if (!evaluationData) return { scores: {} };
    if (typeof evaluationData === 'string') {
      return JSON.parse(evaluationData);
    }
    if (typeof evaluationData === 'object') {
      return evaluationData;
    }
    return { scores: {} };
  } catch (error) {
    console.error('❌ Error parsing evaluation data:', error);
    return { scores: {} };
  }
};

/**
 * Check if value is valid for team registration
 */
const isValidTeamValue = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  const stringValue = String(value).trim();
  return stringValue !== '' && stringValue !== 'undefined' && stringValue !== 'null';
};

/**
 * Extract team registration value
 */
const getTeamRegistrationValue = (data: any, key: string): { value: string; hasAnswer: boolean } => {
  if (!data) return { value: 'No data available', hasAnswer: false };
  
  const rawValue = data[key];
  const hasAnswer = isValidTeamValue(rawValue);
  const extractedValue = hasAnswer ? String(rawValue).trim() : 'Not provided';
  
  return { value: extractedValue, hasAnswer };
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

export const YffApplicationDetailsDialogEnhanced: React.FC<YffApplicationDetailsDialogEnhancedProps> = ({
  application,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  // Parse questionnaire answers using the new comprehensive parser
  const questionnaireParsingResult = useMemo(() => {
    console.log('🔧 Processing questionnaire parsing for application:', application.application_id);
    return parseQuestionnaireAnswers(application);
  }, [application]);

  // Parse evaluation data
  const evaluationData = useMemo(() => {
    console.log('🔧 Processing evaluation data for application:', application.application_id);
    return safeParseEvaluationData(application.evaluation_data);
  }, [application.evaluation_data, application.application_id]);

  // Process questions with AI scoring
  const questionsWithScoring = useMemo(() => {
    return questionnaireParsingResult.parsedQuestions.map(question => {
      const evalKey = getEvaluationKey(question.questionKey);
      const evaluationScore = evaluationData.scores?.[evalKey] || 
                            evaluationData.scores?.[question.questionKey] ||
                            evaluationData.scores?.[question.questionKey.toLowerCase()];

      return {
        ...question,
        score: evaluationScore?.score,
        strengths: evaluationScore?.strengths,
        improvements: evaluationScore?.areas_for_improvement || evaluationScore?.improvements,
        rawFeedback: evaluationScore?.raw_feedback
      };
    });
  }, [questionnaireParsingResult.parsedQuestions, evaluationData.scores]);

  // Process team registration data
  const teamRegistrationData = useMemo(() => {
    const teamData = application.yff_team_registrations || {};
    
    return Object.entries(TEAM_REGISTRATION_QUESTIONS).map(([questionKey, questionText]) => {
      const { value, hasAnswer } = getTeamRegistrationValue(teamData, questionKey);
      
      return {
        questionKey,
        questionText,
        userAnswer: value,
        hasAnswer
      };
    });
  }, [application.yff_team_registrations]);

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
    <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden" aria-describedby="dialog-description">
      <DialogHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <DialogTitle className="text-xl font-semibold">
                Application Details with AI Scoring
              </DialogTitle>
              <DialogDescription id="dialog-description" className="text-sm text-muted-foreground mt-1">
                {application.yff_team_registrations?.venture_name || 'Unnamed Venture'} • {application.yff_team_registrations?.full_name || application.individuals?.first_name + ' ' + application.individuals?.last_name || 'Unknown Applicant'}
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

      <ScrollArea className="flex-1 pr-6">
        <div className="space-y-6">
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
                  <div className={`text-3xl font-bold ${application.overall_score ? 'text-blue-600' : 'text-gray-400'}`}>
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
                      <span className="text-muted-foreground">Questions Found:</span>
                      <span className="ml-2 font-medium">{questionnaireParsingResult.totalFound}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valid Answers:</span>
                      <span className="ml-2 font-medium">{questionnaireParsingResult.validAnswers}</span>
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
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parsing Errors/Warnings */}
          {questionnaireParsingResult.parsingErrors.length > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium text-orange-800">Data Parsing Issues:</p>
                  <ul className="text-sm text-orange-700 space-y-1">
                    {questionnaireParsingResult.parsingErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Complete Questionnaire Answers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Complete Questionnaire with AI Scoring
                <Badge variant="secondary" className="ml-2 text-xs">
                  {questionsWithScoring.length} questions
                </Badge>
                {questionnaireParsingResult.validAnswers < questionsWithScoring.length && (
                  <Badge variant="outline" className="text-xs text-orange-600">
                    Some incomplete
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                All Early Revenue Stage questionnaire questions dynamically loaded from application data
              </p>
            </CardHeader>
            <CardContent>
              {questionsWithScoring.length > 0 ? (
                <div className="space-y-6">
                  {questionsWithScoring.map((question, index) => (
                    <div key={question.questionKey} className="border rounded-lg p-4 bg-blue-50/30">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              Q{index + 1}
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                              Answered
                            </Badge>
                            {question.score !== undefined && (
                              <Badge variant={getScoreBadgeColor(question.score)} className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                {question.score}/10
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {question.questionKey}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-2">
                            {question.questionText}
                          </h4>
                        </div>
                      </div>

                      {/* User's Answer */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Applicant's Answer</span>
                        </div>
                        <Card className="p-3 border-blue-200 bg-white">
                          <CardContent className="p-0">
                            <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-800">
                              {question.userAnswer}
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* AI Feedback */}
                      {(question.strengths || question.improvements || question.rawFeedback) && (
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Strengths */}
                          {question.strengths && question.strengths.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                Strengths
                              </h5>
                              <Card className="bg-green-50 border-green-200">
                                <CardContent className="p-3">
                                  <ul className="space-y-1">
                                    {question.strengths.map((strength: string, i: number) => (
                                      <li key={i} className="text-sm text-green-800">
                                        • {strength}
                                      </li>
                                    ))}
                                  </ul>
                                </CardContent>
                              </Card>
                            </div>
                          )}

                          {/* Areas for Improvement */}
                          {question.improvements && question.improvements.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-orange-700 mb-2 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                Areas for Improvement
                              </h5>
                              <Card className="bg-orange-50 border-orange-200">
                                <CardContent className="p-3">
                                  <ul className="space-y-1">
                                    {question.improvements.map((improvement: string, i: number) => (
                                      <li key={i} className="text-sm text-orange-800">
                                        • {improvement}
                                      </li>
                                    ))}
                                  </ul>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </div>
                      )}

                      {question.score === undefined && (
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
                  <p className="text-gray-500 font-medium">No Questionnaire Answers Found</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Unable to extract valid questionnaire answers from application data
                  </p>
                  {questionnaireParsingResult.parsingErrors.length > 0 && (
                    <p className="text-xs text-red-500 mt-2">
                      Check parsing errors above for details
                    </p>
                  )}
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
                All team registration fields (read-only admin view)
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teamRegistrationData.map((item) => (
                  <div key={item.questionKey} className={`p-3 rounded border ${item.hasAnswer ? 'bg-green-50/50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.questionText}:</span>
                      {item.hasAnswer ? (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Provided
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          Not Provided
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm ${item.hasAnswer ? 'text-gray-800' : 'text-gray-500 italic'}`}>
                      {item.userAnswer}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          {application.yff_team_registrations?.team_members && Array.isArray(application.yff_team_registrations.team_members) && application.yff_team_registrations.team_members.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members ({application.yff_team_registrations.team_members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {application.yff_team_registrations.team_members.map((member: any, index: number) => (
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
                          <span className="ml-2">{member.email || 'N/A'}</span>
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

          {/* Debug Information (only shown if no questions found) */}
          {questionsWithScoring.length === 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Debug Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Application ID:</span>
                    <span className="ml-2 font-mono">{application.application_id}</span>
                  </div>
                  <div>
                    <span className="font-medium">Raw Data Sources Found:</span>
                    <span className="ml-2">{Object.keys(questionnaireParsingResult.rawDataStructure).join(', ') || 'None'}</span>
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium text-red-700">View Raw Data Structure</summary>
                    <pre className="mt-2 p-2 bg-white rounded border text-xs overflow-auto max-h-40">
                      {JSON.stringify(questionnaireParsingResult.rawDataStructure, null, 2)}
                    </pre>
                  </details>
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
