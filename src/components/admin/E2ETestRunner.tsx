
/**
 * @fileoverview E2E Test Runner Component
 * 
 * Admin component for running comprehensive end-to-end tests
 * of the AI scoring system and dashboard integration.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  PlayCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  RefreshCw,
  Download,
  TestTube
} from 'lucide-react';
import { E2ETestingSuite, TestResult } from '@/utils/e2e-testing-suite';

export const E2ETestRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState<string>('');
  const { toast } = useToast();

  /**
   * Run the complete E2E test suite
   */
  const runTestSuite = async () => {
    setIsRunning(true);
    setTestResults([]);
    setProgress(0);
    setCurrentTest('Initializing test suite...');

    try {
      const testingSuite = new E2ETestingSuite();
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 2000);

      const results = await testingSuite.runCompleteTestSuite();
      
      clearInterval(progressInterval);
      setProgress(100);
      setCurrentTest('Test suite completed');
      setTestResults(results);

      const passedCount = results.filter(r => r.status === 'passed').length;
      const failedCount = results.filter(r => r.status === 'failed').length;

      toast({
        title: "E2E Testing Complete",
        description: `${passedCount} tests passed, ${failedCount} tests failed`,
        variant: failedCount > 0 ? "destructive" : "default",
      });

    } catch (error) {
      toast({
        title: "Testing Failed",
        description: `E2E test suite encountered an error: ${error.message}`,
        variant: "destructive",
      });
      
      setTestResults([{
        id: 'test-suite-error',
        testName: 'Test Suite Error',
        name: 'Test Suite Error',
        status: 'failed',
        message: error.message || 'Unknown error occurred',
        timestamp: new Date()
      }]);
    } finally {
      setIsRunning(false);
      setProgress(100);
      setCurrentTest('');
    }
  };

  /**
   * Download test report
   */
  const downloadTestReport = () => {
    if (testResults.length === 0) return;

    const testingSuite = new E2ETestingSuite();
    // Set results for report generation
    (testingSuite as any).results = testResults;
    const report = testingSuite.generateTestReport();

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `e2e-test-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Downloaded",
      description: "E2E test report has been downloaded successfully",
    });
  };

  /**
   * Get status icon for test result
   */
  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  /**
   * Get status badge variant
   */
  const getStatusBadgeVariant = (status: TestResult['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'passed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'running':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const passedTests = testResults.filter(r => r.status === 'passed').length;
  const failedTests = testResults.filter(r => r.status === 'failed').length;
  const totalTests = testResults.length;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              End-to-End Testing Suite
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={runTestSuite}
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Run Complete Test Suite
                  </>
                )}
              </Button>
              
              {testResults.length > 0 && (
                <Button
                  onClick={downloadTestReport}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Progress Indicator */}
            {isRunning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{currentTest}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Test Summary */}
            {totalTests > 0 && (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600">{passedTests}</div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-red-600">{failedTests}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{totalTests}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Test Results
              <Badge variant={failedTests > 0 ? "destructive" : "default"}>
                {passedTests}/{totalTests} Passed
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <h4 className="font-medium">{result.testName}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {result.message}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.duration && (
                          <Badge variant="outline" className="text-xs">
                            {result.duration}ms
                          </Badge>
                        )}
                        <Badge variant={getStatusBadgeVariant(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Test Details */}
                    {result.details && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="mt-2 text-xs text-gray-400">
                      {new Date(result.timestamp).toLocaleString()}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Test Description */}
      <Card>
        <CardHeader>
          <CardTitle>What This Test Suite Validates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Database connectivity and basic queries</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Application submission and storage process</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Dashboard display of new applications</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>AI scoring system trigger and execution</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Scoring process monitoring and completion</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Results display with proper scoring data</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Real-time updates and live dashboard refresh</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Error handling for invalid requests</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Performance metrics and load times</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
