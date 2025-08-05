
/**
 * @fileoverview Comprehensive E2E Real-time Testing Helper
 * 
 * Advanced utilities for testing real-time subscriptions with proper
 * authentication, database access validation, and comprehensive error handling.
 * 
 * @version 3.0.0
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';
import { RealTimeConnectionManagerV2 } from './realtime-connection-manager-v2';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Type-safe table names for Supabase
type ValidTableName = 'country_codes' | 'individuals' | 'mentor_applications' | 'typeform_submissions' | 'user_roles' | 'yff_applications' | 'yff_evaluations' | 'yff_team_registration_autosave' | 'yff_team_registrations';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  duration?: number;
}

interface DatabaseTestResult extends TestResult {
  canRead: boolean;
  canWrite: boolean;
  rlsEnabled: boolean;
  recordCount: number;
}

export class E2ERealtimeHelperV2 {
  private connectionManager: RealTimeConnectionManagerV2;
  private testApplicationId: string | null = null;
  private testIndividualId: string | null = null;

  constructor() {
    this.connectionManager = new RealTimeConnectionManagerV2({
      maxRetries: 3,
      connectionTimeout: 20000,
    });
  }

  /**
   * Comprehensive database connectivity and permissions test
   */
  static async testDatabaseAccess(tableName: ValidTableName): Promise<DatabaseTestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Testing database access for table: ${tableName}`);
      
      // Test authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error(`Authentication required: ${authError?.message || 'No user found'}`);
      }

      console.log(`✅ User authenticated: ${user.id}`);

      let canRead = false;
      let canWrite = false;
      let recordCount = 0;

      // Test READ permissions
      try {
        const { data, error: readError, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (readError) {
          console.error(`❌ Read error for ${tableName}:`, readError);
        } else {
          canRead = true;
          recordCount = count || 0;
          console.log(`✅ Read access confirmed for ${tableName}, found ${recordCount} records`);
        }
      } catch (error) {
        console.error(`❌ Read test failed for ${tableName}:`, error);
      }

      // Test WRITE permissions (only for specific tables)
      if (tableName === 'yff_applications') {
        try {
          // Try to create a test application
          const testData = {
            individual_id: user.id,
            answers: {
              test_field: `database_test_${Date.now()}`,
              tell_us_about_idea: 'Test database connectivity',
              problem_statement: 'Testing database access',
              whose_problem: 'Test users',
              how_solve_problem: 'Through testing',
              how_make_money: 'Test revenue model',
              acquire_customers: 'Test acquisition strategy',
              team_roles: 'Test team description'
            },
            status: 'test',
            evaluation_status: 'pending'
          };

          const { error: writeError } = await supabase
            .from(tableName)
            .insert(testData)
            .select();

          if (writeError) {
            console.error(`❌ Write error for ${tableName}:`, writeError);
          } else {
            canWrite = true;
            console.log(`✅ Write access confirmed for ${tableName}`);
          }
        } catch (error) {
          console.error(`❌ Write test failed for ${tableName}:`, error);
        }
      }

      const duration = Date.now() - startTime;

      return {
        success: canRead,
        message: `Database access test completed for ${tableName}`,
        canRead,
        canWrite,
        rlsEnabled: true, // Assume RLS is enabled based on schema
        recordCount,
        duration,
        details: {
          tableName,
          userId: user.id,
          canRead,
          canWrite,
          recordCount
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        message: `Database access test failed: ${error.message}`,
        canRead: false,
        canWrite: false,
        rlsEnabled: false,
        recordCount: 0,
        duration,
        details: {
          error: error.message,
          tableName
        }
      };
    }
  }

  /**
   * Create a test application with proper authentication and validation
   */
  async createTestApplication(): Promise<{ success: boolean; applicationId?: string; error?: string }> {
    try {
      console.log('🔄 Creating test application...');

      // Ensure user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error(`Authentication required: ${authError?.message || 'No user found'}`);
      }

      this.testIndividualId = user.id;
      this.testApplicationId = uuidv4();

      const testFormData = {
        tell_us_about_idea: 'This is a comprehensive E2E test of an innovative AI-powered platform that revolutionizes how young entrepreneurs develop and validate their business ideas through intelligent mentorship and automated feedback systems.',
        problem_statement: 'Young entrepreneurs lack access to experienced mentors and struggle with validating their business ideas early in the development process, leading to higher failure rates and wasted resources.',
        whose_problem: 'This problem affects aspiring entrepreneurs aged 18-25 who have innovative ideas but lack the network, resources, and expertise to properly validate and develop their concepts into viable businesses.',
        how_solve_problem: 'Our platform uses AI-powered analysis to provide instant feedback on business ideas, connects entrepreneurs with relevant mentors, and offers structured validation frameworks to test market assumptions.',
        how_make_money: 'Revenue streams include subscription fees for premium AI analysis, commission from successful mentor matches, and partnerships with educational institutions and accelerator programs.',
        acquire_customers: 'Customer acquisition through university partnerships, social media marketing targeting entrepreneurship communities, referral programs, and strategic partnerships with startup ecosystems.',
        team_roles: 'Our founding team combines technical expertise in AI/ML with deep entrepreneurship experience, including former startup founders, product managers, and engineers from leading tech companies.'
      };

      // Insert test application
      const { data, error } = await supabase
        .from('yff_applications')
        .insert({
          application_id: this.testApplicationId,
          individual_id: this.testIndividualId,
          answers: testFormData,
          status: 'e2e_test',
          evaluation_status: 'pending',
          application_round: 'e2e_test'
        })
        .select('application_id')
        .single();

      if (error) {
        throw new Error(`Application creation failed: ${error.message}`);
      }

      if (!data?.application_id) {
        throw new Error('Application created but no ID returned');
      }

      // Verify application was created
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: verificationData, error: verificationError } = await supabase
        .from('yff_applications')
        .select('application_id, status, evaluation_status')
        .eq('application_id', this.testApplicationId)
        .single();

      if (verificationError || !verificationData) {
        throw new Error('Application creation could not be verified');
      }

      console.log(`✅ Test application created successfully: ${this.testApplicationId}`);
      
      return { 
        success: true, 
        applicationId: this.testApplicationId 
      };

    } catch (error) {
      console.error('❌ Test application creation failed:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Test real-time events with comprehensive validation
   */
  async testRealtimeEvents(applicationId: string, timeoutMs: number = 30000): Promise<TestResult> {
    const startTime = Date.now();
    let eventReceived = false;
    let totalEvents = 0;
    let eventDetails: any = null;
    let channel: RealtimeChannel | null = null;

    try {
      console.log(`🧪 Testing real-time events for application: ${applicationId.slice(0, 8)}...`);

      // Step 1: Establish connection
      const connected = await this.connectionManager.connect();
      if (!connected) {
        throw new Error('Failed to establish real-time connection');
      }

      channel = this.connectionManager.getChannel();
      if (!channel) {
        throw new Error('No active channel available');
      }

      console.log('✅ Real-time connection established');

      // Step 2: Set up event listener with proper typing
      const eventPromise = new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          console.log(`⏰ Event timeout reached. Total events: ${totalEvents}, Target received: ${eventReceived}`);
          resolve(eventReceived);
        }, timeoutMs);

        // Listen for postgres changes
        channel!.on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'yff_applications'
        }, (payload: any) => {
          totalEvents++;
          
          console.log(`📨 Real-time event ${totalEvents} received:`, {
            eventType: payload.eventType,
            table: payload.table,
            newData: payload.new ? { id: payload.new.application_id?.slice(0, 8) + '...' } : null,
            oldData: payload.old ? { id: payload.old.application_id?.slice(0, 8) + '...' } : null,
            timestamp: new Date().toISOString()
          });

          const receivedAppId = payload.new?.application_id || payload.old?.application_id;
          if (receivedAppId === applicationId) {
            eventReceived = true;
            eventDetails = {
              eventType: payload.eventType,
              table: payload.table,
              applicationId: receivedAppId.slice(0, 8) + '...',
              timestamp: new Date().toISOString()
            };
            console.log(`✅ Target event received for application: ${applicationId.slice(0, 8)}...`);
            clearTimeout(timeout);
            resolve(true);
          }
        });
      });

      // Step 3: Wait for subscription to be ready
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 4: Trigger database changes
      console.log(`🔄 Triggering database updates for application: ${applicationId.slice(0, 8)}...`);

      for (let i = 1; i <= 3; i++) {
        const updateTimestamp = new Date().toISOString();
        const newStatus = `e2e_test_realtime_${i}_${Date.now()}`;

        console.log(`🔄 Update ${i}/3: Setting status to "${newStatus}"`);

        const { error: updateError } = await supabase
          .from('yff_applications')
          .update({
            evaluation_status: newStatus,
            updated_at: updateTimestamp,
            status: `test_status_${i}`
          })
          .eq('application_id', applicationId)
          .select();

        if (updateError) {
          console.warn(`⚠️ Update ${i} failed:`, updateError);
        } else {
          console.log(`✅ Update ${i} completed successfully`);
        }

        // Check if we received the event
        if (eventReceived) {
          console.log(`🎯 Event received after update ${i}, stopping further updates`);
          break;
        }

        // Wait between updates
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Step 5: Wait for events
      const success = await eventPromise;
      const duration = Date.now() - startTime;

      return {
        success,
        message: success 
          ? `Real-time event test successful. Received ${totalEvents} events, target event: ${eventReceived}`
          : `Real-time event test failed. Received ${totalEvents} events, no target event received`,
        duration,
        details: {
          eventReceived,
          totalEvents,
          eventDetails,
          applicationId: applicationId.slice(0, 8) + '...'
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ Real-time event test failed:', error);

      return {
        success: false,
        message: `Real-time event test failed: ${error.message}`,
        duration,
        details: {
          eventReceived: false,
          totalEvents,
          error: error.message,
          applicationId: applicationId?.slice(0, 8) + '...'
        }
      };
    } finally {
      // Cleanup
      if (this.connectionManager) {
        this.connectionManager.disconnect();
      }
    }
  }

  /**
   * Run complete real-time validation suite
   */
  async runCompleteValidation(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    try {
      // Test 1: Database access validation
      const dbTest = await E2ERealtimeHelperV2.testDatabaseAccess('yff_applications');
      results.push(dbTest);

      if (!dbTest.success) {
        throw new Error('Database access test failed - cannot proceed with real-time tests');
      }

      // Test 2: Test application creation
      const appResult = await this.createTestApplication();
      results.push({
        success: appResult.success,
        message: appResult.success ? 'Test application created successfully' : `Test application creation failed: ${appResult.error}`,
        details: appResult
      });

      if (!appResult.success) {
        throw new Error('Test application creation failed - cannot test real-time events');
      }

      // Test 3: Real-time event testing
      const realtimeResult = await this.testRealtimeEvents(appResult.applicationId!, 25000);
      results.push(realtimeResult);

      return results;

    } catch (error) {
      results.push({
        success: false,
        message: `Complete validation failed: ${error.message}`,
        details: { error: error.message }
      });
      return results;
    } finally {
      // Cleanup test data
      await this.cleanupTestData();
    }
  }

  /**
   * Clean up test data
   */
  private async cleanupTestData(): Promise<void> {
    try {
      if (this.testApplicationId) {
        await supabase
          .from('yff_applications')
          .delete()
          .eq('application_id', this.testApplicationId);
        
        console.log(`🗑️ Cleaned up test application: ${this.testApplicationId}`);
      }
    } catch (error) {
      console.warn('⚠️ Error during test data cleanup:', error);
    }
  }
}
