
/**
 * @fileoverview Robust Real-time WebSocket Connection Manager
 * 
 * Manages WebSocket connection lifecycle with comprehensive error handling,
 * authentication management, and connection recovery.
 * 
 * @version 3.0.0
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';
  isAuthenticated: boolean;
  retryCount: number;
  lastError: string | null;
  connectionId: string | null;
  connectedAt: Date | null;
  lastActivity: Date | null;
}

export interface ConnectionManagerConfig {
  maxRetries: number;
  baseRetryDelay: number;
  maxRetryDelay: number;
  connectionTimeout: number;
  heartbeatInterval: number;
}

const DEFAULT_CONFIG: ConnectionManagerConfig = {
  maxRetries: 5,
  baseRetryDelay: 1000,
  maxRetryDelay: 10000,
  connectionTimeout: 20000,
  heartbeatInterval: 30000,
};

export class RealTimeConnectionManagerV2 {
  private config: ConnectionManagerConfig;
  private state: ConnectionState;
  private channel: RealtimeChannel | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private listeners: Set<(state: ConnectionState) => void> = new Set();
  private isConnecting = false;
  private authStateListener: any = null;

  constructor(config: Partial<ConnectionManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      status: 'disconnected',
      isAuthenticated: false,
      retryCount: 0,
      lastError: null,
      connectionId: null,
      connectedAt: null,
      lastActivity: null,
    };
  }

  /**
   * Add state change listener
   */
  addListener(listener: (state: ConnectionState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Force authentication refresh and validation
   */
  private async ensureAuthentication(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 Ensuring authentication state...');
      
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return { success: false, error: `Auth error: ${error.message}` };
      }

      if (!session?.access_token) {
        return { success: false, error: 'No valid session or access token found' };
      }

      // Verify token is not expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at <= now) {
        console.log('🔄 Token expired, attempting refresh...');
        
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshedSession?.access_token) {
          return { success: false, error: `Token refresh failed: ${refreshError?.message || 'No session after refresh'}` };
        }
        
        // Set refreshed token for realtime
        supabase.realtime.setAuth(refreshedSession.access_token);
      } else {
        // Use current session
        supabase.realtime.setAuth(session.access_token);
      }

      console.log('✅ Authentication validated and realtime auth set');
      return { success: true };
      
    } catch (error) {
      return { success: false, error: `Authentication validation failed: ${error.message}` };
    }
  }

  /**
   * Establish WebSocket connection with comprehensive validation
   */
  private async establishWebSocketConnection(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      console.log('🔌 Establishing WebSocket connection...');
      
      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        console.error('⏰ WebSocket connection timeout');
        reject(new Error('WebSocket connection timeout'));
      }, this.config.connectionTimeout);

      // Check current socket state
      const currentState = supabase.realtime.socket?.readyState;
      console.log(`📡 Current WebSocket state: ${currentState}`);

      if (currentState === WebSocket.OPEN) {
        console.log('✅ WebSocket already connected');
        this.clearConnectionTimeout();
        resolve(true);
        return;
      }

      // Force connection if not connected
      if (currentState !== WebSocket.CONNECTING) {
        console.log('🔄 Initiating WebSocket connection...');
        supabase.realtime.connect();
      }

      // Monitor connection state changes
      const checkConnection = () => {
        const state = supabase.realtime.socket?.readyState;
        
        if (state === WebSocket.OPEN) {
          console.log('✅ WebSocket connection established');
          this.clearConnectionTimeout();
          resolve(true);
        } else if (state === WebSocket.CLOSED || state === WebSocket.CLOSING) {
          console.error('❌ WebSocket connection failed or closed');
          this.clearConnectionTimeout();
          reject(new Error(`WebSocket connection failed, state: ${state}`));
        } else {
          // Still connecting, check again
          setTimeout(checkConnection, 200);
        }
      };

      checkConnection();
    });
  }

  /**
   * Create and verify channel subscription
   */
  private async createChannelSubscription(): Promise<RealtimeChannel> {
    return new Promise((resolve, reject) => {
      console.log('📡 Creating channel subscription...');
      
      const channelName = `yff-realtime-${Date.now()}`;
      let subscriptionResolved = false;
      
      // Create timeout for subscription
      const subscriptionTimeout = setTimeout(() => {
        if (!subscriptionResolved) {
          subscriptionResolved = true;
          console.error('⏰ Channel subscription timeout');
          reject(new Error('Channel subscription timeout'));
        }
      }, 15000);

      try {
        this.channel = supabase
          .channel(channelName, {
            config: {
              presence: { key: `user-${Date.now()}` },
            }
          })
          .on('presence', { event: 'sync' }, () => {
            console.log('👥 Presence sync received');
            this.updateState({ lastActivity: new Date() });
          })
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'yff_applications'
          }, (payload) => {
            console.log('📨 Real-time event received:', {
              eventType: payload.eventType,
              table: payload.table,
              timestamp: new Date().toISOString()
            });
            this.updateState({ lastActivity: new Date() });
          })
          .subscribe(async (status, err) => {
            console.log(`📊 Channel subscription status: ${status}`, err ? { error: err } : '');
            
            if (subscriptionResolved) return;
            
            if (status === 'SUBSCRIBED') {
              console.log('✅ Channel subscribed successfully');
              
              // Track presence to validate connection
              try {
                await this.channel?.track({ 
                  status: 'online', 
                  timestamp: Date.now(),
                  userId: supabase.auth.getUser().then(u => u.data.user?.id)
                });
                console.log('✅ Presence tracking successful');
              } catch (error) {
                console.warn('⚠️ Presence tracking failed:', error);
              }
              
              subscriptionResolved = true;
              clearTimeout(subscriptionTimeout);
              resolve(this.channel!);
              
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              if (!subscriptionResolved) {
                subscriptionResolved = true;
                clearTimeout(subscriptionTimeout);
                console.error(`❌ Channel subscription failed: ${status}`, err);
                reject(new Error(`Channel subscription failed: ${status} ${err ? err.message || err : ''}`));
              }
            }
          });
          
      } catch (error) {
        if (!subscriptionResolved) {
          subscriptionResolved = true;
          clearTimeout(subscriptionTimeout);
          console.error('❌ Error creating channel:', error);
          reject(new Error(`Channel creation failed: ${error.message}`));
        }
      }
    });
  }

  /**
   * Start connection with full error handling and retry logic
   */
  async connect(): Promise<boolean> {
    if (this.isConnecting) {
      console.log('⚠️ Connection attempt already in progress');
      return false;
    }

    this.isConnecting = true;
    console.log('🚀 Starting real-time connection...');
    
    this.updateState({
      status: 'connecting',
      lastError: null,
    });

    try {
      // Step 1: Ensure authentication
      const authResult = await this.ensureAuthentication();
      if (!authResult.success) {
        throw new Error(authResult.error || 'Authentication failed');
      }

      this.updateState({ isAuthenticated: true });

      // Step 2: Establish WebSocket connection
      await this.establishWebSocketConnection();

      // Step 3: Create channel subscription
      await this.createChannelSubscription();

      // Step 4: Success
      this.updateState({
        status: 'connected',
        retryCount: 0,
        connectedAt: new Date(),
        connectionId: `conn_${Date.now()}`,
        lastActivity: new Date(),
      });

      this.startHeartbeat();
      console.log('🎉 Real-time connection established successfully');
      return true;

    } catch (error) {
      console.error('💥 Connection failed:', error);
      await this.handleConnectionFailure(error.message);
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Handle connection failure with exponential backoff retry
   */
  private async handleConnectionFailure(error: string): Promise<void> {
    console.error(`💥 Connection failure: ${error}`);
    
    this.updateState({
      status: 'error',
      lastError: error,
    });

    this.cleanup();

    // Retry with exponential backoff
    if (this.state.retryCount < this.config.maxRetries) {
      const delay = Math.min(
        this.config.baseRetryDelay * Math.pow(2, this.state.retryCount),
        this.config.maxRetryDelay
      );

      this.updateState({
        status: 'reconnecting',
        retryCount: this.state.retryCount + 1,
      });

      console.log(`🔄 Retrying connection in ${delay}ms (attempt ${this.state.retryCount}/${this.config.maxRetries})`);
      
      this.retryTimeout = setTimeout(async () => {
        await this.connect();
      }, delay);
      
    } else {
      console.error('💀 Max retries reached, connection failed permanently');
      this.updateState({
        status: 'error',
        lastError: 'Max connection attempts exceeded',
      });
    }
  }

  /**
   * Start heartbeat to monitor connection health
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(async () => {
      if (this.state.status === 'connected' && this.channel) {
        try {
          await this.channel.track({ 
            heartbeat: Date.now(),
            status: 'alive'
          });
          this.updateState({ lastActivity: new Date() });
          console.log('💓 Heartbeat sent successfully');
        } catch (error) {
          console.error('💔 Heartbeat failed:', error);
          this.handleConnectionFailure('Heartbeat failed');
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat monitoring
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Clear connection timeout
   */
  private clearConnectionTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  /**
   * Clear all timeouts
   */
  private clearAllTimeouts(): void {
    this.clearConnectionTimeout();
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  /**
   * Cleanup connection resources
   */
  private cleanup(): void {
    this.clearAllTimeouts();
    
    if (this.channel) {
      try {
        supabase.removeChannel(this.channel);
      } catch (error) {
        console.warn('⚠️ Error during channel cleanup:', error);
      }
      this.channel = null;
    }
  }

  /**
   * Disconnect and cleanup all resources
   */
  disconnect(): void {
    console.log('🔌 Disconnecting real-time connection...');
    
    this.isConnecting = false;
    this.stopHeartbeat();
    this.cleanup();
    
    if (this.authStateListener) {
      this.authStateListener.data.subscription.unsubscribe();
      this.authStateListener = null;
    }

    this.updateState({
      status: 'disconnected',
      connectionId: null,
      connectedAt: null,
      lastActivity: null,
    });
  }

  /**
   * Get the active channel for subscriptions
   */
  getChannel(): RealtimeChannel | null {
    return this.channel;
  }

  /**
   * Update state and notify listeners
   */
  private updateState(updates: Partial<ConnectionState>): void {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('❌ Error in state listener:', error);
      }
    });
  }
}
