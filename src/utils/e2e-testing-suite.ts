/**
 * @fileoverview E2E Testing Suite
 * 
 * Comprehensive end-to-end testing for YFF application system.
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
 * Utility function to measure the execution time of a test
 */
const measureExecutionTime = async (testFn: () => Promise<TestResult>): Promise<TestResult> => {
  const startTime = Date.now();
  const result = await testFn();
  const duration = Date.now() - startTime;
  return { ...result, duration, timestamp: new Date() };
};

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
      name: 'Database Connection',
      id: 'database-connection',
      status: 'passed',
      details: 'Successfully connected to the database'
    };
  } catch (error) {
    return {
      name: 'Database Connection',
      id: 'database-connection',
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
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
    if (!user) {
      return {
        name: 'User Authentication',
        id: 'user-authentication',
        status: 'warning',
        details: 'No user is currently authenticated'
      };
    }
    return {
      name: 'User Authentication',
      id: 'user-authentication',
      status: 'passed',
      details: `User authenticated: ${user.email}`
    };
  } catch (error) {
    return {
      name: 'User Authentication',
      id: 'user-authentication',
      status: 'failed',
      error: error.message
    };
  }
};

/**
 * Test AI evaluation trigger
 */
const testAIEvaluationTrigger = async (): Promise<TestResult> => {
  try {
    // Get a sample application
    const { data: applications, error } = await supabase
      .from('yff_applications')
      .select('application_id, answers')
      .limit(1);
    
    if (error || !applications || applications.length === 0) {
      throw new Error('No applications found for testing');
    }
    
    const testApplication = applications[0];
    
    // Test the evaluation
    const result = await AIComprehensiveScoringService.evaluateApplication(testApplication.application_id);
    
    if (!result || typeof result.overall_score !== 'number') {
      throw new Error('Invalid evaluation result');
    }
    
    return {
      name: 'AI Evaluation Trigger',
      id: 'ai-evaluation-trigger',
      status: 'passed',
      details: `Score: ${result.overall_score}`
    };
    
  } catch (error) {
    return {
      name: 'AI Evaluation Trigger',
      id: 'ai-evaluation-trigger',
      status: 'failed',
      error: error.message
    };
  }
};

/**
 * Test comprehensive AI scoring
 */
const testComprehensiveAIScoring = async (): Promise<TestResult> => {
  try {
    // Get a completed application
    const { data: applications, error } = await supabase
      .from('yff_applications')
      .select('application_id, evaluation_status, overall_score')
      .eq('evaluation_status', 'completed')
      .limit(1);
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!applications || applications.length === 0) {
      return {
        name: 'Comprehensive AI Scoring',
        id: 'comprehensive-ai-scoring',
        status: 'warning',
        details: 'No completed evaluations found to test'
      };
    }
    
    const testApplication = applications[0];
    
    // Validate the evaluation structure
    if (typeof testApplication.overall_score !== 'number') {
      throw new Error('Invalid overall score format');
    }
    
    return {
      name: 'Comprehensive AI Scoring',
      id: 'comprehensive-ai-scoring',
      status: 'passed',
      details: `Found evaluated application with score: ${testApplication.overall_score}`
    };
    
  } catch (error) {
    return {
      name: 'Comprehensive AI Scoring',
      id: 'comprehensive-ai-scoring',
      status: 'failed',
      error: error.message
    };
  }
};

/**
 * Main testing function
 */
export const runTests = async (): Promise<TestResult[]> => {
  const testFunctions = [
    testDatabaseConnection,
    testUserAuthentication,
    testAIEvaluationTrigger,
    testComprehensiveAIScoring
  ];

  const results: TestResult[] = [];

  for (const testFn of testFunctions) {
    const result = await measureExecutionTime(testFn);
    results.push({ id: result.name.toLowerCase().replace(/ /g, '-'), ...result });
  }

  return results;
};
