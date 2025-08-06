
/**
 * @fileoverview Reusable Admin Application Question Component
 * 
 * Displays individual question-answer pairs with AI scoring and feedback
 * for YFF applications in the admin dashboard.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { User, Star, CheckCircle, AlertCircle } from 'lucide-react';

export interface AdminAppQuestionProps {
  questionKey: string;
  questionText: string;
  userAnswer: string;
  index: number;
  score?: number;
  strengths?: string[];
  improvements?: string[];
  rawFeedback?: string;
}

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

export const AdminAppQuestion: React.FC<AdminAppQuestionProps> = ({
  questionKey,
  questionText,
  userAnswer,
  index,
  score,
  strengths,
  improvements,
  rawFeedback
}) => {
  return (
    <div className="border rounded-lg p-4 bg-blue-50/30">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              Q{index + 1}
            </Badge>
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
              Answered
            </Badge>
            {score !== undefined && (
              <Badge variant={getScoreBadgeColor(score)} className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                {score}/10
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {questionKey}
            </Badge>
          </div>
          <h4 className="font-medium text-gray-900 mb-2">
            {questionText}
          </h4>
        </div>
      </div>

      {/* User's Answer */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Applicant's Answer</span>
        </div>
        <Card className="p-3 border-blue-200 bg-white">
          <CardContent className="p-0">
            <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-800">
              {userAnswer}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Feedback */}
      {(strengths || improvements || rawFeedback) && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Strengths */}
          {strengths && strengths.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Strengths
              </h5>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-3">
                  <ul className="space-y-1">
                    {strengths.map((strength: string, i: number) => (
                      <li key={i} className="text-sm text-green-800">
                        • {strength}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Areas for Improvement */}
          {improvements && improvements.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-orange-700 mb-2 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Areas for Improvement
              </h5>
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-3">
                  <ul className="space-y-1">
                    {improvements.map((improvement: string, i: number) => (
                      <li key={i} className="text-sm text-orange-800">
                        • {improvement}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {score === undefined && (
        <div className="text-center py-2">
          <p className="text-sm text-gray-500">AI evaluation pending for this answer</p>
        </div>
      )}
    </div>
  );
};

export default AdminAppQuestion;
