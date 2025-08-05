
/**
 * @fileoverview E2E Real-time Testing Helper
 * 
 * Specialized utilities for testing real-time subscriptions
 * and ensuring proper Supabase configuration.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';

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
      
      // Test 1: Check if we can create a basic channel
      const testChannel = supabase.channel(`test-${tableName}-${Date.now()}`);
      
      let channelStatus: string | null = null;
      const statusPromise = new Promise<string>((resolve) => {
        testChannel.subscribe((status) => {
          channelStatus = status;
          resolve(status);
        });
      });
      
      // Wait for channel status with timeout
      const status = await Promise.race([
        statusPromise,
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('TIMEOUT'), 5000);
        })
      ]);
      
      // Cleanup test channel
      testChannel.unsubscribe();
      
      if (status === 'SUBSCRIBED') {
        return {
          isEnabled: true,
          message: `Real-time appears to be working for ${tableName}`,
          details: { channelStatus: status }
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
   * Trigger a test database change and wait for real-time event
   */
  static async testRealtimeEvent(
    applicationId: string,
    subscriptionManager: any,
    timeoutMs: number = 15000
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
    
    // Set up event listener
    const subscribed = subscriptionManager.subscribe(
      'e2e-realtime-test',
      {
        table: 'yff_applications',
        schema: 'public',
        event: 'UPDATE'
      },
      (payload: any) => {
        totalEvents++;
        console.log(`📨 Test event ${totalEvents} received:`, {
          eventType: payload.eventType,
          table: payload.table,
          applicationId: payload.new?.application_id?.slice(0, 8) + '...' || 'unknown'
        });
        
        const receivedAppId = payload.new?.application_id || payload.old?.application_id;
        if (receivedAppId === applicationId) {
          eventReceived = true;
          eventDetails = payload;
          console.log(`✅ Target event received for application: ${applicationId.slice(0, 8)}...`);
        }
      }
    );
    
    if (!subscribed) {
      return {
        success: false,
        eventReceived: false,
        totalEvents: 0,
        message: 'Failed to create test subscription'
      };
    }
    
    // Wait for subscription to be active
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Create event promise
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
    
    // Trigger multiple database updates
    console.log(`🔄 Triggering database updates for application: ${applicationId.slice(0, 8)}...`);
    
    for (let i = 1; i <= 3; i++) {
      const updateTimestamp = new Date().toISOString();
      const newStatus = `test_realtime_${i}_${Date.now()}`;
      
      console.log(`🔄 Update ${i}/3: Setting status to "${newStatus}"`);
      
      const { error, data } = await supabase
        .from('yff_applications')
        .update({
          evaluation_status: newStatus,
          updated_at: updateTimestamp
        })
        .eq('application_id', applicationId)
        .select();
      
      if (error) {
        console.warn(`⚠️ Update ${i} failed:`, error.message);
      } else {
        console.log(`✅ Update ${i} completed:`, data?.[0]?.evaluation_status);
      }
      
      // Wait between updates
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if we got the event
      if (eventReceived) {
        console.log(`🎯 Event received after update ${i}, stopping further updates`);
        break;
      }
    }
    
    // Wait for events
    const finalResult = await eventPromise;
    
    // Cleanup subscription
    subscriptionManager.unsubscribe('e2e-realtime-test');
    
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
        eventDetails: eventDetails ? {
          eventType: eventDetails.eventType,
          table: eventDetails.table,
          applicationId: eventDetails.new?.application_id?.slice(0, 8) + '...'
        } : null
      }
    };
  }
}
