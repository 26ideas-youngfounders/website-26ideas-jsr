
/**
 * @fileoverview Debug Component for Questionnaire Display
 * 
 * Enhanced debug component to test and troubleshoot questionnaire parsing
 * and display issues in the admin dashboard.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React from 'react';
import { ExtendedYffApplication } from '@/types/yff-application';
import { parseQuestionnaireAnswers } from '@/utils/admin-question-parser';
import { AdminAppQuestion } from './AdminAppQuestion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface QuestionnaireDebugDisplayProps {
  application: ExtendedYffApplication;
}

export const QuestionnaireDebugDisplay: React.FC<QuestionnaireDebugDisplayProps> = ({ 
  application 
}) => {
  const parsingResult = parseQuestionnaireAnswers(application);
  
  // Debug render
  console.log('🎨 RENDERING QUESTIONNAIRE DEBUG:', parsingResult);
  
  if (parsingResult.parsingErrors.length > 0) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Parsing Errors Detected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-red-700 mb-2">Errors:</h4>
              <ul className="space-y-1">
                {parsingResult.parsingErrors.map((error, i) => (
                  <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
            
            <details className="mt-4">
              <summary className="cursor-pointer font-medium text-red-700 hover:text-red-800">
                View Raw Data Structure (Click to expand)
              </summary>
              <div className="mt-2 p-3 bg-white rounded border">
                <pre className="text-xs text-gray-800 overflow-auto max-h-96 whitespace-pre-wrap">
                  {JSON.stringify(parsingResult.rawDataStructure, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (parsingResult.parsedQuestions.length === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center gap-2">
            <Info className="h-5 w-5" />
            No Questions Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-amber-700">
              No questionnaire answers were found for this application. Check the browser console for detailed debugging information.
            </p>
            
            <div className="text-sm text-amber-600">
              <p><strong>Application ID:</strong> {application.application_id}</p>
              <p><strong>Total Data Sources Checked:</strong> Multiple (see console logs)</p>
            </div>
            
            <details className="mt-4">
              <summary className="cursor-pointer font-medium text-amber-700 hover:text-amber-800">
                View Application Object (Click to expand)
              </summary>
              <div className="mt-2 p-3 bg-white rounded border">
                <pre className="text-xs text-gray-800 overflow-auto max-h-96 whitespace-pre-wrap">
                  {JSON.stringify(application, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Questionnaire Answers Found
          <Badge variant="secondary" className="ml-2">
            {parsingResult.parsedQuestions.length} questions
          </Badge>
          <Badge variant="default" className="text-xs">
            {parsingResult.validAnswers} valid answers
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Successfully parsed questionnaire data from application
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {parsingResult.parsedQuestions.map((question, index) => (
            <AdminAppQuestion
              key={question.questionKey}
              questionKey={question.questionKey}
              questionText={question.questionText}
              userAnswer={question.userAnswer}
              index={index}
            />
          ))}
          
          {/* Debug info for developers */}
          <details className="mt-6 pt-4 border-t">
            <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
              Debug Information (Developer View)
            </summary>
            <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Parsing Stats:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>Total Found: {parsingResult.totalFound}</li>
                    <li>Valid Answers: {parsingResult.validAnswers}</li>
                    <li>Parse Errors: {parsingResult.parsingErrors.length}</li>
                  </ul>
                </div>
                <div>
                  <strong>Application Info:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>ID: {application.application_id.slice(0, 12)}...</li>
                    <li>Status: {application.evaluation_status || 'N/A'}</li>
                    <li>Score: {application.overall_score || 'N/A'}</li>
                  </ul>
                </div>
              </div>
            </div>
          </details>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionnaireDebugDisplay;
