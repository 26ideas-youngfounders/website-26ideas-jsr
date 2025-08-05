
/**
 * @fileoverview YFF Application AI Evaluation Dialog
 * 
 * Displays comprehensive AI evaluation results for YFF applications
 * with detailed scores, feedback, and admin controls including re-evaluation.
 * 
 * @version 1.3.0
 * @author 26ideas Development Team
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  BarChart3, 
  RefreshCw, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Target,
  Users,
  DollarSign,
  Zap,
  ChevronDown,
  ChevronRight,
  Eye,
  MessageSquare
} from 'lucide-react';
import { evaluateApplication, reEvaluateApplication, getApplicationEvaluation, QuestionEvaluation } from '@/services/ai-evaluation-service';
import { parseApplicationAnswers } from '@/types/yff-application';

interface YffApplicationEvaluationDialogProps {
  application: {
    application_id: string;
    status: string;
    evaluation_status?: string;
    overall_score?: number;
    evaluation_completed_at?: string;
    answers: any;
    individuals: {
      first_name: string;
      last_name: string;
    } | null;
  };
}

/**
 * Get score color based on score range
 */
const getScoreColor = (score: number): string => {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-yellow-600';
  if (score >= 4) return 'text-orange-600';
  return 'text-red-600';
};

/**
 * Get score badge variant based on score range
 */
const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
  if (score >= 8) return 'default';
  if (score >= 6) return 'secondary';
  if (score >= 4) return 'outline';
  return 'destructive';
};

/**
 * Question labels for better display
 */
const questionLabels: Record<string, string> = {
  // Idea Stage
  ideaDescription: 'Idea Description',
  problemSolved: 'Problem Statement',
  targetAudience: 'Target Audience',
  solutionApproach: 'Solution Approach',
  monetizationStrategy: 'Monetization Strategy',
  customerAcquisition: 'Customer Acquisition',
  competitors: 'Competitive Analysis',
  developmentApproach: 'Product Development',
  teamInfo: 'Team Information',
  timeline: 'Timeline & Milestones',
  payingCustomers: 'Revenue Validation',
  workingDuration: 'Working Duration',
  
  // Early Revenue Stage
  early_revenue_problem: 'Problem Statement',
  early_revenue_whose_problem: 'Target Customer',
  early_revenue_how_solve: 'Solution Approach',
  early_revenue_making_money: 'Revenue Generation',
  early_revenue_acquiring_customers: 'Customer Acquisition',
  early_revenue_competitors: 'Competitive Analysis',
  early_revenue_product_development: 'Product Development',
  early_revenue_team: 'Team Information',
  early_revenue_working_duration: 'Working Duration'
};

/**
 * Question icons for better visual organization
 */
const questionIcons: Record<string, React.ElementType> = {
  // Idea Stage
  ideaDescription: FileText,
  problemSolved: AlertCircle,
  targetAudience: Target,
  solutionApproach: Zap,
  monetizationStrategy: DollarSign,
  customerAcquisition: TrendingUp,
  competitors: BarChart3,
  developmentApproach: RefreshCw,
  teamInfo: Users,
  timeline: Clock,
  payingCustomers: CheckCircle,
  workingDuration: Star,
  
  // Early Revenue Stage
  early_revenue_problem: AlertCircle,
  early_revenue_whose_problem: Target,
  early_revenue_how_solve: Zap,
  early_revenue_making_money: DollarSign,
  early_revenue_acquiring_customers: TrendingUp,
  early_revenue_competitors: BarChart3,
  early_revenue_product_development: RefreshCw,
  early_revenue_team: Users,
  early_revenue_working_duration: Star
};

/**
 * Safe type guard to check if evaluation data is valid
 */
const isValidEvaluation = (evaluation: any): boolean => {
  return evaluation &&
         typeof evaluation === 'object' &&
         typeof evaluation.overall_score === 'number' &&
         evaluation.question_scores &&
         typeof evaluation.question_scores === 'object';
};

/**
 * Enhanced type guard to check if question evaluation is valid with comprehensive null checks
 */
const isValidQuestionEvaluation = (questionEval: any): questionEval is QuestionEvaluation => {
  if (!questionEval || typeof questionEval !== 'object') {
    return false;
  }
  
  // Check if score exists and is a number
  if (typeof questionEval.score !== 'number') {
    return false;
  }
  
  // Safely check strengths array
  if (questionEval.strengths !== undefined && questionEval.strengths !== null) {
    if (!Array.isArray(questionEval.strengths)) {
      return false;
    }
  }
  
  // Safely check improvements array
  if (questionEval.improvements !== undefined && questionEval.improvements !== null) {
    if (!Array.isArray(questionEval.improvements)) {
      return false;
    }
  }
  
  return true;
};

/**
 * Safe array access helper to prevent runtime errors
 */
const safeArrayAccess = (arr: any, fallback: any[] = []): any[] => {
  if (Array.isArray(arr)) {
    return arr;
  }
  return fallback;
};

/**
 * Safe string conversion helper
 */
const safeStringify = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

/**
 * Get answer text for a specific question from application answers
 */
const getAnswerForQuestion = (questionId: string, applicationAnswers: any): string => {
  try {
    const parsedAnswers = parseApplicationAnswers(applicationAnswers);
    
    // Check questionnaire answers first
    if (parsedAnswers.questionnaire_answers && typeof parsedAnswers.questionnaire_answers === 'object') {
      const questionnaireAnswers = parsedAnswers.questionnaire_answers;
      
      // Handle both idea stage and early revenue stage question formats
      const possibleKeys = [
        questionId, // Direct match
        questionId.replace('early_revenue_', ''), // Remove early_revenue_ prefix
        questionId.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '') // Convert camelCase to snake_case
      ];
      
      for (const key of possibleKeys) {
        if (questionnaireAnswers[key]) {
          return safeStringify(questionnaireAnswers[key]);
        }
      }
    }
    
    // Check other answer sections
    if (parsedAnswers.team && questionId.includes('team')) {
      return JSON.stringify(parsedAnswers.team, null, 2);
    }
    
    if (parsedAnswers.personal && questionId.includes('personal')) {
      return JSON.stringify(parsedAnswers.personal, null, 2);
    }
    
    return 'Answer not found or not accessible';
  } catch (error) {
    console.error('Error getting answer for question:', questionId, error);
    return 'Error retrieving answer';
  }
};

export const YffApplicationEvaluationDialog: React.FC<YffApplicationEvaluationDialogProps> = ({ 
  application 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to fetch evaluation data
  const { data: evaluation, isLoading, error, refetch } = useQuery({
    queryKey: ['application-evaluation', application.application_id],
    queryFn: () => getApplicationEvaluation(application.application_id),
    enabled: isOpen && !!application.application_id,
  });

  // Mutation to trigger evaluation
  const evaluateMutation = useMutation({
    mutationFn: () => evaluateApplication(application.application_id),
    onSuccess: () => {
      toast({
        title: "Evaluation Started",
        description: "AI evaluation is now processing. This may take a few minutes.",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['yff-applications'] });
    },
    onError: (error: any) => {
      console.error('Evaluation error:', error);
      toast({
        title: "Evaluation Failed",
        description: error?.message || "Failed to start evaluation process",
        variant: "destructive",
      });
    },
  });

  // Mutation to re-evaluate
  const reEvaluateMutation = useMutation({
    mutationFn: () => reEvaluateApplication(application.application_id),
    onSuccess: () => {
      toast({
        title: "Re-evaluation Started",
        description: "AI re-evaluation is now processing with updated system prompts. This may take a few minutes.",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['yff-applications'] });
    },
    onError: (error: any) => {
      console.error('Re-evaluation error:', error);
      toast({
        title: "Re-evaluation Failed",
        description: error?.message || "Failed to start re-evaluation process",
        variant: "destructive",
      });
    },
  });

  const handleEvaluate = () => {
    console.log('Starting evaluation for application:', application.application_id);
    evaluateMutation.mutate();
  };

  const handleReEvaluate = () => {
    console.log('Starting re-evaluation for application:', application.application_id);
    reEvaluateMutation.mutate();
  };

  const toggleQuestionExpanded = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  /**
   * Render individual question evaluation with answer display
   */
  const renderQuestionEvaluation = (questionId: string, questionEval: any) => {
    console.log('Rendering question evaluation:', { questionId, questionEval });
    
    // Enhanced validation to prevent runtime errors
    if (!isValidQuestionEvaluation(questionEval)) {
      console.warn(`Invalid or incomplete question evaluation for ${questionId}:`, questionEval);
      return (
        <Card key={questionId} className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <CardTitle className="text-sm font-medium text-gray-500">
                  {questionLabels[questionId] || questionId}
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-gray-400">
                No Data
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-gray-400">Evaluation data unavailable or incomplete</p>
          </CardContent>
        </Card>
      );
    }

    const IconComponent = questionIcons[questionId] || FileText;
    const label = questionLabels[questionId] || questionId;
    const score = typeof questionEval.score === 'number' ? questionEval.score : 0;
    
    // Use safe array access to prevent runtime errors
    const strengths = safeArrayAccess(questionEval.strengths);
    const improvements = safeArrayAccess(questionEval.improvements);
    
    // Get the answer for this question
    const answerText = getAnswerForQuestion(questionId, application.answers);
    const isExpanded = expandedQuestions.has(questionId);
    
    console.log('Question evaluation data:', { 
      questionId, 
      score, 
      strengthsCount: strengths.length, 
      improvementsCount: improvements.length 
    });
    
    return (
      <Card key={questionId} className="mb-4">
        <Collapsible>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50" onClick={() => toggleQuestionExpanded(questionId)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4 text-gray-600" />
                  <CardTitle className="text-sm font-medium">{label}</CardTitle>
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getScoreBadgeVariant(score)} className="font-semibold">
                    {score}/10
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    toggleQuestionExpanded(questionId);
                  }}>
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {/* User Answer Section */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <h5 className="text-sm font-semibold text-blue-700">User Answer:</h5>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {answerText}
                  </div>
                </div>
              </div>

              {/* AI Evaluation Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-purple-600" />
                  <h5 className="text-sm font-semibold text-purple-700">AI Evaluation:</h5>
                </div>

                {/* Strengths */}
                {strengths.length > 0 && (
                  <div>
                    <h6 className="text-xs font-semibold text-green-700 mb-1">Strengths:</h6>
                    <div className="text-xs text-gray-600 bg-green-50 p-2 rounded">
                      {strengths.map((strength, idx) => (
                        <div key={idx} className="mb-1">• {safeStringify(strength)}</div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Areas for Improvement */}
                {improvements.length > 0 && (
                  <div>
                    <h6 className="text-xs font-semibold text-orange-700 mb-1">Areas for Improvement:</h6>
                    <div className="text-xs text-gray-600 bg-orange-50 p-2 rounded">
                      {improvements.map((improvement, idx) => (
                        <div key={idx} className="mb-1">• {safeStringify(improvement)}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show message if no feedback available */}
                {strengths.length === 0 && improvements.length === 0 && (
                  <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
                    No detailed feedback available for this question.
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  // Safe application name rendering with null checks
  const getApplicationName = () => {
    try {
      if (application?.individuals?.first_name && application?.individuals?.last_name) {
        return `${application.individuals.first_name} ${application.individuals.last_name}`;
      }
      return 'Unknown Applicant';
    } catch (error) {
      console.error('Error getting application name:', error);
      return 'Unknown Applicant';
    }
  };

  // Safe application ID rendering
  const getApplicationId = () => {
    try {
      return application?.application_id?.slice(0, 8) + '...' || 'Unknown';
    } catch (error) {
      console.error('Error getting application ID:', error);
      return 'Unknown';
    }
  };

  const expandAllQuestions = () => {
    if (evaluation?.question_scores) {
      setExpandedQuestions(new Set(Object.keys(evaluation.question_scores)));
    }
  };

  const collapseAllQuestions = () => {
    setExpandedQuestions(new Set());
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <BarChart3 className="h-3 w-3 mr-1" />
          AI Evaluation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            AI Evaluation - {getApplicationName()}
          </DialogTitle>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Application ID: {getApplicationId()}
            </div>
            <div className="flex items-center gap-2">
              {!evaluation && application.evaluation_status !== 'completed' && (
                <Button 
                  size="sm" 
                  onClick={handleEvaluate}
                  disabled={evaluateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {evaluateMutation.isPending ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <Star className="h-3 w-3 mr-1" />
                      Start Evaluation
                    </>
                  )}
                </Button>
              )}
              
              {evaluation && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleReEvaluate}
                  disabled={reEvaluateMutation.isPending}
                >
                  {reEvaluateMutation.isPending ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Re-evaluating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Re-evaluate with New Prompts
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] mt-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Loading evaluation data...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No evaluation data available yet.</p>
              <p className="text-sm text-gray-400 mt-1">Click "Start Evaluation" to begin AI assessment.</p>
            </div>
          )}

          {evaluation && isValidEvaluation(evaluation) && (
            <div className="space-y-6">
              {/* Overall Score and Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      Overall Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getScoreColor(evaluation.overall_score)}`}>
                        {evaluation.overall_score}/10
                      </div>
                      <div className="mt-2">
                        <Badge variant={getScoreBadgeVariant(evaluation.overall_score)}>
                          {evaluation.overall_score >= 8 && 'Excellent'}
                          {evaluation.overall_score >= 6 && evaluation.overall_score < 8 && 'Good'}
                          {evaluation.overall_score >= 4 && evaluation.overall_score < 6 && 'Fair'}
                          {evaluation.overall_score < 4 && 'Needs Improvement'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Evaluation Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Questions Evaluated:</span>
                        <span className="font-medium">
                          {evaluation.question_scores ? Object.keys(evaluation.question_scores).length : 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed:</span>
                        <span className="font-medium text-green-600">
                          {evaluation.evaluation_completed_at 
                            ? new Date(evaluation.evaluation_completed_at).toLocaleDateString()
                            : 'Unknown'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant="secondary">AI Evaluated</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Idea Summary */}
              {evaluation.idea_summary && typeof evaluation.idea_summary === 'string' && evaluation.idea_summary.trim() && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Executive Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                        {evaluation.idea_summary}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Question-by-Question Breakdown */}
              {evaluation.question_scores && typeof evaluation.question_scores === 'object' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Question-by-Question Analysis</h3>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={expandAllQuestions}>
                        Expand All
                      </Button>
                      <Button size="sm" variant="outline" onClick={collapseAllQuestions}>
                        Collapse All
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(evaluation.question_scores).map(([questionId, questionEval]) => {
                      try {
                        return renderQuestionEvaluation(questionId, questionEval);
                      } catch (error) {
                        console.error(`Error rendering question ${questionId}:`, error);
                        return (
                          <Card key={questionId} className="mb-4">
                            <CardContent className="pt-4">
                              <p className="text-xs text-red-400">
                                Error rendering evaluation for {questionLabels[questionId] || questionId}
                              </p>
                            </CardContent>
                          </Card>
                        );
                      }
                    })}
                  </div>
                </div>
              )}

              {/* Show message if no question scores available */}
              {(!evaluation.question_scores || Object.keys(evaluation.question_scores).length === 0) && (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No detailed question analysis available.</p>
                  <p className="text-sm text-gray-400 mt-1">The evaluation may still be processing.</p>
                </div>
              )}
            </div>
          )}

          {/* Invalid evaluation data with enhanced error handling */}
          {evaluation && !isValidEvaluation(evaluation) && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-500">Evaluation data appears to be corrupted.</p>
              <p className="text-sm text-gray-400 mt-1">Please try re-evaluating this application.</p>
              <div className="mt-2 text-xs text-gray-300">
                Debug info: {JSON.stringify(evaluation, null, 2).substring(0, 200)}...
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
