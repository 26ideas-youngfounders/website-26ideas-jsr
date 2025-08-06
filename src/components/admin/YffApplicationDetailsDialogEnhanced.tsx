
/**
 * @fileoverview Enhanced YFF Application Details Dialog with AI Scoring
 * 
 * Displays comprehensive application details with separate sections for:
 * - Questionnaire answers (from yff_team_registrations.questionnaire_answers)
 * - Team registration data (all questions, including blank ones)
 * 
 * @version 1.10.0
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
  Star, 
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
  'productStage': 'What stage is your product currently in?'
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
 * Safe parsing function for application answers
 */
const safeParseAnswers = (answers: any) => {
  try {
    console.log('🔍 Parsing application answers:', answers);
    if (!answers) return { team: {}, questionnaire_answers: {} };
    
    if (typeof answers === 'string') {
      const parsed = JSON.parse(answers);
      console.log('📋 Parsed JSON answers:', parsed);
      return parsed;
    }
    
    if (typeof answers === 'object') {
      console.log('📋 Direct object answers:', answers);
      return answers;
    }
    
    return { team: {}, questionnaire_answers: {} };
  } catch (error) {
    console.error('❌ Error parsing answers:', error);
    return { team: {}, questionnaire_answers: {} };
  }
};

/**
 * Safe parsing function for evaluation data
 */
const safeParseEvaluationData = (evaluationData: any) => {
  try {
    console.log('🔍 Parsing evaluation data:', evaluationData);
    if (!evaluationData) return { scores: {} };
    
    if (typeof evaluationData === 'string') {
      const parsed = JSON.parse(evaluationData);
      console.log('📊 Parsed evaluation data:', parsed);
      return parsed;
    }
    
    if (typeof evaluationData === 'object') {
      console.log('📊 Direct object evaluation data:', evaluationData);
      return evaluationData;
    }
    
    return { scores: {} };
  } catch (error) {
    console.error('❌ Error parsing evaluation data:', error);
    return { scores: {} };
  }
};

/**
 * Parse questionnaire answers from yff_team_registrations
 */
const parseQuestionnaireAnswers = (teamRegistrationData: any) => {
  try {
    console.log('🔍 Parsing questionnaire answers from team registration:', teamRegistrationData);
    
    // Check for questionnaire_answers field
    if (teamRegistrationData?.questionnaire_answers) {
      let questionnaireAnswers = teamRegistrationData.questionnaire_answers;
      
      // Parse if it's a string
      if (typeof questionnaireAnswers === 'string') {
        questionnaireAnswers = JSON.parse(questionnaireAnswers);
      }
      
      console.log('📝 Found questionnaire answers:', questionnaireAnswers);
      return questionnaireAnswers || {};
    }
    
    return {};
  } catch (error) {
    console.error('❌ Error parsing questionnaire answers:', error);
    return {};
  }
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
 * Extremely permissive validation - show almost everything
 */
const isValidAnswer = (value: any): boolean => {
  console.log('🔍 Validating answer:', { value, type: typeof value, isNull: value === null, isUndefined: value === undefined });
  
  // Only exclude truly empty/null values
  if (value === null || value === undefined) {
    console.log('❌ Answer is null or undefined');
    return false;
  }
  
  const stringValue = String(value).trim();
  console.log('🔍 String value:', `"${stringValue}"`, 'Length:', stringValue.length);
  
  // Only exclude completely empty strings or obvious invalid values
  if (stringValue === '' || 
      stringValue === 'undefined' || 
      stringValue === 'null') {
    console.log('❌ Answer is empty string or invalid literal');
    return false;
  }
  
  console.log('✅ Answer is valid');
  return true;
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

  // Safe parsing of application data
  const parsedAnswers = useMemo(() => {
    console.log('🔧 Processing application answers for:', application.application_id);
    return safeParseAnswers(application.answers);
  }, [application.answers, application.application_id]);

  const evaluationData = useMemo(() => {
    console.log('🔧 Processing evaluation data for:', application.application_id);
    return safeParseEvaluationData(application.evaluation_data);
  }, [application.evaluation_data, application.application_id]);
  
  const teamAnswers = parsedAnswers.team || {};
  
  // Parse questionnaire answers from team registration data with null safety
  const questionnaireAnswers = useMemo(() => {
    console.log('🔧 Processing questionnaire answers from team registration data');
    
    // Check if we have team registration data
    if (application.yff_team_registrations) {
      const questAnswers = parseQuestionnaireAnswers(application.yff_team_registrations);
      console.log('📝 Questionnaire answers from team registration:', questAnswers);
      return questAnswers;
    }
    
    // Fallback to parsed answers structure
    return parsedAnswers.questionnaire_answers || {};
  }, [application.yff_team_registrations, parsedAnswers.questionnaire_answers]);
  
  console.log('📝 Team answers:', teamAnswers);
  console.log('📝 Questionnaire answers:', questionnaireAnswers);
  console.log('📊 Evaluation scores:', evaluationData.scores);

  /**
   * Process questionnaire answers - show ALL answers with extremely permissive filtering
   */
  const answeredQuestionnaireQuestions = useMemo(() => {
    console.log('🗂️ Processing questionnaire questions - EXTREMELY PERMISSIVE APPROACH...');
    console.log('🔍 Raw questionnaire answers object:', questionnaireAnswers);
    console.log('🔍 Object keys:', Object.keys(questionnaireAnswers));
    console.log('🔍 Object entries count:', Object.entries(questionnaireAnswers || {}).length);
    
    const answeredQuestions: Array<{
      questionKey: string;
      questionText: string;
      userAnswer: string;
      score?: number;
      strengths?: string[];
      improvements?: string[];
      rawFeedback?: string;
    }> = [];

    // Process ALL entries in questionnaireAnswers with detailed logging
    Object.entries(questionnaireAnswers || {}).forEach(([questionKey, userAnswer], index) => {
      console.log(`\n🔍 [${index + 1}] Processing question: "${questionKey}"`);
      console.log(`🔍 [${index + 1}] Answer value:`, userAnswer);
      console.log(`🔍 [${index + 1}] Answer type: ${typeof userAnswer}`);
      console.log(`🔍 [${index + 1}] Answer JSON:`, JSON.stringify(userAnswer));
      
      const isValid = isValidAnswer(userAnswer);
      console.log(`🔍 [${index + 1}] Is valid check result:`, isValid);
      
      // Use the extremely permissive validation
      if (isValid) {
        const answerString = String(userAnswer).trim();
        
        // Get human-readable question text
        const questionText = QUESTIONNAIRE_KEY_TO_QUESTION[questionKey] || 
          questionKey.charAt(0).toUpperCase() + questionKey.slice(1).replace(/([A-Z])/g, ' $1');
        
        // Look up evaluation score
        const evalKey = getEvaluationKey(questionKey);
        const evaluationScore = evaluationData.scores?.[evalKey] || 
                              evaluationData.scores?.[questionKey] ||
                              evaluationData.scores?.[questionKey.toLowerCase()];
        
        console.log(`✅ [${index + 1}] ADDING question: "${questionKey}" -> "${questionText}"`);
        console.log(`📏 [${index + 1}] Answer length: ${answerString.length} characters`);
        console.log(`🎯 [${index + 1}] Evaluation key: ${evalKey}`);
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
        console.log(`❌ [${index + 1}] SKIPPING invalid question: "${questionKey}" - Answer:`, userAnswer);
        console.log(`❌ [${index + 1}] Validation details:`, {
          isNull: userAnswer === null,
          isUndefined: userAnswer === undefined,
          stringValue: String(userAnswer).trim(),
          stringLength: String(userAnswer).trim().length
        });
      }
    });

    console.log(`\n🎉 FINAL RESULT: ${answeredQuestions.length} questions will be displayed out of ${Object.keys(questionnaireAnswers).length} total`);
    console.log(`📋 Questions to show:`, answeredQuestions.map(q => q.questionKey));
    console.log(`📋 Questions skipped:`, Object.keys(questionnaireAnswers).filter(key => 
      !answeredQuestions.some(q => q.questionKey === key)
    ));
    
    return answeredQuestions;
  }, [questionnaireAnswers, evaluationData.scores]);

  /**
   * Process team registration data (all questions, including blank)
   */
  const teamRegistrationData = useMemo(() => {
    console.log('🗂️ Processing team registration data (all questions)...');
    
    const teamData: Array<{
      questionKey: string;
      questionText: string;
      userAnswer: string;
      hasAnswer: boolean;
    }> = [];

    // Use team registration data from the application object with null safety
    const teamRegData = application.yff_team_registrations || teamAnswers;

    Object.entries(TEAM_REGISTRATION_QUESTIONS).forEach(([questionKey, questionText]) => {
      const userAnswer = teamRegData?.[questionKey as keyof typeof teamRegData];
      const hasAnswer = userAnswer !== undefined && userAnswer !== null && userAnswer !== '';
      
      console.log(`📋 Team registration question: ${questionKey}, Has answer: ${hasAnswer}`);
      
      teamData.push({
        questionKey,
        questionText,
        userAnswer: hasAnswer ? String(userAnswer) : 'No answer provided',
        hasAnswer
      });
    });

    console.log('✅ Final team registration data entries:', teamData.length);
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

          {/* Enhanced Debug Information Card */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800 text-sm">🔍 Enhanced Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-yellow-700 space-y-1">
                <div><strong>Total questionnaire keys found:</strong> {Object.keys(questionnaireAnswers).length}</div>
                <div><strong>Raw keys:</strong> {Object.keys(questionnaireAnswers).join(', ')}</div>
                <div><strong>Valid questions to display:</strong> {answeredQuestionnaireQuestions.length}</div>
                <div><strong>Questions that will show:</strong> {answeredQuestionnaireQuestions.map(q => q.questionKey).join(', ')}</div>
                <div><strong>Questions skipped:</strong> {Object.keys(questionnaireAnswers).filter(key => 
                  !answeredQuestionnaireQuestions.some(q => q.questionKey === key)
                ).join(', ')}</div>
                <div><strong>Sample raw values:</strong></div>
                {Object.entries(questionnaireAnswers).slice(0, 3).map(([key, value]) => (
                  <div key={key} className="ml-2">• {key}: {JSON.stringify(value).slice(0, 100)}...</div>
                ))}
                <div><strong>Raw questionnaire object (first 500 chars):</strong></div>
                <div className="bg-white p-2 rounded text-gray-800 font-mono text-xs whitespace-pre-wrap">
                  {JSON.stringify(questionnaireAnswers, null, 2).slice(0, 500)}...
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questionnaire Answers (Only Answered Questions) */}
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
                Questions from the YFF questionnaire that the participant answered
              </p>
            </CardHeader>
            <CardContent>
              {answeredQuestionnaireQuestions.length > 0 ? (
                <div className="space-y-6">
                  {answeredQuestionnaireQuestions.map((item, index) => (
                    <div key={item.questionKey} className="border rounded-lg p-4 bg-blue-50/30">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              Q{index + 1}
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                              Answered
                            </Badge>
                            {item.score !== undefined && (
                              <Badge variant={getScoreBadgeColor(item.score)} className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
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
                  <p className="text-gray-500">No questionnaire answers available</p>
                  <p className="text-sm text-gray-400">The participant has not answered any questionnaire questions yet</p>
                  <div className="mt-4 text-xs text-gray-400">
                    <div>Debug: Found {Object.keys(questionnaireAnswers).length} raw keys</div>
                    <div>Keys: {Object.keys(questionnaireAnswers).join(', ')}</div>
                    <div>After validation: {answeredQuestionnaireQuestions.length} valid questions</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Registration Information (All Questions) */}
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
                All team registration fields, including those not filled out
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
