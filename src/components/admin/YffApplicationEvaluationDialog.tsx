
/**
 * @fileoverview YFF Application AI Evaluation Dialog
 * 
 * Displays comprehensive AI evaluation results for YFF applications
 * with detailed scores, feedback, and admin controls.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Zap
} from 'lucide-react';
import { evaluateApplication, reEvaluateApplication, getApplicationEvaluation, QuestionEvaluation } from '@/services/ai-evaluation-service';

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
  workingDuration: 'Working Duration'
};

/**
 * Question icons for better visual organization
 */
const questionIcons: Record<string, React.ElementType> = {
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
  workingDuration: Star
};

export const YffApplicationEvaluationDialog: React.FC<YffApplicationEvaluationDialogProps> = ({ 
  application 
}) => {
  const [isOpen, setIsOpen] = useState(false);
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
      toast({
        title: "Evaluation Failed",
        description: error.message || "Failed to start evaluation process",
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
        description: "AI re-evaluation is now processing. This may take a few minutes.",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['yff-applications'] });
    },
    onError: (error: any) => {
      toast({
        title: "Re-evaluation Failed",
        description: error.message || "Failed to start re-evaluation process",
        variant: "destructive",
      });
    },
  });

  const handleEvaluate = () => {
    evaluateMutation.mutate();
  };

  const handleReEvaluate = () => {
    reEvaluateMutation.mutate();
  };

  /**
   * Render individual question evaluation
   */
  const renderQuestionEvaluation = (questionId: string, questionEval: QuestionEvaluation) => {
    const IconComponent = questionIcons[questionId] || FileText;
    const label = questionLabels[questionId] || questionId;
    
    return (
      <Card key={questionId} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconComponent className="h-4 w-4 text-gray-600" />
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
            </div>
            <Badge variant={getScoreBadgeVariant(questionEval.score)} className="font-semibold">
              {questionEval.score}/10
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Strengths */}
          {questionEval.strengths.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-green-700 mb-1">Strengths:</h5>
              <div className="text-xs text-gray-600">
                {questionEval.strengths.map((strength, idx) => (
                  <div key={idx} className="mb-1">• {strength}</div>
                ))}
              </div>
            </div>
          )}
          
          {/* Areas for Improvement */}
          {questionEval.improvements.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-orange-700 mb-1">Areas for Improvement:</h5>
              <div className="text-xs text-gray-600">
                {questionEval.improvements.map((improvement, idx) => (
                  <div key={idx} className="mb-1">• {improvement}</div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
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
            AI Evaluation - {application.individuals?.first_name} {application.individuals?.last_name}
          </DialogTitle>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Application ID: {application.application_id.slice(0, 8)}...
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
                      Re-evaluate
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

          {evaluation && (
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
                        <span className="font-medium">{Object.keys(evaluation.question_scores).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed:</span>
                        <span className="font-medium text-green-600">
                          {new Date(evaluation.evaluation_completed_at).toLocaleDateString()}
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
              {evaluation.idea_summary && (
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
              <div>
                <h3 className="text-lg font-semibold mb-4">Question-by-Question Analysis</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {Object.entries(evaluation.question_scores).map(([questionId, questionEval]) =>
                    renderQuestionEvaluation(questionId, questionEval as QuestionEvaluation)
                  )}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
