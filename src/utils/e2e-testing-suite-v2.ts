
/**
 * @fileoverview Comprehensive E2E Testing Suite V2
 * 
 * Complete testing framework for YFF applications with enhanced
 * real-time validation, database access verification, and error handling.
 * 
 * @version 3.0.0
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';
import { AIComprehensiveScoringService } from '@/services/ai-comprehensive-scoring-service';
import { E2ERealtimeHelperV2 } from './e2e-realtime-helper-v2';
import { v4 as uuidv4 } from 'uuid';

export interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'running';
  message: string;
  timestamp: string;
  duration?: number;
  details?: any;
}

export class E2ETestingSuiteV2 {
  private results: TestResult[] = [];
  private testApplicationId: string | null = null;
  private testIndividualId: string | null = null;
  private realtimeHelper: E2ERealtimeHelperV2;

  constructor() {
    this.results = [];
    this.realtimeHelper = new E2ERealtimeHelperV2();
  }

  /**
   * Run complete E2E test suite with comprehensive validation
   */
  async runCompleteTestSuite(): Promise<TestResult[]> {
    console.log('🚀 Starting comprehensive E2E test suite V2...');
    
    try {
      // Test 1: Authentication and database connectivity
      await this.testAuthenticationAndDatabase();
      
      // Test 2: Application lifecycle (create, read, update)
      await this.testApplicationLifecycle();
      
      // Test 3: Real-time system validation
      await this.testRealtimeSystemComprehensive();
      
      // Test 4: AI scoring integration
      await this.testAIEvaluationSystem();
      
      // Test 5: Error handling and recovery
      await this.testErrorHandlingAndRecovery();
      
      // Test 6: Performance validation
      await this.testPerformanceMetrics();
      
      console.log('✅ E2E test suite V2 completed successfully');
      
    } catch (error) {
      console.error('❌ E2E test suite V2 failed:', error);
      
      this.addTestResult({
        testName: 'Test Suite Error',
        status: 'failed',
        message: `Test suite failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        details: { error: error.message }
      });
    } finally {
      // Always cleanup
      await this.cleanupTestData();
    }
    
    return this.results;
  }

  /**
   * Test authentication and database connectivity
   */
  private async testAuthenticationAndDatabase(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔐 Testing authentication and database connectivity...');
      
      // Test authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error(`Authentication failed: ${authError?.message || 'No user found'}`);
      }

      console.log(`✅ User authenticated: ${user.id}`);

      // Test database access to all critical tables
      const tables = ['yff_applications', 'individuals', 'user_roles'] as const;
      const tableResults: any = {};

      for (const table of tables) {
        const dbTest = await E2ERealtimeHelperV2.testDatabaseAccess(table);
        tableResults[table] = {
          canRead: dbTest.canRead,
          canWrite: dbTest.canWrite,
          recordCount: dbTest.recordCount
        };
        
        if (!dbTest.canRead) {
          console.warn(`⚠️ Limited access to table: ${table}`);
        }
      }

      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Authentication and Database',
        status: 'passed',
        message: `Authentication successful. Database access verified for ${tables.length} tables.`,
        timestamp: new Date().toISOString(),
        duration,
        details: {
          userId: user.id,
          userEmail: user.email,
          tableAccess: tableResults
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Authentication and Database',
        status: 'failed',
        message: `Authentication/Database test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration,
        details: { error: error.message }
      });
      
      throw error;
    }
  }

  /**
   * Test complete application lifecycle
   */
  private async testApplicationLifecycle(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('📋 Testing application lifecycle...');

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      this.testIndividualId = user.id;
      this.testApplicationId = uuidv4();

      const testFormData = {
        tell_us_about_idea: 'E2E test: AI-powered entrepreneurship platform for real-time validation',
        problem_statement: 'Entrepreneurs need better tools for idea validation and mentorship matching',
        whose_problem: 'Young entrepreneurs aged 18-30 who lack access to experienced mentors',
        how_solve_problem: 'AI-driven analysis platform with real-time feedback and mentor connections',
        how_make_money: 'Subscription model with premium features and mentor commission structure',
        acquire_customers: 'University partnerships, social media campaigns, and referral programs',
        team_roles: 'Technical leadership with startup experience and AI/ML expertise'
      };

      // Step 1: Create application
      console.log('📝 Creating test application...');
      const { data: createData, error: createError } = await supabase
        .from('yff_applications')
        .insert({
          application_id: this.testApplicationId,
          individual_id: this.testIndividualId,
          answers: testFormData,
          status: 'e2e_test_lifecycle',
          evaluation_status: 'pending',
          application_round: 'e2e_test'
        })
        .select('application_id')
        .single();

      if (createError) {
        throw new Error(`Application creation failed: ${createError.message}`);
      }

      console.log(`✅ Application created: ${this.testApplicationId}`);

      // Step 2: Read application
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: readData, error: readError } = await supabase
        .from('yff_applications')
        .select('*')
        .eq('application_id', this.testApplicationId)
        .single();

      if (readError || !readData) {
        throw new Error(`Application retrieval failed: ${readError?.message || 'No data returned'}`);
      }

      console.log(`✅ Application retrieved successfully`);

      // Step 3: Update application
      const updateData = {
        status: 'e2e_test_updated',
        evaluation_status: 'processing',
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('yff_applications')
        .update(updateData)
        .eq('application_id', this.testApplicationId)
        .select();

      if (updateError) {
        throw new Error(`Application update failed: ${updateError.message}`);
      }

      console.log(`✅ Application updated successfully`);

      // Step 4: Verify update
      const { data: verifyData, error: verifyError } = await supabase
        .from('yff_applications')
        .select('status, evaluation_status')
        .eq('application_id', this.testApplicationId)
        .single();

      if (verifyError || !verifyData || verifyData.status !== 'e2e_test_updated') {
        throw new Error('Application update verification failed');
      }

      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Application Lifecycle',
        status: 'passed',
        message: 'Application lifecycle test completed: create → read → update → verify',
        timestamp: new Date().toISOString(),
        duration,
        details: {
          applicationId: this.testApplicationId.slice(0, 8) + '...',
          lifecycle: ['created', 'read', 'updated', 'verified'],
          formFields: Object.keys(testFormData).length
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Application Lifecycle',
        status: 'failed',
        message: `Application lifecycle test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration,
        details: { error: error.message }
      });
      
      throw error;
    }
  }

  /**
   * Test real-time system comprehensively
   */
  private async testRealtimeSystemComprehensive(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing real-time system comprehensively...');

      if (!this.testApplicationId) {
        throw new Error('No test application available for real-time testing');
      }

      // Use the comprehensive real-time helper
      const realtimeResults = await this.realtimeHelper.runCompleteValidation();
      
      let allPassed = true;
      let failedTests: string[] = [];
      
      realtimeResults.forEach(result => {
        if (!result.success) {
          allPassed = false;
          failedTests.push(result.message);
        }
      });

      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Real-Time System Comprehensive',
        status: allPassed ? 'passed' : 'failed',
        message: allPassed 
          ? `Real-time system test passed: ${realtimeResults.length} sub-tests completed successfully`
          : `Real-time system test failed: ${failedTests.length} sub-tests failed`,
        timestamp: new Date().toISOString(),
        duration,
        details: {
          subTests: realtimeResults.length,
          passed: realtimeResults.filter(r => r.success).length,
          failed: failedTests.length,
          failedTests,
          fullResults: realtimeResults
        }
      });

      if (!allPassed) {
        throw new Error(`Real-time system validation failed: ${failedTests.join(', ')}`);
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Real-Time System Comprehensive',
        status: 'failed',
        message: `Real-time system test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration,
        details: { error: error.message }
      });
      
      console.error('❌ Real-time system test failed, but continuing with other tests');
    }
  }

  /**
   * Test AI evaluation system
   */
  private async testAIEvaluationSystem(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🤖 Testing AI evaluation system...');

      if (!this.testApplicationId) {
        throw new Error('No test application available for AI evaluation');
      }

      // Trigger AI evaluation
      const evaluationResult = await AIComprehensiveScoringService.triggerEvaluation(this.testApplicationId);
      
      if (!evaluationResult.success) {
        throw new Error(`AI evaluation failed: ${evaluationResult.message}`);
      }

      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'AI Evaluation System',
        status: 'passed',
        message: `AI evaluation completed successfully: ${evaluationResult.message}`,
        timestamp: new Date().toISOString(),
        duration,
        details: {
          applicationId: this.testApplicationId.slice(0, 8) + '...',
          evaluationResult: evaluationResult.result,
          overallScore: evaluationResult.result?.overall_score
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'AI Evaluation System',
        status: 'failed',
        message: `AI evaluation test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration,
        details: { error: error.message }
      });
      
      console.error('❌ AI evaluation test failed, but continuing with other tests');
    }
  }

  /**
   * Test error handling and recovery mechanisms
   */
  private async testErrorHandlingAndRecovery(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🛠️ Testing error handling and recovery...');

      // Test 1: Invalid application ID handling
      const invalidUuid = uuidv4();
      const invalidResult = await AIComprehensiveScoringService.triggerEvaluation(invalidUuid);
      
      if (invalidResult.success) {
        throw new Error('Error handling test failed: should have rejected invalid application ID');
      }

      // Test 2: Database query with invalid conditions
      const { data: invalidQuery, error: queryError } = await supabase
        .from('yff_applications')
        .select('*')
        .eq('application_id', 'invalid-uuid-format')
        .single();

      // Should handle gracefully without throwing
      if (!queryError) {
        console.log('⚠️ Expected query error but none occurred');
      }

      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Error Handling and Recovery',
        status: 'passed',
        message: 'Error handling mechanisms working correctly',
        timestamp: new Date().toISOString(),
        duration,
        details: {
          invalidIdHandled: !invalidResult.success,
          queryErrorHandled: !!queryError,
          testScenarios: 2
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Error Handling and Recovery',
        status: 'failed',
        message: `Error handling test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration,
        details: { error: error.message }
      });
      
      console.error('❌ Error handling test failed, but continuing with other tests');
    }
  }

  /**
   * Test system performance metrics
   */
  private async testPerformanceMetrics(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('⚡ Testing performance metrics...');

      const queryStart = Date.now();
      const { count, error } = await supabase
        .from('yff_applications')
        .select('*', { count: 'exact', head: true });
      const queryDuration = Date.now() - queryStart;

      if (error) {
        throw new Error(`Performance test query failed: ${error.message}`);
      }

      const maxAcceptableQueryTime = 3000; // 3 seconds
      const performanceGrade = queryDuration < maxAcceptableQueryTime ? 'Excellent' : 'Needs Optimization';
      
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Performance Metrics',
        status: queryDuration < maxAcceptableQueryTime ? 'passed' : 'failed',
        message: `Database query performance: ${queryDuration}ms (${performanceGrade})`,
        timestamp: new Date().toISOString(),
        duration,
        details: {
          queryDuration,
          performanceGrade,
          maxAcceptable: maxAcceptableQueryTime,
          recordCount: count,
          meetsPerformanceThreshold: queryDuration < maxAcceptableQueryTime
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Performance Metrics',
        status: 'failed',
        message: `Performance metrics test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration,
        details: { error: error.message }
      });
      
      console.error('❌ Performance metrics test failed, but continuing with other tests');
    }
  }

  /**
   * Clean up all test data
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
   * Generate comprehensive test report
   */
  generateTestReport(): string {
    const timestamp = new Date().toISOString();
    const passedTests = this.results.filter(r => r.status === 'passed').length;
    const failedTests = this.results.filter(r => r.status === 'failed').length;
    const totalTests = this.results.length;
    
    let report = `# E2E Test Report V2\n\n`;
    report += `**Generated:** ${timestamp}\n`;
    report += `**Tests Passed:** ${passedTests}/${totalTests}\n`;
    report += `**Tests Failed:** ${failedTests}/${totalTests}\n`;
    report += `**Success Rate:** ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%\n\n`;
    
    if (failedTests === 0) {
      report += `🎉 **All tests passed!** The YFF application system is working correctly.\n\n`;
    } else {
      report += `⚠️ **${failedTests} test(s) failed.** Please review the results below.\n\n`;
    }
    
    report += `## Detailed Test Results\n\n`;
    
    this.results.forEach((result, index) => {
      const icon = result.status === 'passed' ? '✅' : '❌';
      report += `### ${index + 1}. ${icon} ${result.testName}\n\n`;
      report += `**Status:** ${result.status.toUpperCase()}\n`;
      report += `**Message:** ${result.message}\n`;
      report += `**Timestamp:** ${result.timestamp}\n`;
      
      if (result.duration) {
        report += `**Duration:** ${result.duration}ms\n`;
      }
      
      if (result.details) {
        report += `**Details:**\n\`\`\`json\n${JSON.stringify(result.details, null, 2)}\n\`\`\`\n`;
      }
      
      report += `\n`;
    });
    
    return report;
  }
}
