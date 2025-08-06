
/**
 * @fileoverview Enhanced YFF Application Evaluation Dialog
 * 
 * Displays comprehensive AI evaluation results for YFF applications with
 * question-by-question analysis, user answers, AI scores, and feedback.
 * Supports both viewing existing evaluations and triggering re-evaluations.
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  RefreshCw, 
  Brain, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  User,
  MessageSquare,
  Star
} from 'lucide-react';
import { useYffEvaluations } from '@/hooks/useYffEvaluations';
import { 
  parseEvaluationData, 
  getOrderedQuestions,
  ExtendedYffApplication 
} from '@/types/yff-application';

interface YffApplicationEvaluationDialogProps {
  application: ExtendedYffApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Enhanced evaluation dialog component with proper question-answer mapping
 */
export const YffApplicationEvaluationDialog: React.FC<YffApplicationEvaluationDialogProps> = ({
  application,
  open,
  onOpenChange,
}) => {
  const { reEvaluate, isReEvaluating } = useYffEvaluations();

  if (!application) return null;

  // Parse evaluation data
  const evaluationData = parseEvaluationData(application.evaluation_data);
  const scores = evaluationData.scores || {};
  const hasEvaluationData = Object.keys(scores).length > 0;

  // Get ordered questions for consistent display
  const orderedQuestions = getOrderedQuestions(scores);

  const handleReEvaluate = () => {
    if (application?.application_id) {
      reEvaluate({ applicationId: application.application_id });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 6) return 'text-blue-600 bg-blue-50';
    if (score >= 4) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-purple-600" />
              <div>
                <DialogTitle className="text-xl font-semibold">
                  AI Evaluation Results
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Application: {application.application_id?.slice(0, 8)}...
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(application.evaluation_status)}
              <Badge 
                variant={application.evaluation_status === 'completed' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {application.evaluation_status}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-6">
          <div className="space-y-6">
            {/* Overall Score Card */}
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Overall Score
                  </CardTitle>
                  <Button
                    onClick={handleReEvaluate}
                    disabled={isReEvaluating}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isReEvaluating ? 'animate-spin' : ''}`} />
                    Re-evaluate
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-primary">
                    {application.overall_score?.toFixed(1) || 'N/A'}
                    <span className="text-lg text-muted-foreground">/10</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground mb-1">
                      Based on {orderedQuestions.length} evaluated questions
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last updated: {application.evaluation_completed_at ? 
                        new Date(application.evaluation_completed_at).toLocaleDateString() : 
                        'Not available'
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Question-by-Question Analysis */}
            {hasEvaluationData ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Detailed Question Analysis
                </h3>
                
                {orderedQuestions.map(({ key, data }, index) => (
                  <Card key={key} className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              Q{index + 1}
                            </Badge>
                            <div className={`px-2 py-1 rounded-md text-sm font-medium ${getScoreColor(data.score || 0)}`}>
                              Score: {data.score || 0}/10
                            </div>
                          </div>
                          <CardTitle className="text-base font-medium text-gray-900">
                            {data.question_text || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* User's Answer */}
                      {data.user_answer && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">User's Answer</span>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">
                              {data.user_answer}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* AI Feedback */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Strengths */}
                        {data.strengths && data.strengths.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              Strengths
                            </h4>
                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                              <ul className="space-y-1">
                                {data.strengths.map((strength: string, i: number) => (
                                  <li key={i} className="text-sm text-green-800">
                                    • {strength}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* Areas for Improvement */}
                        {data.areas_for_improvement && data.areas_for_improvement.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-orange-700 mb-2 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              Areas for Improvement
                            </h4>
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                              <ul className="space-y-1">
                                {data.areas_for_improvement.map((improvement: string, i: number) => (
                                  <li key={i} className="text-sm text-orange-800">
                                    • {improvement}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-600 mb-2">
                    No Evaluation Data Available
                  </p>
                  <p className="text-sm text-gray-500 text-center mb-6">
                    This application hasn't been evaluated yet or the evaluation failed.
                  </p>
                  <Button
                    onClick={handleReEvaluate}
                    disabled={isReEvaluating}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isReEvaluating ? 'animate-spin' : ''}`} />
                    Start Evaluation
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Evaluation Metadata */}
            {evaluationData.evaluation_metadata && (
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-sm">Evaluation Details</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-1">
                  <div>Model: {evaluationData.evaluation_metadata.model_used}</div>
                  <div>Version: {evaluationData.evaluation_metadata.evaluation_version}</div>
                  <div>Questions Scored: {evaluationData.evaluation_metadata.questions_scored}</div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default YffApplicationEvaluationDialog;
