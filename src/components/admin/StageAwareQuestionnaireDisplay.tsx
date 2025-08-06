
/**
 * @fileoverview Stage-Aware Questionnaire Display Component
 * 
 * Displays questionnaire answers using strict stage detection and zero
 * cross-stage contamination to ensure only the correct stage's questions
 * and answers are shown.
 * 
 * @version 2.0.0 - Strict Implementation
 * @author 26ideas Development Team
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdminAppQuestion } from './AdminAppQuestion';
import { ExtendedYffApplication } from '@/types/yff-application';
import { parseStrictQuestionnaire } from '@/utils/strict-questionnaire-parser';
import { getStageDisplayName, getStageColor } from '@/utils/stage-detection-service';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Shield,
  FileText,
  Eye,
  Target,
  Bug,
  Settings,
  ShieldAlert
} from 'lucide-react';

interface StageAwareQuestionnaireDisplayProps {
  application: ExtendedYffApplication;
}

export const StageAwareQuestionnaireDisplay: React.FC<StageAwareQuestionnaireDisplayProps> = ({ 
  application 
}) => {
  // Parse questions using strict stage-aware parser
  const parsingResult = useMemo(() => {
    console.log('🎨 RENDERING STRICT STAGE-AWARE QUESTIONNAIRE for:', application.application_id);
    return parseStrictQuestionnaire(application);
  }, [application]);

  // Render stage validation warnings
  const renderValidationWarnings = () => {
    if (parsingResult.stageValidation.isValid) return null;

    return (
      <Alert className="mb-4 border-red-200 bg-red-50">
        <ShieldAlert className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="space-y-2">
            <p><strong>⚠️ Cross-Stage Contamination Detected:</strong></p>
            {parsingResult.stageValidation.violations.map((violation, i) => (
              <p key={i} className="text-sm">• {violation}</p>
            ))}
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  // Render detection warnings
  const renderDetectionWarnings = () => {
    if (parsingResult.detectionInfo.warnings.length === 0) return null;

    return (
      <Alert className="mb-4 border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <div className="space-y-2">
            <p><strong>Stage Detection Warnings:</strong></p>
            {parsingResult.detectionInfo.warnings.map((warning, i) => (
              <p key={i} className="text-sm">• {warning}</p>
            ))}
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  // Render strict stage detection info
  const renderStageDetectionInfo = () => {
    return (
      <Card className="mb-4 border-indigo-200 bg-indigo-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-indigo-800">
            <Shield className="h-5 w-5" />
            Strict Stage Detection
            <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700">
              Zero Cross-Contamination
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-indigo-700">Raw productStage:</span>
              <p className="mt-1 p-2 bg-white rounded border text-gray-800 font-mono text-xs">
                {parsingResult.detectionInfo.rawProductStage || 'Not found'}
              </p>
            </div>
            <div>
              <span className="font-medium text-indigo-700">Detected Stage:</span>
              <div className="mt-1">
                <Badge 
                  className={`${parsingResult.detectedStage ? getStageColor(parsingResult.detectedStage) : 'bg-gray-100 text-gray-700'}`}
                >
                  <Target className="h-3 w-3 mr-1" />
                  {parsingResult.detectedStage ? getStageDisplayName(parsingResult.detectedStage) : 'Unknown'}
                </Badge>
              </div>
            </div>
            <div>
              <span className="font-medium text-indigo-700">Detection Method:</span>
              <p className="mt-1 text-xs text-indigo-600">
                {parsingResult.detectionInfo.detectionMethod}
              </p>
            </div>
            <div>
              <span className="font-medium text-indigo-700">Validation Status:</span>
              <Badge 
                variant={parsingResult.stageValidation.isValid ? "default" : "destructive"}
                className="mt-1 text-xs"
              >
                {parsingResult.stageValidation.isValid ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Clean
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Violations
                  </>
                )}
              </Badge>
            </div>
          </div>
          
          <div className="mt-4 p-2 bg-indigo-100 rounded text-xs text-indigo-800">
            <strong>Strict Policy:</strong> Only questions and answers for the detected stage are shown. Zero cross-stage contamination allowed.
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render summary stats
  const renderSummary = () => (
    <Card className="mb-6 border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <FileText className="h-5 w-5" />
          Strict Stage-Aware Analysis
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
            <div className="text-blue-700">Stage Questions</div>
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
              {parsingResult.totalQuestions > 0 ? Math.round((parsingResult.answeredQuestions / parsingResult.totalQuestions) * 100) : 0}%
            </div>
            <div className="text-indigo-700">Complete</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Handle no stage detected
  if (!parsingResult.detectedStage) {
    return (
      <div className="space-y-4">
        {renderStageDetectionInfo()}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              No Stage Detected - Cannot Display Questionnaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-3">
              Could not determine the user's application stage. No questions can be displayed without a valid stage.
            </p>
            <div className="text-sm text-red-600 space-y-1">
              <p><strong>Application ID:</strong> {application.application_id}</p>
              <p><strong>Raw productStage:</strong> {parsingResult.detectionInfo.rawProductStage || 'Not found'}</p>
              <p><strong>Detection Method:</strong> {parsingResult.detectionInfo.detectionMethod}</p>
              <p><strong>Warnings:</strong> {parsingResult.detectionInfo.warnings.length}</p>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer font-medium text-red-700 hover:text-red-800 flex items-center gap-2">
                <Bug className="h-4 w-4" />
                View Application Data for Debugging
              </summary>
              <div className="mt-2 p-3 bg-white rounded border max-h-96 overflow-y-auto">
                <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                  {JSON.stringify(application, null, 2)}
                </pre>
              </div>
            </details>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle no questions case (should be rare with valid stage)
  if (parsingResult.questions.length === 0) {
    return (
      <div className="space-y-4">
        {renderStageDetectionInfo()}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <Info className="h-5 w-5" />
              No Questions Found for Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 mb-3">
              Stage was detected but no questions are defined for this stage.
            </p>
            <div className="text-sm text-amber-600 space-y-1">
              <p><strong>Detected Stage:</strong> {getStageDisplayName(parsingResult.detectedStage)}</p>
              <p><strong>Application ID:</strong> {application.application_id}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderStageDetectionInfo()}
      {renderSummary()}
      {renderValidationWarnings()}
      {renderDetectionWarnings()}
      
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
            
            {/* Stage and answer status indicators */}
            <div className="mt-2 flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`text-xs ${getStageColor(question.stage)}`}
              >
                {getStageDisplayName(question.stage)} Q{question.orderIndex + 1}
              </Badge>
              
              {!question.hasAnswer && (
                <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                  Not Provided
                </Badge>
              )}
              
              {question.hasAnswer && !question.aiScore && (
                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                  Awaiting AI Evaluation
                </Badge>
              )}
              
              {question.hasAnswer && question.aiScore && (
                <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Evaluated
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Enhanced developer debug section */}
      <details className="mt-8 pt-4 border-t border-gray-200">
        <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800 flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Strict Parser Debug Information
        </summary>
        <div className="mt-3 p-3 bg-gray-50 rounded text-xs space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Application Info:</strong>
              <ul className="mt-1 space-y-1">
                <li>ID: {application.application_id.slice(0, 12)}...</li>
                <li>Raw productStage: {parsingResult.detectionInfo.rawProductStage || 'None'}</li>
                <li>Detected Stage: {parsingResult.detectedStage}</li>
                <li>Detection Method: {parsingResult.detectionInfo.detectionMethod}</li>
              </ul>
            </div>
            <div>
              <strong>Parsing Results:</strong>
              <ul className="mt-1 space-y-1">
                <li>Questions Found: {parsingResult.questions.length}</li>
                <li>Answered: {parsingResult.answeredQuestions}</li>
                <li>AI Evaluated: {parsingResult.questions.filter(q => q.aiScore).length}</li>
                <li>Validation Clean: {parsingResult.stageValidation.isValid ? 'Yes' : 'No'}</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-2 border-t border-gray-300">
            <strong>Available Answer Keys:</strong>
            <div className="mt-1 text-xs text-gray-600 font-mono">
              {Object.keys(parsingResult.rawAnswerData).join(', ') || 'None'}
            </div>
          </div>
          
          {parsingResult.stageValidation.violations.length > 0 && (
            <div className="pt-2 border-t border-red-200">
              <strong className="text-red-600">Validation Violations:</strong>
              <ul className="mt-1 text-xs text-red-600">
                {parsingResult.stageValidation.violations.map((violation, i) => (
                  <li key={i}>• {violation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>
    </div>
  );
};

export default StageAwareQuestionnaireDisplay;
