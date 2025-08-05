
/**
 * @fileoverview WebSocket Connection Manager
 * 
 * Robust WebSocket connection management with automatic reconnection,
 * exponential backoff, and comprehensive error recovery for Supabase Realtime.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  diagnoseWebSocketConnection, 
  ensureWebSocketConnection, 
  setupRealtimeAuth,
  WEBSOCKET_STATES,
  WEBSOCKET_STATE_NAMES 
} from './websocket-diagnostics';
import type { Session } from '@supabase/supabase-js';

export interface ConnectionManagerOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  timeoutMs: number;
  enableAutoReconnect: boolean;
}

export interface ConnectionStatus {
  isConnected: boolean;
  status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'fallback';
  retryCount: number;
  lastError: string | null;
  lastUpdate: Date | null;
}

/**
 * WebSocket Connection Manager with robust error handling and reconnection
 */
export class WebSocketConnectionManager {
  private options: ConnectionManagerOptions;
  private connectionStatus: ConnectionStatus;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private statusCallbacks: ((status: ConnectionStatus) => void)[] = [];
  private isSetupInProgress = false;

  constructor(options: Partial<ConnectionManagerOptions> = {}) {
    this.options = {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      timeoutMs: 15000,
      enableAutoReconnect: true,
      ...options
    };

    this.connectionStatus = {
      isConnected: false,
      status: 'disconnected',
      retryCount: 0,
      lastError: null,
      lastUpdate: null
    };
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusCallbacks.push(callback);
    // Return unsubscribe function
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Update connection status and notify callbacks
   */
  private updateStatus(updates: Partial<ConnectionStatus>): void {
    this.connectionStatus = {
      ...this.connectionStatus,
      ...updates,
      lastUpdate: new Date()
    };

    console.log('📊 Connection status updated:', this.connectionStatus);

    // Notify all callbacks
    this.statusCallbacks.forEach(callback => {
      try {
        callback({ ...this.connectionStatus });
      } catch (error) {
        console.error('❌ Error in status callback:', error);
      }
    });
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(retryCount: number): number {
    const delay = Math.min(
      this.options.baseDelayMs * Math.pow(2, retryCount),
      this.options.maxDelayMs
    );
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay;
    return Math.floor(delay + jitter);
  }

  /**
   * Establish WebSocket connection with full error handling
   */
  async connect(): Promise<boolean> {
    if (this.isSetupInProgress) {
      console.log('⏳ Connection setup already in progress, skipping...');
      return false;
    }

    this.isSetupInProgress = true;

    try {
      console.log('🚀 Establishing WebSocket connection...');
      this.updateStatus({ status: 'connecting', lastError: null });

      // Step 1: Run diagnostics
      const diagnostics = await diagnoseWebSocketConnection();
      
      if (!diagnostics.isConfigured) {
        throw new Error('Supabase not properly configured - missing URL or key');
      }
      
      if (!diagnostics.isAuthenticated) {
        throw new Error('Authentication required for realtime - user must be signed in');
      }

      // Step 2: Setup authentication
      const session = await setupRealtimeAuth();
      console.log('✅ Authentication setup completed');

      // Step 3: Ensure WebSocket connection
      await ensureWebSocketConnection(this.options.timeoutMs);
      console.log('✅ WebSocket connection established');

      // Update status to connected
      this.updateStatus({
        isConnected: true,
        status: 'connected',
        retryCount: 0,
        lastError: null
      });

      console.log('🎉 WebSocket connection fully established');
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      console.error('❌ WebSocket connection failed:', errorMessage);
      
      this.updateStatus({
        isConnected: false,
        status: 'error',
        lastError: errorMessage
      });

      // Schedule reconnection if enabled
      if (this.options.enableAutoReconnect && this.connectionStatus.retryCount < this.options.maxRetries) {
        this.scheduleReconnect();
      } else {
        console.error('💀 Max retries reached or auto-reconnect disabled, switching to fallback mode');
        this.updateStatus({ status: 'fallback' });
      }

      return false;

    } finally {
      this.isSetupInProgress = false;
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }

    const currentRetry = this.connectionStatus.retryCount;
    const delay = this.calculateBackoffDelay(currentRetry);

    console.log(`🔄 Scheduling reconnection attempt ${currentRetry + 1}/${this.options.maxRetries} in ${delay}ms...`);
    
    this.updateStatus({ 
      retryCount: currentRetry + 1,
      status: 'connecting'
    });

    this.reconnectTimeoutId = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    console.log('🔌 Disconnecting WebSocket connection...');

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    this.updateStatus({
      isConnected: false,
      status: 'disconnected',
      retryCount: 0,
      lastError: null
    });

    this.isSetupInProgress = false;
    console.log('✅ WebSocket disconnected successfully');
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Check if connection is healthy
   */
  isHealthy(): boolean {
    const realtimeSocket = (supabase as any).realtime?.socket;
    const socketState = realtimeSocket?.readyState;
    
    return (
      this.connectionStatus.isConnected && 
      this.connectionStatus.status === 'connected' &&
      socketState === WEBSOCKET_STATES.OPEN
    );
  }

  /**
   * Force immediate reconnection (bypass retry limits)
   */
  async forceReconnect(): Promise<boolean> {
    console.log('🔄 Forcing immediate reconnection...');
    
    this.disconnect();
    
    // Reset retry count for forced reconnection
    this.updateStatus({ retryCount: 0 });
    
    return this.connect();
  }

  /**
   * Cleanup all resources
   */
  destroy(): void {
    console.log('🗑️ Destroying WebSocket connection manager...');
    
    this.disconnect();
    this.statusCallbacks.length = 0;
    
    console.log('✅ WebSocket connection manager destroyed');
  }
}
