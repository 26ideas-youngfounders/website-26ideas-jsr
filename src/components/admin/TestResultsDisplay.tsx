
/**
 * @fileoverview Test Results Display Component
 * 
 * Shows comprehensive testing results and system health metrics
 * for the AI scoring system and admin dashboard.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Clock,
  BarChart3,
  Users,
  RefreshCw
} from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'warning' | 'pending';
  duration?: number;
  details?: string;
  timestamp?: Date;
}

interface TestResultsDisplayProps {
  testResults: TestResult[];
  isRunning?: boolean;
  onRunTests?: () => void;
  onRunSingleTest?: (testId: string) => void;
}

/**
 * Get status icon and color for test results
 */
const getStatusDisplay = (status: TestResult['status']) => {
  switch (status) {
    case 'passed':
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        variant: 'default' as const
      };
    case 'failed':
      return {
        icon: XCircle,
        color: 'text-red-600',
        variant: 'destructive' as const
      };
    case 'warning':
      return {
        icon: AlertCircle,
        color: 'text-yellow-600',
        variant: 'secondary' as const
      };
    case 'pending':
      return {
        icon: Clock,
        color: 'text-gray-600',
        variant: 'outline' as const
      };
  }
};

export const TestResultsDisplay: React.FC<TestResultsDisplayProps> = ({
  testResults,
  isRunning = false,
  onRunTests,
  onRunSingleTest
}) => {
  const passedCount = testResults.filter(t => t.status === 'passed').length;
  const failedCount = testResults.filter(t => t.status === 'failed').length;
  const warningCount = testResults.filter(t => t.status === 'warning').length;
  const pendingCount = testResults.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{passedCount}</div>
                <div className="text-xs text-gray-500">Passed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                <div className="text-xs text-gray-500">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
                <div className="text-xs text-gray-500">Warnings</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <div>
                <div className="text-2xl font-bold text-gray-600">{pendingCount}</div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Test Suite
            </CardTitle>
            {onRunTests && (
              <Button 
                onClick={onRunTests} 
                disabled={isRunning}
                variant="outline"
                size="sm"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Run All Tests
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testResults.map((test) => {
              const { icon: StatusIcon, color, variant } = getStatusDisplay(test.status);
              
              return (
                <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`h-4 w-4 ${color}`} />
                    <div>
                      <div className="font-medium">{test.name}</div>
                      {test.details && (
                        <div className="text-sm text-gray-500">{test.details}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {test.duration && (
                      <div className="text-xs text-gray-500">
                        {test.duration}ms
                      </div>
                    )}
                    
                    <Badge variant={variant}>
                      {test.status}
                    </Badge>
                    
                    {onRunSingleTest && (
                      <Button 
                        onClick={() => onRunSingleTest(test.id)}
                        size="sm"
                        variant="ghost"
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {testResults.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No test results available</p>
              <p className="text-sm">Run the test suite to see results</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
