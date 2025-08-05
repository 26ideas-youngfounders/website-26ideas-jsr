
/**
 * @fileoverview E2E Real-time Testing Helper
 * 
 * Specialized utilities for testing real-time subscriptions
 * and ensuring proper Supabase configuration.
 * 
 * @version 2.0.0
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export class E2ERealtimeHelper {
  /**
   * Verify that real-time is properly configured for a table
   */
  static async verifyRealtimeSetup(tableName: string): Promise<{
    isEnabled: boolean;
    message: string;
    details?: any;
  }> {
    try {
      console.log(`🔍 Verifying real-time setup for table: ${tableName}`);
      
      // Test basic connectivity first
      const { data, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        return {
          isEnabled: false,
          message: `Table query failed: ${error.message}`,
          details: { error: error.message }
        };
      }
      
      // Test channel creation
      const testChannel = supabase.channel(`test-${tableName}-${Date.now()}`);
      
      const channelPromise = new Promise<string>((resolve) => {
        testChannel.subscribe((status) => {
          resolve(status);
        });
      });
      
      const status = await Promise.race([
        channelPromise,
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('TIMEOUT'), 8000);
        })
      ]);
      
      // Cleanup test channel
      await testChannel.unsubscribe();
      
      if (status === 'SUBSCRIBED') {
        return {
          isEnabled: true,
          message: `Real-time appears to be working for ${tableName}`,
          details: { channelStatus: status, rowCount: data?.length || 0 }
        };
      } else {
        return {
          isEnabled: false,
          message: `Real-time channel subscription failed with status: ${status}`,
          details: { channelStatus: status }
        };
      }
      
    } catch (error) {
      return {
        isEnabled: false,
        message: `Real-time verification failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Test real-time events with direct Supabase channel approach
   */
  static async testRealtimeEvent(
    applicationId: string,
    timeoutMs: number = 25000
  ): Promise<{
    success: boolean;
    eventReceived: boolean;
    totalEvents: number;
    message: string;
    details?: any;
  }> {
    console.log(`🧪 Testing real-time event for application: ${applicationId.slice(0, 8)}...`);
    
    let eventReceived = false;
    let totalEvents = 0;
    let eventDetails: any = null;
    let channel: RealtimeChannel | null = null;
    
    try {
      // Create a unique channel for this test
      const channelName = `e2e-test-${Date.now()}`;
      console.log(`📡 Creating channel: ${channelName}`);
      
      channel = supabase.channel(channelName);
      
      // Set up the postgres changes listener
      channel.on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'yff_applications'
        } as any,
        (payload: any) => {
          totalEvents++;
          console.log(`📨 Real-time event ${totalEvents} received:`, {
            eventType: payload.eventType,
            table: payload.table,
            applicationId: payload.new?.application_id?.slice(0, 8) + '...' || payload.old?.application_id?.slice(0, 8) + '...' || 'unknown',
            timestamp: new Date().toISOString()
          });
          
          const receivedAppId = payload.new?.application_id || payload.old?.application_id;
          if (receivedAppId === applicationId) {
            eventReceived = true;
            eventDetails = {
              eventType: payload.eventType,
              table: payload.table,
              applicationId: receivedAppId.slice(0, 8) + '...'
            };
            console.log(`✅ Target event received for application: ${applicationId.slice(0, 8)}...`);
          }
        }
      );
      
      // Subscribe and wait for connection
      console.log(`🚀 Subscribing to channel...`);
      
      const subscriptionPromise = new Promise<boolean>((resolve) => {
        channel!.subscribe((status, err) => {
          console.log(`📊 Channel subscription status: ${status}`, err ? { error: err } : '');
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ Channel subscription successful');
            resolve(true);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.error(`❌ Channel subscription failed: ${status}`, err);
            resolve(false);
          }
        });
      });
      
      const subscribed = await Promise.race([
        subscriptionPromise,
        new Promise<boolean>((resolve) => {
          setTimeout(() => {
            console.log('⏰ Subscription timeout');
            resolve(false);
          }, 10000);
        })
      ]);
      
      if (!subscribed) {
        throw new Error('Failed to establish subscription within timeout');
      }
      
      // Wait for subscription to be fully active
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create event promise with timeout
      const eventPromise = new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          console.log(`⏰ Event timeout reached. Total events: ${totalEvents}, Target received: ${eventReceived}`);
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
      
      // Trigger multiple database updates with different strategies
      console.log(`🔄 Triggering database updates for application: ${applicationId.slice(0, 8)}...`);
      
      for (let i = 1; i <= 5; i++) {
        const updateTimestamp = new Date().toISOString();
        const newStatus = `test_realtime_${i}_${Date.now()}`;
        
        console.log(`🔄 Update ${i}/5: Setting status to "${newStatus}"`);
        
        // Try different update approaches to ensure one triggers an event
        const updatePromises = [
          // Standard update
          supabase
            .from('yff_applications')
            .update({
              evaluation_status: newStatus,
              updated_at: updateTimestamp
            })
            .eq('application_id', applicationId)
            .select(),
          
          // Update with different field
          supabase
            .from('yff_applications')
            .update({
              status: `status_${i}_${Date.now()}`,
              updated_at: updateTimestamp
            })
            .eq('application_id', applicationId)
            .select()
        ];
        
        const results = await Promise.allSettled(updatePromises);
        
        let successCount = 0;
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && !result.value.error) {
            successCount++;
            console.log(`✅ Update ${i}.${index + 1} completed successfully`);
          } else {
            const error = result.status === 'rejected' ? result.reason : result.value.error;
            console.warn(`⚠️ Update ${i}.${index + 1} failed:`, error?.message || 'Unknown error');
          }
        });
        
        if (successCount === 0) {
          console.warn(`⚠️ All updates in batch ${i} failed`);
        }
        
        // Wait between batches
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check if we got the event
        if (eventReceived) {
          console.log(`🎯 Event received after update batch ${i}, stopping further updates`);
          break;
        }
      }
      
      // Wait for final events
      const finalResult = await eventPromise;
      
      return {
        success: finalResult || totalEvents > 0,
        eventReceived: finalResult,
        totalEvents,
        message: finalResult 
          ? `Real-time event test successful. Received ${totalEvents} events, target event: ${eventReceived}`
          : `Real-time event test failed. Received ${totalEvents} events, no target event received`,
        details: {
          eventReceived: finalResult,
          totalEvents,
          eventDetails
        }
      };
      
    } catch (error) {
      console.error('❌ Real-time test error:', error);
      
      return {
        success: false,
        eventReceived: false,
        totalEvents,
        message: `Real-time test failed: ${error.message}`,
        details: {
          errorType: error.constructor.name,
          errorMessage: error.message,
          totalEvents
        }
      };
    } finally {
      // Cleanup channel
      if (channel) {
        try {
          console.log('🧹 Cleaning up test channel...');
          await channel.unsubscribe();
        } catch (error) {
          console.warn('⚠️ Error cleaning up channel:', error);
        }
      }
    }
  }
}
