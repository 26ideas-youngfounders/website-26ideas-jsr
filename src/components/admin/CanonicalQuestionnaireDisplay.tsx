
/**
 * @fileoverview Canonical Questionnaire Display Component
 * 
 * Displays questionnaire answers using canonical stage detection
 * with strict ID-based mapping and zero cross-stage contamination.
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
import { parseCanonicalQuestionnaire } from '@/utils/canonical-questionnaire-parser';
import { getStageDisplayName, getStageColor } from '@/utils/stage-questionnaire-mapper';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Shield,
  FileText,
  Eye,
  Target,
  Bug
} from 'lucide-react';

interface CanonicalQuestionnaireDisplayProps {
  application: ExtendedYffApplication;
}

export const CanonicalQuestionnaireDisplay: React.FC<CanonicalQuestionnaireDisplayProps> = ({ 
  application 
}) => {
  // Parse questions using canonical parser
  const parsingResult = useMemo(() => {
    console.log('🎨 RENDERING CANONICAL QUESTIONNAIRE for:', application.application_id);
    return parseCanonicalQuestionnaire(application);
  }, [application]);

  // Render stage detection information
  const renderStageDetectionInfo = () => {
    return (
      <Card className="mb-4 border-indigo-200 bg-indigo-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-indigo-800">
            <Shield className="h-5 w-5" />
            Canonical Stage Detection
            <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700">
              ID-Based Mapping
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-indigo-700">Raw productStage:</span>
              <p className="mt-1 p-2 bg-white rounded border text-gray-800 font-mono text-xs">
                {parsingResult.stageDetectionInfo.rawProductStage || 'Not found'}
              </p>
            </div>
            <div>
              <span className="font-medium text-indigo-700">Canonical Stage:</span>
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
              <span className="font-medium text-indigo-700">Detection Source:</span>
              <p className="mt-1 text-xs text-indigo-600">
                {parsingResult.stageDetectionInfo.detectionSource}
              </p>
            </div>
            <div>
              <span className="font-medium text-indigo-700">Answer Source:</span>
              <p className="mt-1 text-xs text-indigo-600">
                {Object.keys(parsingResult.rawAnswerData).length > 0 ? 'questionnaire_answers' : 'No data found'}
              </p>
            </div>
          </div>
          
          {parsingResult.stageDetectionInfo.warnings.length > 0 && (
            <div className="mt-4 p-2 bg-amber-100 rounded text-xs text-amber-800">
              <strong>Warnings:</strong>
              <ul className="mt-1 space-y-1">
                {parsingResult.stageDetectionInfo.warnings.map((warning, i) => (
                  <li key={i}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-4 p-2 bg-indigo-100 rounded text-xs text-indigo-800">
            <strong>Canonical Policy:</strong> Only questions and answers for the detected canonical stage are shown. Zero cross-stage contamination guaranteed.
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render summary statistics
  const renderSummary = () => (
    <Card className="mb-6 border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <FileText className="h-5 w-5" />
          Canonical Stage Analysis
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
            <div className="text-purple-700">AI Evaluated</div>
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
              No Canonical Stage Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-3">
              Could not determine the user's canonical application stage. No questions can be displayed without a valid stage mapping.
            </p>
            <div className="text-sm text-red-600 space-y-1">
              <p><strong>Application ID:</strong> {application.application_id}</p>
              <p><strong>Raw productStage:</strong> {parsingResult.stageDetectionInfo.rawProductStage || 'Not found'}</p>
              <p><strong>Detection Source:</strong> {parsingResult.stageDetectionInfo.detectionSource}</p>
              <p><strong>Warnings:</strong> {parsingResult.stageDetectionInfo.warnings.length}</p>
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

  // Handle no questions case
  if (parsingResult.questions.length === 0) {
    return (
      <div className="space-y-4">
        {renderStageDetectionInfo()}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <Info className="h-5 w-5" />
              No Questions Found for Canonical Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 mb-3">
              Canonical stage was detected but no question mapping exists for this stage.
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
      
      <div className="space-y-4">
        {parsingResult.questions.map((question, index) => (
          <div key={question.questionId} className="relative">
            <AdminAppQuestion
              questionKey={question.questionId}
              questionText={question.questionLabel}
              userAnswer={question.userAnswer}
              index={index}
              score={question.aiScore}
              strengths={question.aiStrengths}
              improvements={question.aiImprovements}
              rawFeedback={question.aiRawFeedback}
            />
            
            {/* Question metadata indicators */}
            <div className="mt-2 flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`text-xs ${getStageColor(question.stage)}`}
              >
                {getStageDisplayName(question.stage)} Q{question.orderNumber}
              </Badge>
              
              <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                ID: {question.questionId}
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
      
      {/* Enhanced debug section */}
      <details className="mt-8 pt-4 border-t border-gray-200">
        <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800 flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Canonical Parser Debug Information
        </summary>
        <div className="mt-3 p-3 bg-gray-50 rounded text-xs space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Application Info:</strong>
              <ul className="mt-1 space-y-1">
                <li>ID: {application.application_id.slice(0, 12)}...</li>
                <li>Raw productStage: {parsingResult.stageDetectionInfo.rawProductStage || 'None'}</li>
                <li>Canonical Stage: {parsingResult.detectedStage}</li>
                <li>Detection Source: {parsingResult.stageDetectionInfo.detectionSource}</li>
              </ul>
            </div>
            <div>
              <strong>Data Sources:</strong>
              <ul className="mt-1 space-y-1">
                <li>Answer Keys: {Object.keys(parsingResult.rawAnswerData).length}</li>
                <li>Evaluation Keys: {Object.keys(parsingResult.rawEvaluationData).length}</li>
                <li>Questions Found: {parsingResult.questions.length}</li>
                <li>Answered: {parsingResult.answeredQuestions}</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-2 border-t border-gray-300">
            <strong>Available Answer Keys:</strong>
            <div className="mt-1 text-xs text-gray-600 font-mono">
              {Object.keys(parsingResult.rawAnswerData).join(', ') || 'None'}
            </div>
          </div>
          
          <div className="pt-2 border-t border-gray-300">
            <strong>Available Evaluation Keys:</strong>
            <div className="mt-1 text-xs text-gray-600 font-mono">
              {Object.keys(parsingResult.rawEvaluationData).join(', ') || 'None'}
            </div>
          </div>
        </div>
      </details>
    </div>
  );
};

export default CanonicalQuestionnaireDisplay;
