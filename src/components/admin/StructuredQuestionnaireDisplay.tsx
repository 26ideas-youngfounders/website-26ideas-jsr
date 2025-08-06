
/**
 * @fileoverview Structured Questionnaire Display Component
 * 
 * Displays questionnaire answers in a properly structured format with individual
 * question-answer pairs, AI scoring, and clear visual separation.
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
import { splitQuestionnaireAnswers, SplittingResult } from '@/utils/question-splitter';
import { getEvaluationKey } from '@/utils/admin-question-parser';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Zap,
  FileText,
  Eye
} from 'lucide-react';

interface StructuredQuestionnaireDisplayProps {
  application: ExtendedYffApplication;
}

/**
 * Safe parsing function for evaluation data
 */
const safeParseEvaluationData = (evaluationData: any) => {
  try {
    if (!evaluationData) return { scores: {} };
    if (typeof evaluationData === 'string') {
      return JSON.parse(evaluationData);
    }
    if (typeof evaluationData === 'object') {
      return evaluationData;
    }
    return { scores: {} };
  } catch (error) {
    console.error('❌ Error parsing evaluation data:', error);
    return { scores: {} };
  }
};

/**
 * Extract questionnaire data from application
 */
const extractQuestionnaireData = (application: ExtendedYffApplication): any => {
  console.log('📊 EXTRACTING DATA FOR STRUCTURED DISPLAY:', application.application_id);
  
  // Try multiple data sources
  const possibleSources = [
    application.answers,
    application.yff_team_registrations,
    (application as any).questionnaire_answers,
    (application as any).form_responses,
    application
  ];
  
  for (const source of possibleSources) {
    if (source && typeof source === 'object') {
      console.log('✅ USING DATA SOURCE:', source);
      return source;
    }
  }
  
  console.log('❌ NO DATA SOURCE FOUND');
  return {};
};

export const StructuredQuestionnaireDisplay: React.FC<StructuredQuestionnaireDisplayProps> = ({ 
  application 
}) => {
  // Extract and split questionnaire data
  const splittingResult: SplittingResult = useMemo(() => {
    const rawData = extractQuestionnaireData(application);
    return splitQuestionnaireAnswers(rawData, 'early_revenue');
  }, [application]);

  // Parse evaluation data for AI scoring
  const evaluationData = useMemo(() => {
    return safeParseEvaluationData(application.evaluation_data);
  }, [application.evaluation_data]);

  // Combine split answers with AI evaluation data
  const questionsWithScoring = useMemo(() => {
    return splittingResult.splitAnswers.map((splitAnswer, index) => {
      const evalKey = getEvaluationKey(splitAnswer.questionKey);
      const evaluationScore = evaluationData.scores?.[evalKey] || 
                            evaluationData.scores?.[splitAnswer.questionKey] ||
                            evaluationData.scores?.[splitAnswer.questionKey.toLowerCase()];

      return {
        questionKey: splitAnswer.questionKey,
        questionText: splitAnswer.questionText,
        userAnswer: splitAnswer.userAnswer,
        index,
        score: evaluationScore?.score,
        strengths: evaluationScore?.strengths,
        improvements: evaluationScore?.areas_for_improvement || evaluationScore?.improvements,
        rawFeedback: evaluationScore?.raw_feedback,
        confidence: splitAnswer.confidence,
        splitMethod: splitAnswer.splitMethod,
        warnings: splitAnswer.warnings
      };
    });
  }, [splittingResult.splitAnswers, evaluationData.scores]);

  // Render warnings if auto-splitting was used
  const renderWarnings = () => {
    if (!splittingResult.usedAutoSplitting && splittingResult.warnings.length === 0) {
      return null;
    }

    return (
      <Alert className="mb-4 border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <div className="space-y-2">
            {splittingResult.usedAutoSplitting && (
              <p>
                <strong>Auto-splitting used:</strong> Answers have been automatically separated based on detected patterns. 
                Please review for accuracy.
              </p>
            )}
            {splittingResult.warnings.map((warning, i) => (
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
          Structured Questionnaire Analysis
          <Badge variant="secondary" className="ml-2">
            Enhanced Parsing
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {splittingResult.totalQuestions}
            </div>
            <div className="text-blue-700">Total Questions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {splittingResult.successfulSplits}
            </div>
            <div className="text-green-700">Answered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {questionsWithScoring.filter(q => q.score !== undefined).length}
            </div>
            <div className="text-purple-700">AI Scored</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${splittingResult.usedAutoSplitting ? 'text-amber-600' : 'text-gray-600'}`}>
              {splittingResult.usedAutoSplitting ? 'AUTO' : 'DIRECT'}
            </div>
            <div className={`${splittingResult.usedAutoSplitting ? 'text-amber-700' : 'text-gray-700'}`}>
              Parse Method
            </div>
          </div>
        </div>
        
        {splittingResult.usedAutoSplitting && (
          <div className="mt-3 p-2 bg-amber-100 rounded text-xs text-amber-800 flex items-center gap-2">
            <Zap className="h-3 w-3" />
            Automatic answer splitting was applied. Review individual answers for accuracy.
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Handle no questions case
  if (splittingResult.splitAnswers.length === 0) {
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
            No questionnaire data could be extracted from this application.
          </p>
          <details className="mt-4">
            <summary className="cursor-pointer font-medium text-red-700 hover:text-red-800">
              View Raw Application Data
            </summary>
            <div className="mt-2 p-3 bg-white rounded border max-h-96 overflow-y-auto">
              <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                {JSON.stringify(splittingResult.rawData, null, 2)}
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
        {questionsWithScoring.map((question) => (
          <div key={question.questionKey} className="relative">
            <AdminAppQuestion
              questionKey={question.questionKey}
              questionText={question.questionText}
              userAnswer={question.userAnswer}
              index={question.index}
              score={question.score}
              strengths={question.strengths}
              improvements={question.improvements}
              rawFeedback={question.rawFeedback}
            />
            
            {/* Add confidence and method indicators for debugging */}
            {(question.confidence !== 'high' || question.warnings.length > 0) && (
              <div className="mt-2 flex items-center gap-2">
                {question.confidence !== 'high' && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      question.confidence === 'medium' ? 'border-amber-300 text-amber-700' : 'border-red-300 text-red-700'
                    }`}
                  >
                    {question.confidence} confidence
                  </Badge>
                )}
                
                {question.splitMethod === 'pattern_match' && (
                  <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                    Pattern matched
                  </Badge>
                )}
                
                {question.splitMethod === 'fallback' && (
                  <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                    Order-based match
                  </Badge>
                )}
                
                {question.warnings.length > 0 && (
                  <div className="text-xs text-amber-600">
                    ⚠️ {question.warnings[0]}
                  </div>
                )}
              </div>
            )}
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
            <strong>Split Method:</strong> {splittingResult.usedAutoSplitting ? 'Auto-splitting' : 'Direct matching'}
          </div>
          <div>
            <strong>Success Rate:</strong> {splittingResult.successfulSplits}/{splittingResult.totalQuestions} 
            ({Math.round((splittingResult.successfulSplits / splittingResult.totalQuestions) * 100)}%)
          </div>
          <div>
            <strong>Warnings:</strong> {splittingResult.warnings.length}
          </div>
        </div>
      </details>
    </div>
  );
};

export default StructuredQuestionnaireDisplay;
