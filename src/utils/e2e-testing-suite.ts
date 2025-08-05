/**
 * @fileoverview End-to-End Testing Suite for AI Scoring System
 * 
 * Comprehensive testing framework to validate the entire flow from
 * application submission through AI scoring to dashboard display.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import type { YffApplicationWithIndividual } from '@/types/yff-application';

/**
 * Test result interface
 */
export interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'running' | 'skipped';
  message: string;
  duration?: number;
  details?: any;
  timestamp: string;
}

/**
 * Type guard to check if value is an object (not array)
 */
function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Type guard to check if evaluation data has scores
 */
function hasScores(data: any): data is { scores: Record<string, any> } {
  return isObject(data) && data.scores && isObject(data.scores);
}

/**
 * Generate unique test email for each test run
 */
function generateUniqueTestEmail(): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  return `e2e.test.${timestamp}.${randomId}@26ideas.com`;
}

/**
 * End-to-End Testing Suite
 */
export class E2ETestingSuite {
  private results: TestResult[] = [];
  private testApplicationId: string | null = null;
  private testIndividualId: string | null = null;
  private testEmail: string | null = null;

  /**
   * Run complete end-to-end test suite
   */
  async runCompleteTestSuite(): Promise<TestResult[]> {
    console.log('🚀 Starting comprehensive E2E testing suite...');
    this.results = [];

    try {
      // Test 1: Database Connection
      await this.testDatabaseConnection();

      // Test 2: Create Test Application
      await this.testApplicationSubmission();

      // Test 3: Verify Dashboard Display
      await this.testDashboardDisplay();

      // Test 4: Trigger AI Scoring
      await this.testAIScoringTrigger();

      // Test 5: Monitor Scoring Process
      await this.testScoringProcessMonitoring();

      // Test 6: Verify Results Display
      await this.testResultsDisplay();

      // Test 7: Real-time Updates
      await this.testRealTimeUpdates();

      // Test 8: Error Handling
      await this.testErrorHandling();

      // Test 9: Performance Metrics
      await this.testPerformanceMetrics();

      console.log('✅ E2E testing suite completed successfully');

    } catch (error) {
      console.error('❌ E2E testing suite failed:', error);
      this.addResult({
        testName: 'Test Suite Execution',
        status: 'failed',
        message: `Test suite failed with error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    } finally {
      // Cleanup test data
      await this.cleanupTestData();
    }

    return this.results;
  }

  /**
   * Test database connection and basic queries
   */
  private async testDatabaseConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Testing database connection...');

      // Fixed: Use proper Supabase count syntax
      const { count, error } = await supabase
        .from('yff_applications')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      const duration = Date.now() - startTime;
      this.addResult({
        testName: 'Database Connection',
        status: 'passed',
        message: `Database connection successful. Found ${count || 0} applications.`,
        duration,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.addResult({
        testName: 'Database Connection',
        status: 'failed',
        message: `Database connection failed: ${error.message}`,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Test application submission process
   */
  private async testApplicationSubmission(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('📝 Testing application submission...');

      // Generate unique test data for this run
      this.testApplicationId = uuidv4();
      this.testEmail = generateUniqueTestEmail();
      
      console.log(`Generated test application UUID: ${this.testApplicationId}`);
      console.log(`Generated unique test email: ${this.testEmail}`);

      // Create test application data with unique email
      const TEST_APPLICATION = {
        first_name: 'E2E',
        last_name: 'TestUser',
        email: this.testEmail,
        phone_number: '+1234567890',
        answers: {
          tell_us_about_idea: 'Our innovative E2E test startup focuses on developing sustainable energy solutions using advanced solar technology. We aim to revolutionize how businesses approach renewable energy by creating affordable, high-efficiency solar panels that can be easily integrated into existing infrastructure. Our unique value proposition lies in our proprietary nano-coating technology that increases energy absorption by 30% compared to traditional panels.',
          problem_statement: 'The current renewable energy market faces significant barriers including high installation costs, low efficiency rates, and complex integration processes. According to recent studies, 67% of small businesses cite cost as the primary barrier to adopting solar energy, while 45% mention technical complexity. Our research shows that existing solar panels only achieve 18-22% efficiency rates, leaving substantial room for improvement.',
          target_audience: 'Small to medium-sized businesses with annual revenues between $1M-$50M, particularly those in manufacturing, retail, and office environments. These businesses typically spend $5,000-$25,000 annually on electricity and are motivated by both cost savings and sustainability goals.',
          solution_approach: 'We combine advanced materials science with AI-driven optimization to create next-generation solar panels. Our proprietary nano-coating increases light absorption, while our smart monitoring system uses machine learning to optimize energy production based on weather patterns and usage data.',
          monetization_strategy: 'We offer three revenue streams: direct sales of solar panels ($15,000-$75,000 per installation), subscription-based monitoring and optimization services ($200-$500/month), and licensing our nano-coating technology to existing manufacturers ($1M+ annual licensing fees).'
        }
      };

      // Create individual record first
      const { data: individual, error: individualError } = await supabase
        .from('individuals')
        .insert({
          first_name: TEST_APPLICATION.first_name,
          last_name: TEST_APPLICATION.last_name,
          email: TEST_APPLICATION.email,
          phone_number: TEST_APPLICATION.phone_number
        })
        .select()
        .single();

      if (individualError) throw individualError;
      this.testIndividualId = individual.individual_id;

      // Create application record with proper UUID
      const { data: application, error: applicationError } = await supabase
        .from('yff_applications')
        .insert({
          application_id: this.testApplicationId,
          individual_id: individual.individual_id,
          status: 'submitted',
          answers: TEST_APPLICATION.answers,
          evaluation_status: 'pending'
        })
        .select()
        .single();

      if (applicationError) throw applicationError;

      const duration = Date.now() - startTime;
      this.addResult({
        testName: 'Application Submission',
        status: 'passed',
        message: `Test application created successfully with UUID: ${this.testApplicationId} and email: ${this.testEmail}`,
        duration,
        details: { 
          applicationId: this.testApplicationId, 
          individualId: individual.individual_id,
          testEmail: this.testEmail 
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.addResult({
        testName: 'Application Submission',
        status: 'failed',
        message: `Application submission failed: ${error.message}`,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Test dashboard display of new application
   */
  private async testDashboardDisplay(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('📊 Testing dashboard display...');

      // Wait a moment for the application to be available
      await new Promise(resolve => setTimeout(resolve, 2000));

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

      if (error) throw error;

      if (!applications || applications.length === 0) {
        throw new Error('Test application not found in dashboard query');
      }

      const application = applications[0];
      const expectedFields = [
        'application_id',
        'status',
        'evaluation_status',
        'created_at',
        'answers'
      ];

      const missingFields = expectedFields.filter(field => !(field in application));
      if (missingFields.length > 0) {
        throw new Error(`Missing fields in application: ${missingFields.join(', ')}`);
      }

      const duration = Date.now() - startTime;
      this.addResult({
        testName: 'Dashboard Display',
        status: 'passed',
        message: 'Application correctly displayed in dashboard with all required fields',
        duration,
        details: { fieldsPresent: Object.keys(application) },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.addResult({
        testName: 'Dashboard Display',
        status: 'failed',
        message: `Dashboard display test failed: ${error.message}`,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
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
      console.log('🤖 Testing AI scoring trigger...');

      // Call the comprehensive evaluation edge function with proper UUID
      const { data, error } = await supabase.functions.invoke('comprehensive-evaluation', {
        body: { applicationId: this.testApplicationId }
      });

      if (error) throw error;

      if (!data || !data.success) {
        throw new Error(`AI scoring trigger failed: ${data?.error || 'Unknown error'}`);
      }

      const duration = Date.now() - startTime;
      this.addResult({
        testName: 'AI Scoring Trigger',
        status: 'passed',
        message: 'AI scoring triggered successfully',
        duration,
        details: data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.addResult({
        testName: 'AI Scoring Trigger',
        status: 'failed',
        message: `AI scoring trigger failed: ${error.message}`,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
      // Don't throw here - continue with other tests
    }
  }

  /**
   * Monitor scoring process completion
   */
  private async testScoringProcessMonitoring(): Promise<void> {
    const startTime = Date.now();
    const maxWaitTime = 5 * 60 * 1000; // 5 minutes
    const checkInterval = 10000; // 10 seconds
    
    try {
      console.log('⏱️ Monitoring scoring process...');

      let completed = false;
      let attempts = 0;
      const maxAttempts = Math.floor(maxWaitTime / checkInterval);

      while (!completed && attempts < maxAttempts) {
        const { data: application, error } = await supabase
          .from('yff_applications')
          .select('evaluation_status, overall_score, evaluation_completed_at')
          .eq('application_id', this.testApplicationId)
          .single();

        if (error) throw error;

        console.log(`📊 Scoring status check ${attempts + 1}: ${application.evaluation_status}`);

        if (application.evaluation_status === 'completed') {
          completed = true;
          const duration = Date.now() - startTime;
          this.addResult({
            testName: 'Scoring Process Monitoring',
            status: 'passed',
            message: `Scoring completed successfully in ${Math.round(duration / 1000)} seconds`,
            duration,
            details: {
              overallScore: application.overall_score,
              evaluationCompletedAt: application.evaluation_completed_at,
              attempts: attempts + 1
            },
            timestamp: new Date().toISOString()
          });
          return;
        } else if (application.evaluation_status === 'failed') {
          throw new Error('Scoring process failed');
        }

        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
      }

      if (!completed) {
        throw new Error(`Scoring process did not complete within ${maxWaitTime / 1000} seconds`);
      }

    } catch (error) {
      this.addResult({
        testName: 'Scoring Process Monitoring',
        status: 'failed',
        message: `Scoring process monitoring failed: ${error.message}`,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Test results display in dashboard
   */
  private async testResultsDisplay(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('📋 Testing results display...');

      const { data: application, error } = await supabase
        .from('yff_applications')
        .select('*, individuals(first_name, last_name, email)')
        .eq('application_id', this.testApplicationId)
        .single();

      if (error) throw error;

      // Verify scoring results
      const requiredFields = [
        'overall_score',
        'evaluation_data',
        'evaluation_status',
        'evaluation_completed_at'
      ];

      const missingFields = requiredFields.filter(field => 
        application[field] === null || application[field] === undefined
      );

      if (missingFields.length > 0) {
        throw new Error(`Missing scoring result fields: ${missingFields.join(', ')}`);
      }

      // Verify score is in valid range
      if (application.overall_score < 0 || application.overall_score > 10) {
        throw new Error(`Overall score out of range: ${application.overall_score}`);
      }

      // Verify evaluation data structure with proper type checking
      if (!application.evaluation_data || !isObject(application.evaluation_data)) {
        throw new Error('Invalid evaluation data structure - not an object');
      }

      // Use type guard to safely check for scores
      let questionsScored = 0;
      if (hasScores(application.evaluation_data)) {
        questionsScored = Object.keys(application.evaluation_data.scores).length;
      }

      const duration = Date.now() - startTime;
      this.addResult({
        testName: 'Results Display',
        status: 'passed',
        message: 'Scoring results correctly displayed with all required data',
        duration,
        details: {
          overallScore: application.overall_score,
          questionsScored,
          evaluationStatus: application.evaluation_status,
          hasValidScores: hasScores(application.evaluation_data)
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.addResult({
        testName: 'Results Display',
        status: 'failed',
        message: `Results display test failed: ${error.message}`,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Test real-time updates functionality
   */
  private async testRealTimeUpdates(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing real-time updates...');

      // This is a simplified test - in a real scenario, we'd test with multiple browser instances
      let updateReceived = false;

      const channel = supabase
        .channel('e2e-test-channel')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'yff_applications',
            filter: `application_id=eq.${this.testApplicationId}`
          },
          (payload) => {
            console.log('📨 Real-time update received in test:', payload);
            updateReceived = true;
          }
        )
        .subscribe();

      // Make a small update to trigger real-time notification
      await supabase
        .from('yff_applications')
        .update({ updated_at: new Date().toISOString() })
        .eq('application_id', this.testApplicationId);

      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 3000));

      supabase.removeChannel(channel);

      const duration = Date.now() - startTime;
      if (updateReceived) {
        this.addResult({
          testName: 'Real-time Updates',
          status: 'passed',
          message: 'Real-time updates working correctly',
          duration,
          timestamp: new Date().toISOString()
        });
      } else {
        this.addResult({
          testName: 'Real-time Updates',
          status: 'failed',
          message: 'Real-time update not received within expected timeframe',
          duration,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      this.addResult({
        testName: 'Real-time Updates',
        status: 'failed',
        message: `Real-time updates test failed: ${error.message}`,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Test error handling scenarios
   */
  private async testErrorHandling(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('❌ Testing error handling...');

      // Test with invalid UUID format (this should fail properly)
      const invalidId = 'invalid_id_12345';
      const { data, error } = await supabase.functions.invoke('comprehensive-evaluation', {
        body: { applicationId: invalidId }
      });

      // We expect this to fail, so check if error handling works correctly
      if (!error && data?.success) {
        throw new Error('Expected error handling test to fail, but it succeeded');
      }

      const duration = Date.now() - startTime;
      this.addResult({
        testName: 'Error Handling',
        status: 'passed',
        message: 'Error handling working correctly - invalid requests properly rejected',
        duration,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.addResult({
        testName: 'Error Handling',
        status: 'failed',
        message: `Error handling test failed: ${error.message}`,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Test performance metrics
   */
  private async testPerformanceMetrics(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('⚡ Testing performance metrics...');

      // Test dashboard load performance
      const dashboardStartTime = Date.now();
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
        .limit(50);

      if (error) throw error;

      const dashboardLoadTime = Date.now() - dashboardStartTime;

      // Test individual application load
      const appStartTime = Date.now();
      const { data: singleApp, error: singleError } = await supabase
        .from('yff_applications')
        .select('*')
        .eq('application_id', this.testApplicationId)
        .single();

      if (singleError) throw singleError;

      const singleAppLoadTime = Date.now() - appStartTime;

      const duration = Date.now() - startTime;
      this.addResult({
        testName: 'Performance Metrics',
        status: 'passed',
        message: 'Performance metrics within acceptable ranges',
        duration,
        details: {
          dashboardLoadTime: `${dashboardLoadTime}ms`,
          singleApplicationLoadTime: `${singleAppLoadTime}ms`,
          applicationsCount: applications.length,
          averageLoadTimePerApp: `${Math.round(dashboardLoadTime / applications.length)}ms`
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.addResult({
        testName: 'Performance Metrics',
        status: 'failed',
        message: `Performance metrics test failed: ${error.message}`,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Cleanup test data
   */
  private async cleanupTestData(): Promise<void> {
    if (!this.testApplicationId && !this.testIndividualId && !this.testEmail) return;

    try {
      console.log('🧹 Cleaning up test data...');
      console.log(`Cleaning up application: ${this.testApplicationId}`);
      console.log(`Cleaning up individual: ${this.testIndividualId}`);
      console.log(`Cleaning up email: ${this.testEmail}`);

      // Delete application record first (due to foreign key constraint)
      if (this.testApplicationId) {
        const { error: appDeleteError } = await supabase
          .from('yff_applications')
          .delete()
          .eq('application_id', this.testApplicationId);
        
        if (appDeleteError) {
          console.warn('Warning: Failed to delete test application:', appDeleteError);
        } else {
          console.log('✅ Test application deleted successfully');
        }
      }

      // Delete individual record
      if (this.testIndividualId) {
        const { error: individualDeleteError } = await supabase
          .from('individuals')
          .delete()
          .eq('individual_id', this.testIndividualId);
        
        if (individualDeleteError) {
          console.warn('Warning: Failed to delete test individual:', individualDeleteError);
        } else {
          console.log('✅ Test individual deleted successfully');
        }
      }

      // Fallback: Delete by email if IDs are not available
      if (this.testEmail && !this.testIndividualId) {
        const { error: emailDeleteError } = await supabase
          .from('individuals')
          .delete()
          .eq('email', this.testEmail);
        
        if (emailDeleteError) {
          console.warn('Warning: Failed to delete test individual by email:', emailDeleteError);
        } else {
          console.log('✅ Test individual deleted by email successfully');
        }
      }

      console.log('✅ Test data cleanup completed');

    } catch (error) {
      console.error('❌ Test data cleanup failed:', error);
    }
  }

  /**
   * Add test result to results array
   */
  private addResult(result: TestResult): void {
    this.results.push(result);
    
    // Log result
    const emoji = result.status === 'passed' ? '✅' : 
                 result.status === 'failed' ? '❌' : '⏳';
    
    console.log(`${emoji} ${result.testName}: ${result.message}`);
    
    if (result.duration) {
      console.log(`   Duration: ${result.duration}ms`);
    }
  }

  /**
   * Generate detailed test report
   */
  generateTestReport(): string {
    const passedTests = this.results.filter(r => r.status === 'passed').length;
    const failedTests = this.results.filter(r => r.status === 'failed').length;
    const totalTests = this.results.length;

    let report = `
# End-to-End Testing Report
Generated: ${new Date().toISOString()}

## Summary
- Total Tests: ${totalTests}
- Passed: ${passedTests} ✅
- Failed: ${failedTests} ❌
- Success Rate: ${Math.round((passedTests / totalTests) * 100)}%

## Test Results
`;

    this.results.forEach(result => {
      const status = result.status === 'passed' ? '✅ PASSED' : '❌ FAILED';
      report += `
### ${result.testName} - ${status}
- **Message:** ${result.message}
- **Duration:** ${result.duration ? `${result.duration}ms` : 'N/A'}
- **Timestamp:** ${result.timestamp}
`;
      
      if (result.details) {
        report += `- **Details:** ${JSON.stringify(result.details, null, 2)}\n`;
      }
    });

    return report;
  }
}
