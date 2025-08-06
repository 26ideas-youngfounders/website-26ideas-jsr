
/**
 * @fileoverview Stage-Aware Questionnaire Display Component
 * 
 * Dynamically displays questionnaire answers based on the user's selected stage
 * with proper question mapping and AI scoring integration.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdminAppQuestion } from './AdminAppQuestion';
import { ExtendedYffApplication } from '@/types/yff-application';
import { parseStageAwareQuestions, ApplicationStage } from '@/utils/stage-aware-question-parser';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Zap,
  FileText,
  Eye,
  Target
} from 'lucide-react';

interface StageAwareQuestionnaireDisplayProps {
  application: ExtendedYffApplication;
}

/**
 * Get stage display name
 */
const getStageDisplayName = (stage: ApplicationStage): string => {
  const displayNames = {
    idea_stage: 'Idea Stage',
    early_revenue: 'Early Revenue',
    mvp_stage: 'MVP Stage'
  };
  
  return displayNames[stage] || stage.replace(/_/g, ' ').toUpperCase();
};

/**
 * Get stage color
 */
const getStageColor = (stage: ApplicationStage): string => {
  const colors = {
    idea_stage: 'bg-purple-100 text-purple-700 border-purple-200',
    early_revenue: 'bg-blue-100 text-blue-700 border-blue-200',
    mvp_stage: 'bg-green-100 text-green-700 border-green-200'
  };
  
  return colors[stage] || 'bg-gray-100 text-gray-700 border-gray-200';
};

export const StageAwareQuestionnaireDisplay: React.FC<StageAwareQuestionnaireDisplayProps> = ({ 
  application 
}) => {
  // Parse questions based on detected stage
  const parsingResult = useMemo(() => {
    return parseStageAwareQuestions(application);
  }, [application]);

  // Render warnings if any
  const renderWarnings = () => {
    if (parsingResult.warnings.length === 0) return null;

    return (
      <Alert className="mb-4 border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <div className="space-y-2">
            <p><strong>Stage Detection Warnings:</strong></p>
            {parsingResult.warnings.map((warning, i) => (
              <p key={i} className="text-sm">• {warning}</p>
            ))}
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  // Render summary stats
  const renderSummary = () => (
    <Card className="mb-6 border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <FileText className="h-5 w-5" />
          Stage-Aware Questionnaire Analysis
          <Badge 
            variant="secondary" 
            className={`ml-2 ${parsingResult.detectedStage ? getStageColor(parsingResult.detectedStage) : 'bg-gray-100 text-gray-700'}`}
          >
            <Target className="h-3 w-3 mr-1" />
            {parsingResult.detectedStage ? getStageDisplayName(parsingResult.detectedStage) : 'Unknown Stage'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {parsingResult.totalQuestions}
            </div>
            <div className="text-blue-700">Total Questions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {parsingResult.answeredQuestions}
            </div>
            <div className="text-green-700">Answered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {parsingResult.questions.filter(q => q.aiScore !== undefined).length}
            </div>
            <div className="text-purple-700">AI Scored</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {Math.round((parsingResult.answeredQuestions / parsingResult.totalQuestions) * 100)}%
            </div>
            <div className="text-indigo-700">Complete</div>
          </div>
        </div>
        
        {parsingResult.detectedStage && (
          <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800 flex items-center gap-2">
            <Info className="h-3 w-3" />
            Displaying questions for detected stage: <strong>{getStageDisplayName(parsingResult.detectedStage)}</strong>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Handle no questions case
  if (parsingResult.questions.length === 0) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            No Questions Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 mb-3">
            No questionnaire data could be extracted from this application for any stage.
          </p>
          <div className="text-sm text-red-600 space-y-1">
            <p><strong>Application ID:</strong> {application.application_id}</p>
            <p><strong>Detected Stage:</strong> {parsingResult.detectedStage || 'None'}</p>
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer font-medium text-red-700 hover:text-red-800">
              View Raw Application Data
            </summary>
            <div className="mt-2 p-3 bg-white rounded border max-h-96 overflow-y-auto">
              <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                {JSON.stringify(parsingResult.rawData, null, 2)}
              </pre>
            </div>
          </details>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {renderSummary()}
      {renderWarnings()}
      
      <div className="space-y-4">
        {parsingResult.questions.map((question, index) => (
          <div key={question.questionKey} className="relative">
            <AdminAppQuestion
              questionKey={question.questionKey}
              questionText={question.questionText}
              userAnswer={question.userAnswer}
              index={index}
              score={question.aiScore}
              strengths={question.aiStrengths}
              improvements={question.aiImprovements}
              rawFeedback={question.aiRawFeedback}
            />
            
            {/* Add stage and answer status indicators */}
            <div className="mt-2 flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`text-xs ${getStageColor(question.stage)}`}
              >
                {getStageDisplayName(question.stage)}
              </Badge>
              
              {!question.hasAnswer && (
                <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                  No Answer Provided
                </Badge>
              )}
              
              {question.hasAnswer && !question.aiScore && (
                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                  Awaiting AI Evaluation
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Developer debug section */}
      <details className="mt-8 pt-4 border-t border-gray-200">
        <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800 flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Developer Debug Information
        </summary>
        <div className="mt-3 p-3 bg-gray-50 rounded text-xs space-y-2">
          <div>
            <strong>Application ID:</strong> {application.application_id}
          </div>
          <div>
            <strong>Detected Stage:</strong> {parsingResult.detectedStage || 'Not detected'}
          </div>
          <div>
            <strong>Questions Found:</strong> {parsingResult.questions.length}
          </div>
          <div>
            <strong>Answered:</strong> {parsingResult.answeredQuestions}/{parsingResult.totalQuestions}
          </div>
          <div>
            <strong>AI Evaluated:</strong> {parsingResult.questions.filter(q => q.aiScore !== undefined).length}
          </div>
          <div>
            <strong>Warnings:</strong> {parsingResult.warnings.length}
          </div>
        </div>
      </details>
    </div>
  );
};

export default StageAwareQuestionnaireDisplay;
