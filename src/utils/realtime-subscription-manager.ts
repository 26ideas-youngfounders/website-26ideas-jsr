
/**
 * @fileoverview Realtime Subscription Manager
 * 
 * Robust subscription management for Supabase Realtime with automatic
 * recovery, validation, and comprehensive error handling.
 * 
 * @version 1.1.0
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
  retryOnFailure?: boolean;
  maxRetries?: number;
}

export interface SubscriptionStatus {
  isActive: boolean;
  channelState: string;
  socketState: string;
  lastActivity: Date | null;
  error: string | null;
  subscriptionId: string;
  retryCount: number;
}

/**
 * Enhanced Realtime Subscription Manager with comprehensive error handling
 */
export class RealtimeSubscriptionManager {
  private connectionManager: WebSocketConnectionManager;
  private activeChannels: Map<string, RealtimeChannel> = new Map();
  private subscriptionCallbacks: Map<string, (payload: any) => void> = new Map();
  private statusCallbacks: Map<string, (status: SubscriptionStatus) => void> = new Map();
  private subscriptionRetries: Map<string, number> = new Map();
  private subscriptionIds: Map<string, string> = new Map();

  constructor(connectionManager: WebSocketConnectionManager) {
    this.connectionManager = connectionManager;
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create robust realtime subscription with enhanced validation and retry logic
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
      validationTimeoutMs = 25000,
      maxValidationAttempts = 250,
      retryOnFailure = true,
      maxRetries = 3
    } = options;

    const subscriptionId = this.generateSubscriptionId();
    this.subscriptionIds.set(channelName, subscriptionId);

    console.log(`📡 Creating robust subscription [${subscriptionId}] for ${channelName}...`);

    try {
      // Ensure connection is established with retries
      let connectionAttempts = 0;
      const maxConnectionAttempts = 3;
      let isConnected = false;

      while (!isConnected && connectionAttempts < maxConnectionAttempts) {
        connectionAttempts++;
        console.log(`🔗 Connection attempt ${connectionAttempts} for subscription ${subscriptionId}...`);
        
        isConnected = await this.connectionManager.connect();
        
        if (!isConnected) {
          console.warn(`⚠️ Connection attempt ${connectionAttempts} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * connectionAttempts));
        }
      }

      if (!isConnected) {
        throw new Error(`Failed to establish connection after ${maxConnectionAttempts} attempts`);
      }

      // Clean up existing subscription if present
      if (this.activeChannels.has(channelName)) {
        console.log(`🧹 Cleaning up existing subscription: ${channelName}`);
        await this.removeSubscription(channelName);
      }

      // Get authenticated session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required for subscription');
      }

      console.log(`📡 Creating channel [${subscriptionId}]: ${channelName}`);

      // Create channel with enhanced configuration
      const channel = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: false },
            presence: { key: `admin-${session.user.id}` }
          }
        })
        .on(
          'postgres_changes' as any,
          {
            event,
            schema,
            table
          } as any,
          (payload: any) => {
            console.log(`📨 Realtime payload received [${subscriptionId}]:`, {
              eventType: payload.eventType,
              table: payload.table,
              schema: payload.schema,
              timestamp: new Date().toISOString(),
              hasNewRecord: !!payload.new,
              hasOldRecord: !!payload.old
            });

            // Update subscription status
            this.updateSubscriptionStatus(channelName, {
              isActive: true,
              channelState: (channel as any).state || 'unknown',
              socketState: this.getSocketStateName(),
              lastActivity: new Date(),
              error: null,
              subscriptionId,
              retryCount: this.subscriptionRetries.get(channelName) || 0
            });

            // Call payload handler with error protection
            try {
              onPayload(payload);
            } catch (error) {
              console.error(`❌ Error in payload handler for ${subscriptionId}:`, error);
            }
          }
        )
        .subscribe(async (status, err) => {
          const timestamp = new Date().toISOString();
          
          console.log(`📡 Subscription status [${subscriptionId}] for ${channelName}: ${status}`, {
            timestamp,
            error: err,
            channelName,
            subscriptionId
          });

          // Handle subscription status changes with enhanced error handling
          if (err) {
            let errorMessage = 'Unknown subscription error';
            
            if (err instanceof Error) {
              errorMessage = err.message;
            } else if (typeof err === 'object' && err !== null) {
              const errorObj = err as Record<string, unknown>;
              if ('message' in errorObj && typeof errorObj.message === 'string') {
                errorMessage = errorObj.message;
              } else {
                errorMessage = JSON.stringify(err);
              }
            }

            console.error(`❌ Subscription error [${subscriptionId}]:`, errorMessage);
            
            this.updateSubscriptionStatus(channelName, {
              isActive: false,
              channelState: status,
              socketState: this.getSocketStateName(),
              lastActivity: new Date(),
              error: errorMessage,
              subscriptionId,
              retryCount: this.subscriptionRetries.get(channelName) || 0
            });

            // Retry subscription if enabled
            if (retryOnFailure) {
              await this.retrySubscription(channelName, options, onPayload, onStatus);
            }
          } else {
            const isActive = status === 'SUBSCRIBED';
            this.updateSubscriptionStatus(channelName, {
              isActive,
              channelState: status,
              socketState: this.getSocketStateName(),
              lastActivity: new Date(),
              error: null,
              subscriptionId,
              retryCount: this.subscriptionRetries.get(channelName) || 0
            });

            if (isActive) {
              console.log(`✅ Subscription [${subscriptionId}] active and ready`);
              // Reset retry count on success
              this.subscriptionRetries.set(channelName, 0);
            }
          }
        });

      // Enhanced subscription validation with timeout protection
      await this.validateSubscriptionEstablishment(
        channel, 
        channelName, 
        subscriptionId,
        validationTimeoutMs, 
        maxValidationAttempts
      );

      // Store subscription references
      this.activeChannels.set(channelName, channel);
      this.subscriptionCallbacks.set(channelName, onPayload);
      if (onStatus) {
        this.statusCallbacks.set(channelName, onStatus);
      }

      console.log(`✅ Robust subscription [${subscriptionId}] created successfully: ${channelName}`);
      return channel;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to create subscription [${subscriptionId}] ${channelName}:`, errorMessage);
      
      // Update status with error
      this.updateSubscriptionStatus(channelName, {
        isActive: false,
        channelState: 'error',
        socketState: this.getSocketStateName(),
        lastActivity: new Date(),
        error: errorMessage,
        subscriptionId,
        retryCount: this.subscriptionRetries.get(channelName) || 0
      });

      throw error;
    }
  }

  /**
   * Retry subscription with exponential backoff
   */
  private async retrySubscription(
    channelName: string,
    options: SubscriptionOptions,
    onPayload: (payload: any) => void,
    onStatus?: (status: SubscriptionStatus) => void
  ): Promise<void> {
    const currentRetries = this.subscriptionRetries.get(channelName) || 0;
    const maxRetries = options.maxRetries || 3;

    if (currentRetries >= maxRetries) {
      console.error(`❌ Max retries (${maxRetries}) reached for subscription: ${channelName}`);
      return;
    }

    this.subscriptionRetries.set(channelName, currentRetries + 1);
    const delay = Math.min(1000 * Math.pow(2, currentRetries), 10000);

    console.log(`🔄 Retrying subscription ${channelName} in ${delay}ms (attempt ${currentRetries + 1}/${maxRetries})...`);

    setTimeout(async () => {
      try {
        await this.createSubscription(options, onPayload, onStatus);
      } catch (retryError) {
        console.error(`❌ Retry failed for subscription ${channelName}:`, retryError);
      }
    }, delay);
  }

  /**
   * Enhanced subscription validation with detailed monitoring
   */
  private async validateSubscriptionEstablishment(
    channel: RealtimeChannel,
    channelName: string,
    subscriptionId: string,
    timeoutMs: number,
    maxAttempts: number
  ): Promise<void> {
    console.log(`⏳ Validating subscription establishment [${subscriptionId}]: ${channelName}`);
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timeout = setTimeout(() => {
        const elapsed = Date.now() - startTime;
        console.error(`❌ Subscription validation timeout [${subscriptionId}] after ${elapsed}ms`);
        reject(new Error(`Subscription ${channelName} [${subscriptionId}] did not establish within ${timeoutMs}ms`));
      }, timeoutMs);

      let attemptCount = 0;
      let lastLogTime = 0;
      
      const validateSubscription = () => {
        attemptCount++;
        
        const realtimeSocket = (supabase as any).realtime?.socket;
        const socketState = realtimeSocket?.readyState;
        const channelState = (channel as any).state;
        const elapsed = Date.now() - startTime;
        const now = Date.now();
        
        // Log every 2 seconds or for first 10 attempts
        if (now - lastLogTime >= 2000 || attemptCount <= 10) {
          console.log(`🔍 Subscription validation [${subscriptionId}] ${attemptCount} (${elapsed}ms):`, {
            socketState: `${socketState} (${this.getSocketStateName()})`,
            channelState,
            elapsed: `${elapsed}ms`,
            subscriptionId
          });
          lastLogTime = now;
        }
        
        if (channelState === 'joined' && socketState === WEBSOCKET_STATES.OPEN) {
          console.log(`✅ Subscription [${subscriptionId}] ${channelName} established successfully!`, {
            elapsed: `${elapsed}ms`,
            attempts: attemptCount,
            subscriptionId
          });
          clearTimeout(timeout);
          resolve();
        } else if (channelState === 'errored' || channelState === 'closed') {
          console.error(`❌ Subscription [${subscriptionId}] ${channelName} failed:`, {
            channelState,
            socketState: this.getSocketStateName(),
            elapsed: `${elapsed}ms`,
            subscriptionId
          });
          clearTimeout(timeout);
          reject(new Error(`Subscription failed [${subscriptionId}]: channel=${channelState}, socket=${this.getSocketStateName()}`));
        } else if (attemptCount >= maxAttempts) {
          console.error(`❌ Subscription [${subscriptionId}] ${channelName} validation timeout:`, {
            finalChannelState: channelState,
            finalSocketState: this.getSocketStateName(),
            totalAttempts: attemptCount,
            elapsed: `${elapsed}ms`,
            subscriptionId
          });
          clearTimeout(timeout);
          reject(new Error(`Subscription validation timeout [${subscriptionId}]: channel=${channelState}, socket=${this.getSocketStateName()}`));
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
   * Get current socket state name with fallback
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
   * Remove subscription with enhanced cleanup
   */
  async removeSubscription(channelName: string): Promise<void> {
    const subscriptionId = this.subscriptionIds.get(channelName) || 'unknown';
    console.log(`🗑️ Removing subscription [${subscriptionId}]: ${channelName}`);
    
    const channel = this.activeChannels.get(channelName);
    if (channel) {
      try {
        await supabase.removeChannel(channel);
        console.log(`✅ Subscription [${subscriptionId}] ${channelName} removed successfully`);
      } catch (error) {
        console.warn(`⚠️ Error removing subscription [${subscriptionId}] ${channelName}:`, error);
      }
    }
    
    // Clean up all references
    this.activeChannels.delete(channelName);
    this.subscriptionCallbacks.delete(channelName);
    this.statusCallbacks.delete(channelName);
    this.subscriptionRetries.delete(channelName);
    this.subscriptionIds.delete(channelName);
  }

  /**
   * Get subscription status with enhanced details
   */
  getSubscriptionStatus(channelName: string): SubscriptionStatus | null {
    const channel = this.activeChannels.get(channelName);
    const subscriptionId = this.subscriptionIds.get(channelName) || 'unknown';
    
    if (!channel) {
      return null;
    }
    
    return {
      isActive: (channel as any).state === 'joined',
      channelState: (channel as any).state || 'unknown',
      socketState: this.getSocketStateName(),
      lastActivity: null, // Would need to track separately
      error: null,
      subscriptionId,
      retryCount: this.subscriptionRetries.get(channelName) || 0
    };
  }

  /**
   * Get all active subscriptions with metrics
   */
  getAllSubscriptionStatuses(): Record<string, SubscriptionStatus | null> {
    const statuses: Record<string, SubscriptionStatus | null> = {};
    
    for (const channelName of this.activeChannels.keys()) {
      statuses[channelName] = this.getSubscriptionStatus(channelName);
    }
    
    return statuses;
  }

  /**
   * Cleanup all subscriptions with comprehensive teardown
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up all subscriptions...');
    
    const channelNames = Array.from(this.activeChannels.keys());
    const cleanupPromises = channelNames.map(channelName => this.removeSubscription(channelName));
    
    await Promise.all(cleanupPromises);
    
    // Clear all maps
    this.activeChannels.clear();
    this.subscriptionCallbacks.clear();
    this.statusCallbacks.clear();
    this.subscriptionRetries.clear();
    this.subscriptionIds.clear();
    
    console.log('✅ All subscriptions cleaned up successfully');
  }
}
