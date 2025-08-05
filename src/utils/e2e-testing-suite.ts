/**
 * @fileoverview Comprehensive E2E Testing Suite for YFF Applications
 * 
 * Tests the complete flow from application submission through AI scoring
 * to dashboard display with enhanced real-time WebSocket validation.
 * 
 * @version 5.0.0
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';
import { AIComprehensiveScoringService } from '@/services/ai-comprehensive-scoring-service';
import { BackgroundJobService } from '@/services/background-job-service';
import { RealtimeConnectionManager } from '@/utils/realtime-connection-manager';
import { RealtimeSubscriptionManager } from '@/utils/realtime-subscription-manager';
import { YffFormData } from '@/types/yff-form';
import { v4 as uuidv4 } from 'uuid';

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
  private subscriptionManager: RealtimeSubscriptionManager | null = null;

  constructor() {
    this.results = [];
  }

  /**
   * Run complete E2E test suite with enhanced WebSocket validation
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
      await this.testRobustRealTimeSubscription();
      
      // Test 6: Connection manager resilience
      await this.testConnectionManagerResilience();
      
      // Test 7: Subscription manager stability
      await this.testSubscriptionManagerStability();
      
      // Test 8: Results display
      await this.testResultsDisplay();
      
      // Test 9: Error handling
      await this.testErrorHandling();
      
      // Test 10: Performance metrics
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
   * Test robust real-time subscription with enhanced connection management
   */
  private async testRobustRealTimeSubscription(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing robust real-time subscription...');
      
      if (!this.testApplicationId) {
        throw new Error('No test application ID available');
      }

      // Create subscription manager
      this.subscriptionManager = new RealtimeSubscriptionManager();
      
      // Track connection events
      let connectionEstablished = false;
      let subscriptionActive = false;
      let eventReceived = false;
      let eventDetails: any = null;

      const connectionPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout after 30 seconds'));
        }, 30000);

        this.subscriptionManager!.addListener((subscriptionState) => {
          const connectionState = this.subscriptionManager!.getConnectionState();
          
          console.log('📊 Real-time test - State update:', {
            connection: connectionState.status,
            isActive: subscriptionState.isActive,
            subscriptions: subscriptionState.subscriptionCount
          });

          if (connectionState.status === 'connected' && subscriptionState.isActive) {
            connectionEstablished = true;
            subscriptionActive = true;
            clearTimeout(timeout);
            resolve();
          } else if (connectionState.status === 'error') {
            clearTimeout(timeout);
            reject(new Error(`Connection failed: ${connectionState.lastError}`));
          }
        });
      });

      // Start subscription manager
      console.log('🚀 Starting subscription manager...');
      const started = await this.subscriptionManager.start();
      
      if (!started) {
        throw new Error('Failed to start subscription manager');
      }

      // Subscribe to test application updates
      const subscribed = this.subscriptionManager.subscribe(
        'e2e-test-subscription',
        {
          table: 'yff_applications',
          schema: 'public',
          event: 'UPDATE',
          filter: `application_id=eq.${this.testApplicationId}`
        },
        (payload) => {
          console.log('📨 E2E test - Event received:', {
            eventType: payload.eventType,
            applicationId: payload.new?.application_id || payload.old?.application_id,
            evaluationStatus: payload.new?.evaluation_status
          });
          
          eventReceived = true;
          eventDetails = payload;
        }
      );

      if (!subscribed) {
        throw new Error('Failed to subscribe to application updates');
      }

      // Wait for connection to be established
      await connectionPromise;
      console.log('✅ Connection established, triggering test updates...');

      // Trigger database update to test event reception
      const updatePromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Event not received within 20 seconds'));
        }, 20000);

        const checkEvent = () => {
          if (eventReceived) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkEvent, 500);
          }
        };
        
        checkEvent();
      });

      // Perform test update
      console.log('🔄 Performing test database update...');
      const { error: updateError } = await supabase
        .from('yff_applications')
        .update({ 
          evaluation_status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('application_id', this.testApplicationId);

      if (updateError) {
        throw new Error(`Failed to update application: ${updateError.message}`);
      }

      // Wait for event
      await updatePromise;

      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Robust Real-Time Subscription',
        status: 'passed',
        message: `Real-time subscription working correctly. Connection established and events received within ${duration}ms.`,
        timestamp: new Date().toISOString(),
        duration,
        details: {
          connectionEstablished,
          subscriptionActive,
          eventReceived,
          eventDetails: eventDetails ? {
            eventType: eventDetails.eventType,
            table: eventDetails.table
          } : null
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Robust Real-Time Subscription',
        status: 'failed',
        message: `Real-time subscription test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
    } finally {
      // Cleanup
      if (this.subscriptionManager) {
        this.subscriptionManager.stop();
        this.subscriptionManager = null;
      }
    }
  }

  /**
   * Test connection manager resilience
   */
  private async testConnectionManagerResilience(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing connection manager resilience...');
      
      const connectionManager = new RealtimeConnectionManager({
        maxRetries: 3,
        baseRetryDelay: 1000,
        maxRetryDelay: 5000,
        connectionTimeout: 10000
      });

      let connectionAttempts = 0;
      let finalState: any = null;

      connectionManager.addListener((state) => {
        console.log(`📊 Connection manager test - State: ${state.status}, Retries: ${state.retryCount}`);
        
        if (state.status === 'connecting' || state.status === 'reconnecting') {
          connectionAttempts++;
        }
        
        finalState = state;
      });

      // Attempt connection
      const connected = await connectionManager.connect();
      
      // Wait a moment for final state
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      connectionManager.disconnect();

      const duration = Date.now() - startTime;
      
      if (connected || (finalState && finalState.retryCount > 0)) {
        this.addTestResult({
          testName: 'Connection Manager Resilience',
          status: 'passed',
          message: `Connection manager demonstrated resilience with ${connectionAttempts} connection attempts.`,
          timestamp: new Date().toISOString(),
          duration,
          details: {
            connectionAttempts,
            connected,
            finalState: finalState ? {
              status: finalState.status,
              retryCount: finalState.retryCount,
              isAuthenticated: finalState.isAuthenticated
            } : null
          }
        });
      } else {
        throw new Error('Connection manager failed to establish connection or retry');
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Connection Manager Resilience',
        status: 'failed',
        message: `Connection manager resilience test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
    }
  }

  /**
   * Test subscription manager stability
   */
  private async testSubscriptionManagerStability(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing subscription manager stability...');
      
      const subscriptionManager = new RealtimeSubscriptionManager();
      
      let stateChanges = 0;
      let finalSubscriptionState: any = null;

      subscriptionManager.addListener((state) => {
        console.log(`📊 Subscription manager test - Active: ${state.isActive}, Count: ${state.subscriptionCount}`);
        stateChanges++;
        finalSubscriptionState = state;
      });

      // Start manager
      const started = await subscriptionManager.start();
      
      if (!started) {
        throw new Error('Failed to start subscription manager');
      }

      // Add multiple subscriptions to test stability
      subscriptionManager.subscribe('test-sub-1', {
        table: 'yff_applications',
        event: 'INSERT'
      }, () => {});

      subscriptionManager.subscribe('test-sub-2', {
        table: 'yff_applications', 
        event: 'UPDATE'
      }, () => {});

      // Wait for stability
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      subscriptionManager.stop();
      
      // Wait for final state
      await new Promise(resolve => setTimeout(resolve, 1000));

      const duration = Date.now() - startTime;
      
      if (stateChanges > 0 && finalSubscriptionState) {
        this.addTestResult({
          testName: 'Subscription Manager Stability',
          status: 'passed',
          message: `Subscription manager demonstrated stability with ${stateChanges} state changes.`,
          timestamp: new Date().toISOString(),
          duration,
          details: {
            stateChanges,
            finalState: {
              isActive: finalSubscriptionState.isActive,
              subscriptionCount: finalSubscriptionState.subscriptionCount,
              eventCount: finalSubscriptionState.eventCount
            }
          }
        });
      } else {
        throw new Error('Subscription manager did not demonstrate expected state changes');
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Subscription Manager Stability',
        status: 'failed',
        message: `Subscription manager stability test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
    }
  }

  /**
   * Test database connection with proper count query
   */
  private async testDatabaseConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing database connection...');
      
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
      
      const testFormData: YffFormData = {
        tell_us_about_idea: 'This is a comprehensive test of an innovative AI-powered platform that revolutionizes how young entrepreneurs develop and validate their business ideas through intelligent mentorship and automated feedback systems.',
        problem_statement: 'Young entrepreneurs lack access to experienced mentors and struggle with validating their business ideas early in the development process, leading to higher failure rates and wasted resources.',
        whose_problem: 'This problem affects aspiring entrepreneurs aged 18-25 who have innovative ideas but lack the network, resources, and expertise to properly validate and develop their concepts into viable businesses.',
        how_solve_problem: 'Our platform uses AI-powered analysis to provide instant feedback on business ideas, connects entrepreneurs with relevant mentors, and offers structured validation frameworks to test market assumptions.',
        how_make_money: 'Revenue streams include subscription fees for premium AI analysis, commission from successful mentor matches, and partnerships with educational institutions and accelerator programs.',
        acquire_customers: 'Customer acquisition through university partnerships, social media marketing targeting entrepreneurship communities, referral programs, and strategic partnerships with startup ecosystems.',
        team_roles: 'Our founding team combines technical expertise in AI/ML with deep entrepreneurship experience, including former startup founders, product managers, and engineers from leading tech companies.'
      };
      
      // Submit test application
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
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
   * Test results display
   */
  private async testResultsDisplay(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing results display...');
      
      if (!this.testApplicationId) {
        throw new Error('No test application ID available');
      }
      
      const { data: application, error } = await supabase
        .from('yff_applications')
        .select('*')
        .eq('application_id', this.testApplicationId)
        .single();
      
      if (error) {
        throw new Error(`Failed to fetch application results: ${error.message}`);
      }
      
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
      
      const queryStart = Date.now();
      const { count, error } = await supabase
        .from('yff_applications')
        .select('*', { count: 'exact', head: true });
      const queryDuration = Date.now() - queryStart;
      
      if (error) {
        throw new Error(`Performance test query failed: ${error.message}`);
      }
      
      const maxAcceptableQueryTime = 2000;
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
      
      if (this.subscriptionManager) {
        this.subscriptionManager.stop();
        this.subscriptionManager = null;
      }
      
    } catch (error) {
      console.error('⚠️ Error during cleanup:', error);
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
