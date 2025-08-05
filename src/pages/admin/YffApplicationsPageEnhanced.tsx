
/**
 * @fileoverview Enhanced YFF Applications Admin Page with Real-time Updates
 * 
 * Main admin interface with comprehensive AI evaluation integration,
 * background job monitoring, real-time data updates, system testing, and E2E validation.
 * 
 * @version 2.2.0
 * @author 26ideas Development Team
 */

import React, { useState, useCallback } from 'react';
import { YffApplicationsTableEnhanced } from '@/components/admin/YffApplicationsTableEnhanced';
import { BackgroundJobMonitor } from '@/components/admin/BackgroundJobMonitor';
import { TestResultsDisplay } from '@/components/admin/TestResultsDisplay';
import { E2ETestRunner } from '@/components/admin/E2ETestRunner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Activity, FileText, Settings, Wifi, WifiOff, RefreshCw, TestTube, PlayCircle } from 'lucide-react';
import { useRealTimeApplications } from '@/hooks/useRealTimeApplications';
import { useSystemTesting } from '@/hooks/useSystemTesting';
import { useToast } from '@/hooks/use-toast';

const YffApplicationsPageEnhanced: React.FC = () => {
  const [activeTab, setActiveTab] = useState('applications');
  const { toast } = useToast();

  // Use the real-time hook for live updates
  const { 
    applications, 
    isLoading, 
    error, 
    isConnected,
    retryCount,
    lastUpdate
  } = useRealTimeApplications();

  // System testing hook
  const {
    testResults,
    isRunningTests,
    runAllTests,
    runSingleTest,
    clearResults
  } = useSystemTesting();

  /**
   * Handle manual refresh with user feedback
   */
  const handleManualRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  /**
   * Test the scoring system with a sample application
   */
  const handleTestScoring = useCallback(() => {
    toast({
      title: "Test Mode",
      description: "This would trigger a test scoring job in production.",
    });
  }, [toast]);

  // Error boundary fallback
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                <Activity className="h-12 w-12 mx-auto mb-2" />
                <p className="font-medium">System Error</p>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {error.message || 'Unable to load applications'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleManualRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                <Button onClick={() => runAllTests()} variant="outline">
                  <TestTube className="h-4 w-4 mr-2" />
                  Run Diagnostics
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with System Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">YFF Applications Dashboard</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gray-600">
              Manage, evaluate, and monitor Young Founders Floor applications
            </p>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                {isConnected ? (
                  <>
                    <Wifi className="h-3 w-3 mr-1" />
                    Live Updates
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 mr-1" />
                    Offline {retryCount > 0 && `(Retry ${retryCount})`}
                  </>
                )}
              </Badge>
              {lastUpdate && (
                <Badge variant="outline" className="text-xs">
                  Last: {lastUpdate.toLocaleTimeString()}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">
            {applications.length} total applications
          </div>
          <Button onClick={handleManualRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Check */}
      {!isConnected && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-700">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Real-time updates are currently unavailable. Data may not reflect the latest changes.
                </span>
              </div>
              <Button onClick={() => runAllTests()} variant="outline" size="sm">
                <TestTube className="h-4 w-4 mr-2" />
                Diagnose
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Applications
            <Badge variant="secondary" className="ml-1 text-xs">
              {applications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Background Jobs
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Unit Tests
            {testResults.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {testResults.filter(t => t.status === 'passed').length}/{testResults.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="e2e" className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            E2E Testing
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="mt-6">
          <YffApplicationsTableEnhanced 
            applications={applications}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="monitoring" className="mt-6">
          <BackgroundJobMonitor />
        </TabsContent>

        <TabsContent value="testing" className="mt-6">
          <TestResultsDisplay 
            testResults={testResults}
            isRunning={isRunningTests}
            onRunTests={runAllTests}
            onRunSingleTest={runSingleTest}
          />
        </TabsContent>

        <TabsContent value="e2e" className="mt-6">
          <E2ETestRunner />
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Test the AI scoring system with sample data
                  </p>
                  <Button onClick={handleTestScoring} variant="outline" className="w-full">
                    Trigger Test Evaluation
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Force refresh all application data
                  </p>
                  <Button onClick={handleManualRefresh} variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Force Refresh
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Clear test results and start fresh
                  </p>
                  <Button onClick={clearResults} variant="outline" className="w-full">
                    Clear Test Results
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Real-time Connection:</span>
                    <Badge variant={isConnected ? "default" : "destructive"}>
                      {isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Applications Loaded:</span>
                    <Badge variant="secondary">{applications.length}</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Loading State:</span>
                    <Badge variant={isLoading ? "secondary" : "default"}>
                      {isLoading ? "Loading" : "Ready"}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Error State:</span>
                    <Badge variant={error ? "destructive" : "default"}>
                      {error ? "Error" : "Healthy"}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Retry Count:</span>
                    <Badge variant={retryCount > 0 ? "secondary" : "default"}>
                      {retryCount}
                    </Badge>
                  </div>

                  {lastUpdate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Last Update:</span>
                      <Badge variant="outline" className="text-xs">
                        {lastUpdate.toLocaleString()}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default YffApplicationsPageEnhanced;
