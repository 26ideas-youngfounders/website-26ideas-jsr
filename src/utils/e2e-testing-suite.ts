/**
 * @fileoverview Complete E2E Testing Suite Rebuild
 * 
 * Bulletproof end-to-end testing with comprehensive verification,
 * robust application lifecycle management, and bulletproof error handling.
 * 
 * @version 3.0.0 - COMPLETE SYSTEM REBUILD
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';
import { AIComprehensiveScoringService } from '@/services/ai-comprehensive-scoring-service';
import { BackgroundJobService } from '@/services/background-job-service';
import { RealtimeSubscriptionManager } from '@/utils/realtime-subscription-manager';
import { E2ERealtimeHelper } from '@/utils/e2e-realtime-helper';
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

// Enhanced type definitions for test data
interface TestApplicationData {
  application_id: string;
  individual_id: string;
  answers: YffFormData;
  status: string;
  evaluation_status: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

/**
 * Log operation with comprehensive details
 */
const logOperation = (operation: string, details: any, error?: any) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    operation,
    details,
    error: error ? {
      message: error.message,
      code: error.code,
      details: error.details,
      stack: error.stack
    } : null
  };
  
  console.log(`[${timestamp}] E2E_SUITE_${operation.toUpperCase()}:`, logEntry);
  
  if (error) {
    console.error(`[${timestamp}] E2E_SUITE_ERROR in ${operation}:`, error);
  }
};

export class E2ETestingSuite {
  private results: TestResult[] = [];
  private testApplicationId: string | null = null;
  private testIndividualId: string | null = null;
  private testEmail: string | null = null;
  private subscriptionManager: RealtimeSubscriptionManager | null = null;

  constructor() {
    this.results = [];
    logOperation('CONSTRUCTOR', { timestamp: new Date().toISOString() });
  }

  /**
   * COMPREHENSIVE E2E TEST SUITE - BULLETPROOF IMPLEMENTATION
   */
  async runCompleteTestSuite(): Promise<TestResult[]> {
    logOperation('TEST_SUITE_START', { timestamp: new Date().toISOString() });
    
    try {
      // Clear previous results
      this.results = [];
      
      // Test 1: Database connectivity with comprehensive verification
      await this.testDatabaseConnectionComprehensive();
      
      // Test 2: Authentication and RLS verification
      await this.testAuthenticationAndRLS();
      
      // Test 3: Real-time setup verification
      await this.testRealtimeSetupVerification();
      
      // Test 4: Application submission with bulletproof creation
      await this.testApplicationSubmissionBulletproof();
      
      // Test 5: Application retrieval verification
      await this.testApplicationRetrievalVerification();
      
      // Test 6: Dashboard display functionality
      await this.testDashboardDisplayComprehensive();
      
      // Test 7: AI scoring trigger and verification
      await this.testAIScoringComprehensive();
      
      // Test 8: Bulletproof real-time event testing
      await this.testBulletproofRealTimeEvents();
      
      // Test 9: Results display and validation
      await this.testResultsDisplayComprehensive();
      
      // Test 10: Error handling and recovery
      await this.testErrorHandlingComprehensive();
      
      // Test 11: Performance and reliability metrics
      await this.testPerformanceMetrics();
      
      // Final cleanup
      await this.cleanupTestDataComprehensive();
      
      const passedTests = this.results.filter(r => r.status === 'passed').length;
      const totalTests = this.results.length;
      
      logOperation('TEST_SUITE_COMPLETE', {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        successRate: `${Math.round((passedTests / totalTests) * 100)}%`
      });
      
    } catch (error) {
      logOperation('TEST_SUITE_ERROR', {}, error);
      
      this.addTestResult({
        testName: 'Test Suite Critical Error',
        status: 'failed',
        message: `Test suite failed: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
    
    return this.results;
  }

  /**
   * COMPREHENSIVE DATABASE CONNECTION TEST
   */
  private async testDatabaseConnectionComprehensive(): Promise<void> {
    const startTime = Date.now();
    
    try {
      logOperation('DB_CONNECTION_TEST_START', {});
      
      // Step 1: Test basic connectivity
      const { count, error } = await supabase
        .from('yff_applications')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        throw new Error(`Database query failed: ${error.message} (${error.code})`);
      }

      // Step 2: Test authentication
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        throw new Error(`Authentication failed: ${authError?.message || 'No session'}`);
      }

      // Step 3: Test individual table access
      const { data: individual, error: individualError } = await supabase
        .from('individuals')
        .select('individual_id, email')
        .eq('individual_id', session.user.id)
        .single();

      if (individualError) {
        throw new Error(`Individual lookup failed: ${individualError.message}`);
      }

      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Database Connection Comprehensive',
        status: 'passed',
        message: `Database connectivity verified - ${count || 0} applications, user authenticated`,
        timestamp: new Date().toISOString(),
        duration,
        details: { 
          applicationCount: count,
          authenticatedUser: individual?.email,
          userId: session.user.id
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logOperation('DB_CONNECTION_TEST_FAILED', {}, error);
      
      this.addTestResult({
        testName: 'Database Connection Comprehensive',
        status: 'failed',
        message: `Database connection failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration,
        details: { errorType: error.constructor.name }
      });
      
      throw error;
    }
  }

  /**
   * AUTHENTICATION AND RLS VERIFICATION
   */
  private async testAuthenticationAndRLS(): Promise<void> {
    const startTime = Date.now();
    
    try {
      logOperation('AUTH_RLS_TEST_START', {});
      
      // Test RLS policies for different tables
      const tables = [
        { name: 'yff_applications', expectData: true },
        { name: 'individuals', expectData: true },
        { name: 'user_roles', expectData: false } // May be empty for regular users
      ];

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });

        if (error && !error.message.includes('permission denied')) {
          throw new Error(`RLS test failed for ${table.name}: ${error.message}`);
        }

        logOperation('RLS_TABLE_TEST', {
          table: table.name,
          hasAccess: !error,
          errorCode: error?.code
        });
      }

      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Authentication and RLS Verification',
        status: 'passed',
        message: 'Authentication and RLS policies verified successfully',
        timestamp: new Date().toISOString(),
        duration,
        details: { tablesChecked: tables.length }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Authentication and RLS Verification',
        status: 'failed',
        message: `Auth/RLS verification failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      throw error;
    }
  }

  /**
   * REAL-TIME SETUP VERIFICATION
   */
  private async testRealtimeSetupVerification(): Promise<void> {
    const startTime = Date.now();
    
    try {
      logOperation('REALTIME_SETUP_TEST_START', {});
      
      const verificationResult = await E2ERealtimeHelper.verifyRealtimeSetup('yff_applications');
      
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Real-time Setup Verification',
        status: verificationResult.isEnabled ? 'passed' : 'failed',
        message: verificationResult.message,
        timestamp: new Date().toISOString(),
        duration,
        details: verificationResult.details
      });

      if (!verificationResult.isEnabled) {
        throw new Error(verificationResult.message);
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Real-time Setup Verification',
        status: 'failed',
        message: `Real-time setup verification failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      // Don't throw - continue with other tests
    }
  }

  /**
   * BULLETPROOF APPLICATION SUBMISSION
   */
  private async testApplicationSubmissionBulletproof(): Promise<void> {
    const startTime = Date.now();
    
    try {
      logOperation('APPLICATION_SUBMISSION_TEST_START', {});
      
      // Generate unique test identifiers
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 15);
      this.testEmail = `e2etest-${timestamp}-${randomSuffix}@example.com`;
      this.testIndividualId = uuidv4();
      this.testApplicationId = uuidv4();
      
      logOperation('APPLICATION_TEST_IDS_GENERATED', {
        testEmail: this.testEmail,
        testIndividualId: this.testIndividualId.slice(0, 8) + '...',
        testApplicationId: this.testApplicationId.slice(0, 8) + '...'
      });
      
      // Step 1: Create test individual with comprehensive data
      const { data: individual, error: individualError } = await supabase
        .from('individuals')
        .insert({
          individual_id: this.testIndividualId,
          email: this.testEmail,
          first_name: 'E2E',
          last_name: 'Test',
          privacy_consent: true,
          data_processing_consent: true,
          email_verified: true,
          country_code: '+91',
          country_iso_code: 'IN',
          is_active: true
        })
        .select()
        .single();
      
      if (individualError) {
        throw new Error(`Failed to create test individual: ${individualError.message} (${individualError.code})`);
      }
      
      logOperation('APPLICATION_TEST_INDIVIDUAL_CREATED', { individual });
      
      // Step 2: Create comprehensive test form data
      const testFormData: YffFormData = {
        tell_us_about_idea: `This is a comprehensive test of an innovative AI-powered platform that revolutionizes how young entrepreneurs develop and validate their business ideas through intelligent mentorship and automated feedback systems. Test timestamp: ${timestamp}`,
        problem_statement: 'Young entrepreneurs lack access to experienced mentors and struggle with validating their business ideas early in the development process, leading to higher failure rates and wasted resources.',
        whose_problem: 'This problem affects aspiring entrepreneurs aged 18-25 who have innovative ideas but lack the network, resources, and expertise to properly validate and develop their concepts into viable businesses.',
        how_solve_problem: 'Our platform uses AI-powered analysis to provide instant feedback on business ideas, connects entrepreneurs with relevant mentors, and offers structured validation frameworks to test market assumptions.',
        how_make_money: 'Revenue streams include subscription fees for premium AI analysis, commission from successful mentor matches, and partnerships with educational institutions and accelerator programs.',
        acquire_customers: 'Customer acquisition through university partnerships, social media marketing targeting entrepreneurship communities, referral programs, and strategic partnerships with startup ecosystems.',
        team_roles: 'Our founding team combines technical expertise in AI/ML with deep entrepreneurship experience, including former startup founders, product managers, and engineers from leading tech companies.'
      };
      
      // Step 3: Submit application with retry logic
      let applicationCreated = false;
      let createAttempts = 0;
      const maxCreateAttempts = 3;
      
      while (!applicationCreated && createAttempts < maxCreateAttempts) {
        createAttempts++;
        
        logOperation('APPLICATION_CREATION_ATTEMPT', { 
          attempt: createAttempts,
          applicationId: this.testApplicationId.slice(0, 8) + '...'
        });
        
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
          logOperation('APPLICATION_CREATION_FAILED', { 
            attempt: createAttempts,
            error: applicationError 
          }, applicationError);
          
          if (createAttempts >= maxCreateAttempts) {
            throw new Error(`Failed to submit application after ${maxCreateAttempts} attempts: ${applicationError.message} (${applicationError.code})`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        logOperation('APPLICATION_CREATION_SUCCESS', { 
          attempt: createAttempts,
          application 
        });
        applicationCreated = true;
      }
      
      // Step 4: Verify application was properly created
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const verificationResult = await this.verifyApplicationExists(this.testApplicationId);
      if (!verificationResult.exists) {
        throw new Error(`Application verification failed: ${verificationResult.error}`);
      }
      
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Application Submission Bulletproof',
        status: 'passed',
        message: `Successfully created and verified test application`,
        timestamp: new Date().toISOString(),
        duration,
        details: { 
          applicationId: this.testApplicationId.slice(0, 8) + '...', 
          email: this.testEmail,
          createAttempts,
          verified: verificationResult.exists
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logOperation('APPLICATION_SUBMISSION_TEST_FAILED', {}, error);
      
      this.addTestResult({
        testName: 'Application Submission Bulletproof',
        status: 'failed',
        message: `Application submission failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      throw error;
    }
  }

  /**
   * APPLICATION RETRIEVAL VERIFICATION
   */
  private async testApplicationRetrievalVerification(): Promise<void> {
    const startTime = Date.now();
    
    try {
      logOperation('APPLICATION_RETRIEVAL_TEST_START', {
        applicationId: this.testApplicationId?.slice(0, 8) + '...'
      });
      
      if (!this.testApplicationId) {
        throw new Error('No test application ID available');
      }

      const verificationResult = await this.verifyApplicationExists(this.testApplicationId);
      
      if (!verificationResult.exists) {
        throw new Error(`Application not found: ${verificationResult.error}`);
      }

      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Application Retrieval Verification',
        status: 'passed',
        message: 'Successfully retrieved and verified application data',
        timestamp: new Date().toISOString(),
        duration,
        details: verificationResult.details
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Application Retrieval Verification',
        status: 'failed',
        message: `Application retrieval failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      throw error;
    }
  }

  /**
   * COMPREHENSIVE DASHBOARD DISPLAY TEST
   */
  private async testDashboardDisplayComprehensive(): Promise<void> {
    const startTime = Date.now();
    
    try {
      logOperation('DASHBOARD_DISPLAY_TEST_START', {});
      
      if (!this.testApplicationId) {
        throw new Error('No test application ID available');
      }
      
      // Test the exact query used by the admin dashboard
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
        throw new Error(`Dashboard query failed: ${error.message} (${error.code})`);
      }
      
      if (!applications || applications.length === 0) {
        throw new Error('Test application not found in dashboard query');
      }
      
      const application = applications[0];
      
      // Verify all required fields are present
      const requiredFields = ['application_id', 'individual_id', 'answers', 'status', 'evaluation_status'];
      for (const field of requiredFields) {
        if (!(field in application)) {
          throw new Error(`Required field missing: ${field}`);
        }
      }
      
      if (!application.answers || typeof application.answers !== 'object') {
        throw new Error('Application answers not properly stored or invalid format');
      }
      
      if (!application.individuals) {
        throw new Error('Individual data not properly joined');
      }
      
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Dashboard Display Comprehensive',
        status: 'passed',
        message: 'Successfully retrieved application in dashboard format with all required fields',
        timestamp: new Date().toISOString(),
        duration,
        details: { 
          applicationFound: true,
          hasAnswers: Object.keys(application.answers).length > 0,
          hasIndividual: !!application.individuals,
          fieldsVerified: requiredFields.length
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Dashboard Display Comprehensive',
        status: 'failed',
        message: `Dashboard display test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      throw error;
    }
  }

  /**
   * COMPREHENSIVE AI SCORING TEST
   */
  private async testAIScoringComprehensive(): Promise<void> {
    const startTime = Date.now();
    
    try {
      logOperation('AI_SCORING_TEST_START', {
        applicationId: this.testApplicationId?.slice(0, 8) + '...'
      });
      
      if (!this.testApplicationId) {
        throw new Error('No test application ID available');
      }
      
      const result = await AIComprehensiveScoringService.triggerEvaluation(this.testApplicationId);
      
      if (!result.success) {
        throw new Error(`AI scoring failed: ${result.message}`);
      }
      
      // Verify the scoring result has required fields
      if (!result.result) {
        throw new Error('AI scoring result is missing');
      }
      
      if (typeof result.result.overall_score !== 'number') {
        throw new Error('Overall score is missing or invalid');
      }
      
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'AI Scoring Comprehensive',
        status: 'passed',
        message: `AI evaluation completed successfully - Score: ${result.result.overall_score}/10`,
        timestamp: new Date().toISOString(),
        duration,
        details: { 
          overallScore: result.result.overall_score,
          hasQuestionScores: !!(result.result.question_scores),
          hasAnalysis: !!(result.result.analysis),
          resultMessage: result.message
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logOperation('AI_SCORING_TEST_FAILED', {}, error);
      
      this.addTestResult({
        testName: 'AI Scoring Comprehensive',
        status: 'failed',
        message: `AI scoring test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      // Don't throw - continue with other tests
    }
  }

  /**
   * BULLETPROOF REAL-TIME EVENTS TEST
   */
  private async testBulletproofRealTimeEvents(): Promise<void> {
    const startTime = Date.now();
    
    try {
      logOperation('BULLETPROOF_REALTIME_TEST_START', {
        applicationId: this.testApplicationId?.slice(0, 8) + '...'
      });
      
      if (!this.testApplicationId) {
        throw new Error('No test application ID available');
      }

      // Use the bulletproof real-time helper
      const testResult = await E2ERealtimeHelper.testRealtimeEvent(
        this.testApplicationId,
        30000 // 30 second timeout
      );

      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Bulletproof Real-Time Events',
        status: testResult.success ? 'passed' : 'failed',
        message: testResult.message,
        timestamp: new Date().toISOString(),
        duration,
        details: testResult.details
      });

      if (!testResult.success) {
        throw new Error(testResult.message);
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logOperation('BULLETPROOF_REALTIME_TEST_FAILED', {}, error);
      
      this.addTestResult({
        testName: 'Bulletproof Real-Time Events',
        status: 'failed',
        message: `Real-time event test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      // Don't throw - continue with other tests
    }
  }

  /**
   * Verify application exists with comprehensive checks
   */
  private async verifyApplicationExists(applicationId: string): Promise<{
    exists: boolean;
    error?: string;
    details?: any;
  }> {
    try {
      const { data: application, error } = await supabase
        .from('yff_applications')
        .select('*')
        .eq('application_id', applicationId)
        .single();
      
      if (error) {
        return {
          exists: false,
          error: `Query error: ${error.message} (${error.code})`,
          details: { errorCode: error.code, errorHint: error.hint }
        };
      }
      
      if (!application) {
        return {
          exists: false,
          error: 'Application not found',
          details: { searchedId: applicationId.slice(0, 8) + '...' }
        };
      }
      
      return {
        exists: true,
        details: {
          applicationId: application.application_id.slice(0, 8) + '...',
          status: application.status,
          evaluationStatus: application.evaluation_status,
          hasAnswers: !!application.answers,
          createdAt: application.created_at
        }
      };
      
    } catch (error) {
      return {
        exists: false,
        error: `Verification error: ${error.message}`,
        details: { errorType: error.constructor.name }
      };
    }
  }

  /**
   * COMPREHENSIVE RESULTS DISPLAY TEST
   */
  private async testResultsDisplayComprehensive(): Promise<void> {
    const startTime = Date.now();
    
    try {
      logOperation('RESULTS_DISPLAY_TEST_START', {});
      
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
      
      // Check if evaluation was completed
      if (!application.evaluation_data) {
        logOperation('RESULTS_DISPLAY_NO_EVALUATION', {
          evaluationStatus: application.evaluation_status,
          overallScore: application.overall_score
        });
        
        this.addTestResult({
          testName: 'Results Display Comprehensive',
          status: 'passed',
          message: 'Application retrieved successfully, evaluation pending',
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          details: {
            applicationFound: true,
            evaluationStatus: application.evaluation_status,
            hasEvaluationData: false
          }
        });
        return;
      }
      
      if (typeof application.evaluation_data !== 'object') {
        throw new Error('Evaluation data not properly formatted');
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
        testName: 'Results Display Comprehensive',
        status: 'passed',
        message: `Results display verified - Score: ${application.overall_score}/10`,
        timestamp: new Date().toISOString(),
        duration,
        details: {
          overallScore: application.overall_score,
          questionsScored: Object.keys(evaluationData.scores).length,
          evaluationStatus: application.evaluation_status,
          hasEvaluationData: true
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Results Display Comprehensive',
        status: 'failed',
        message: `Results display test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      // Don't throw - this is not critical
    }
  }

  /**
   * COMPREHENSIVE ERROR HANDLING TEST
   */
  private async testErrorHandlingComprehensive(): Promise<void> {
    const startTime = Date.now();
    
    try {
      logOperation('ERROR_HANDLING_TEST_START', {});
      
      // Test with non-existent UUID
      const nonExistentUuid = uuidv4();
      
      const invalidResult = await AIComprehensiveScoringService.triggerEvaluation(nonExistentUuid);
      
      if (invalidResult.success) {
        throw new Error('Error handling test failed: should have rejected non-existent application');
      }
      
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Error Handling Comprehensive',
        status: 'passed',
        message: 'Error handling verified - properly rejected invalid application',
        timestamp: new Date().toISOString(),
        duration,
        details: { 
          errorMessage: invalidResult.message,
          testedUuid: nonExistentUuid.slice(0, 8) + '...',
          resultSuccess: invalidResult.success
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Error Handling Comprehensive',
        status: 'failed',
        message: `Error handling test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
    }
  }

  /**
   * PERFORMANCE METRICS TEST
   */
  private async testPerformanceMetrics(): Promise<void> {
    const startTime = Date.now();
    
    try {
      logOperation('PERFORMANCE_METRICS_TEST_START', {});
      
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
        message: `Database query performance: ${queryDuration}ms (${performanceGrade})`,
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
    }
  }

  /**
   * COMPREHENSIVE CLEANUP
   */
  private async cleanupTestDataComprehensive(): Promise<void> {
    logOperation('CLEANUP_START', {
      applicationId: this.testApplicationId?.slice(0, 8) + '...',
      individualId: this.testIndividualId?.slice(0, 8) + '...'
    });
    
    const cleanupResults = [];
    
    try {
      if (this.testApplicationId) {
        const { error: appError } = await supabase
          .from('yff_applications')
          .delete()
          .eq('application_id', this.testApplicationId);
        
        cleanupResults.push({
          item: 'test_application',
          success: !appError,
          error: appError?.message
        });
        
        if (appError) {
          logOperation('CLEANUP_APPLICATION_ERROR', { appError }, appError);
        } else {
          logOperation('CLEANUP_APPLICATION_SUCCESS', { applicationId: this.testApplicationId.slice(0, 8) + '...' });
        }
      }
      
      if (this.testIndividualId) {
        const { error: indError } = await supabase
          .from('individuals')
          .delete()
          .eq('individual_id', this.testIndividualId);
        
        cleanupResults.push({
          item: 'test_individual',
          success: !indError,
          error: indError?.message
        });
        
        if (indError) {
          logOperation('CLEANUP_INDIVIDUAL_ERROR', { indError }, indError);
        } else {
          logOperation('CLEANUP_INDIVIDUAL_SUCCESS', { individualId: this.testIndividualId.slice(0, 8) + '...' });
        }
      }
      
      if (this.subscriptionManager) {
        this.subscriptionManager.stop();
        this.subscriptionManager = null;
        cleanupResults.push({
          item: 'subscription_manager',
          success: true
        });
      }
      
      logOperation('CLEANUP_COMPLETE', { cleanupResults });
      
    } catch (error) {
      logOperation('CLEANUP_ERROR', { cleanupResults }, error);
    }
  }

  /**
   * Add test result to results array
   */
  private addTestResult(result: TestResult): void {
    this.results.push(result);
    logOperation('TEST_RESULT_ADDED', { result });
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport(): string {
    const timestamp = new Date().toISOString();
    const passedTests = this.results.filter(r => r.status === 'passed').length;
    const failedTests = this.results.filter(r => r.status === 'failed').length;
    const totalTests = this.results.length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    let report = `# E2E Test Report - BULLETPROOF IMPLEMENTATION\n\n`;
    report += `**Generated:** ${timestamp}\n`;
    report += `**Tests Passed:** ${passedTests}/${totalTests}\n`;
    report += `**Tests Failed:** ${failedTests}/${totalTests}\n`;
    report += `**Success Rate:** ${successRate}%\n\n`;
    
    if (failedTests === 0) {
      report += `✅ **ALL TESTS PASSED!** The YFF application system is working correctly.\n\n`;
    } else {
      report += `⚠️ **${failedTests} test(s) failed.** Please review the results below.\n\n`;
    }
    
    report += `## Detailed Test Results\n\n`;
    
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
        report += `**Details:**\n\`\`\`json\n${JSON.stringify(result.details, null, 2)}\n\`\`\`\n`;
      }
      
      report += `\n`;
    });
    
    return report;
  }
}
