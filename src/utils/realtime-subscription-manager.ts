
/**
 * @fileoverview Real-time Subscription Manager
 * 
 * Manages real-time subscriptions for database changes with automatic
 * reconnection, error handling, and event processing.
 * 
 * @version 1.0.0
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
  }> = new Map();
  
  private state: SubscriptionState = {
    isActive: false,
    subscriptionCount: 0,
    lastEvent: null,
    eventCount: 0,
    lastError: null,
  };

  private listeners: Set<(state: SubscriptionState) => void> = new Set();

  constructor() {
    this.connectionManager = new RealtimeConnectionManager({
      maxRetries: 3,
      baseRetryDelay: 2000,
      maxRetryDelay: 15000,
      heartbeatInterval: 30000,
      connectionTimeout: 20000,
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
    console.log('🚀 Starting subscription manager...');
    
    const connected = await this.connectionManager.connect();
    if (!connected) {
      this.updateState({ lastError: 'Failed to establish connection' });
      return false;
    }

    return true;
  }

  /**
   * Stop subscription manager
   */
  stop(): void {
    console.log('⏹️ Stopping subscription manager...');
    
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
    
    this.subscriptions.set(id, {
      config,
      handler: handler as EventHandler,
      isActive: false,
    });

    // If connected, activate the subscription immediately
    const connectionState = this.connectionManager.getState();
    if (connectionState.status === 'connected') {
      this.activateSubscription(id);
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
      // Activate all subscriptions
      this.activateAllSubscriptions();
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
   * Activate a specific subscription
   */
  private activateSubscription(id: string): void {
    const subscription = this.subscriptions.get(id);
    if (!subscription || subscription.isActive) {
      return;
    }

    const channel = this.connectionManager.getChannel();
    if (!channel) {
      console.warn(`⚠️ No channel available for subscription: ${id}`);
      return;
    }

    try {
      console.log(`✅ Activating subscription: ${id}`);
      
      const { config, handler } = subscription;
      
      // Use the correct Supabase realtime API pattern
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
            timestamp: new Date().toISOString(),
          });

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

      subscription.isActive = true;
      console.log(`✅ Subscription ${id} activated`);

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
