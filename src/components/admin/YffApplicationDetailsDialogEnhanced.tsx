/**
 * @fileoverview Enhanced YFF Application Details Dialog with AI Scoring
 * 
 * Displays comprehensive application details with separate sections for:
 * - Team registration data (from joined yff_team_registrations)
 * - Questionnaire answers (from yff_team_registrations.questionnaire_answers)
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
 * Get team registration data - now properly handles joined data
 */
const getTeamRegistrationData = (teamRegistrations: any): any => {
  console.log('🔍 Processing team registration data:', teamRegistrations);
  
  if (!teamRegistrations) {
    console.log('❌ No team registration data found');
    return null;
  }
  
  // Handle array case (if multiple registrations)
  if (Array.isArray(teamRegistrations)) {
    console.log('📋 Team registration is array, taking first item');
    return teamRegistrations[0] || null;
  }
  
  // Handle single object case
  if (typeof teamRegistrations === 'object') {
    console.log('📋 Team registration is single object');
    return teamRegistrations;
  }
  
  console.log('❌ Team registration data is not in expected format');
  return null;
};

/**
 * Extract questionnaire answers from team registration data
 */
const extractQuestionnaireAnswers = (teamRegData: any): Record<string, any> => {
  console.log('🔍 Extracting questionnaire answers from:', teamRegData);
  
  if (!teamRegData) return {};
  
  const questionnaireAnswers = teamRegData.questionnaire_answers || {};
  console.log('📝 Found questionnaire answers:', questionnaireAnswers);
  
  if (typeof questionnaireAnswers === 'string') {
    try {
      return JSON.parse(questionnaireAnswers);
    } catch (e) {
      console.error('❌ Failed to parse questionnaire JSON:', e);
      return {};
    }
  }
  
  return questionnaireAnswers;
};

/**
 * Validation function for answers
 */
const isValidAnswer = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  
  const stringValue = String(value).trim();
  return stringValue !== '' && stringValue !== 'undefined' && stringValue !== 'null';
};

/**
 * Extract display value
 */
const extractValue = (value: any): string => {
  if (value === null || value === undefined) return 'Not provided';
  if (Array.isArray(value)) return value.map(item => extractValue(item)).join(', ');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value).trim();
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

  // Parse application data
  const parsedAnswers = useMemo(() => {
    console.log('🔧 Processing application answers for:', application.application_id);
    return safeParseAnswers(application.answers);
  }, [application.answers, application.application_id]);

  const evaluationData = useMemo(() => {
    console.log('🔧 Processing evaluation data for:', application.application_id);
    return safeParseEvaluationData(application.evaluation_data);
  }, [application.evaluation_data, application.application_id]);

  // Get team registration data from the joined table
  const teamRegistrationData = useMemo(() => {
    console.log('🔧 Processing joined team registration data for:', application.application_id);
    return getTeamRegistrationData(application.yff_team_registrations);
  }, [application.yff_team_registrations, application.application_id]);

  // Extract questionnaire answers from team registration data
  const questionnaireAnswers = useMemo(() => {
    console.log('🔧 Extracting questionnaire answers for application:', application.application_id);
    return extractQuestionnaireAnswers(teamRegistrationData);
  }, [teamRegistrationData, application.application_id]);

  console.log('📝 Final questionnaire answers:', questionnaireAnswers);
  console.log('📊 Final evaluation scores:', evaluationData.scores);
  console.log('👥 Final team registration data:', teamRegistrationData);

  /**
   * Process questionnaire answers for display
   */
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
        
        console.log(`✅ Adding question: "${questionKey}" -> "${questionText}"`);
        
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

    console.log(`🎉 Final: ${answeredQuestions.length} questions will be displayed`);
    return answeredQuestions;
  }, [questionnaireAnswers, evaluationData.scores]);

  /**
   * Process team registration fields for display
   */
  const teamRegistrationFields = useMemo(() => {
    console.log('🗂️ Processing team registration fields...');
    
    const fields: Array<{
      questionKey: string;
      questionText: string;
      userAnswer: string;
      hasAnswer: boolean;
    }> = [];

    Object.entries(TEAM_REGISTRATION_QUESTIONS).forEach(([questionKey, questionText]) => {
      const rawValue = teamRegistrationData?.[questionKey];
      const hasAnswer = isValidAnswer(rawValue);
      const value = hasAnswer ? extractValue(rawValue) : 'Not provided';
      
      console.log(`📋 Team field ${questionKey}: hasAnswer=${hasAnswer}, value="${value}"`);
      
      fields.push({
        questionKey,
        questionText,
        userAnswer: value,
        hasAnswer
      });
    });

    const answeredCount = fields.filter(item => item.hasAnswer).length;
    console.log(`✅ Team registration: ${answeredCount}/${fields.length} fields have answers`);
    
    return fields;
  }, [teamRegistrationData]);

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

          {/* Team Registration Information - NEW SECTION */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Team Registration Information
                <Badge variant="outline" className="ml-2 text-xs">
                  {teamRegistrationFields.filter(item => item.hasAnswer).length} of {teamRegistrationFields.length} completed
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Complete team registration details as submitted by the applicant
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teamRegistrationFields.map((item) => (
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
