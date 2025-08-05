
/**
 * @fileoverview Real-time WebSocket Connection Manager
 * 
 * Manages WebSocket connection lifecycle with robust error handling,
 * authentication management, and exponential backoff retry logic.
 * 
 * @version 1.0.0
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
  maxRetries: 5,
  baseRetryDelay: 1000,
  maxRetryDelay: 30000,
  heartbeatInterval: 30000,
  connectionTimeout: 15000,
};

export class RealtimeConnectionManager {
  private config: ConnectionManagerConfig;
  private state: ConnectionState;
  private channel: RealtimeChannel | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private listeners: Set<(state: ConnectionState) => void> = new Set();

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
   * Start connection with authentication validation
   */
  async connect(): Promise<boolean> {
    console.log('🔗 Starting real-time connection...');
    
    this.updateState({
      status: 'connecting',
      lastError: null,
    });

    try {
      // Validate authentication
      const authResult = await this.validateAuthentication();
      if (!authResult.success) {
        this.updateState({
          status: 'error',
          lastError: authResult.error,
          isAuthenticated: false,
        });
        return false;
      }

      this.updateState({ isAuthenticated: true });

      // Create connection with timeout
      const connected = await this.createConnection();
      if (!connected) {
        await this.handleConnectionFailure('Failed to establish connection');
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
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    console.log('🔌 Disconnecting real-time connection...');
    
    this.clearTimeouts();
    this.stopHeartbeat();
    
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
   * Validate authentication and refresh token if needed
   */
  private async validateAuthentication(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 Validating authentication...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return { success: false, error: `Auth error: ${error.message}` };
      }

      if (!session) {
        return { success: false, error: 'No active session found' };
      }

      if (!session.access_token) {
        return { success: false, error: 'No access token in session' };
      }

      // Check token expiry (refresh if needed)
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at <= now + 300) { // 5 minutes buffer
        console.log('🔄 Token expires soon, refreshing...');
        
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          return { success: false, error: `Token refresh failed: ${refreshError.message}` };
        }
      }

      // Set realtime auth
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.access_token) {
        supabase.realtime.setAuth(currentSession.access_token);
        console.log('✅ Authentication validated and realtime auth set');
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Authentication validation failed: ${error.message}` };
    }
  }

  /**
   * Create WebSocket connection with timeout
   */
  private async createConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      console.log('🔌 Creating WebSocket connection...');
      
      const channelName = `realtime-connection-${Date.now()}`;
      
      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        console.error('⏰ Connection timeout');
        this.cleanup();
        resolve(false);
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
            console.log('👥 Presence sync received');
          })
          .subscribe((status, err) => {
            console.log(`📡 Subscription status: ${status}`, err ? { error: err } : '');
            
            if (status === 'SUBSCRIBED') {
              this.clearTimeout();
              
              // Validate WebSocket state
              setTimeout(() => {
                const isOpen = this.validateWebSocketState();
                console.log(`🔍 WebSocket validation: ${isOpen ? 'OPEN' : 'NOT OPEN'}`);
                resolve(isOpen);
              }, 2000); // Allow time for connection to stabilize
              
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              this.clearTimeout();
              console.error(`❌ Subscription failed: ${status}`);
              resolve(false);
            }
          });
          
      } catch (error) {
        this.clearTimeout();
        console.error('❌ Error creating channel:', error);
        resolve(false);
      }
    });
  }

  /**
   * Validate WebSocket is in OPEN state
   */
  private validateWebSocketState(): boolean {
    try {
      if (!this.channel) {
        console.warn('⚠️ No channel to validate');
        return false;
      }

      const socket = (this.channel as any).socket;
      if (!socket) {
        console.warn('⚠️ No socket found in channel');
        return false;
      }

      const readyState = socket.readyState;
      const states = {
        0: 'CONNECTING',
        1: 'OPEN',
        2: 'CLOSING',
        3: 'CLOSED'
      };

      const stateName = states[readyState] || 'UNKNOWN';
      console.log(`🔍 WebSocket readyState: ${readyState} (${stateName})`);
      
      return readyState === 1; // WebSocket.OPEN
      
    } catch (error) {
      console.error('❌ Error validating WebSocket state:', error);
      return false;
    }
  }

  /**
   * Handle connection failure with retry logic
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
      
      this.retryTimeout = setTimeout(() => {
        this.connect();
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
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.state.status === 'connected') {
        const isOpen = this.validateWebSocketState();
        
        if (isOpen) {
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
