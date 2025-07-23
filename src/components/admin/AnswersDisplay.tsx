
/**
 * @fileoverview Answers Display Component
 * 
 * Visual component for displaying YFF application answers
 * in a structured and readable format.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnswersDisplayProps {
  answers: any;
  compact?: boolean;
}

const AnswersDisplay: React.FC<AnswersDisplayProps> = ({ answers, compact = false }) => {
  if (!answers) {
    return <span className="text-gray-400">No answers provided</span>;
  }

  // Parse answers if it's a string
  let parsedAnswers: any;
  try {
    parsedAnswers = typeof answers === 'string' ? JSON.parse(answers) : answers;
  } catch (error) {
    console.error('Error parsing answers:', error);
    return <span className="text-red-400">Invalid answer format</span>;
  }

  if (compact) {
    return (
      <div className="space-y-2 max-w-md">
        {/* Team Information */}
        {parsedAnswers.team && (
          <div className="p-2 bg-blue-50 rounded">
            <h4 className="font-semibold text-sm text-blue-800">Team Info</h4>
            <p className="text-xs text-blue-600">
              {parsedAnswers.team.team_name || 'Team Name Not Provided'}
            </p>
            {parsedAnswers.team.venture?.venture_name && (
              <p className="text-xs text-blue-600">
                Venture: {parsedAnswers.team.venture.venture_name}
              </p>
            )}
          </div>
        )}

        {/* Questionnaire Answers */}
        {parsedAnswers.questionnaire && (
          <div className="p-2 bg-green-50 rounded">
            <h4 className="font-semibold text-sm text-green-800">Questionnaire</h4>
            <div className="text-xs text-green-600 space-y-1">
              {Object.entries(parsedAnswers.questionnaire).slice(0, 3).map(([key, value]) => (
                <div key={key}>
                  <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className="ml-1">
                    {typeof value === 'string' 
                      ? value.substring(0, 50) + (value.length > 50 ? '...' : '')
                      : JSON.stringify(value).substring(0, 50) + '...'
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show raw data if structure is different */}
        {!parsedAnswers.team && !parsedAnswers.questionnaire && (
          <div className="p-2 bg-gray-50 rounded">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap">
              {JSON.stringify(parsedAnswers, null, 2).substring(0, 200) + '...'}
            </pre>
          </div>
        )}
      </div>
    );
  }

  // Full display for detailed view
  return (
    <div className="space-y-4">
      {/* Team Information */}
      {parsedAnswers.team && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Team Details</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Team Name:</strong> {parsedAnswers.team.team_name || 'Not provided'}</div>
                  <div><strong>Team Size:</strong> {parsedAnswers.team.team_size || 'Not specified'}</div>
                  {parsedAnswers.team.team_members && (
                    <div>
                      <strong>Team Members:</strong>
                      <div className="mt-1 space-y-1">
                        {parsedAnswers.team.team_members.map((member: any, index: number) => (
                          <div key={index} className="pl-2 border-l-2 border-blue-200">
                            <div className="font-medium">{member.name}</div>
                            <div className="text-gray-600">{member.role}</div>
                            <div className="text-gray-500 text-xs">{member.email}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {parsedAnswers.team.venture && (
                <div>
                  <h4 className="font-semibold mb-2">Venture Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Venture Name:</strong> {parsedAnswers.team.venture.venture_name}</div>
                    <div><strong>Stage:</strong> {parsedAnswers.team.venture.stage || 'Not specified'}</div>
                    <div><strong>Industry:</strong> {parsedAnswers.team.venture.industry || 'Not specified'}</div>
                    {parsedAnswers.team.venture.description && (
                      <div><strong>Description:</strong> {parsedAnswers.team.venture.description}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questionnaire Answers */}
      {parsedAnswers.questionnaire && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Questionnaire Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(parsedAnswers.questionnaire).map(([key, value]) => (
                <div key={key} className="border rounded-lg p-4">
                  <h5 className="font-medium capitalize mb-2 text-blue-800">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h5>
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {Array.isArray(value) ? (
                      <div className="space-y-1">
                        {value.map((item, index) => (
                          <Badge key={index} variant="outline" className="mr-1">
                            {String(item)}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{String(value)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw Data Fallback */}
      {!parsedAnswers.team && !parsedAnswers.questionnaire && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Application Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded overflow-x-auto">
              {JSON.stringify(parsedAnswers, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnswersDisplay;
