
/**
 * @fileoverview Realtime Subscription Manager
 * 
 * Robust subscription management for Supabase Realtime with automatic
 * recovery, validation, and comprehensive error handling.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';
import { WebSocketConnectionManager } from './websocket-connection-manager';
import { WEBSOCKET_STATES } from './websocket-diagnostics';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface SubscriptionOptions {
  channelName: string;
  table: string;
  schema?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  validationTimeoutMs?: number;
  maxValidationAttempts?: number;
}

export interface SubscriptionStatus {
  isActive: boolean;
  channelState: string;
  socketState: string;
  lastActivity: Date | null;
  error: string | null;
}

/**
 * Realtime Subscription Manager with robust error handling
 */
export class RealtimeSubscriptionManager {
  private connectionManager: WebSocketConnectionManager;
  private activeChannels: Map<string, RealtimeChannel> = new Map();
  private subscriptionCallbacks: Map<string, (payload: any) => void> = new Map();
  private statusCallbacks: Map<string, (status: SubscriptionStatus) => void> = new Map();

  constructor(connectionManager: WebSocketConnectionManager) {
    this.connectionManager = connectionManager;
  }

  /**
   * Create robust realtime subscription with full validation
   */
  async createSubscription(
    options: SubscriptionOptions,
    onPayload: (payload: any) => void,
    onStatus?: (status: SubscriptionStatus) => void
  ): Promise<RealtimeChannel> {
    const {
      channelName,
      table,
      schema = 'public',
      event = '*',
      validationTimeoutMs = 20000,
      maxValidationAttempts = 200
    } = options;

    console.log(`📡 Creating robust subscription for ${channelName}...`);

    try {
      // Ensure connection is established
      const isConnected = await this.connectionManager.connect();
      if (!isConnected) {
        throw new Error('Failed to establish WebSocket connection');
      }

      // Clean up existing subscription if present
      if (this.activeChannels.has(channelName)) {
        console.log(`🧹 Cleaning up existing subscription: ${channelName}`);
        await this.removeSubscription(channelName);
      }

      // Get authenticated session for presence
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required for subscription');
      }

      // Create channel with enhanced configuration
      const channel = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: false },
            presence: { key: `admin-${session.user.id}` }
          }
        })
        .on(
          'postgres_changes',
          {
            event,
            schema,
            table
          },
          (payload) => {
            console.log('📨 Realtime payload received:', {
              eventType: payload.eventType,
              table: payload.table,
              schema: payload.schema,
              timestamp: new Date().toISOString(),
              hasNewRecord: !!payload.new,
              hasOldRecord: !!payload.old
            });

            // Update status
            this.updateSubscriptionStatus(channelName, {
              isActive: true,
              channelState: (channel as any).state || 'unknown',
              socketState: this.getSocketStateName(),
              lastActivity: new Date(),
              error: null
            });

            // Call payload handler
            try {
              onPayload(payload);
            } catch (error) {
              console.error('❌ Error in payload handler:', error);
            }
          }
        )
        .subscribe(async (status, err) => {
          const timestamp = new Date().toISOString();
          
          console.log(`📡 Subscription status for ${channelName}: ${status}`, {
            timestamp,
            error: err,
            channelName
          });

          // Handle subscription status changes
          if (err) {
            let errorMessage = 'Unknown subscription error';
            
            if (err instanceof Error) {
              errorMessage = err.message;
            } else if (typeof err === 'object' && err !== null) {
              const errorObj = err as Record<string, unknown>;
              if ('message' in errorObj && typeof errorObj.message === 'string') {
                errorMessage = errorObj.message;
              }
            }

            console.error('❌ Subscription error:', errorMessage);
            
            this.updateSubscriptionStatus(channelName, {
              isActive: false,
              channelState: status,
              socketState: this.getSocketStateName(),
              lastActivity: new Date(),
              error: errorMessage
            });
          } else {
            this.updateSubscriptionStatus(channelName, {
              isActive: status === 'SUBSCRIBED',
              channelState: status,
              socketState: this.getSocketStateName(),
              lastActivity: new Date(),
              error: null
            });
          }
        });

      // Validate subscription establishment
      await this.validateSubscriptionEstablishment(
        channel, 
        channelName, 
        validationTimeoutMs, 
        maxValidationAttempts
      );

      // Store subscription references
      this.activeChannels.set(channelName, channel);
      this.subscriptionCallbacks.set(channelName, onPayload);
      if (onStatus) {
        this.statusCallbacks.set(channelName, onStatus);
      }

      console.log(`✅ Robust subscription created successfully: ${channelName}`);
      return channel;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to create subscription ${channelName}:`, errorMessage);
      
      // Update status with error
      this.updateSubscriptionStatus(channelName, {
        isActive: false,
        channelState: 'error',
        socketState: this.getSocketStateName(),
        lastActivity: new Date(),
        error: errorMessage
      });

      throw error;
    }
  }

  /**
   * Validate that subscription is properly established
   */
  private async validateSubscriptionEstablishment(
    channel: RealtimeChannel,
    channelName: string,
    timeoutMs: number,
    maxAttempts: number
  ): Promise<void> {
    console.log(`⏳ Validating subscription establishment: ${channelName}`);
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timeout = setTimeout(() => {
        const elapsed = Date.now() - startTime;
        console.error(`❌ Subscription validation timeout after ${elapsed}ms`);
        reject(new Error(`Subscription ${channelName} did not establish within ${timeoutMs}ms`));
      }, timeoutMs);

      let attemptCount = 0;
      
      const validateSubscription = () => {
        attemptCount++;
        
        const realtimeSocket = (supabase as any).realtime?.socket;
        const socketState = realtimeSocket?.readyState;
        const channelState = (channel as any).state;
        const elapsed = Date.now() - startTime;
        
        if (attemptCount % 20 === 0 || attemptCount <= 5) { // Log every 2s or first 5 attempts
          console.log(`🔍 Subscription validation ${attemptCount} (${elapsed}ms):`, {
            socketState: `${socketState} (${this.getSocketStateName()})`,
            channelState,
            elapsed: `${elapsed}ms`
          });
        }
        
        if (channelState === 'joined' && socketState === WEBSOCKET_STATES.OPEN) {
          console.log(`✅ Subscription ${channelName} established successfully!`, {
            elapsed: `${elapsed}ms`,
            attempts: attemptCount
          });
          clearTimeout(timeout);
          resolve();
        } else if (channelState === 'errored' || channelState === 'closed') {
          console.error(`❌ Subscription ${channelName} failed:`, {
            channelState,
            socketState: this.getSocketStateName(),
            elapsed: `${elapsed}ms`
          });
          clearTimeout(timeout);
          reject(new Error(`Subscription failed: channel=${channelState}, socket=${this.getSocketStateName()}`));
        } else if (attemptCount >= maxAttempts) {
          console.error(`❌ Subscription ${channelName} validation timeout:`, {
            finalChannelState: channelState,
            finalSocketState: this.getSocketStateName(),
            totalAttempts: attemptCount,
            elapsed: `${elapsed}ms`
          });
          clearTimeout(timeout);
          reject(new Error(`Subscription validation timeout: channel=${channelState}, socket=${this.getSocketStateName()}`));
        } else {
          // Continue validation
          setTimeout(validateSubscription, 100);
        }
      };
      
      // Start validation immediately
      validateSubscription();
    });
  }

  /**
   * Get current socket state name
   */
  private getSocketStateName(): string {
    const realtimeSocket = (supabase as any).realtime?.socket;
    const socketState = realtimeSocket?.readyState;
    
    const stateNames = {
      0: 'CONNECTING',
      1: 'OPEN',
      2: 'CLOSING',
      3: 'CLOSED'
    };
    
    return stateNames[socketState as keyof typeof stateNames] || 'UNKNOWN';
  }

  /**
   * Update subscription status and notify callbacks
   */
  private updateSubscriptionStatus(channelName: string, status: SubscriptionStatus): void {
    const callback = this.statusCallbacks.get(channelName);
    if (callback) {
      try {
        callback(status);
      } catch (error) {
        console.error(`❌ Error in status callback for ${channelName}:`, error);
      }
    }
  }

  /**
   * Remove subscription and cleanup
   */
  async removeSubscription(channelName: string): Promise<void> {
    console.log(`🗑️ Removing subscription: ${channelName}`);
    
    const channel = this.activeChannels.get(channelName);
    if (channel) {
      try {
        await supabase.removeChannel(channel);
        console.log(`✅ Subscription ${channelName} removed successfully`);
      } catch (error) {
        console.warn(`⚠️ Error removing subscription ${channelName}:`, error);
      }
    }
    
    // Clean up references
    this.activeChannels.delete(channelName);
    this.subscriptionCallbacks.delete(channelName);
    this.statusCallbacks.delete(channelName);
  }

  /**
   * Get subscription status
   */
  getSubscriptionStatus(channelName: string): SubscriptionStatus | null {
    const channel = this.activeChannels.get(channelName);
    if (!channel) {
      return null;
    }
    
    return {
      isActive: (channel as any).state === 'joined',
      channelState: (channel as any).state || 'unknown',
      socketState: this.getSocketStateName(),
      lastActivity: null, // Would need to track separately
      error: null
    };
  }

  /**
   * Cleanup all subscriptions
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up all subscriptions...');
    
    const channelNames = Array.from(this.activeChannels.keys());
    
    for (const channelName of channelNames) {
      await this.removeSubscription(channelName);
    }
    
    console.log('✅ All subscriptions cleaned up');
  }
}
