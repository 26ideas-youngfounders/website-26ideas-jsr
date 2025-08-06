/**
 * @fileoverview Enhanced YFF Application Details Dialog with AI Scoring
 * 
 * Displays comprehensive application details with question-wise answers
 * and corresponding AI scores in a structured, user-friendly format.
 * 
 * @version 1.0.0
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
 * Question mapping for idea stage applications with proper display names
 */
const IDEA_STAGE_QUESTION_MAPPING: Record<string, string> = {
  'tell_us_about_idea': 'Tell us about your idea',
  'problem_statement': 'What problem does your idea solve?',
  'whose_problem': 'Whose problem does your idea solve for?',
  'how_solve_problem': 'How does your idea solve this problem?',
  'how_make_money': 'How do you plan to make money from this idea?',
  'acquire_customers': 'How do you plan to acquire customers?',
  'competitors': 'List 3 potential competitors for your idea',
  'product_development': 'What is your approach to product development?',
  'team_roles': 'Who is on your team, and what are their roles?',
  'when_proceed': 'When do you plan to proceed with the idea?'
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

  // Parse application data
  const parsedAnswers = useMemo(() => parseApplicationAnswers(application.answers), [application.answers]);
  const evaluationData = useMemo(() => parseEvaluationData(application.evaluation_data), [application.evaluation_data]);
  
  const teamAnswers = parsedAnswers.team || {};
  const questionnaireAnswers = parsedAnswers.questionnaire_answers || {};
  
  // Get ordered questions for scoring display
  const orderedQuestions = useMemo(() => {
    const scores = evaluationData.scores || {};
    return getOrderedQuestions(scores);
  }, [evaluationData.scores]);

  /**
   * Map questionnaire answers to their corresponding evaluation scores
   */
  const questionAnswerMap = useMemo(() => {
    const map: Array<{
      questionKey: string;
      questionText: string;
      userAnswer: string;
      score?: number;
      strengths?: string[];
      improvements?: string[];
      rawFeedback?: string;
    }> = [];

    // Map questionnaire answers to evaluation scores
    Object.entries(questionnaireAnswers).forEach(([key, answer]) => {
      let mappedKey = key;
      let questionText = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

      // Map camelCase keys to snake_case evaluation keys
      const keyMapping: Record<string, string> = {
        'ideaDescription': 'tell_us_about_idea',
        'problemSolved': 'problem_statement',
        'targetAudience': 'whose_problem',
        'solutionApproach': 'how_solve_problem',
        'monetizationStrategy': 'how_make_money',
        'customerAcquisition': 'acquire_customers',
        'competitors': 'competitors',
        'developmentApproach': 'product_development',
        'teamInfo': 'team_roles',
        'timeline': 'when_proceed'
      };

      if (keyMapping[key]) {
        mappedKey = keyMapping[key];
        questionText = IDEA_STAGE_QUESTION_MAPPING[mappedKey] || questionText;
      }

      // Find corresponding evaluation score
      const evaluationScore = evaluationData.scores?.[mappedKey];

      map.push({
        questionKey: key,
        questionText,
        userAnswer: String(answer || 'No answer provided'),
        score: evaluationScore?.score,
        strengths: evaluationScore?.strengths,
        improvements: evaluationScore?.areas_for_improvement,
        rawFeedback: evaluationScore?.raw_feedback
      });
    });

    return map;
  }, [questionnaireAnswers, evaluationData.scores]);

  const DialogButton = () => (
    <Button variant="outline" size="sm" className="flex items-center gap-2">
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
                {teamAnswers.ventureName || 'Unnamed Venture'} • {teamAnswers.fullName || 'Unknown Applicant'}
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
                      <span className="ml-2 font-medium">{questionAnswerMap.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Submitted:</span>
                      <span className="ml-2 font-medium">
                        {application.submitted_at ? 
                          new Date(application.submitted_at).toLocaleDateString() : 
                          'N/A'
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
                    <span className="ml-2">{teamAnswers.fullName || 'N/A'}</span>
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

          {/* Question-wise Answers with AI Scoring */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Detailed Question Analysis with AI Scoring
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Each question shows the applicant's answer alongside AI-generated scores and feedback
              </p>
            </CardHeader>
            <CardContent>
              {questionAnswerMap.length > 0 ? (
                <div className="space-y-6">
                  {questionAnswerMap.map((item, index) => (
                    <div key={item.questionKey} className="border rounded-lg p-4 bg-gray-50/50">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              Q{index + 1}
                            </Badge>
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
                        <div className="bg-white p-3 rounded border border-blue-200">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
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

                      {!item.score && (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">No AI evaluation available for this question</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-600 mb-2">
                    No Questionnaire Data Available
                  </p>
                  <p className="text-sm text-gray-500">
                    This application doesn't contain detailed questionnaire responses.
                  </p>
                </div>
              )}
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
