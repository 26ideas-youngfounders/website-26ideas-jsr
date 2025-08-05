
/**
 * @fileoverview Complete Real-time Connection Manager Overhaul
 * 
 * Bulletproof WebSocket connection management with comprehensive error handling,
 * authentication verification, and connection recovery mechanisms.
 * 
 * @version 3.0.0 - COMPLETE SYSTEM REBUILD
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';
  isAuthenticated: boolean;
  retryCount: number;
  lastError: string | null;
  connectionId: string;
  connectedAt: Date | null;
  lastHeartbeat: Date | null;
}

export interface ConnectionConfig {
  maxRetries: number;
  baseRetryDelay: number;
  maxRetryDelay: number;
  heartbeatInterval: number;
  connectionTimeout: number;
  authRefreshInterval: number;
}

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
  
  console.log(`[${timestamp}] REALTIME_${operation.toUpperCase()}:`, logEntry);
  
  if (error) {
    console.error(`[${timestamp}] REALTIME_ERROR in ${operation}:`, error);
  }
};

export class RealtimeConnectionManager {
  private state: ConnectionState;
  private config: ConnectionConfig;
  private listeners: Set<(state: ConnectionState) => void> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private authRefreshInterval: NodeJS.Timeout | null = null;
  private connectionAttemptTimeout: NodeJS.Timeout | null = null;
  private channels: Map<string, RealtimeChannel> = new Map();

  constructor(config?: Partial<ConnectionConfig>) {
    this.config = {
      maxRetries: 5,
      baseRetryDelay: 2000,
      maxRetryDelay: 30000,
      heartbeatInterval: 30000,
      connectionTimeout: 20000,
      authRefreshInterval: 300000, // 5 minutes
      ...config,
    };

    this.state = {
      status: 'disconnected',
      isAuthenticated: false,
      retryCount: 0,
      lastError: null,
      connectionId: `conn_${Date.now()}`,
      connectedAt: null,
      lastHeartbeat: null,
    };

    logOperation('CONSTRUCTOR', { config: this.config, initialState: this.state });
  }

  /**
   * FORCE AUTHENTICATION REFRESH AND VERIFICATION
   */
  private async verifyAuthentication(): Promise<boolean> {
    try {
      logOperation('AUTH_VERIFICATION_START', {});

      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        logOperation('AUTH_VERIFICATION_FAILED', { authError }, authError);
        this.updateState({ isAuthenticated: false, lastError: `Auth error: ${authError.message}` });
        return false;
      }

      if (!session) {
        logOperation('AUTH_VERIFICATION_FAILED', { reason: 'No session' });
        this.updateState({ isAuthenticated: false, lastError: 'No authentication session' });
        return false;
      }

      // Verify token is not expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at <= now) {
        logOperation('AUTH_TOKEN_EXPIRED', { expiresAt: session.expires_at, now });
        
        // Attempt to refresh token
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !data.session) {
          logOperation('AUTH_REFRESH_FAILED', { refreshError }, refreshError);
          this.updateState({ isAuthenticated: false, lastError: 'Token refresh failed' });
          return false;
        }
      }

      logOperation('AUTH_VERIFICATION_SUCCESS', { 
        userId: session.user?.id,
        expiresAt: session.expires_at 
      });
      
      this.updateState({ isAuthenticated: true, lastError: null });
      return true;

    } catch (error) {
      logOperation('AUTH_VERIFICATION_ERROR', {}, error);
      this.updateState({ isAuthenticated: false, lastError: `Auth verification error: ${error.message}` });
      return false;
    }
  }

  /**
   * FORCE WEBSOCKET CONNECTION WITH COMPREHENSIVE VERIFICATION
   */
  private async establishWebSocketConnection(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        logOperation('WEBSOCKET_CONNECTION_START', {
          currentState: supabase.realtime.socket?.readyState,
          isConnecting: supabase.realtime.isConnected()
        });

        // Clear any existing connection timeout
        if (this.connectionAttemptTimeout) {
          clearTimeout(this.connectionAttemptTimeout);
        }

        // Set connection timeout
        this.connectionAttemptTimeout = setTimeout(() => {
          const error = new Error('WebSocket connection timeout after 20 seconds');
          logOperation('WEBSOCKET_CONNECTION_TIMEOUT', {}, error);
          this.updateState({ 
            status: 'error', 
            lastError: 'WebSocket connection timeout' 
          });
          reject(error);
        }, this.config.connectionTimeout);

        // Force disconnect if already connected but not working
        if (supabase.realtime.socket?.readyState === 1) {
          logOperation('WEBSOCKET_FORCE_DISCONNECT', { reason: 'Reconnection attempt' });
          supabase.realtime.disconnect();
        }

        // Wait for disconnect to complete
        setTimeout(() => {
          // Force new connection
          logOperation('WEBSOCKET_FORCE_CONNECT', {});
          supabase.realtime.connect();

          // Monitor connection state
          const checkConnection = () => {
            const state = supabase.realtime.socket?.readyState;
            const isConnected = supabase.realtime.isConnected();
            
            logOperation('WEBSOCKET_STATE_CHECK', {
              readyState: state,
              isConnected,
              stateMap: { 0: 'CONNECTING', 1: 'OPEN', 2: 'CLOSING', 3: 'CLOSED' }[state || -1]
            });

            if (state === 1 && isConnected) {
              if (this.connectionAttemptTimeout) {
                clearTimeout(this.connectionAttemptTimeout);
                this.connectionAttemptTimeout = null;
              }
              
              logOperation('WEBSOCKET_CONNECTION_SUCCESS', { readyState: state });
              this.updateState({ 
                status: 'connected', 
                connectedAt: new Date(),
                lastError: null 
              });
              resolve(true);
              
            } else if (state === 3) {
              if (this.connectionAttemptTimeout) {
                clearTimeout(this.connectionAttemptTimeout);
                this.connectionAttemptTimeout = null;
              }
              
              const error = new Error('WebSocket connection failed - CLOSED state');
              logOperation('WEBSOCKET_CONNECTION_FAILED', { readyState: state }, error);
              this.updateState({ 
                status: 'error', 
                lastError: 'WebSocket connection failed' 
              });
              reject(error);
              
            } else if (state === 0 || state === 2) {
              // Still connecting or closing, continue checking
              setTimeout(checkConnection, 200);
              
            } else {
              // Unexpected state
              setTimeout(checkConnection, 200);
            }
          };

          // Start checking connection state
          setTimeout(checkConnection, 500);
        }, 1000);

      } catch (error) {
        if (this.connectionAttemptTimeout) {
          clearTimeout(this.connectionAttemptTimeout);
          this.connectionAttemptTimeout = null;
        }
        
        logOperation('WEBSOCKET_CONNECTION_ERROR', {}, error);
        this.updateState({ 
          status: 'error', 
          lastError: `WebSocket error: ${error.message}` 
        });
        reject(error);
      }
    });
  }

  /**
   * COMPREHENSIVE CONNECTION ESTABLISHMENT
   */
  async connect(): Promise<boolean> {
    try {
      logOperation('CONNECTION_START', { 
        currentState: this.state,
        retryCount: this.state.retryCount 
      });

      this.updateState({ status: 'connecting' });

      // Step 1: Verify authentication
      const isAuthenticated = await this.verifyAuthentication();
      if (!isAuthenticated) {
        throw new Error('Authentication verification failed');
      }

      // Step 2: Establish WebSocket connection
      const isConnected = await this.establishWebSocketConnection();
      if (!isConnected) {
        throw new Error('WebSocket connection failed');
      }

      // Step 3: Setup heartbeat monitoring
      this.startHeartbeat();

      // Step 4: Setup periodic auth refresh
      this.startAuthRefresh();

      logOperation('CONNECTION_SUCCESS', {
        state: this.state,
        socketState: supabase.realtime.socket?.readyState
      });

      return true;

    } catch (error) {
      logOperation('CONNECTION_FAILED', { 
        retryCount: this.state.retryCount,
        maxRetries: this.config.maxRetries 
      }, error);

      this.updateState({ 
        status: 'error', 
        lastError: error.message 
      });

      // Attempt retry if within limits
      if (this.state.retryCount < this.config.maxRetries) {
        const delay = Math.min(
          this.config.baseRetryDelay * Math.pow(2, this.state.retryCount),
          this.config.maxRetryDelay
        );

        logOperation('CONNECTION_RETRY_SCHEDULED', { 
          delay, 
          attempt: this.state.retryCount + 1 
        });

        this.updateState({ 
          status: 'reconnecting', 
          retryCount: this.state.retryCount + 1 
        });

        setTimeout(() => {
          this.connect();
        }, delay);
      }

      return false;
    }
  }

  /**
   * Create and verify channel subscription
   */
  async createChannel(
    name: string, 
    config: { table: string; event?: string; schema?: string },
    callback: (payload: any) => void
  ): Promise<RealtimeChannel | null> {
    try {
      logOperation('CHANNEL_CREATION_START', { name, config });

      if (this.state.status !== 'connected') {
        throw new Error(`Cannot create channel - not connected (status: ${this.state.status})`);
      }

      // Remove existing channel if it exists
      if (this.channels.has(name)) {
        const existingChannel = this.channels.get(name);
        if (existingChannel) {
          logOperation('CHANNEL_CLEANUP_EXISTING', { name });
          await supabase.removeChannel(existingChannel);
        }
        this.channels.delete(name);
      }

      const channelName = `${name}_${Date.now()}`;
      logOperation('CHANNEL_CREATING', { channelName, config });

      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: config.event || '*',
          schema: config.schema || 'public',
          table: config.table
        } as any, (payload: any) => {
          logOperation('CHANNEL_EVENT_RECEIVED', {
            channel: channelName,
            eventType: payload.eventType,
            table: payload.table,
            hasNew: !!payload.new,
            hasOld: !!payload.old
          });
          callback(payload);
        });

      // Subscribe with comprehensive verification
      const subscriptionResult = await new Promise<boolean>((resolve, reject) => {
        const timeout = setTimeout(() => {
          logOperation('CHANNEL_SUBSCRIPTION_TIMEOUT', { channelName });
          reject(new Error(`Channel subscription timeout: ${channelName}`));
        }, 15000);

        channel.subscribe((status, error) => {
          logOperation('CHANNEL_SUBSCRIPTION_STATUS', {
            channelName,
            status,
            error: error ? {
              message: error.message,
              type: error.constructor.name
            } : null
          });

          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            logOperation('CHANNEL_SUBSCRIPTION_SUCCESS', { channelName });
            resolve(true);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            clearTimeout(timeout);
            logOperation('CHANNEL_SUBSCRIPTION_FAILED', { channelName, status, error }, error);
            reject(new Error(`Channel subscription failed: ${status} - ${error?.message || 'Unknown error'}`));
          }
        });
      });

      if (subscriptionResult) {
        this.channels.set(name, channel);
        logOperation('CHANNEL_CREATION_SUCCESS', { 
          name, 
          channelName,
          totalChannels: this.channels.size 
        });
        return channel;
      }

      return null;

    } catch (error) {
      logOperation('CHANNEL_CREATION_ERROR', { name, config }, error);
      return null;
    }
  }

  /**
   * Disconnect and cleanup all resources
   */
  disconnect(): void {
    logOperation('DISCONNECT_START', { channelCount: this.channels.size });

    // Clear timeouts
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.authRefreshInterval) {
      clearInterval(this.authRefreshInterval);
      this.authRefreshInterval = null;
    }

    if (this.connectionAttemptTimeout) {
      clearTimeout(this.connectionAttemptTimeout);
      this.connectionAttemptTimeout = null;
    }

    // Cleanup all channels
    for (const [name, channel] of this.channels) {
      try {
        logOperation('CHANNEL_CLEANUP', { name });
        supabase.removeChannel(channel);
      } catch (error) {
        logOperation('CHANNEL_CLEANUP_ERROR', { name }, error);
      }
    }
    this.channels.clear();

    // Disconnect WebSocket
    try {
      supabase.realtime.disconnect();
    } catch (error) {
      logOperation('WEBSOCKET_DISCONNECT_ERROR', {}, error);
    }

    this.updateState({
      status: 'disconnected',
      isAuthenticated: false,
      retryCount: 0,
      connectedAt: null,
      lastHeartbeat: null,
      lastError: null
    });

    logOperation('DISCONNECT_COMPLETE', {});
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      const socketState = supabase.realtime.socket?.readyState;
      const isConnected = supabase.realtime.isConnected();
      
      logOperation('HEARTBEAT', {
        socketState,
        isConnected,
        stateMap: { 0: 'CONNECTING', 1: 'OPEN', 2: 'CLOSING', 3: 'CLOSED' }[socketState || -1]
      });

      if (socketState === 1 && isConnected) {
        this.updateState({ lastHeartbeat: new Date() });
      } else {
        logOperation('HEARTBEAT_CONNECTION_LOST', { socketState, isConnected });
        this.updateState({ 
          status: 'error', 
          lastError: 'Connection lost during heartbeat' 
        });
        
        // Attempt reconnection
        this.connect();
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Start periodic auth refresh
   */
  private startAuthRefresh(): void {
    if (this.authRefreshInterval) {
      clearInterval(this.authRefreshInterval);
    }

    this.authRefreshInterval = setInterval(async () => {
      logOperation('AUTH_REFRESH_SCHEDULED', {});
      await this.verifyAuthentication();
    }, this.config.authRefreshInterval);
  }

  /**
   * Add state change listener
   */
  addListener(listener: (state: ConnectionState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current state
   */
  getState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Update state and notify listeners
   */
  private updateState(updates: Partial<ConnectionState>): void {
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
