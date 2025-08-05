
/**
 * @fileoverview WebSocket Connection Manager
 * 
 * Robust WebSocket connection management with automatic reconnection,
 * exponential backoff, and comprehensive error recovery for Supabase Realtime.
 * 
 * @version 2.1.0
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
  healthCheckIntervalMs: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'fallback';
  retryCount: number;
  lastError: string | null;
  lastUpdate: Date | null;
  connectionId: string;
  uptime: number;
}

/**
 * Enhanced WebSocket Connection Manager with comprehensive error handling
 */
export class WebSocketConnectionManager {
  private options: ConnectionManagerOptions;
  private connectionStatus: ConnectionStatus;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private healthCheckIntervalId: NodeJS.Timeout | null = null;
  private statusCallbacks: ((status: ConnectionStatus) => void)[] = [];
  private isSetupInProgress = false;
  private connectionStartTime: Date | null = null;
  private connectionId: string;

  constructor(options: Partial<ConnectionManagerOptions> = {}) {
    this.options = {
      maxRetries: 5,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      timeoutMs: 20000,
      enableAutoReconnect: true,
      healthCheckIntervalMs: 30000,
      ...options
    };

    this.connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.connectionStatus = {
      isConnected: false,
      status: 'disconnected',
      retryCount: 0,
      lastError: null,
      lastUpdate: null,
      connectionId: this.connectionId,
      uptime: 0
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
    // Calculate uptime
    const uptime = this.connectionStartTime && this.connectionStatus.isConnected
      ? Date.now() - this.connectionStartTime.getTime()
      : 0;

    this.connectionStatus = {
      ...this.connectionStatus,
      ...updates,
      lastUpdate: new Date(),
      uptime
    };

    console.log(`📊 Connection status updated [${this.connectionId}]:`, this.connectionStatus);

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
   * Calculate exponential backoff delay with jitter
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
   * Start health check monitoring
   */
  private startHealthCheck(): void {
    if (this.healthCheckIntervalId) {
      clearInterval(this.healthCheckIntervalId);
    }

    this.healthCheckIntervalId = setInterval(() => {
      const currentHealth = this.isHealthy();
      
      if (!currentHealth && this.connectionStatus.isConnected) {
        console.warn('⚠️ Health check failed - connection appears unhealthy');
        this.updateStatus({
          isConnected: false,
          status: 'error',
          lastError: 'Health check failed - connection lost'
        });

        if (this.options.enableAutoReconnect) {
          this.scheduleReconnect();
        }
      }
    }, this.options.healthCheckIntervalMs);
  }

  /**
   * Stop health check monitoring
   */
  private stopHealthCheck(): void {
    if (this.healthCheckIntervalId) {
      clearInterval(this.healthCheckIntervalId);
      this.healthCheckIntervalId = null;
    }
  }

  /**
   * Establish WebSocket connection with comprehensive error handling
   */
  async connect(): Promise<boolean> {
    if (this.isSetupInProgress) {
      console.log('⏳ Connection setup already in progress, waiting...');
      return false;
    }

    this.isSetupInProgress = true;
    this.connectionStartTime = new Date();

    try {
      console.log(`🚀 Establishing WebSocket connection [${this.connectionId}]...`);
      this.updateStatus({ status: 'connecting', lastError: null });

      // Step 1: Run comprehensive diagnostics
      console.log('🔍 Running enhanced diagnostics...');
      const diagnostics = await diagnoseWebSocketConnection();
      
      if (!diagnostics.isConfigured) {
        throw new Error('Supabase configuration validation failed');
      }
      
      if (!diagnostics.isAuthenticated) {
        throw new Error('Authentication required for realtime - user must be signed in');
      }

      console.log('✅ Diagnostics passed - configuration and authentication valid');

      // Step 2: Setup authentication with token refresh
      console.log('🔐 Setting up realtime authentication...');
      await setupRealtimeAuth();
      console.log('✅ Authentication setup completed successfully');

      // Step 3: Initialize realtime connection with retry
      console.log('🔗 Initializing realtime connection...');
      let initAttempts = 0;
      const maxInitAttempts = 3;
      
      while (initAttempts < maxInitAttempts) {
        try {
          if (!(supabase as any).realtime?.socket) {
            console.log(`🔄 Initializing realtime connection (attempt ${initAttempts + 1})...`);
            (supabase as any).realtime.connect();
            
            // Wait for initialization with progressive delays
            await new Promise(resolve => setTimeout(resolve, (initAttempts + 1) * 500));
          }
          break;
        } catch (initError) {
          console.warn(`⚠️ Initialization attempt ${initAttempts + 1} failed:`, initError);
          initAttempts++;
          
          if (initAttempts >= maxInitAttempts) {
            throw new Error(`Failed to initialize realtime after ${maxInitAttempts} attempts`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000 * initAttempts));
        }
      }

      // Step 4: Ensure WebSocket connection with extended timeout
      console.log('🔗 Establishing WebSocket connection...');
      await ensureWebSocketConnection(this.options.timeoutMs);
      console.log('✅ WebSocket connection established and verified');

      // Step 5: Final health verification
      const finalHealth = this.isHealthy();
      if (!finalHealth) {
        throw new Error('Connection established but health check failed');
      }

      // Update status to connected and start monitoring
      this.updateStatus({
        isConnected: true,
        status: 'connected',
        retryCount: 0,
        lastError: null
      });

      this.startHealthCheck();
      console.log(`🎉 WebSocket connection fully established and healthy [${this.connectionId}]`);
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      console.error(`❌ WebSocket connection failed [${this.connectionId}]:`, errorMessage);
      
      this.updateStatus({
        isConnected: false,
        status: 'error',
        lastError: errorMessage
      });

      // Schedule reconnection if enabled and within retry limits
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
   * Schedule reconnection with enhanced backoff strategy
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }

    this.stopHealthCheck();

    const currentRetry = this.connectionStatus.retryCount;
    const delay = this.calculateBackoffDelay(currentRetry);

    console.log(`🔄 Scheduling reconnection attempt ${currentRetry + 1}/${this.options.maxRetries} in ${delay}ms...`);
    
    this.updateStatus({ 
      retryCount: currentRetry + 1,
      status: 'connecting'
    });

    this.reconnectTimeoutId = setTimeout(() => {
      console.log(`🔄 Executing scheduled reconnection attempt ${currentRetry + 1}...`);
      this.connect();
    }, delay);
  }

  /**
   * Disconnect and cleanup with comprehensive teardown
   */
  disconnect(): void {
    console.log(`🔌 Disconnecting WebSocket connection [${this.connectionId}]...`);

    // Clear all timers
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    this.stopHealthCheck();

    // Disconnect realtime
    try {
      if ((supabase as any).realtime?.socket) {
        (supabase as any).realtime.disconnect();
      }
    } catch (disconnectError) {
      console.warn('⚠️ Error during realtime disconnection:', disconnectError);
    }

    this.updateStatus({
      isConnected: false,
      status: 'disconnected',
      retryCount: 0,
      lastError: null
    });

    this.isSetupInProgress = false;
    this.connectionStartTime = null;
    console.log(`✅ WebSocket disconnected successfully [${this.connectionId}]`);
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Enhanced health check with multiple validation layers
   */
  isHealthy(): boolean {
    const realtimeSocket = (supabase as any).realtime?.socket;
    
    if (!realtimeSocket) {
      return false;
    }
    
    const socketState = realtimeSocket.readyState;
    const isSocketOpen = socketState === WEBSOCKET_STATES.OPEN;
    const isStatusConnected = this.connectionStatus.isConnected && this.connectionStatus.status === 'connected';
    
    // Additional health checks
    const hasValidConnectionState = realtimeSocket.connectionState !== 'closed';
    const isOnline = navigator.onLine;
    
    const isHealthy = isSocketOpen && isStatusConnected && hasValidConnectionState && isOnline;
    
    if (!isHealthy) {
      console.log(`🔍 Health check details:`, {
        socketState: `${socketState} (${WEBSOCKET_STATE_NAMES[socketState] || 'UNKNOWN'})`,
        isSocketOpen,
        isStatusConnected,
        hasValidConnectionState,
        isOnline,
        connectionState: realtimeSocket.connectionState
      });
    }
    
    return isHealthy;
  }

  /**
   * Force immediate reconnection with reset
   */
  async forceReconnect(): Promise<boolean> {
    console.log(`🔄 Forcing immediate reconnection [${this.connectionId}]...`);
    
    // Generate new connection ID for tracking
    this.connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.disconnect();
    
    // Reset retry count for forced reconnection
    this.updateStatus({ 
      retryCount: 0,
      connectionId: this.connectionId
    });
    
    // Small delay to ensure cleanup completes
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return this.connect();
  }

  /**
   * Get connection metrics and diagnostics
   */
  getConnectionMetrics(): object {
    const realtimeSocket = (supabase as any).realtime?.socket;
    
    return {
      connectionId: this.connectionId,
      status: this.connectionStatus,
      socketState: realtimeSocket?.readyState,
      socketStateName: WEBSOCKET_STATE_NAMES[realtimeSocket?.readyState] || 'UNKNOWN',
      connectionState: realtimeSocket?.connectionState,
      channelCount: Object.keys(realtimeSocket?.channels || {}).length,
      sendBufferLength: realtimeSocket?.sendBuffer?.length || 0,
      uptime: this.connectionStatus.uptime,
      healthCheckEnabled: !!this.healthCheckIntervalId,
      autoReconnectEnabled: this.options.enableAutoReconnect,
      options: this.options
    };
  }

  /**
   * Cleanup all resources with comprehensive teardown
   */
  destroy(): void {
    console.log(`🗑️ Destroying WebSocket connection manager [${this.connectionId}]...`);
    
    this.disconnect();
    this.statusCallbacks.length = 0;
    
    console.log(`✅ WebSocket connection manager destroyed [${this.connectionId}]`);
  }
}
