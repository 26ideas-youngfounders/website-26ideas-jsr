
/**
 * @fileoverview Real-time Subscription Manager
 * 
 * Manages real-time subscriptions for database changes with automatic
 * reconnection, error handling, and event processing.
 * 
 * @version 2.2.0
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

// Generic type for database row data
export type EventHandler<T = Record<string, any>> = (payload: RealtimePostgresChangesPayload<T>) => void;

export class RealtimeSubscriptionManager {
  private connectionManager: RealtimeConnectionManager;
  private subscriptions: Map<string, {
    config: SubscriptionConfig;
    handler: EventHandler;
    isActive: boolean;
    channel?: RealtimeChannel;
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
      maxRetries: 3,
      baseRetryDelay: 1000,
      maxRetryDelay: 5000,
      heartbeatInterval: 25000,
      connectionTimeout: 10000,
    });

    // Listen to connection state changes
    this.connectionManager.addListener(this.handleConnectionStateChange.bind(this));
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
   * Start subscription manager
   */
  async start(): Promise<boolean> {
    if (this.isStarting) {
      console.log('⚠️ Subscription manager start already in progress');
      return false;
    }

    this.isStarting = true;
    console.log('🚀 Starting subscription manager...');
    
    try {
      const connected = await this.connectionManager.connect();
      if (!connected) {
        console.error('❌ Connection manager failed to connect');
        this.updateState({ lastError: 'Failed to establish connection' });
        return false;
      }

      // Wait for connection to be fully established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify connection state
      const connectionState = this.connectionManager.getState();
      if (connectionState.status !== 'connected') {
        console.error('❌ Connection not in connected state:', connectionState.status);
        this.updateState({ lastError: `Connection not ready: ${connectionState.status}` });
        return false;
      }

      console.log('✅ Subscription manager started successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Error starting subscription manager:', error);
      this.updateState({ lastError: `Startup error: ${error.message}` });
      return false;
    } finally {
      this.isStarting = false;
    }
  }

  /**
   * Stop subscription manager
   */
  stop(): void {
    console.log('⏹️ Stopping subscription manager...');
    
    this.isStarting = false;
    
    // Cleanup all subscription channels
    for (const [id, subscription] of this.subscriptions) {
      if (subscription.channel) {
        try {
          subscription.channel.unsubscribe();
        } catch (error) {
          console.warn(`⚠️ Error unsubscribing channel for ${id}:`, error);
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
  }

  /**
   * Subscribe to database changes
   */
  subscribe<T = any>(
    id: string,
    config: SubscriptionConfig,
    handler: EventHandler<T>
  ): boolean {
    console.log(`📡 Adding subscription: ${id}`, config);
    
    if (this.subscriptions.has(id)) {
      console.warn(`⚠️ Subscription ${id} already exists, replacing`);
      const existing = this.subscriptions.get(id);
      if (existing?.channel) {
        existing.channel.unsubscribe();
      }
    }

    this.subscriptions.set(id, {
      config,
      handler: handler as EventHandler,
      isActive: false,
    });

    // If connected, activate the subscription immediately
    const connectionState = this.connectionManager.getState();
    if (connectionState.status === 'connected') {
      setTimeout(() => {
        this.activateSubscription(id);
      }, 100);
    }

    this.updateState({
      subscriptionCount: this.subscriptions.size,
    });

    return true;
  }

  /**
   * Unsubscribe from database changes
   */
  unsubscribe(id: string): void {
    console.log(`📡 Removing subscription: ${id}`);
    
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      if (subscription.channel) {
        try {
          subscription.channel.unsubscribe();
        } catch (error) {
          console.warn(`⚠️ Error unsubscribing ${id}:`, error);
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
    console.log(`🔄 Connection state changed: ${connectionState.status}`);
    
    if (connectionState.status === 'connected') {
      // Activate all subscriptions after connection with a delay
      setTimeout(() => {
        this.activateAllSubscriptions();
      }, 500);
    } else if (connectionState.status === 'disconnected' || connectionState.status === 'error') {
      // Mark all subscriptions as inactive
      this.deactivateAllSubscriptions();
    }

    this.updateState({
      isActive: connectionState.status === 'connected',
      lastError: connectionState.lastError,
    });
  }

  /**
   * Activate a specific subscription using dedicated channel
   */
  private activateSubscription(id: string): void {
    const subscription = this.subscriptions.get(id);
    if (!subscription || subscription.isActive) {
      return;
    }

    try {
      console.log(`✅ Activating subscription: ${id} for table: ${subscription.config.table}`);
      
      const { config, handler } = subscription;
      
      // Import supabase client
      import('@/integrations/supabase/client').then(({ supabase }) => {
        // Create a dedicated channel for this subscription
        const channelName = `${config.table}_${id}_${Date.now()}`;
        const channel = supabase.channel(channelName);
        
        // Set up postgres changes listener
        channel.on(
          'postgres_changes' as any,
          {
            event: config.event || '*',
            schema: config.schema || 'public',
            table: config.table,
            filter: config.filter,
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            console.log(`📨 Event received for ${id}:`, {
              eventType: payload.eventType,
              table: payload.table,
              schema: payload.schema,
              timestamp: new Date().toISOString(),
              hasNewData: !!payload.new,
              hasOldData: !!payload.old
            });

            // Update event statistics
            this.updateState({
              lastEvent: new Date(),
              eventCount: this.state.eventCount + 1,
            });

            try {
              handler(payload);
            } catch (error) {
              console.error(`❌ Error in event handler for ${id}:`, error);
              this.updateState({
                lastError: `Handler error: ${error.message}`,
              });
            }
          }
        );

        // Subscribe to the channel
        channel.subscribe((status, err) => {
          console.log(`📡 Subscription ${id} status: ${status}`, err ? { error: err } : '');
          
          if (status === 'SUBSCRIBED') {
            subscription.isActive = true;
            subscription.channel = channel;
            console.log(`✅ Subscription ${id} activated successfully`);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.error(`❌ Subscription ${id} failed: ${status}`, err);
            subscription.isActive = false;
            this.updateState({
              lastError: `Subscription ${id} failed: ${status}`,
            });
          }
        });
      });

    } catch (error) {
      console.error(`❌ Failed to activate subscription ${id}:`, error);
      this.updateState({
        lastError: `Subscription activation failed: ${error.message}`,
      });
    }
  }

  /**
   * Activate all subscriptions
   */
  private activateAllSubscriptions(): void {
    console.log('🔄 Activating all subscriptions...');
    
    for (const [id] of this.subscriptions) {
      this.activateSubscription(id);
    }
  }

  /**
   * Deactivate all subscriptions
   */
  private deactivateAllSubscriptions(): void {
    console.log('⏸️ Deactivating all subscriptions...');
    
    for (const [, subscription] of this.subscriptions) {
      subscription.isActive = false;
      if (subscription.channel) {
        try {
          subscription.channel.unsubscribe();
        } catch (error) {
          console.warn('⚠️ Error unsubscribing channel:', error);
        }
        subscription.channel = undefined;
      }
    }
  }

  /**
   * Update state and notify listeners
   */
  private updateState(updates: Partial<SubscriptionState>): void {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('❌ Error in subscription state listener:', error);
      }
    });
  }
}
