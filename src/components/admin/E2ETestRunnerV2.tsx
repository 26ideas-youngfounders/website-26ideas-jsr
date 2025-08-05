
/**
 * @fileoverview Enhanced E2E Test Runner Component V2
 * 
 * Advanced admin component for running comprehensive end-to-end tests
 * with real-time validation and detailed reporting.
 * 
 * @version 2.0.0
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
  TestTube,
  Shield,
  Database,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { E2ETestingSuiteV2, TestResult } from '@/utils/e2e-testing-suite-v2';

export const E2ETestRunnerV2: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState<string>('');
  const { toast } = useToast();

  /**
   * Run the comprehensive E2E test suite V2
   */
  const runTestSuite = async () => {
    setIsRunning(true);
    setTestResults([]);
    setProgress(0);
    setCurrentTest('Initializing comprehensive test suite V2...');

    try {
      const testingSuite = new E2ETestingSuiteV2();
      
      // Simulate progress updates with more granular steps
      let progressValue = 0;
      const progressInterval = setInterval(() => {
        progressValue = Math.min(progressValue + 5, 95);
        setProgress(progressValue);
        
        // Update current test status based on progress
        if (progressValue < 20) {
          setCurrentTest('Testing authentication and database access...');
        } else if (progressValue < 40) {
          setCurrentTest('Testing application lifecycle...');
        } else if (progressValue < 60) {
          setCurrentTest('Testing real-time system...');
        } else if (progressValue < 80) {
          setCurrentTest('Testing AI evaluation system...');
        } else {
          setCurrentTest('Testing error handling and performance...');
        }
      }, 3000);

      const results = await testingSuite.runCompleteTestSuite();
      
      clearInterval(progressInterval);
      setProgress(100);
      setCurrentTest('Test suite completed');
      setTestResults(results);

      const passedCount = results.filter(r => r.status === 'passed').length;
      const failedCount = results.filter(r => r.status === 'failed').length;
      const successRate = results.length > 0 ? Math.round((passedCount / results.length) * 100) : 0;

      toast({
        title: "E2E Testing Complete",
        description: `${passedCount} tests passed, ${failedCount} tests failed (${successRate}% success rate)`,
        variant: failedCount > 0 ? "destructive" : "default",
      });

    } catch (error) {
      toast({
        title: "Testing Failed",
        description: `E2E test suite encountered an error: ${error.message}`,
        variant: "destructive",
      });
      
      setTestResults([{
        testName: 'Test Suite Critical Error',
        status: 'failed',
        message: error.message || 'Unknown critical error occurred',
        timestamp: new Date().toISOString(),
        details: {
          errorType: error.constructor.name,
          stack: error.stack
        }
      }]);
    } finally {
      setIsRunning(false);
      setProgress(100);
      setCurrentTest('');
    }
  };

  /**
   * Download comprehensive test report
   */
  const downloadTestReport = () => {
    if (testResults.length === 0) return;

    const testingSuite = new E2ETestingSuiteV2();
    // Set results for report generation
    (testingSuite as any).results = testResults;
    const report = testingSuite.generateTestReport();

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `e2e-comprehensive-test-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Downloaded",
      description: "Comprehensive E2E test report has been downloaded successfully",
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
   * Get test category icon
   */
  const getTestCategoryIcon = (testName: string) => {
    if (testName.includes('Authentication') || testName.includes('Database')) {
      return <Shield className="h-4 w-4 text-blue-600" />;
    } else if (testName.includes('Application')) {
      return <Database className="h-4 w-4 text-green-600" />;
    } else if (testName.includes('Real-Time')) {
      return <Zap className="h-4 w-4 text-purple-600" />;
    } else if (testName.includes('Performance')) {
      return <Zap className="h-4 w-4 text-orange-600" />;
    } else if (testName.includes('Error')) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
    return <TestTube className="h-4 w-4 text-gray-600" />;
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
  const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Comprehensive E2E Testing Suite V2
              <Badge variant="secondary" className="ml-2 text-xs">Enhanced</Badge>
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
                    Running Comprehensive Tests...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Run Complete Test Suite V2
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
                  <span className="font-medium">{currentTest}</span>
                  <span className="text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Test Summary */}
            {totalTests > 0 && (
              <div className="grid grid-cols-4 gap-4 text-center">
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
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-blue-600">{successRate}%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
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
              Comprehensive Test Results
              <Badge variant={failedTests > 0 ? "destructive" : "default"}>
                {passedTests}/{totalTests} Passed ({successRate}%)
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
                        {getTestCategoryIcon(result.testName)}
                        {getStatusIcon(result.status)}
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {result.testName}
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                          </h4>
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
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs">
                        <div className="font-medium mb-2">Test Details:</div>
                        <pre className="whitespace-pre-wrap text-gray-700 max-h-32 overflow-y-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="mt-2 text-xs text-gray-400">
                      Executed: {new Date(result.timestamp).toLocaleString()}
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
          <CardTitle>Comprehensive Test Suite Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                Authentication & Security
              </h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• User authentication validation</li>
                <li>• Database access permissions (RLS)</li>
                <li>• Session management</li>
                <li>• Security policy enforcement</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-green-600" />
                Data Management
              </h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Application CRUD operations</li>
                <li>• Data integrity validation</li>
                <li>• Transaction consistency</li>
                <li>• Multi-table relationships</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-600" />
                Real-time System
              </h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• WebSocket connection stability</li>
                <li>• Event subscription/unsubscription</li>
                <li>• Real-time data synchronization</li>
                <li>• Connection recovery mechanisms</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <TestTube className="h-4 w-4 text-orange-600" />
                AI & Performance
              </h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• AI evaluation system integration</li>
                <li>• Scoring algorithm validation</li>
                <li>• Performance benchmarking</li>
                <li>• Error handling & recovery</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
