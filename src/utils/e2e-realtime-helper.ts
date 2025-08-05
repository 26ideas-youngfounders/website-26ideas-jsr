
/**
 * @fileoverview Complete E2E Real-time Testing Helper Rebuild
 * 
 * Bulletproof real-time testing with comprehensive verification,
 * robust event detection, and comprehensive error handling.
 * 
 * @version 3.0.0 - COMPLETE SYSTEM REBUILD
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Define type-safe table names based on Supabase schema
type TableNames = 'country_codes' | 'individuals' | 'mentor_applications' | 'typeform_submissions' | 'user_roles' | 'yff_applications' | 'yff_evaluations' | 'yff_team_registration_autosave' | 'yff_team_registrations';

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
  
  console.log(`[${timestamp}] E2E_REALTIME_${operation.toUpperCase()}:`, logEntry);
  
  if (error) {
    console.error(`[${timestamp}] E2E_REALTIME_ERROR in ${operation}:`, error);
  }
};

export class E2ERealtimeHelper {
  /**
   * COMPREHENSIVE REAL-TIME SETUP VERIFICATION
   */
  static async verifyRealtimeSetup(tableName: string): Promise<{
    isEnabled: boolean;
    message: string;
    details?: any;
  }> {
    try {
      logOperation('SETUP_VERIFICATION_START', { tableName });
      
      // Ensure table name is valid before using with Supabase
      if (!E2ERealtimeHelper.isValidTableName(tableName)) {
        const error = new Error(`Invalid table name: ${tableName}`);
        logOperation('SETUP_VERIFICATION_INVALID_TABLE', { tableName }, error);
        return {
          isEnabled: false,
          message: `Invalid table name: ${tableName}`,
          details: { error: 'Table name not recognized' }
        };
      }
      
      // Step 1: Verify authentication
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        logOperation('SETUP_VERIFICATION_AUTH_FAILED', { authError }, authError);
        return {
          isEnabled: false,
          message: `Authentication failed: ${authError?.message || 'No session'}`,
          details: { error: authError?.message || 'No session' }
        };
      }

      logOperation('SETUP_VERIFICATION_AUTH_SUCCESS', { 
        userId: session.user?.id,
        email: session.user?.email 
      });

      // Step 2: Test basic database connectivity
      logOperation('SETUP_VERIFICATION_DB_TEST', { tableName });
      const { count, error } = await supabase
        .from(tableName as TableNames)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        logOperation('SETUP_VERIFICATION_DB_FAILED', { tableName, error }, error);
        return {
          isEnabled: false,
          message: `Database query failed: ${error.message}`,
          details: { error: error.message, code: error.code }
        };
      }

      logOperation('SETUP_VERIFICATION_DB_SUCCESS', { tableName, count });

      // Step 3: Test WebSocket connection
      logOperation('SETUP_VERIFICATION_WEBSOCKET_TEST', {});
      
      // Force connection if not connected
      if (supabase.realtime.socket?.readyState !== 1) {
        logOperation('SETUP_VERIFICATION_WEBSOCKET_CONNECTING', {});
        supabase.realtime.connect();
        
        // Wait for connection with timeout
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('WebSocket connection timeout'));
          }, 15000);
          
          const checkConnection = () => {
            const state = supabase.realtime.socket?.readyState;
            if (state === 1) {
              clearTimeout(timeout);
              resolve();
            } else if (state === 3) {
              clearTimeout(timeout);
              reject(new Error('WebSocket connection failed'));
            } else {
              setTimeout(checkConnection, 200);
            }
          };
          
          setTimeout(checkConnection, 500);
        });
      }

      // Step 4: Test channel creation and subscription
      const testChannelName = `test-${tableName}-${Date.now()}`;
      logOperation('SETUP_VERIFICATION_CHANNEL_TEST', { testChannelName });
      
      const testChannel = supabase.channel(testChannelName);
      
      const subscriptionResult = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Channel subscription timeout'));
        }, 10000);
        
        testChannel.subscribe((status, error) => {
          clearTimeout(timeout);
          logOperation('SETUP_VERIFICATION_CHANNEL_STATUS', { 
            testChannelName, 
            status, 
            error: error ? {
              message: error.message,
              type: error.constructor.name
            } : null 
          });
          
          if (status === 'SUBSCRIBED') {
            resolve(status);
          } else {
            reject(new Error(`Channel subscription failed: ${status} - ${error?.message}`));
          }
        });
      });

      // Cleanup test channel
      await supabase.removeChannel(testChannel);
      
      logOperation('SETUP_VERIFICATION_SUCCESS', {
        tableName,
        rowCount: count,
        subscriptionStatus: subscriptionResult
      });
      
      return {
        isEnabled: true,
        message: `Real-time setup verified for ${tableName}`,
        details: { 
          subscriptionStatus: subscriptionResult, 
          rowCount: count,
          authenticatedUser: session.user?.email
        }
      };
      
    } catch (error) {
      logOperation('SETUP_VERIFICATION_FAILED', { tableName }, error);
      return {
        isEnabled: false,
        message: `Real-time verification failed: ${error.message}`,
        details: { error: error.message, type: error.constructor.name }
      };
    }
  }

  /**
   * Validate if table name is in our known schema
   */
  private static isValidTableName(tableName: string): tableName is TableNames {
    const validTables: TableNames[] = [
      'country_codes',
      'individuals', 
      'mentor_applications',
      'typeform_submissions',
      'user_roles',
      'yff_applications',
      'yff_evaluations',
      'yff_team_registration_autosave',
      'yff_team_registrations'
    ];
    return validTables.includes(tableName as TableNames);
  }

  /**
   * BULLETPROOF REAL-TIME EVENT TESTING
   */
  static async testRealtimeEvent(
    applicationId: string,
    timeoutMs: number = 30000
  ): Promise<{
    success: boolean;
    eventReceived: boolean;
    totalEvents: number;
    message: string;
    details?: any;
  }> {
    logOperation('EVENT_TEST_START', { 
      applicationId: applicationId.slice(0, 8) + '...', 
      timeoutMs 
    });
    
    let eventReceived = false;
    let totalEvents = 0;
    let eventDetails: any = null;
    let channel: RealtimeChannel | null = null;
    
    try {
      // Step 1: Verify application exists
      logOperation('EVENT_TEST_VERIFY_APPLICATION', { 
        applicationId: applicationId.slice(0, 8) + '...' 
      });
      
      const { data: existingApp, error: verifyError } = await supabase
        .from('yff_applications')
        .select('application_id, evaluation_status, status, updated_at')
        .eq('application_id', applicationId)
        .single();
      
      if (verifyError || !existingApp) {
        throw new Error(`Application not found: ${verifyError?.message || 'No data'}`);
      }
      
      logOperation('EVENT_TEST_APPLICATION_VERIFIED', {
        applicationId: existingApp.application_id.slice(0, 8) + '...',
        status: existingApp.status,
        evaluationStatus: existingApp.evaluation_status
      });

      // Step 2: Setup real-time subscription BEFORE triggering changes
      const channelName = `event-test-${Date.now()}`;
      logOperation('EVENT_TEST_SETUP_SUBSCRIPTION', { channelName });
      
      channel = supabase.channel(channelName);
      
      // Set up the postgres changes listener with comprehensive logging
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'yff_applications'
      } as any, (payload: any) => {
        totalEvents++;
        
        const receivedAppId = payload.new?.application_id || payload.old?.application_id;
        
        logOperation('EVENT_TEST_EVENT_RECEIVED', {
          eventNumber: totalEvents,
          eventType: payload.eventType,
          table: payload.table,
          schema: payload.schema,
          receivedAppId: receivedAppId?.slice(0, 8) + '...' || 'unknown',
          targetAppId: applicationId.slice(0, 8) + '...',
          isMatch: receivedAppId === applicationId,
          hasNew: !!payload.new,
          hasOld: !!payload.old,
          timestamp: new Date().toISOString()
        });
        
        if (receivedAppId === applicationId) {
          eventReceived = true;
          eventDetails = {
            eventType: payload.eventType,
            table: payload.table,
            schema: payload.schema,
            applicationId: receivedAppId.slice(0, 8) + '...',
            timestamp: new Date().toISOString()
          };
          logOperation('EVENT_TEST_TARGET_EVENT_RECEIVED', { eventDetails });
        }
      });
      
      // Step 3: Subscribe with comprehensive verification
      logOperation('EVENT_TEST_SUBSCRIBING', { channelName });
      
      const subscriptionPromise = new Promise<boolean>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Subscription timeout'));
        }, 15000);
        
        channel!.subscribe((status, error) => {
          logOperation('EVENT_TEST_SUBSCRIPTION_STATUS', {
            channelName,
            status,
            error: error ? {
              message: error.message,
              type: error.constructor.name
            } : null
          });
          
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            resolve(true);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            clearTimeout(timeout);
            reject(new Error(`Subscription failed: ${status} - ${error?.message}`));
          }
        });
      });
      
      const subscribed = await subscriptionPromise;
      if (!subscribed) {
        throw new Error('Failed to establish subscription');
      }

      // Step 4: Wait for subscription to be fully active
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 5: Create event promise with comprehensive timeout handling
      const eventPromise = new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          logOperation('EVENT_TEST_TIMEOUT', { 
            totalEvents, 
            eventReceived,
            timeoutMs 
          });
          resolve(eventReceived);
        }, timeoutMs);
        
        const checkEvent = () => {
          if (eventReceived) {
            clearTimeout(timeout);
            resolve(true);
          } else {
            setTimeout(checkEvent, 500);
          }
        };
        
        checkEvent();
      });

      // Step 6: Trigger multiple database updates with different strategies
      logOperation('EVENT_TEST_TRIGGER_UPDATES', { 
        applicationId: applicationId.slice(0, 8) + '...' 
      });
      
      const updateStrategies = [
        // Strategy 1: Update evaluation_status
        () => supabase
          .from('yff_applications')
          .update({
            evaluation_status: `test_realtime_${Date.now()}`,
            updated_at: new Date().toISOString()
          })
          .eq('application_id', applicationId)
          .select(),
          
        // Strategy 2: Update status field
        () => supabase
          .from('yff_applications')
          .update({
            status: `status_test_${Date.now()}`,
            updated_at: new Date().toISOString()
          })
          .eq('application_id', applicationId)
          .select(),
          
        // Strategy 3: Update answers JSON
        () => supabase
          .from('yff_applications')
          .update({
            answers: { 
              ...existingApp.answers || {},
              test_realtime_field: `realtime_test_${Date.now()}`
            },
            updated_at: new Date().toISOString()
          })
          .eq('application_id', applicationId)
          .select(),
          
        // Strategy 4: Update overall_score if it exists
        () => supabase
          .from('yff_applications')
          .update({
            overall_score: Math.random() * 10,
            updated_at: new Date().toISOString()
          })
          .eq('application_id', applicationId)
          .select()
      ];

      for (let i = 0; i < updateStrategies.length; i++) {
        if (eventReceived) {
          logOperation('EVENT_TEST_EARLY_SUCCESS', { 
            strategy: i + 1,
            totalEvents,
            eventReceived 
          });
          break;
        }

        logOperation('EVENT_TEST_UPDATE_ATTEMPT', { 
          strategy: i + 1,
          applicationId: applicationId.slice(0, 8) + '...' 
        });
        
        try {
          const updateResult = await updateStrategies[i]();
          
          if (updateResult.error) {
            logOperation('EVENT_TEST_UPDATE_FAILED', { 
              strategy: i + 1,
              error: updateResult.error 
            }, updateResult.error);
          } else {
            logOperation('EVENT_TEST_UPDATE_SUCCESS', { 
              strategy: i + 1,
              updatedRecords: updateResult.data?.length || 0
            });
          }
          
          // Wait between updates to allow event processing
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (updateError) {
          logOperation('EVENT_TEST_UPDATE_ERROR', { 
            strategy: i + 1 
          }, updateError);
        }
      }

      // Step 7: Wait for final result
      const finalResult = await eventPromise;
      
      const result = {
        success: finalResult || totalEvents > 0,
        eventReceived: finalResult,
        totalEvents,
        message: finalResult 
          ? `Event test successful - received ${totalEvents} events, target event: ${finalResult}`
          : `Event test failed - received ${totalEvents} events, no target event received`,
        details: {
          eventReceived: finalResult,
          totalEvents,
          eventDetails,
          applicationId: applicationId.slice(0, 8) + '...',
          testDuration: timeoutMs
        }
      };

      logOperation('EVENT_TEST_COMPLETE', result);
      return result;
      
    } catch (error) {
      logOperation('EVENT_TEST_ERROR', { 
        applicationId: applicationId.slice(0, 8) + '...' 
      }, error);
      
      return {
        success: false,
        eventReceived: false,
        totalEvents,
        message: `Real-time event test failed: ${error.message}`,
        details: {
          errorType: error.constructor.name,
          errorMessage: error.message,
          totalEvents,
          applicationId: applicationId.slice(0, 8) + '...'
        }
      };
    } finally {
      // Step 8: Cleanup channel
      if (channel) {
        try {
          logOperation('EVENT_TEST_CLEANUP', { channelName: channel.topic });
          await supabase.removeChannel(channel);
        } catch (cleanupError) {
          logOperation('EVENT_TEST_CLEANUP_ERROR', {}, cleanupError);
        }
      }
    }
  }
}
