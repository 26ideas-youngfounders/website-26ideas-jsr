
/**
 * @fileoverview Complete Real-time Subscription Manager Rebuild
 * 
 * Bulletproof subscription management with comprehensive event handling,
 * error recovery, and robust connection management.
 * 
 * @version 3.0.0 - COMPLETE SYSTEM REBUILD
 * @author 26ideas Development Team
 */

import { RealtimeConnectionManager, ConnectionState } from './realtime-connection-manager';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface SubscriptionConfig {
  table: string;
  schema?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
}

export interface SubscriptionState {
  isActive: boolean;
  subscriptionCount: number;
  lastEvent: Date | null;
  eventCount: number;
  lastError: string | null;
}

export type EventHandler<T = Record<string, any>> = (payload: RealtimePostgresChangesPayload<T>) => void;

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
  
  console.log(`[${timestamp}] SUBSCRIPTION_${operation.toUpperCase()}:`, logEntry);
  
  if (error) {
    console.error(`[${timestamp}] SUBSCRIPTION_ERROR in ${operation}:`, error);
  }
};

export class RealtimeSubscriptionManager {
  private connectionManager: RealtimeConnectionManager;
  private subscriptions: Map<string, {
    config: SubscriptionConfig;
    handler: EventHandler;
    isActive: boolean;
    channel?: RealtimeChannel;
    retryCount: number;
  }> = new Map();
  
  private state: SubscriptionState = {
    isActive: false,
    subscriptionCount: 0,
    lastEvent: null,
    eventCount: 0,
    lastError: null,
  };

  private listeners: Set<(state: SubscriptionState) => void> = new Set();
  private isStarting = false;

  constructor() {
    this.connectionManager = new RealtimeConnectionManager({
      maxRetries: 5,
      baseRetryDelay: 2000,
      maxRetryDelay: 15000,
      heartbeatInterval: 30000,
      connectionTimeout: 20000,
      authRefreshInterval: 300000,
    });

    // Listen to connection state changes
    this.connectionManager.addListener(this.handleConnectionStateChange.bind(this));
    
    logOperation('CONSTRUCTOR', { 
      initialState: this.state,
      connectionManagerReady: true 
    });
  }

  /**
   * Add subscription state listener
   */
  addListener(listener: (state: SubscriptionState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current subscription state
   */
  getState(): SubscriptionState {
    return { ...this.state };
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionManager.getState();
  }

  /**
   * BULLETPROOF START SEQUENCE
   */
  async start(): Promise<boolean> {
    if (this.isStarting) {
      logOperation('START_ALREADY_IN_PROGRESS', {});
      return false;
    }

    this.isStarting = true;
    
    try {
      logOperation('START_SEQUENCE_BEGIN', {});

      // Reset state for fresh start
      this.updateState({
        isActive: false,
        eventCount: 0,
        lastEvent: null,
        lastError: null
      });

      // Step 1: Establish connection with comprehensive verification
      logOperation('START_CONNECTION_ATTEMPT', {});
      const connected = await this.connectionManager.connect();
      
      if (!connected) {
        throw new Error('Connection manager failed to connect');
      }

      // Step 2: Verify connection is actually ready
      await new Promise(resolve => setTimeout(resolve, 2000));

      const connectionState = this.connectionManager.getState();
      if (connectionState.status !== 'connected') {
        throw new Error(`Connection not ready: ${connectionState.status} - ${connectionState.lastError}`);
      }

      // Step 3: Verify authentication
      if (!connectionState.isAuthenticated) {
        throw new Error('Authentication verification failed');
      }

      logOperation('START_SEQUENCE_SUCCESS', {
        connectionState,
        subscriptionCount: this.subscriptions.size
      });

      this.updateState({
        isActive: true,
        lastError: null
      });

      return true;
      
    } catch (error) {
      logOperation('START_SEQUENCE_FAILED', {}, error);
      this.updateState({ 
        isActive: false,
        lastError: `Startup failed: ${error.message}` 
      });
      return false;
    } finally {
      this.isStarting = false;
    }
  }

  /**
   * Stop subscription manager
   */
  stop(): void {
    logOperation('STOP_SEQUENCE_BEGIN', { 
      subscriptionCount: this.subscriptions.size 
    });
    
    this.isStarting = false;
    
    // Clear all subscriptions
    for (const [id, subscription] of this.subscriptions) {
      if (subscription.channel) {
        try {
          logOperation('SUBSCRIPTION_CLEANUP', { id });
          subscription.channel.unsubscribe();
        } catch (error) {
          logOperation('SUBSCRIPTION_CLEANUP_ERROR', { id }, error);
        }
      }
      subscription.isActive = false;
    }
    
    this.subscriptions.clear();
    this.connectionManager.disconnect();
    
    this.updateState({
      isActive: false,
      subscriptionCount: 0,
      lastError: null,
    });

    logOperation('STOP_SEQUENCE_COMPLETE', {});
  }

  /**
   * BULLETPROOF SUBSCRIPTION CREATION
   */
  subscribe<T = any>(
    id: string,
    config: SubscriptionConfig,
    handler: EventHandler<T>
  ): boolean {
    try {
      logOperation('SUBSCRIPTION_REQUEST', { id, config });
      
      // Remove existing subscription if it exists
      if (this.subscriptions.has(id)) {
        logOperation('SUBSCRIPTION_REPLACING_EXISTING', { id });
        const existing = this.subscriptions.get(id);
        if (existing?.channel) {
          existing.channel.unsubscribe();
        }
      }

      // Store subscription configuration
      this.subscriptions.set(id, {
        config,
        handler: handler as EventHandler,
        isActive: false,
        retryCount: 0,
      });

      // If connected, activate immediately
      const connectionState = this.connectionManager.getState();
      if (connectionState.status === 'connected' && this.state.isActive) {
        logOperation('SUBSCRIPTION_IMMEDIATE_ACTIVATION', { id });
        setTimeout(() => {
          this.activateSubscription(id);
        }, 1000);
      } else {
        logOperation('SUBSCRIPTION_PENDING_CONNECTION', { 
          id, 
          connectionStatus: connectionState.status,
          managerActive: this.state.isActive 
        });
      }

      this.updateState({
        subscriptionCount: this.subscriptions.size,
      });

      return true;

    } catch (error) {
      logOperation('SUBSCRIPTION_REQUEST_ERROR', { id, config }, error);
      return false;
    }
  }

  /**
   * Unsubscribe from database changes
   */
  unsubscribe(id: string): void {
    logOperation('UNSUBSCRIBE_REQUEST', { id });
    
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      if (subscription.channel) {
        try {
          subscription.channel.unsubscribe();
        } catch (error) {
          logOperation('UNSUBSCRIBE_ERROR', { id }, error);
        }
      }
      subscription.isActive = false;
    }
    
    this.subscriptions.delete(id);
    
    this.updateState({
      subscriptionCount: this.subscriptions.size,
    });
  }

  /**
   * Handle connection state changes
   */
  private handleConnectionStateChange(connectionState: ConnectionState): void {
    logOperation('CONNECTION_STATE_CHANGED', { connectionState });
    
    if (connectionState.status === 'connected' && connectionState.isAuthenticated) {
      // Connection is ready - activate all subscriptions
      setTimeout(() => {
        this.activateAllSubscriptions();
      }, 2000);
    } else if (connectionState.status === 'disconnected' || connectionState.status === 'error') {
      // Connection lost - mark all subscriptions as inactive
      this.deactivateAllSubscriptions();
    }

    this.updateState({
      isActive: connectionState.status === 'connected' && connectionState.isAuthenticated,
      lastError: connectionState.lastError,
    });
  }

  /**
   * BULLETPROOF SUBSCRIPTION ACTIVATION
   */
  private async activateSubscription(id: string): Promise<void> {
    const subscription = this.subscriptions.get(id);
    if (!subscription || subscription.isActive) {
      return;
    }

    try {
      logOperation('SUBSCRIPTION_ACTIVATION_START', { 
        id, 
        table: subscription.config.table,
        retryCount: subscription.retryCount 
      });
      
      const { config, handler } = subscription;
      
      // Use connection manager to create channel
      const channel = await this.connectionManager.createChannel(
        id,
        {
          table: config.table,
          event: config.event,
          schema: config.schema
        },
        (payload: any) => {
          logOperation('EVENT_RECEIVED', {
            subscriptionId: id,
            eventType: payload.eventType,
            table: payload.table,
            schema: payload.schema,
            hasNew: !!payload.new,
            hasOld: !!payload.old,
            timestamp: new Date().toISOString()
          });

          // Update event statistics
          this.updateState({
            lastEvent: new Date(),
            eventCount: this.state.eventCount + 1,
          });

          try {
            handler(payload);
          } catch (error) {
            logOperation('EVENT_HANDLER_ERROR', { subscriptionId: id }, error);
            this.updateState({
              lastError: `Event handler error: ${error.message}`,
            });
          }
        }
      );

      if (channel) {
        subscription.channel = channel;
        subscription.isActive = true;
        subscription.retryCount = 0;
        
        logOperation('SUBSCRIPTION_ACTIVATION_SUCCESS', { 
          id,
          table: subscription.config.table 
        });
      } else {
        throw new Error('Channel creation failed');
      }

    } catch (error) {
      logOperation('SUBSCRIPTION_ACTIVATION_FAILED', { 
        id, 
        retryCount: subscription.retryCount 
      }, error);
      
      subscription.isActive = false;
      
      // Retry logic with exponential backoff
      if (subscription.retryCount < 3) {
        subscription.retryCount++;
        const retryDelay = Math.min(2000 * Math.pow(2, subscription.retryCount - 1), 10000);
        
        logOperation('SUBSCRIPTION_RETRY_SCHEDULED', { 
          id, 
          retryDelay,
          attempt: subscription.retryCount 
        });
        
        setTimeout(() => {
          this.activateSubscription(id);
        }, retryDelay);
      } else {
        logOperation('SUBSCRIPTION_MAX_RETRIES_REACHED', { 
          id, 
          maxRetries: subscription.retryCount 
        });
        
        this.updateState({
          lastError: `Subscription ${id} failed after ${subscription.retryCount} attempts: ${error.message}`,
        });
      }
    }
  }

  /**
   * Activate all subscriptions
   */
  private activateAllSubscriptions(): void {
    logOperation('ACTIVATION_ALL_SUBSCRIPTIONS', { 
      subscriptionCount: this.subscriptions.size 
    });
    
    for (const [id] of this.subscriptions) {
      // Stagger activation to avoid overwhelming the connection
      setTimeout(() => {
        this.activateSubscription(id);
      }, Math.random() * 3000);
    }
  }

  /**
   * Deactivate all subscriptions
   */
  private deactivateAllSubscriptions(): void {
    logOperation('DEACTIVATION_ALL_SUBSCRIPTIONS', { 
      subscriptionCount: this.subscriptions.size 
    });
    
    for (const [id, subscription] of this.subscriptions) {
      subscription.isActive = false;
      if (subscription.channel) {
        try {
          subscription.channel.unsubscribe();
        } catch (error) {
          logOperation('DEACTIVATION_ERROR', { id }, error);
        }
        subscription.channel = undefined;
      }
    }
  }

  /**
   * Update state and notify listeners
   */
  private updateState(updates: Partial<SubscriptionState>): void {
    const previousState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    logOperation('STATE_UPDATE', {
      previous: previousState,
      current: this.state,
      changes: updates
    });

    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        logOperation('LISTENER_ERROR', {}, error);
      }
    });
  }
}
