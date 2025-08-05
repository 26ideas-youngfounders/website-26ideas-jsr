
/**
 * @fileoverview Real-time Subscription Manager
 * 
 * Manages real-time subscriptions for database changes with automatic
 * reconnection, error handling, and event processing.
 * 
 * @version 2.0.0
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
  private isStarting = false;

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
   * Start subscription manager with enhanced error handling
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
        this.updateState({ lastError: 'Failed to establish connection' });
        return false;
      }

      // Wait for connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));

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
    this.subscriptions.clear();
    this.connectionManager.disconnect();
    
    this.updateState({
      isActive: false,
      subscriptionCount: 0,
      lastError: null,
    });
  }

  /**
   * Subscribe to database changes with enhanced error handling
   */
  subscribe<T = any>(
    id: string,
    config: SubscriptionConfig,
    handler: EventHandler<T>
  ): boolean {
    console.log(`📡 Adding subscription: ${id}`, config);
    
    if (this.subscriptions.has(id)) {
      console.warn(`⚠️ Subscription ${id} already exists, replacing`);
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
      }, 500); // Small delay to ensure stability
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
    if (subscription?.isActive) {
      // Deactivate subscription if active
      subscription.isActive = false;
    }
    
    this.subscriptions.delete(id);
    
    this.updateState({
      subscriptionCount: this.subscriptions.size,
    });
  }

  /**
   * Handle connection state changes with improved logic
   */
  private handleConnectionStateChange(connectionState: ConnectionState): void {
    console.log(`🔄 Connection state changed: ${connectionState.status}`);
    
    if (connectionState.status === 'connected') {
      // Activate all subscriptions after a short delay to ensure stability
      setTimeout(() => {
        this.activateAllSubscriptions();
      }, 1000);
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
   * Activate a specific subscription with enhanced error handling
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
      console.log(`✅ Subscription ${id} activated successfully`);

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
      // Add small delay between activations to prevent overwhelming
      setTimeout(() => {
        this.activateSubscription(id);
      }, Math.random() * 1000);
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
