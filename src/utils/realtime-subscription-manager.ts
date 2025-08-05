
/**
 * @fileoverview Real-time Subscription Manager
 * 
 * Manages real-time subscriptions for database changes with automatic
 * reconnection, error handling, and event processing.
 * 
 * @version 2.4.0
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
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.connectionManager = new RealtimeConnectionManager({
      maxRetries: 5,
      baseRetryDelay: 1000,
      maxRetryDelay: 8000,
      heartbeatInterval: 30000,
      connectionTimeout: 15000,
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
      // First ensure real-time is enabled for the tables we need
      await this.ensureRealtimeEnabled();
      
      const connected = await this.connectionManager.connect();
      if (!connected) {
        console.error('❌ Connection manager failed to connect');
        this.updateState({ lastError: 'Failed to establish connection' });
        return false;
      }

      // Wait for connection to be fully established
      await new Promise(resolve => setTimeout(resolve, 2000));

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
   * Ensure real-time is enabled for required tables
   */
  private async ensureRealtimeEnabled(): Promise<void> {
    try {
      console.log('🔧 Ensuring real-time is enabled for yff_applications...');
      
      // Import supabase client
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Check if table is in realtime publication (this will fail silently if not admin)
      try {
        const { error } = await supabase.rpc('check_realtime_enabled' as any);
        console.log('📊 Real-time check completed', error ? `with error: ${error.message}` : 'successfully');
      } catch (error) {
        console.log('📊 Real-time check not available (expected for non-admin users)');
      }
      
    } catch (error) {
      console.warn('⚠️ Could not verify real-time setup:', error.message);
    }
  }

  /**
   * Stop subscription manager
   */
  stop(): void {
    console.log('⏹️ Stopping subscription manager...');
    
    this.isStarting = false;
    
    // Clear all reconnect timeouts
    for (const [id, timeout] of this.reconnectTimeouts) {
      clearTimeout(timeout);
    }
    this.reconnectTimeouts.clear();
    
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
      retryCount: 0,
    });

    // If connected, activate the subscription immediately
    const connectionState = this.connectionManager.getState();
    if (connectionState.status === 'connected') {
      setTimeout(() => {
        this.activateSubscription(id);
      }, 500);
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
    
    // Clear any reconnect timeout
    const timeout = this.reconnectTimeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.reconnectTimeouts.delete(id);
    }
    
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
   * Activate a specific subscription with enhanced error handling and direct Supabase approach
   */
  private activateSubscription(id: string): void {
    const subscription = this.subscriptions.get(id);
    if (!subscription || subscription.isActive) {
      return;
    }

    try {
      console.log(`✅ Activating subscription: ${id} for table: ${subscription.config.table}`);
      
      const { config, handler } = subscription;
      
      // Import supabase client directly
      import('@/integrations/supabase/client').then(({ supabase }) => {
        // Create channel with unique name
        const channelName = `realtime:${config.table}:${id}:${Date.now()}`;
        console.log(`📡 Creating channel: ${channelName}`);
        
        const channel = supabase.channel(channelName);
        
        // Configure postgres changes listener with proper typing
        console.log(`🔧 Setting up postgres_changes listener for ${config.table}...`);
        
        const eventConfig = {
          event: config.event || '*',
          schema: config.schema || 'public',
          table: config.table,
          ...(config.filter && { filter: config.filter })
        };
        
        console.log(`📋 Event config:`, eventConfig);
        
        // Use direct channel.on approach with proper event name
        channel.on(
          'postgres_changes' as any,
          eventConfig as any,
          (payload: any) => {
            console.log(`🎉 Real-time event received for ${id}:`, {
              eventType: payload.eventType,
              table: payload.table,
              schema: payload.schema,
              timestamp: new Date().toISOString(),
              hasNewData: !!payload.new,
              hasOldData: !!payload.old,
              payloadKeys: payload.new ? Object.keys(payload.new) : []
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

        // Subscribe to the channel with enhanced status handling
        console.log(`🚀 Subscribing to channel: ${channelName}...`);
        
        channel.subscribe((status, err) => {
          console.log(`📊 Channel ${id} subscription status: ${status}`, err ? { error: err } : '');
          
          if (status === 'SUBSCRIBED') {
            subscription.isActive = true;
            subscription.channel = channel;
            subscription.retryCount = 0;
            console.log(`✅ Subscription ${id} is now ACTIVE and listening for events`);
            
            // Test the subscription immediately with a heartbeat
            setTimeout(() => {
              console.log(`💓 Testing subscription ${id} with heartbeat...`);
            }, 1000);
            
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.error(`❌ Subscription ${id} failed with status: ${status}`, err);
            subscription.isActive = false;
            
            // Enhanced retry logic
            if (subscription.retryCount < 5) {
              subscription.retryCount++;
              const retryDelay = Math.min(2000 * Math.pow(2, subscription.retryCount - 1), 10000);
              console.log(`🔄 Retrying subscription ${id} in ${retryDelay}ms (attempt ${subscription.retryCount}/5)`);
              
              const retryTimeout = setTimeout(() => {
                console.log(`🔄 Executing retry ${subscription.retryCount} for subscription ${id}`);
                this.activateSubscription(id);
              }, retryDelay);
              
              this.reconnectTimeouts.set(id, retryTimeout);
            } else {
              console.error(`💀 Max retry attempts (5) reached for subscription ${id}`);
              this.updateState({
                lastError: `Subscription ${id} permanently failed after 5 attempts: ${status}`,
              });
            }
          }
        });
        
      }).catch(error => {
        console.error(`❌ Failed to import Supabase client for ${id}:`, error);
        this.updateState({
          lastError: `Supabase client import failed: ${error.message}`,
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
      // Stagger activation to avoid overwhelming the connection
      setTimeout(() => {
        this.activateSubscription(id);
      }, Math.random() * 2000);
    }
  }

  /**
   * Deactivate all subscriptions
   */
  private deactivateAllSubscriptions(): void {
    console.log('⏸️ Deactivating all subscriptions...');
    
    for (const [id, subscription] of this.subscriptions) {
      subscription.isActive = false;
      if (subscription.channel) {
        try {
          subscription.channel.unsubscribe();
        } catch (error) {
          console.warn('⚠️ Error unsubscribing channel:', error);
        }
        subscription.channel = undefined;
      }
      
      // Clear any pending reconnect timeout
      const timeout = this.reconnectTimeouts.get(id);
      if (timeout) {
        clearTimeout(timeout);
        this.reconnectTimeouts.delete(id);
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
