/**
 * @fileoverview Comprehensive E2E Testing Suite for YFF Applications
 * 
 * Tests the complete flow from application submission through AI scoring
 * to dashboard display with enhanced real-time update validation.
 * 
 * @version 2.1.0
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';
import { AIComprehensiveScoringService } from '@/services/ai-comprehensive-scoring-service';
import { BackgroundJobService } from '@/services/background-job-service';
import { YffFormData } from '@/types/yff-form';
import { v4 as uuidv4 } from 'uuid';
import type { Json } from '@/integrations/supabase/types';

export interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'running';
  message: string;
  timestamp: string;
  duration?: number;
  details?: any;
}

export class E2ETestingSuite {
  private results: TestResult[] = [];
  private testApplicationId: string | null = null;
  private testIndividualId: string | null = null;
  private testEmail: string | null = null;
  private realtimeChannel: any = null;

  constructor() {
    this.results = [];
  }

  /**
   * Run complete E2E test suite with enhanced real-time validation
   */
  async runCompleteTestSuite(): Promise<TestResult[]> {
    console.log('🚀 Starting comprehensive E2E test suite...');
    
    try {
      // Test 1: Database connectivity
      await this.testDatabaseConnection();
      
      // Test 2: Application submission
      await this.testApplicationSubmission();
      
      // Test 3: Dashboard display
      await this.testDashboardDisplay();
      
      // Test 4: AI scoring trigger
      await this.testAIScoringTrigger();
      
      // Test 5: Enhanced real-time updates test
      await this.testRealTimeUpdates();
      
      // Test 6: Results display
      await this.testResultsDisplay();
      
      // Test 7: Error handling
      await this.testErrorHandling();
      
      // Test 8: Performance metrics
      await this.testPerformanceMetrics();
      
      // Cleanup test data
      await this.cleanupTestData();
      
      console.log('✅ E2E test suite completed successfully');
      
    } catch (error) {
      console.error('❌ E2E test suite failed:', error);
      
      this.addTestResult({
        testName: 'Test Suite Error',
        status: 'failed',
        message: `Test suite failed: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
    
    return this.results;
  }

  /**
   * Test database connection with proper count query
   */
  private async testDatabaseConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing database connection...');
      
      // Use correct Supabase count syntax
      const { count, error } = await supabase
        .from('yff_applications')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }
      
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Database Connection',
        status: 'passed',
        message: `Successfully connected to database. Found ${count || 0} applications.`,
        timestamp: new Date().toISOString(),
        duration,
        details: { applicationCount: count }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Database Connection',
        status: 'failed',
        message: `Database connection failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      throw error;
    }
  }

  /**
   * Test application submission with unique identifiers and proper types
   */
  private async testApplicationSubmission(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing application submission...');
      
      // Generate unique test data with proper UUIDs and timestamp-based uniqueness
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 15);
      this.testEmail = `e2etest-${timestamp}-${randomSuffix}@example.com`;
      this.testIndividualId = uuidv4();
      this.testApplicationId = uuidv4();
      
      console.log(`🔍 Generated test IDs: individual=${this.testIndividualId}, application=${this.testApplicationId}, email=${this.testEmail}`);
      
      // Create test individual first
      const { data: individual, error: individualError } = await supabase
        .from('individuals')
        .insert({
          individual_id: this.testIndividualId,
          email: this.testEmail,
          first_name: 'E2E',
          last_name: 'Test',
          privacy_consent: true,
          data_processing_consent: true,
          email_verified: true
        })
        .select()
        .single();
      
      if (individualError) {
        throw new Error(`Failed to create test individual: ${individualError.message}`);
      }
      
      console.log('✅ Test individual created successfully');
      
      // Create test application data with proper typing
      const testFormData: YffFormData = {
        tell_us_about_idea: 'This is a comprehensive test of an innovative AI-powered platform that revolutionizes how young entrepreneurs develop and validate their business ideas through intelligent mentorship and automated feedback systems.',
        problem_statement: 'Young entrepreneurs lack access to experienced mentors and struggle with validating their business ideas early in the development process, leading to higher failure rates and wasted resources.',
        whose_problem: 'This problem affects aspiring entrepreneurs aged 18-25 who have innovative ideas but lack the network, resources, and expertise to properly validate and develop their concepts into viable businesses.',
        how_solve_problem: 'Our platform uses AI-powered analysis to provide instant feedback on business ideas, connects entrepreneurs with relevant mentors, and offers structured validation frameworks to test market assumptions.',
        how_make_money: 'Revenue streams include subscription fees for premium AI analysis, commission from successful mentor matches, and partnerships with educational institutions and accelerator programs.',
        acquire_customers: 'Customer acquisition through university partnerships, social media marketing targeting entrepreneurship communities, referral programs, and strategic partnerships with startup ecosystems.',
        team_roles: 'Our founding team combines technical expertise in AI/ML with deep entrepreneurship experience, including former startup founders, product managers, and engineers from leading tech companies.'
      };
      
      // Submit test application with proper database structure
      const { data: application, error: applicationError } = await supabase
        .from('yff_applications')
        .insert({
          application_id: this.testApplicationId,
          individual_id: this.testIndividualId,
          answers: testFormData,
          status: 'submitted',
          evaluation_status: 'pending'
        })
        .select()
        .single();
      
      if (applicationError) {
        throw new Error(`Failed to submit test application: ${applicationError.message}`);
      }
      
      console.log('✅ Test application submitted successfully');
      
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Application Submission',
        status: 'passed',
        message: `Successfully submitted test application with ID: ${this.testApplicationId}`,
        timestamp: new Date().toISOString(),
        duration,
        details: { applicationId: this.testApplicationId, email: this.testEmail }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Application Submission',
        status: 'failed',
        message: `Application submission failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      throw error;
    }
  }

  /**
   * Test dashboard display functionality
   */
  private async testDashboardDisplay(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing dashboard display...');
      
      if (!this.testApplicationId) {
        throw new Error('No test application ID available');
      }
      
      // Wait briefly for database consistency
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Query application from dashboard perspective
      const { data: applications, error } = await supabase
        .from('yff_applications')
        .select(`
          *,
          individuals(
            first_name,
            last_name,
            email
          )
        `)
        .eq('application_id', this.testApplicationId);
      
      if (error) {
        throw new Error(`Failed to fetch application for dashboard: ${error.message}`);
      }
      
      if (!applications || applications.length === 0) {
        throw new Error('Test application not found in dashboard query');
      }
      
      const application = applications[0];
      
      // Validate application data structure
      if (!application.answers || typeof application.answers !== 'object') {
        throw new Error('Application answers not properly stored');
      }
      
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Dashboard Display',
        status: 'passed',
        message: `Successfully retrieved application in dashboard format`,
        timestamp: new Date().toISOString(),
        duration,
        details: { 
          applicationFound: true,
          hasAnswers: Object.keys(application.answers).length > 0,
          hasIndividual: !!application.individuals
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Dashboard Display',
        status: 'failed',
        message: `Dashboard display test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      throw error;
    }
  }

  /**
   * Test AI scoring trigger
   */
  private async testAIScoringTrigger(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing AI scoring trigger...');
      
      if (!this.testApplicationId) {
        throw new Error('No test application ID available');
      }
      
      // Trigger AI scoring
      const result = await AIComprehensiveScoringService.triggerEvaluation(this.testApplicationId);
      
      if (!result.success) {
        throw new Error(`AI scoring failed: ${result.message}`);
      }
      
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'AI Scoring Trigger',
        status: 'passed',
        message: `Successfully triggered AI evaluation: ${result.message}`,
        timestamp: new Date().toISOString(),
        duration,
        details: { 
          scoringResult: result.result,
          overallScore: result.result?.overall_score 
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'AI Scoring Trigger',
        status: 'failed',
        message: `AI scoring trigger failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      throw error;
    }
  }

  /**
   * Enhanced real-time updates test with proper subscription validation
   */
  private async testRealTimeUpdates(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing real-time updates with enhanced validation...');
      
      if (!this.testApplicationId) {
        throw new Error('No test application ID available');
      }

      // Test the real-time subscription system
      const subscriptionTest = await this.validateRealtimeSubscription();
      
      if (!subscriptionTest.success) {
        throw new Error(`Real-time subscription test failed: ${subscriptionTest.error}`);
      }

      // Perform a database update and wait for real-time notification
      const updateTest = await this.testRealtimeUpdatePropagation();
      
      if (!updateTest.success) {
        throw new Error(`Real-time update propagation failed: ${updateTest.error}`);
      }

      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Real-Time Updates',
        status: 'passed',
        message: `Real-time updates working correctly. Subscription active, updates propagated within acceptable timeframe.`,
        timestamp: new Date().toISOString(),
        duration,
        details: {
          subscriptionStatus: subscriptionTest.details,
          updateLatency: updateTest.latency,
          eventsReceived: updateTest.eventsReceived
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Real-Time Updates',
        status: 'failed',
        message: `Real-time updates test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      // Don't throw here to allow other tests to continue
      console.error('❌ Real-time updates test failed, but continuing with other tests');
    } finally {
      // Always cleanup the channel
      if (this.realtimeChannel) {
        supabase.removeChannel(this.realtimeChannel);
        this.realtimeChannel = null;
      }
    }
  }

  /**
   * Validate that the real-time subscription system is working
   */
  private async validateRealtimeSubscription(): Promise<{
    success: boolean;
    error?: string;
    details?: any;
  }> {
    return new Promise((resolve) => {
      console.log('🔍 Validating real-time subscription setup...');
      
      let subscriptionTimeout: NodeJS.Timeout;
      let isResolved = false;
      
      const resolveOnce = (result: any) => {
        if (isResolved) return;
        isResolved = true;
        if (subscriptionTimeout) clearTimeout(subscriptionTimeout);
        resolve(result);
      };

      try {
        // Create a test channel to validate subscription capability
        this.realtimeChannel = supabase
          .channel(`e2e-test-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'yff_applications'
            },
            (payload) => {
              console.log('📨 Real-time event received in test:', payload.eventType);
            }
          )
          .subscribe((status, err) => {
            console.log('📡 Subscription status:', status, err);
            
            if (status === 'SUBSCRIBED') {
              resolveOnce({
                success: true,
                details: {
                  subscriptionStatus: status,
                  timestamp: new Date().toISOString()
                }
              });
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              resolveOnce({
                success: false,
                error: `Subscription failed with status: ${status}`,
                details: { status, error: err }
              });
            }
          });

        // Set timeout for subscription establishment
        subscriptionTimeout = setTimeout(() => {
          resolveOnce({
            success: false,
            error: 'Subscription did not establish within 10 seconds',
            details: { timeout: true }
          });
        }, 10000);

      } catch (error) {
        resolveOnce({
          success: false,
          error: `Subscription setup failed: ${error.message}`,
          details: { exception: error }
        });
      }
    });
  }

  /**
   * Test that real-time updates propagate correctly with proper update payload
   */
  private async testRealtimeUpdatePropagation(): Promise<{
    success: boolean;
    error?: string;
    latency?: number;
    eventsReceived?: number;
  }> {
    return new Promise((resolve) => {
      console.log('🔍 Testing real-time update propagation...');
      
      let updateTimeout: NodeJS.Timeout;
      let eventsReceived = 0;
      let updateStartTime: number;
      let isResolved = false;
      
      const resolveOnce = (result: any) => {
        if (isResolved) return;
        isResolved = true;
        if (updateTimeout) clearTimeout(updateTimeout);
        resolve(result);
      };

      // Listen for real-time updates on our test application
      const updateChannel = supabase
        .channel(`update-test-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'yff_applications',
            filter: `application_id=eq.${this.testApplicationId}`
          },
          (payload) => {
            eventsReceived++;
            const latency = Date.now() - updateStartTime;
            
            console.log(`📨 Real-time update received for test application. Latency: ${latency}ms`);
            
            resolveOnce({
              success: true,
              latency,
              eventsReceived
            });
          }
        )
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Update test channel subscribed, triggering database update...');
            
            // Give subscription a moment to be fully ready
            setTimeout(async () => {
              updateStartTime = Date.now();
              
              // Perform a database update with proper payload structure
              const { error } = await supabase
                .from('yff_applications')
                .update({ 
                  updated_at: new Date().toISOString(),
                  status: 'test_update'
                })
                .eq('application_id', this.testApplicationId);
              
              if (error) {
                resolveOnce({
                  success: false,
                  error: `Failed to trigger update: ${error.message}`,
                  eventsReceived
                });
              }
            }, 500);
          }
        });

      // Set timeout for update propagation (increased to 5 seconds for more reliability)
      updateTimeout = setTimeout(() => {
        supabase.removeChannel(updateChannel);
        resolveOnce({
          success: false,
          error: `Real-time update not received within 5 seconds. Events received: ${eventsReceived}`,
          eventsReceived
        });
      }, 5000);
    });
  }

  /**
   * Test results display
   */
  private async testResultsDisplay(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing results display...');
      
      if (!this.testApplicationId) {
        throw new Error('No test application ID available');
      }
      
      // Fetch application with evaluation data
      const { data: application, error } = await supabase
        .from('yff_applications')
        .select('*')
        .eq('application_id', this.testApplicationId)
        .single();
      
      if (error) {
        throw new Error(`Failed to fetch application results: ${error.message}`);
      }
      
      // Validate evaluation data exists and has proper structure
      if (!application.evaluation_data || typeof application.evaluation_data !== 'object') {
        throw new Error('Evaluation data not found or improperly formatted');
      }
      
      const evaluationData = application.evaluation_data as any;
      
      if (!evaluationData.scores || typeof evaluationData.scores !== 'object') {
        throw new Error('Question scores not found in evaluation data');
      }
      
      if (typeof application.overall_score !== 'number') {
        throw new Error('Overall score not found or not a number');
      }
      
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Results Display',
        status: 'passed',
        message: `Successfully retrieved and validated evaluation results. Overall score: ${application.overall_score}/10`,
        timestamp: new Date().toISOString(),
        duration,
        details: {
          overallScore: application.overall_score,
          questionsScored: Object.keys(evaluationData.scores).length,
          evaluationStatus: application.evaluation_status
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Results Display',
        status: 'failed',
        message: `Results display test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      // Don't throw here to allow other tests to continue
      console.error('❌ Results display test failed, but continuing with other tests');
    }
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing error handling...');
      
      // Test invalid application ID handling
      const invalidResult = await AIComprehensiveScoringService.triggerEvaluation('invalid-uuid-format');
      
      if (invalidResult.success) {
        throw new Error('Error handling test failed: should have rejected invalid UUID');
      }
      
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Error Handling',
        status: 'passed',
        message: 'Successfully handled invalid input and returned appropriate error response',
        timestamp: new Date().toISOString(),
        duration,
        details: { errorMessage: invalidResult.message }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Error Handling',
        status: 'failed',
        message: `Error handling test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      console.error('❌ Error handling test failed, but continuing with other tests');
    }
  }

  /**
   * Test performance metrics
   */
  private async testPerformanceMetrics(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing performance metrics...');
      
      // Test database query performance
      const queryStart = Date.now();
      const { count, error } = await supabase
        .from('yff_applications')
        .select('*', { count: 'exact', head: true });
      const queryDuration = Date.now() - queryStart;
      
      if (error) {
        throw new Error(`Performance test query failed: ${error.message}`);
      }
      
      // Validate acceptable performance thresholds
      const maxAcceptableQueryTime = 2000; // 2 seconds
      const performanceGrade = queryDuration < maxAcceptableQueryTime ? 'Good' : 'Needs Improvement';
      
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Performance Metrics',
        status: queryDuration < maxAcceptableQueryTime ? 'passed' : 'failed',
        message: `Database query performance: ${queryDuration}ms (Grade: ${performanceGrade})`,
        timestamp: new Date().toISOString(),
        duration,
        details: {
          queryDuration,
          performanceGrade,
          maxAcceptable: maxAcceptableQueryTime,
          recordCount: count
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Performance Metrics',
        status: 'failed',
        message: `Performance metrics test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      console.error('❌ Performance metrics test failed, but continuing with other tests');
    }
  }

  /**
   * Clean up test data
   */
  private async cleanupTestData(): Promise<void> {
    console.log('🧹 Cleaning up test data...');
    
    try {
      // Clean up in reverse order of creation
      if (this.testApplicationId) {
        await supabase
          .from('yff_applications')
          .delete()
          .eq('application_id', this.testApplicationId);
        
        console.log(`🗑️ Deleted test application: ${this.testApplicationId}`);
      }
      
      if (this.testIndividualId) {
        await supabase
          .from('individuals')
          .delete()
          .eq('individual_id', this.testIndividualId);
        
        console.log(`🗑️ Deleted test individual: ${this.testIndividualId}`);
      }
      
      // Clean up any remaining realtime channels
      if (this.realtimeChannel) {
        supabase.removeChannel(this.realtimeChannel);
        this.realtimeChannel = null;
      }
      
    } catch (error) {
      console.error('⚠️ Error during cleanup:', error);
      // Don't throw cleanup errors
    }
  }

  /**
   * Add test result to results array
   */
  private addTestResult(result: TestResult): void {
    this.results.push(result);
  }

  /**
   * Generate markdown test report
   */
  generateTestReport(): string {
    const timestamp = new Date().toISOString();
    const passedTests = this.results.filter(r => r.status === 'passed').length;
    const failedTests = this.results.filter(r => r.status === 'failed').length;
    const totalTests = this.results.length;
    
    let report = `# E2E Test Report\n\n`;
    report += `**Generated:** ${timestamp}\n`;
    report += `**Tests Passed:** ${passedTests}/${totalTests}\n`;
    report += `**Tests Failed:** ${failedTests}/${totalTests}\n\n`;
    
    if (failedTests === 0) {
      report += `✅ **All tests passed!** The YFF application system is working correctly.\n\n`;
    } else {
      report += `⚠️ **${failedTests} test(s) failed.** Please review the results below.\n\n`;
    }
    
    report += `## Test Results\n\n`;
    
    this.results.forEach(result => {
      const icon = result.status === 'passed' ? '✅' : '❌';
      report += `### ${icon} ${result.testName}\n\n`;
      report += `**Status:** ${result.status.toUpperCase()}\n`;
      report += `**Message:** ${result.message}\n`;
      report += `**Timestamp:** ${result.timestamp}\n`;
      
      if (result.duration) {
        report += `**Duration:** ${result.duration}ms\n`;
      }
      
      if (result.details) {
        report += `**Details:** \`${JSON.stringify(result.details, null, 2)}\`\n`;
      }
      
      report += `\n`;
    });
    
    return report;
  }
}
