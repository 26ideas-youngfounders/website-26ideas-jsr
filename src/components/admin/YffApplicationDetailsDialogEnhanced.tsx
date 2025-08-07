
/**
 * @fileoverview Enhanced YFF Application Details Dialog
 * 
 * Comprehensive admin interface for viewing and managing YFF application details
 * with AI evaluation integration, stage-based display, and enhanced error handling.
 * 
 * @version 3.3.0
 * @author 26ideas Development Team
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  User, 
  Calendar, 
  Target,
  Brain,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import type { YffApplicationWithIndividual } from '@/types/yff-application';
import { TeamRegistrationSection } from './TeamRegistrationSection';

interface YffApplicationDetailsDialogEnhancedProps {
  application: YffApplicationWithIndividual | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StageConfiguration {
  stage: string;
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  questions: { key: string; label: string }[];
}

interface EvaluationStatusDisplay {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
}

/**
 * Stage configurations for questionnaire display
 */
const STAGE_CONFIGURATIONS: StageConfiguration[] = [
  {
    stage: 'idea-stage',
    title: 'Idea Stage Questions',
    icon: Target,
    questions: [
      { key: 'problem-statement', label: 'Problem Statement' },
      { key: 'target-audience', label: 'Target Audience' },
      { key: 'solution-description', label: 'Solution Description' },
      { key: 'unique-value-proposition', label: 'Unique Value Proposition' },
      { key: 'market-size', label: 'Market Size & Opportunity' },
      { key: 'revenue-model', label: 'Revenue Model' },
      { key: 'competitive-advantage', label: 'Competitive Advantage' },
      { key: 'implementation-plan', label: 'Implementation Plan' },
      { key: 'success-metrics', label: 'Success Metrics' },
      { key: 'resources-needed', label: 'Resources Needed' }
    ]
  }
];

/**
 * Get human-readable evaluation status
 */
const getEvaluationStatusDisplay = (status: string): EvaluationStatusDisplay => {
  switch (status) {
    case 'completed':
      return { 
        label: 'Evaluation Complete', 
        variant: 'default' as const,
        icon: CheckCircle,
        color: 'text-green-600'
      };
    case 'processing':
      return { 
        label: 'Evaluating...', 
        variant: 'secondary' as const,
        icon: Clock,
        color: 'text-blue-600'
      };
    case 'failed':
      return { 
        label: 'Evaluation Failed', 
        variant: 'destructive' as const,
        icon: AlertCircle,
        color: 'text-red-600'
      };
    default:
      return { 
        label: 'Pending Evaluation', 
        variant: 'outline' as const,
        icon: Clock,
        color: 'text-gray-600'
      };
  }
};

/**
 * Safely extract and display questionnaire answers
 */
const extractQuestionnaireAnswers = (application: YffApplicationWithIndividual) => {
  console.log('📋 Processing questionnaire answers for application:', application.application_id);
  
  const answers = application.answers;
  console.log('📋 Raw answers object:', answers);
  
  if (!answers || typeof answers !== 'object') {
    console.log('❌ No valid answers found');
    return [];
  }

  // Try different possible answer storage patterns
  const possiblePaths = [
    Array.isArray(answers) ? null : (answers as Record<string, any>).questionnaire_answers,
    Array.isArray(answers) ? null : (answers as Record<string, any>).answers,
    Array.isArray(answers) ? null : answers
  ];

  let questionnaireAnswers = null;
  for (const path of possiblePaths) {
    if (path && typeof path === 'object') {
      questionnaireAnswers = path;
      break;
    }
  }

  if (!questionnaireAnswers) {
    console.log('❌ No questionnaire answers found in any expected path');
    return [];
  }

  console.log('✅ Found questionnaire answers:', questionnaireAnswers);

  // Convert to array format for display
  const answerList = Object.entries(questionnaireAnswers)
    .filter(([key, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => ({
      question: key,
      answer: value,
      label: key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }));

  console.log('📋 Processed answer list:', answerList);
  return answerList;
};

/**
 * Extract and format AI evaluation data
 */
const extractEvaluationData = (application: YffApplicationWithIndividual) => {
  const evaluationData = application.evaluation_data || {};
  
  if (!evaluationData || typeof evaluationData !== 'object') {
    return null;
  }

  return {
    overallScore: application.overall_score || 0,
    completedAt: application.evaluation_completed_at,
    criteria: (evaluationData as Record<string, any>).criteria || {},
    feedback: (evaluationData as Record<string, any>).feedback || {},
    recommendations: (evaluationData as Record<string, any>).recommendations || []
  };
};

export const YffApplicationDetailsDialogEnhanced: React.FC<YffApplicationDetailsDialogEnhancedProps> = ({
  application,
  open,
  onOpenChange,
}) => {
  if (!application) {
    return null;
  }

  const individual = application.individuals;
  const evaluationStatus = getEvaluationStatusDisplay(application.evaluation_status || 'pending');
  const StatusIcon = evaluationStatus.icon;
  
  const questionnaireAnswers = extractQuestionnaireAnswers(application);
  const evaluationData = extractEvaluationData(application);

  console.log('🔍 Application details dialog rendered for:', {
    applicationId: application.application_id,
    evaluationStatus: application.evaluation_status,
    questionnaireAnswersCount: questionnaireAnswers.length,
    hasEvaluationData: !!evaluationData
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              Application Details
            </DialogTitle>
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-4 w-4 ${evaluationStatus.color}`} />
              <Badge variant={evaluationStatus.variant}>
                {evaluationStatus.label}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{individual?.first_name} {individual?.last_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Submitted {new Date(application.created_at).toLocaleDateString()}</span>
            </div>
            {evaluationData?.overallScore > 0 && (
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <span>Score: {evaluationData.overallScore.toFixed(1)}/10</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <Tabs defaultValue="registration" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="registration" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Registration Details
              </TabsTrigger>
              <TabsTrigger value="questionnaire" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Questionnaire
                <Badge variant="secondary" className="ml-1 text-xs">
                  {questionnaireAnswers.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="evaluation" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Evaluation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="registration" className="mt-6">
              <TeamRegistrationSection application={application} />
            </TabsContent>

            <TabsContent value="questionnaire" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Questionnaire Responses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {questionnaireAnswers.length > 0 ? (
                    <div className="space-y-6">
                      {STAGE_CONFIGURATIONS.map(stage => {
                        const StageIcon = stage.icon;
                        const stageAnswers = questionnaireAnswers.filter(qa => 
                          stage.questions.some(q => q.key === qa.question)
                        );

                        if (stageAnswers.length === 0) return null;

                        return (
                          <div key={stage.stage} className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                              <StageIcon className="h-5 w-5 text-blue-600" />
                              <h3 className="text-lg font-semibold">{stage.title}</h3>
                              <Badge variant="outline" className="ml-2">
                                {stageAnswers.length} responses
                              </Badge>
                            </div>
                            
                            <div className="grid gap-4">
                              {stageAnswers.map((qa, index) => (
                                <div key={qa.question} className="bg-gray-50 rounded-lg p-4">
                                  <h4 className="font-medium text-gray-900 mb-2">
                                    {qa.label}
                                  </h4>
                                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {typeof qa.answer === 'object' ? 
                                      JSON.stringify(qa.answer, null, 2) : 
                                      String(qa.answer)
                                    }
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {/* Show any ungrouped answers */}
                      {(() => {
                        const groupedQuestions = STAGE_CONFIGURATIONS.flatMap(stage => 
                          stage.questions.map(q => q.key)
                        );
                        const ungroupedAnswers = questionnaireAnswers.filter(qa => 
                          !groupedQuestions.includes(qa.question)
                        );

                        if (ungroupedAnswers.length === 0) return null;

                        return (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                              <FileText className="h-5 w-5 text-gray-600" />
                              <h3 className="text-lg font-semibold">Other Responses</h3>
                              <Badge variant="outline" className="ml-2">
                                {ungroupedAnswers.length} responses
                              </Badge>
                            </div>
                            
                            <div className="grid gap-4">
                              {ungroupedAnswers.map((qa, index) => (
                                <div key={qa.question} className="bg-gray-50 rounded-lg p-4">
                                  <h4 className="font-medium text-gray-900 mb-2">
                                    {qa.label}
                                  </h4>
                                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {typeof qa.answer === 'object' ? 
                                      JSON.stringify(qa.answer, null, 2) : 
                                      String(qa.answer)
                                    }
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No questionnaire responses found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evaluation" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Evaluation Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {evaluationData ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div>
                          <h3 className="font-semibold text-blue-900">Overall Score</h3>
                          <p className="text-sm text-blue-700">
                            Completed {evaluationData.completedAt ? 
                              new Date(evaluationData.completedAt).toLocaleString() : 
                              'Recently'
                            }
                          </p>
                        </div>
                        <div className="text-3xl font-bold text-blue-600">
                          {evaluationData.overallScore.toFixed(1)}/10
                        </div>
                      </div>

                      {Object.keys(evaluationData.criteria).length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Evaluation Criteria</h4>
                          <div className="space-y-2">
                            {Object.entries(evaluationData.criteria).map(([criterion, score]) => (
                              <div key={criterion} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                <span className="capitalize">{criterion.replace(/_/g, ' ')}</span>
                                <Badge variant="secondary">{String(score)}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {Object.keys(evaluationData.feedback).length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Detailed Feedback</h4>
                          <div className="space-y-3">
                            {Object.entries(evaluationData.feedback).map(([area, feedback]) => (
                              <div key={area} className="p-4 border rounded-lg">
                                <h5 className="font-medium capitalize mb-2">
                                  {area.replace(/_/g, ' ')}
                                </h5>
                                <p className="text-gray-700 text-sm">
                                  {String(feedback)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {evaluationData.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Recommendations</h4>
                          <ul className="space-y-2">
                            {evaluationData.recommendations.map((recommendation, index) => (
                              <li key={index} className="flex items-start gap-2 p-3 bg-green-50 rounded">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-green-800">
                                  {String(recommendation)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No evaluation data available</p>
                      <p className="text-sm mt-2">
                        {application.evaluation_status === 'processing' ? 
                          'Evaluation is currently in progress...' :
                          'This application has not been evaluated yet.'
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
