
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
      
      // Test 3: Real-time system validation - only if we have a valid test application
      if (this.testApplicationId) {
        await this.testRealtimeSystemComprehensive();
      } else {
        this.addTestResult({
          testName: 'Real-Time System Comprehensive',
          status: 'failed',
          message: 'Skipped: No valid test application available',
          timestamp: new Date().toISOString(),
          details: { reason: 'Test application creation failed' }
        });
      }
      
      // Test 4: AI scoring integration - only if we have a valid test application
      if (this.testApplicationId) {
        await this.testAIEvaluationSystem();
      } else {
        this.addTestResult({
          testName: 'AI Evaluation System',
          status: 'failed',
          message: 'Skipped: No valid test application available for AI evaluation',
          timestamp: new Date().toISOString(),
          details: { reason: 'Test application creation failed' }
        });
      }
      
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
   * Test complete application lifecycle with enhanced error handling
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
        tell_us_about_idea: 'E2E test: AI-powered entrepreneurship platform for real-time validation and comprehensive testing',
        problem_statement: 'Entrepreneurs need better tools for idea validation and mentorship matching with advanced analytics',
        whose_problem: 'Young entrepreneurs aged 18-30 who lack access to experienced mentors and validation frameworks',
        how_solve_problem: 'AI-driven analysis platform with real-time feedback and mentor connections using machine learning',
        how_make_money: 'Subscription model with premium features, mentor commission structure, and enterprise partnerships',
        acquire_customers: 'University partnerships, social media campaigns, referral programs, and strategic startup ecosystem partnerships',
        team_roles: 'Technical leadership with startup experience and AI/ML expertise from leading technology companies'
      };

      console.log(`📝 Creating test application with ID: ${this.testApplicationId}`);
      
      // Step 1: Create application with comprehensive data
      const { data: createData, error: createError } = await supabase
        .from('yff_applications')
        .insert({
          application_id: this.testApplicationId,
          individual_id: this.testIndividualId,
          answers: testFormData,
          status: 'e2e_test_lifecycle',
          evaluation_status: 'pending',
          application_round: 'e2e_test_v2',
          cumulative_score: 0,
          overall_score: 0,
          reviewer_scores: {},
          evaluation_data: {}
        })
        .select('application_id, status, evaluation_status')
        .single();

      if (createError) {
        console.error('❌ Application creation failed:', createError);
        throw new Error(`Application creation failed: ${createError.message}`);
      }

      if (!createData?.application_id) {
        throw new Error('Application created but no data returned');
      }

      console.log(`✅ Application created successfully: ${createData.application_id}`);

      // Step 2: Verify creation by reading back the application
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for database consistency
      
      const { data: readData, error: readError } = await supabase
        .from('yff_applications')
        .select('*')
        .eq('application_id', this.testApplicationId)
        .maybeSingle(); // Use maybeSingle to avoid 406 error

      if (readError) {
        console.error('❌ Application retrieval failed:', readError);
        throw new Error(`Application retrieval failed: ${readError.message}`);
      }

      if (!readData) {
        console.error('❌ Application not found after creation');
        throw new Error(`Application not found after creation: ${this.testApplicationId}`);
      }

      console.log(`✅ Application retrieved successfully with status: ${readData.status}`);

      // Step 3: Update application
      const updateData = {
        status: 'e2e_test_updated',
        evaluation_status: 'processing',
        updated_at: new Date().toISOString()
      };

      const { data: updateResult, error: updateError } = await supabase
        .from('yff_applications')
        .update(updateData)
        .eq('application_id', this.testApplicationId)
        .select('status, evaluation_status')
        .single();

      if (updateError) {
        console.error('❌ Application update failed:', updateError);
        throw new Error(`Application update failed: ${updateError.message}`);
      }

      console.log(`✅ Application updated successfully to status: ${updateResult.status}`);

      // Step 4: Final verification
      const { data: verifyData, error: verifyError } = await supabase
        .from('yff_applications')
        .select('status, evaluation_status, application_id')
        .eq('application_id', this.testApplicationId)
        .maybeSingle();

      if (verifyError || !verifyData || verifyData.status !== 'e2e_test_updated') {
        console.error('❌ Application update verification failed:', verifyError || 'Status mismatch');
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
          formFields: Object.keys(testFormData).length,
          finalStatus: verifyData.status,
          evaluationStatus: verifyData.evaluation_status
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Clear test application ID if creation/verification failed
      if (error.message.includes('creation') || error.message.includes('not found')) {
        this.testApplicationId = null;
      }
      
      this.addTestResult({
        testName: 'Application Lifecycle',
        status: 'failed',
        message: `Application lifecycle test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration,
        details: { 
          error: error.message,
          applicationId: this.testApplicationId?.slice(0, 8) + '...' || 'none',
          phase: error.message.includes('creation') ? 'creation' : 
                 error.message.includes('retrieval') ? 'reading' :
                 error.message.includes('update') ? 'updating' : 'unknown'
        }
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

      // Use the comprehensive real-time helper with our validated test application
      const realtimeResults = await this.realtimeHelper.testRealtimeEvents(this.testApplicationId, 25000);
      
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Real-Time System Comprehensive',
        status: realtimeResults.success ? 'passed' : 'failed',
        message: realtimeResults.message,
        timestamp: new Date().toISOString(),
        duration,
        details: realtimeResults.details
      });

      if (!realtimeResults.success) {
        console.warn('⚠️ Real-time system test failed, but continuing with other tests');
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

  private async testAIEvaluationSystem(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🤖 Testing AI evaluation system...');

      if (!this.testApplicationId) {
        throw new Error('No test application available for AI evaluation');
      }

      console.log(`🔍 Testing AI evaluation for application: ${this.testApplicationId}`);

      // Verify application exists before evaluation
      const { data: appData, error: appError } = await supabase
        .from('yff_applications')
        .select('application_id, status, answers')
        .eq('application_id', this.testApplicationId)
        .maybeSingle();

      if (appError || !appData) {
        throw new Error(`Application verification failed before AI evaluation: ${appError?.message || 'Application not found'}`);
      }

      console.log(`✅ Application verified for AI evaluation: ${appData.application_id}`);

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
        details: { 
          error: error.message,
          applicationId: this.testApplicationId?.slice(0, 8) + '...' || 'none'
        }
      });
      
      console.error('❌ AI evaluation test failed, but continuing with other tests');
    }
  }

  /**
   * Test error handling and recovery mechanisms - FIXED to avoid using real application IDs
   */
  private async testErrorHandlingAndRecovery(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🛠️ Testing error handling and recovery...');

      // Test 1: Invalid application ID handling - use clearly invalid format
      console.log('🔍 Testing with invalid application ID format...');
      const invalidApplicationId = 'invalid-application-id-format-for-testing';
      const invalidResult = await AIComprehensiveScoringService.triggerEvaluation(invalidApplicationId);
      
      if (invalidResult.success) {
        throw new Error('Error handling test failed: should have rejected invalid application ID format');
      }

      console.log('✅ Invalid application ID properly rejected');

      // Test 2: Database query with malformed UUID
      console.log('🔍 Testing database error handling with malformed UUID...');
      const { data: invalidQuery, error: queryError } = await supabase
        .from('yff_applications')
        .select('*')
        .eq('application_id', 'not-a-valid-uuid-format')
        .maybeSingle(); // Use maybeSingle to avoid 406 errors

      // Should handle gracefully without throwing
      const queryHandled = !!queryError || !invalidQuery;
      console.log(queryHandled ? '✅ Database query error handled gracefully' : '⚠️ Query unexpectedly succeeded');

      // Test 3: Non-existent but valid UUID format
      console.log('🔍 Testing with non-existent but valid UUID...');
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000'; // Use zero UUID which won't exist
      const nonExistentResult = await AIComprehensiveScoringService.triggerEvaluation(nonExistentUuid);
      
      if (nonExistentResult.success) {
        throw new Error('Error handling test failed: should have rejected non-existent application');
      }

      console.log('✅ Non-existent application properly handled');

      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Error Handling and Recovery',
        status: 'passed',
        message: 'Error handling mechanisms working correctly for all test scenarios',
        timestamp: new Date().toISOString(),
        duration,
        details: {
          invalidIdFormatHandled: !invalidResult.success,
          queryErrorHandled: queryHandled,
          nonExistentUuidHandled: !nonExistentResult.success,
          testScenarios: 3,
          testedFormats: ['invalid-format', 'malformed-uuid', 'valid-but-nonexistent-uuid']
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

  private async cleanupTestData(): Promise<void> {
    console.log('🧹 Cleaning up test data...');
    
    try {
      if (this.testApplicationId) {
        const { error } = await supabase
          .from('yff_applications')
          .delete()
          .eq('application_id', this.testApplicationId);
        
        if (error) {
          console.warn(`⚠️ Error deleting test application: ${error.message}`);
        } else {
          console.log(`🗑️ Deleted test application: ${this.testApplicationId}`);
        }
      }
      
    } catch (error) {
      console.error('⚠️ Error during cleanup:', error);
    }
  }

  private addTestResult(result: TestResult): void {
    this.results.push(result);
  }

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
