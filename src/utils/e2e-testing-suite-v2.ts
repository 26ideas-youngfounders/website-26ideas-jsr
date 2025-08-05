/**
 * @fileoverview Enhanced E2E Testing Suite v2
 * 
 * Comprehensive end-to-end testing for YFF application system
 * with AI evaluation testing capabilities.
 */

import { supabase } from '@/integrations/supabase/client';
import { AIComprehensiveScoringService } from '@/services/ai-comprehensive-scoring-service';

interface TestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'warning' | 'pending';
  duration?: number;
  details?: string;
  error?: string;
  timestamp?: Date;
}

/**
 * Utility function to simulate delay
 */
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Test database connection
 */
const testDatabaseConnection = async (): Promise<TestResult> => {
  try {
    const { data, error } = await supabase.from('yff_applications').select('*').limit(1);
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    return {
      id: 'database-connection',
      name: 'Database Connection',
      status: 'passed',
      details: 'Successfully connected to the database'
    };
  } catch (error) {
    return {
      id: 'database-connection',
      name: 'Database Connection',
      status: 'failed',
      error: error.message
    };
  }
};

/**
 * Test AI evaluation system
 */
const testAIEvaluationSystem = async (): Promise<TestResult> => {
  try {
    // Get a sample application for testing
    const { data: applications, error } = await supabase
      .from('yff_applications')
      .select('application_id, answers')
      .eq('evaluation_status', 'pending')
      .limit(1);
    
    if (error || !applications || applications.length === 0) {
      return {
        id: 'ai-evaluation-system',
        name: 'AI Evaluation System',
        status: 'failed',
        error: 'No pending applications found for testing'
      };
    }
    
    const testApplication = applications[0];
    
    // Test the evaluation
    const result = await AIComprehensiveScoringService.evaluateApplication(testApplication.application_id);
    
    if (!result || typeof result.overall_score !== 'number') {
      throw new Error('Invalid evaluation result structure');
    }
    
    return {
      id: 'ai-evaluation-system',
      name: 'AI Evaluation System',
      status: 'passed',
      details: `Evaluation completed with score: ${result.overall_score}`
    };
    
  } catch (error) {
    return {
      id: 'ai-evaluation-system',
      name: 'AI Evaluation System',
      status: 'failed',
      error: error.message
    };
  }
};

/**
 * Test user authentication
 */
const testUserAuthentication = async (): Promise<TestResult> => {
  try {
    const { data: user, error } = await supabase.auth.getUser();
    if (error) {
      throw new Error(`User authentication failed: ${error.message}`);
    }
    if (!user) {
      return {
        id: 'user-authentication',
        name: 'User Authentication',
        status: 'warning',
        details: 'No user is currently authenticated'
      };
    }
    return {
      id: 'user-authentication',
      name: 'User Authentication',
      status: 'passed',
      details: `User authenticated: ${user.user.email}`
    };
  } catch (error) {
    return {
      id: 'user-authentication',
      name: 'User Authentication',
      status: 'failed',
      error: error.message
    };
  }
};

/**
 * Test application submission
 */
const testApplicationSubmission = async (): Promise<TestResult> => {
  try {
    // Create a test application
    const { data, error } = await supabase
      .from('yff_applications')
      .insert({
        individual_id: 'test-individual',
        answers: { test: 'Test submission' },
        status: 'submitted',
        evaluation_status: 'pending',
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('application_id')
      .single();
    
    if (error) {
      throw new Error(`Application submission failed: ${error.message}`);
    }
    
    if (!data?.application_id) {
      throw new Error('No application ID returned from database');
    }
    
    // Clean up the test application
    await supabase
      .from('yff_applications')
      .delete()
      .eq('application_id', data.application_id);
    
    return {
      id: 'application-submission',
      name: 'Application Submission',
      status: 'passed',
      details: `Application submitted successfully: ${data.application_id}`
    };
    
  } catch (error) {
    return {
      id: 'application-submission',
      name: 'Application Submission',
      status: 'failed',
      error: error.message
    };
  }
};

/**
 * Main testing function
 */
export const runTests = async (): Promise<TestResult[]> => {
  const testResults: TestResult[] = [];
  
  // Run tests sequentially with delay
  const dbConnectionResult = await testDatabaseConnection();
  testResults.push({ ...dbConnectionResult, id: 'database-connection' });
  await delay(500);
  
  const userAuthResult = await testUserAuthentication();
  testResults.push({ ...userAuthResult, id: 'user-authentication' });
  await delay(500);
  
  const appSubmissionResult = await testApplicationSubmission();
  testResults.push({ ...appSubmissionResult, id: 'application-submission' });
  await delay(500);
  
  const aiEvaluationResult = await testAIEvaluationSystem();
  testResults.push({ ...aiEvaluationResult, id: 'ai-evaluation-system' });
  
  return testResults;
};
