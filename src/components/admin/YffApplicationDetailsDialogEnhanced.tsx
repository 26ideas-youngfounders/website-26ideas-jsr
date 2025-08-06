/**
 * @fileoverview Enhanced YFF Application Details Dialog with AI Scoring
 * 
 * Displays comprehensive application details with question-wise answers
 * and corresponding AI scores in a structured, user-friendly format.
 * 
 * @version 1.2.0
 * @author 26ideas Development Team
 */

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  TrendingUp
} from 'lucide-react';
import { ExtendedYffApplication, parseApplicationAnswers, parseEvaluationData, getOrderedQuestions } from '@/types/yff-application';

interface YffApplicationDetailsDialogEnhancedProps {
  application: ExtendedYffApplication;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Complete question definitions for idea stage applications
 * This ensures we show ALL questions, even if unanswered
 */
const IDEA_STAGE_COMPLETE_QUESTIONS: Record<string, string> = {
  'tell_us_about_idea': 'Tell us about your idea',
  'ideaDescription': 'Tell us about your idea',
  'problem_statement': 'What problem does your idea solve?',
  'problemSolved': 'What problem does your idea solve?',
  'whose_problem': 'Whose problem does your idea solve for?',
  'targetAudience': 'Whose problem does your idea solve for?',
  'how_solve_problem': 'How does your idea solve this problem?',
  'solutionApproach': 'How does your idea solve this problem?',
  'how_make_money': 'How do you plan to make money from this idea?',
  'monetizationStrategy': 'How do you plan to make money from this idea?',
  'acquire_customers': 'How do you plan to acquire customers?',
  'customerAcquisition': 'How do you plan to acquire customers?',
  'competitors': 'List 3 potential competitors for your idea',
  'product_development': 'What is your approach to product development?',
  'developmentApproach': 'What is your approach to product development?',
  'team_roles': 'Who is on your team, and what are their roles?',
  'teamInfo': 'Who is on your team, and what are their roles?',
  'when_proceed': 'When do you plan to proceed with the idea?',
  'timeline': 'When do you plan to proceed with the idea?'
};

/**
 * Standard question order for display consistency
 */
const QUESTION_DISPLAY_ORDER = [
  'tell_us_about_idea',
  'ideaDescription',
  'problem_statement', 
  'problemSolved',
  'whose_problem',
  'targetAudience',
  'how_solve_problem',
  'solutionApproach',
  'how_make_money',
  'monetizationStrategy',
  'acquire_customers',
  'customerAcquisition',
  'competitors',
  'product_development',
  'developmentApproach',
  'team_roles',
  'teamInfo',
  'when_proceed',
  'timeline'
];

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
  const questionnaireAnswers = parsedAnswers.questionnaire_answers || {};
  
  console.log('📝 Team answers:', teamAnswers);
  console.log('📝 Questionnaire answers:', questionnaireAnswers);
  console.log('📊 Evaluation scores:', evaluationData.scores);

  /**
   * Create comprehensive question list including all questions (answered and unanswered)
   */
  const completeQuestionSet = useMemo(() => {
    console.log('🗺️ Creating complete question set with all questions...');
    
    const questionSet = new Set<string>();
    const questionMap: Record<string, {
      questionKey: string;
      questionText: string;
      userAnswer: string;
      score?: number;
      strengths?: string[];
      improvements?: string[];
      rawFeedback?: string;
      hasAnswer: boolean;
    }> = {};

    // First, add all possible questions from our complete definition
    Object.keys(IDEA_STAGE_COMPLETE_QUESTIONS).forEach(questionKey => {
      questionSet.add(questionKey);
    });

    // Add any additional questions found in the actual data
    if (questionnaireAnswers && typeof questionnaireAnswers === 'object') {
      Object.keys(questionnaireAnswers).forEach(key => {
        questionSet.add(key);
      });
    }

    // Add questions found in evaluation data
    if (evaluationData.scores && typeof evaluationData.scores === 'object') {
      Object.keys(evaluationData.scores).forEach(key => {
        questionSet.add(key);
      });
    }

    console.log('📋 Complete question set:', Array.from(questionSet));

    // Build the final question map
    Array.from(questionSet).forEach(questionKey => {
      const questionText = IDEA_STAGE_COMPLETE_QUESTIONS[questionKey] || 
                          questionKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      
      // Get user answer
      const userAnswer = questionnaireAnswers[questionKey];
      const hasAnswer = userAnswer !== undefined && userAnswer !== null && userAnswer !== '';
      
      // Map evaluation key for scoring lookup
      const evalKey = getEvaluationKey(questionKey);
      const evaluationScore = evaluationData.scores?.[evalKey] || evaluationData.scores?.[questionKey];
      
      console.log(`📊 Question: ${questionKey}, Answer: ${hasAnswer ? 'Yes' : 'No'}, Score: ${evaluationScore?.score || 'N/A'}`);

      questionMap[questionKey] = {
        questionKey,
        questionText,
        userAnswer: hasAnswer ? String(userAnswer) : 'No answer provided',
        score: evaluationScore?.score,
        strengths: evaluationScore?.strengths,
        improvements: evaluationScore?.areas_for_improvement,
        rawFeedback: evaluationScore?.raw_feedback,
        hasAnswer
      };
    });

    // Sort questions by display order, then alphabetically
    const sortedQuestions = Object.values(questionMap).sort((a, b) => {
      const aIndex = QUESTION_DISPLAY_ORDER.indexOf(a.questionKey);
      const bIndex = QUESTION_DISPLAY_ORDER.indexOf(b.questionKey);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      return a.questionText.localeCompare(b.questionText);
    });

    console.log('✅ Final complete question map:', sortedQuestions);
    return sortedQuestions;
  }, [questionnaireAnswers, evaluationData.scores]);

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
      'timeline': 'when_proceed'
    };
    
    return keyMapping[questionKey] || questionKey;
  };

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
    <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
      <DialogHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <DialogTitle className="text-xl font-semibold">
                Application Details with AI Scoring
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {teamAnswers.ventureName || 'Unnamed Venture'} • {teamAnswers.fullName || application.individuals?.first_name + ' ' + application.individuals?.last_name || 'Unknown Applicant'}
              </p>
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
                      <span className="text-muted-foreground">Questions Evaluated:</span>
                      <span className="ml-2 font-medium">{completeQuestionSet.length}</span>
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

          {/* Applicant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Applicant Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-muted-foreground">Full Name:</span>
                    <span className="ml-2">{teamAnswers.fullName || `${application.individuals?.first_name} ${application.individuals?.last_name}` || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Email:</span>
                    <span className="ml-2">{application.individuals?.email || teamAnswers.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Phone:</span>
                    <span className="ml-2">{teamAnswers.countryCode} {teamAnswers.phoneNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Location:</span>
                    <span className="ml-2">{teamAnswers.currentCity}, {teamAnswers.state || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-muted-foreground">Institution:</span>
                    <span className="ml-2">{teamAnswers.institutionName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Course:</span>
                    <span className="ml-2">{teamAnswers.courseProgram || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Year:</span>
                    <span className="ml-2">{teamAnswers.currentYearOfStudy || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Graduation:</span>
                    <span className="ml-2">{teamAnswers.expectedGraduation || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Venture Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Venture Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Venture Name:</span>
                  <span className="ml-2 font-medium">{teamAnswers.ventureName || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Industry:</span>
                  <span className="ml-2">{teamAnswers.industrySector || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Team Size:</span>
                  <span className="ml-2">{teamAnswers.numberOfMembers || 1} member(s)</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Product Stage:</span>
                  <Badge variant="outline" className="ml-2">
                    {questionnaireAnswers.productStage || 'Not specified'}
                  </Badge>
                </div>
              </div>
              {teamAnswers.website && (
                <div className="mt-4">
                  <span className="font-medium text-muted-foreground">Website:</span>
                  <span className="ml-2 text-blue-600">{teamAnswers.website}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Complete Question Analysis with AI Scoring */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Complete Questionnaire Analysis with AI Scoring
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                All questions from the application stage, including answered and unanswered questions with AI feedback
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {completeQuestionSet.map((item, index) => (
                  <div key={item.questionKey} className={`border rounded-lg p-4 ${item.hasAnswer ? 'bg-blue-50/30' : 'bg-gray-50/50'}`}>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            Q{index + 1}
                          </Badge>
                          {item.hasAnswer ? (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                              Answered
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-gray-500">
                              Unanswered
                            </Badge>
                          )}
                          {item.score !== undefined && (
                            <Badge variant={getScoreBadgeColor(item.score)} className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              {item.score}/10
                            </Badge>
                          )}
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
                      <div className={`p-3 rounded border ${item.hasAnswer ? 'bg-white border-blue-200' : 'bg-gray-100 border-gray-200'}`}>
                        <p className={`text-sm whitespace-pre-wrap leading-relaxed ${item.hasAnswer ? 'text-gray-800' : 'text-gray-500 italic'}`}>
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

                    {!item.hasAnswer && !item.score && (
                      <div className="text-center py-2">
                        <p className="text-sm text-gray-500">No answer provided - No AI evaluation available</p>
                      </div>
                    )}

                    {item.hasAnswer && !item.score && (
                      <div className="text-center py-2">
                        <p className="text-sm text-gray-500">Answer provided - AI evaluation pending</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          {Array.isArray(teamAnswers.teamMembers) && teamAnswers.teamMembers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members ({teamAnswers.teamMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamAnswers.teamMembers.map((member: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50/50">
                      <h4 className="font-semibold text-sm mb-3 text-gray-700">
                        Team Member {index + 2}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-muted-foreground">Name:</span>
                          <span className="ml-2">{member.fullName || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Email:</span>
                          <span className="ml-2">{member.email || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Institution:</span>
                          <span className="ml-2">{member.institutionName || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Course:</span>
                          <span className="ml-2">{member.courseProgram || 'N/A'}</span>
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
