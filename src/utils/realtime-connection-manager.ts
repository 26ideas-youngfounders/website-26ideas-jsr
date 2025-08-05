/**
 * @fileoverview Real-time WebSocket Connection Manager
 * 
 * Manages WebSocket connection lifecycle with robust error handling,
 * authentication management, and exponential backoff retry logic.
 * 
 * @version 2.0.0
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
  lastHeartbeat: Date | null;
}

export interface ConnectionManagerConfig {
  maxRetries: number;
  baseRetryDelay: number;
  maxRetryDelay: number;
  heartbeatInterval: number;
  connectionTimeout: number;
}

const DEFAULT_CONFIG: ConnectionManagerConfig = {
  maxRetries: 3,
  baseRetryDelay: 2000,
  maxRetryDelay: 15000,
  heartbeatInterval: 30000,
  connectionTimeout: 20000,
};

export class RealtimeConnectionManager {
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
      lastHeartbeat: null,
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
   * Start connection with enhanced authentication validation
   */
  async connect(): Promise<boolean> {
    if (this.isConnecting) {
      console.log('⚠️ Connection attempt already in progress');
      return false;
    }

    this.isConnecting = true;
    console.log('🔗 Starting real-time connection...');
    
    this.updateState({
      status: 'connecting',
      lastError: null,
    });

    try {
      // Step 1: Validate and ensure authentication
      const authResult = await this.ensureAuthentication();
      if (!authResult.success) {
        await this.handleConnectionFailure(authResult.error || 'Authentication failed');
        return false;
      }

      this.updateState({ isAuthenticated: true });

      // Step 2: Set up auth state monitoring to prevent disconnections
      this.setupAuthStateMonitoring();

      // Step 3: Create connection with enhanced validation
      const connected = await this.createEnhancedConnection();
      if (!connected) {
        await this.handleConnectionFailure('Failed to establish WebSocket connection');
        return false;
      }

      this.updateState({
        status: 'connected',
        retryCount: 0,
        connectedAt: new Date(),
        connectionId: `conn_${Date.now()}`,
      });

      this.startHeartbeat();
      console.log('✅ Real-time connection established successfully');
      return true;

    } catch (error) {
      console.error('❌ Connection error:', error);
      await this.handleConnectionFailure(error.message);
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    console.log('🔌 Disconnecting real-time connection...');
    
    this.isConnecting = false;
    this.clearTimeouts();
    this.stopHeartbeat();
    this.cleanupAuthStateMonitoring();
    
    if (this.channel) {
      try {
        supabase.removeChannel(this.channel);
      } catch (error) {
        console.warn('⚠️ Error removing channel:', error);
      }
      this.channel = null;
    }

    this.updateState({
      status: 'disconnected',
      connectionId: null,
      connectedAt: null,
      lastHeartbeat: null,
    });
  }

  /**
   * Get the active channel for subscriptions
   */
  getChannel(): RealtimeChannel | null {
    return this.channel;
  }

  /**
   * Enhanced authentication validation with session verification
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
        
        // Use refreshed session
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
   * Set up auth state monitoring to prevent mid-connection disconnections
   */
  private setupAuthStateMonitoring(): void {
    this.cleanupAuthStateMonitoring();
    
    this.authStateListener = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`🔐 Auth state changed during connection: ${event}`, !!session);
      
      if (event === 'SIGNED_OUT' && this.state.status === 'connected') {
        console.warn('⚠️ User signed out while connected, maintaining connection for stability');
        // Don't immediately disconnect, let the heartbeat handle it
      } else if (event === 'TOKEN_REFRESHED' && session?.access_token) {
        console.log('🔄 Token refreshed, updating realtime auth');
        supabase.realtime.setAuth(session.access_token);
      }
    });
  }

  /**
   * Cleanup auth state monitoring
   */
  private cleanupAuthStateMonitoring(): void {
    if (this.authStateListener) {
      this.authStateListener.data.subscription.unsubscribe();
      this.authStateListener = null;
    }
  }

  /**
   * Create WebSocket connection with enhanced validation and monitoring
   */
  private async createEnhancedConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      console.log('🔌 Creating enhanced WebSocket connection...');
      
      const channelName = `realtime-connection-${Date.now()}`;
      let connectionResolved = false;
      
      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (!connectionResolved) {
          console.error('⏰ Connection timeout after', this.config.connectionTimeout, 'ms');
          connectionResolved = true;
          this.cleanup();
          resolve(false);
        }
      }, this.config.connectionTimeout);

      try {
        this.channel = supabase
          .channel(channelName, {
            config: {
              presence: { key: `admin-${Date.now()}` },
              broadcast: { self: false }
            }
          })
          .on('presence', { event: 'sync' }, () => {
            console.log('👥 Presence sync received - connection active');
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log('👋 Presence join:', key, newPresences.length, 'presences');
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            console.log('👋 Presence leave:', key, leftPresences.length, 'presences');
          })
          .subscribe(async (status, err) => {
            console.log(`📡 Subscription status: ${status}`, err ? { error: err } : '');
            
            if (connectionResolved) return;
            
            if (status === 'SUBSCRIBED') {
              // Wait for WebSocket to stabilize
              setTimeout(async () => {
                if (connectionResolved) return;
                
                const isValid = await this.validateConnectionState();
                console.log(`🔍 Connection validation: ${isValid ? 'VALID' : 'INVALID'}`);
                
                connectionResolved = true;
                this.clearTimeout();
                resolve(isValid);
              }, 3000); // Extended stabilization time
              
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              if (!connectionResolved) {
                connectionResolved = true;
                this.clearTimeout();
                console.error(`❌ Subscription failed: ${status}`, err);
                resolve(false);
              }
            }
          });
          
      } catch (error) {
        if (!connectionResolved) {
          connectionResolved = true;
          this.clearTimeout();
          console.error('❌ Error creating channel:', error);
          resolve(false);
        }
      }
    });
  }

  /**
   * Enhanced connection state validation
   */
  private async validateConnectionState(): Promise<boolean> {
    try {
      if (!this.channel) {
        console.warn('⚠️ No channel to validate');
        return false;
      }

      // Check WebSocket state
      const socket = (this.channel as any).socket;
      if (!socket) {
        console.warn('⚠️ No socket found in channel');
        return false;
      }

      const readyState = socket.readyState;
      const isWebSocketOpen = readyState === 1; // WebSocket.OPEN
      
      console.log(`🔍 WebSocket readyState: ${readyState} (${this.getReadyStateString(readyState)})`);

      // Additional validation: check if we can send a test presence update
      if (isWebSocketOpen) {
        try {
          await this.channel.track({ status: 'online', timestamp: Date.now() });
          console.log('✅ Test presence track successful');
          return true;
        } catch (error) {
          console.warn('⚠️ Test presence track failed:', error);
          return false;
        }
      }
      
      return false;
      
    } catch (error) {
      console.error('❌ Error validating connection state:', error);
      return false;
    }
  }

  /**
   * Get readable WebSocket ready state string
   */
  private getReadyStateString(readyState: number): string {
    const states = {
      0: 'CONNECTING',
      1: 'OPEN',
      2: 'CLOSING',
      3: 'CLOSED'
    };
    return states[readyState] || 'UNKNOWN';
  }

  /**
   * Handle connection failure with enhanced retry logic
   */
  private async handleConnectionFailure(error: string): Promise<void> {
    console.error(`💥 Connection failure: ${error}`);
    
    this.updateState({
      status: 'error',
      lastError: error,
    });

    this.cleanup();

    // Implement retry with exponential backoff
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
      console.error('💀 Max retries reached, giving up');
      this.updateState({
        status: 'error',
        lastError: 'Max connection attempts exceeded',
      });
    }
  }

  /**
   * Start enhanced heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.state.status === 'connected') {
        const isValid = this.validateWebSocketState();
        
        if (isValid) {
          this.updateState({ lastHeartbeat: new Date() });
          console.log('💓 Heartbeat: Connection healthy');
        } else {
          console.warn('💔 Heartbeat: Connection unhealthy, reconnecting...');
          this.handleConnectionFailure('Heartbeat failed - WebSocket not open');
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Validate WebSocket is in OPEN state (synchronous)
   */
  private validateWebSocketState(): boolean {
    try {
      if (!this.channel) return false;
      
      const socket = (this.channel as any).socket;
      if (!socket) return false;
      
      return socket.readyState === 1; // WebSocket.OPEN
      
    } catch (error) {
      console.error('❌ Error validating WebSocket state:', error);
      return false;
    }
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
  private clearTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  /**
   * Clear all timeouts
   */
  private clearTimeouts(): void {
    this.clearTimeout();
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  /**
   * Cleanup connection resources
   */
  private cleanup(): void {
    this.clearTimeouts();
    
    if (this.channel) {
      try {
        supabase.removeChannel(this.channel);
      } catch (error) {
        console.warn('⚠️ Error during cleanup:', error);
      }
      this.channel = null;
    }
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
