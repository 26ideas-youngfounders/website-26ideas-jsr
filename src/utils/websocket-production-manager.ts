
/**
 * @fileoverview Production WebSocket Manager
 * 
 * Enterprise-grade WebSocket connection management with comprehensive
 * error handling, monitoring, and fallback strategies.
 * 
 * @version 4.0.0
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

export interface ProductionConnectionStatus {
  isConnected: boolean;
  status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'fallback';
  retryCount: number;
  lastError: string | null;
  lastUpdate: Date | null;
  connectionId: string;
  uptime: number;
  diagnostics: {
    socketState: number | null;
    socketStateName: string;
    authenticationValid: boolean;
    networkLatency: number | null;
    connectionAttempts: number;
  };
}

export interface ConnectionMetrics {
  totalConnections: number;
  successfulConnections: number;
  failedConnections: number;
  averageConnectionTime: number;
  longestUptime: number;
  fallbackActivations: number;
}

/**
 * Production-grade WebSocket Connection Manager
 */
export class WebSocketProductionManager {
  private status: ProductionConnectionStatus;
  private metrics: ConnectionMetrics;
  private statusCallbacks: ((status: ProductionConnectionStatus) => void)[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionAttemptTimeout: NodeJS.Timeout | null = null;
  private fallbackModeActive = false;
  private connectionStartTime: number | null = null;
  
  // Configuration
  private readonly config = {
    maxRetries: 3,
    initialRetryDelay: 1000,
    maxRetryDelay: 30000,
    connectionTimeout: 20000,
    heartbeatInterval: 30000,
    healthCheckInterval: 10000,
    fallbackMode: {
      enabled: true,
      refreshInterval: 60000
    }
  };

  constructor() {
    const connectionId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.status = {
      isConnected: false,
      status: 'disconnected',
      retryCount: 0,
      lastError: null,
      lastUpdate: null,
      connectionId,
      uptime: 0,
      diagnostics: {
        socketState: null,
        socketStateName: 'UNKNOWN',
        authenticationValid: false,
        networkLatency: null,
        connectionAttempts: 0
      }
    };
    
    this.metrics = {
      totalConnections: 0,
      successfulConnections: 0,
      failedConnections: 0,
      averageConnectionTime: 0,
      longestUptime: 0,
      fallbackActivations: 0
    };
    
    // Start health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Establish WebSocket connection with comprehensive error handling
   */
  async connect(): Promise<boolean> {
    console.log(`🚀 [${this.status.connectionId}] Starting production WebSocket connection...`);
    
    this.updateStatus({ status: 'connecting' });
    this.connectionStartTime = Date.now();
    this.metrics.totalConnections++;
    
    try {
      // Phase 1: Pre-connection validation
      const preValidation = await this.performPreConnectionValidation();
      if (!preValidation.success) {
        throw new Error(`Pre-connection validation failed: ${preValidation.error}`);
      }
      
      // Phase 2: Authentication setup
      const authSetup = await this.setupAuthentication();
      if (!authSetup.success) {
        throw new Error(`Authentication setup failed: ${authSetup.error}`);
      }
      
      // Phase 3: Network connectivity test
      const networkTest = await this.testNetworkConnectivity();
      if (!networkTest.success) {
        throw new Error(`Network connectivity test failed: ${networkTest.error}`);
      }
      
      // Phase 4: WebSocket connection establishment
      const connectionResult = await this.establishWebSocketConnection();
      if (!connectionResult.success) {
        throw new Error(`WebSocket connection failed: ${connectionResult.error}`);
      }
      
      // Phase 5: Post-connection validation
      const postValidation = await this.performPostConnectionValidation();
      if (!postValidation.success) {
        throw new Error(`Post-connection validation failed: ${postValidation.error}`);
      }
      
      // Success!
      const connectionTime = Date.now() - this.connectionStartTime;
      this.metrics.successfulConnections++;
      
      this.updateStatus({
        isConnected: true,
        status: 'connected',
        retryCount: 0,
        lastError: null,
        diagnostics: {
          ...this.status.diagnostics,
          authenticationValid: true,
          connectionAttempts: this.status.diagnostics.connectionAttempts + 1
        }
      });
      
      this.startHeartbeat();
      console.log(`✅ [${this.status.connectionId}] WebSocket connection established successfully in ${connectionTime}ms`);
      
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      const connectionTime = Date.now() - (this.connectionStartTime || Date.now());
      
      console.error(`❌ [${this.status.connectionId}] Connection failed after ${connectionTime}ms:`, errorMessage);
      
      this.metrics.failedConnections++;
      this.updateStatus({
        isConnected: false,
        status: 'error',
        lastError: errorMessage,
        diagnostics: {
          ...this.status.diagnostics,
          connectionAttempts: this.status.diagnostics.connectionAttempts + 1
        }
      });
      
      // Retry or fallback
      if (this.status.retryCount < this.config.maxRetries) {
        await this.scheduleRetry();
      } else {
        await this.activateFallbackMode();
      }
      
      return false;
    }
  }
  
  /**
   * Pre-connection validation
   */
  private async performPreConnectionValidation(): Promise<{ success: boolean; error?: string }> {
    console.log(`🔍 [${this.status.connectionId}] Performing pre-connection validation...`);
    
    try {
      // Check browser environment
      if (typeof window === 'undefined' || typeof WebSocket === 'undefined') {
        return { success: false, error: 'WebSocket not supported in this environment' };
      }
      
      // Check network status
      if (!navigator.onLine) {
        return { success: false, error: 'No network connectivity detected' };
      }
      
      // Check Supabase client
      if (!supabase) {
        return { success: false, error: 'Supabase client not initialized' };
      }
      
      // Basic connectivity test
      try {
        const response = await fetch('https://jdqsgigwbcukxijiunwl.supabase.co/rest/v1/', {
          method: 'HEAD',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcXNnaWd3YmN1a3hpaml1bndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODA2NDcsImV4cCI6MjA2ODk1NjY0N30.QWqLMVIH_ej2A7shVjN-FEWzMA6uP0_L5w315Fxhx08'
          },
          signal: AbortSignal.timeout(10000)
        });
        
        if (!response.ok) {
          return { success: false, error: `HTTP connectivity test failed: ${response.status}` };
        }
      } catch (error) {
        return { success: false, error: `Network request failed: ${error instanceof Error ? error.message : 'Unknown'}` };
      }
      
      console.log(`✅ [${this.status.connectionId}] Pre-connection validation passed`);
      return { success: true };
      
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown validation error' };
    }
  }
  
  /**
   * Setup authentication
   */
  private async setupAuthentication(): Promise<{ success: boolean; error?: string; session?: Session }> {
    console.log(`🔐 [${this.status.connectionId}] Setting up authentication...`);
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return { success: false, error: `Auth error: ${error.message}` };
      }
      
      if (!session) {
        return { success: false, error: 'No active session found' };
      }
      
      if (!session.access_token) {
        return { success: false, error: 'Session missing access token' };
      }
      
      // Check token expiration
      try {
        const tokenParts = session.access_token.split('.');
        const payload = JSON.parse(atob(tokenParts[1]));
        const now = Date.now() / 1000;
        const timeUntilExpiry = payload.exp - now;
        
        if (timeUntilExpiry < 300) { // Less than 5 minutes
          console.log(`🔄 [${this.status.connectionId}] Token expires soon, refreshing...`);
          
          const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !refreshedData.session) {
            return { success: false, error: `Token refresh failed: ${refreshError?.message || 'Unknown error'}` };
          }
          
          console.log(`✅ [${this.status.connectionId}] Token refreshed successfully`);
          return { success: true, session: refreshedData.session };
        }
      } catch (tokenError) {
        console.warn(`⚠️ [${this.status.connectionId}] Token parsing failed:`, tokenError);
      }
      
      console.log(`✅ [${this.status.connectionId}] Authentication setup completed`);
      return { success: true, session };
      
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown auth error' };
    }
  }
  
  /**
   * Test network connectivity
   */
  private async testNetworkConnectivity(): Promise<{ success: boolean; error?: string; latency?: number }> {
    console.log(`🌐 [${this.status.connectionId}] Testing network connectivity...`);
    
    try {
      const startTime = Date.now();
      
      const response = await Promise.race([
        fetch('https://jdqsgigwbcukxijiunwl.supabase.co/rest/v1/', {
          method: 'HEAD',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcXNnaWd3YmN1a3hpaml1bndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODA2NDcsImV4cCI6MjA2ODk1NjY0N30.QWqLMVIH_ej2A7shVjN-FEWzMA6uP0_L5w315Fxhx08'
          }
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Network test timeout')), 10000)
        )
      ]);
      
      const latency = Date.now() - startTime;
      
      if (!response.ok) {
        return { success: false, error: `Network test failed: ${response.status}`, latency };
      }
      
      this.updateStatus({
        diagnostics: {
          ...this.status.diagnostics,
          networkLatency: latency
        }
      });
      
      console.log(`✅ [${this.status.connectionId}] Network connectivity test passed (${latency}ms)`);
      return { success: true, latency };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network test failed' 
      };
    }
  }
  
  /**
   * Establish WebSocket connection
   */
  private async establishWebSocketConnection(): Promise<{ success: boolean; error?: string }> {
    console.log(`🔗 [${this.status.connectionId}] Establishing WebSocket connection...`);
    
    try {
      // Initialize or get realtime client
      const realtimeClient = (supabase as any).realtime;
      
      if (!realtimeClient) {
        return { success: false, error: 'Realtime client not available' };
      }
      
      // Force connection
      realtimeClient.connect();
      
      // Wait for connection with timeout
      const connectionPromise = new Promise<{ success: boolean; error?: string }>((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ success: false, error: 'Connection timeout' });
        }, this.config.connectionTimeout);
        
        const checkConnection = () => {
          const socket = realtimeClient.socket;
          
          if (socket && socket.readyState === WebSocket.OPEN) {
            clearTimeout(timeout);
            this.updateStatus({
              diagnostics: {
                ...this.status.diagnostics,
                socketState: socket.readyState,
                socketStateName: 'OPEN'
              }
            });
            resolve({ success: true });
          } else if (socket && socket.readyState === WebSocket.CLOSED) {
            clearTimeout(timeout);
            resolve({ success: false, error: 'Socket closed unexpectedly' });
          } else {
            // Still connecting, check again
            setTimeout(checkConnection, 100);
          }
        };
        
        checkConnection();
      });
      
      const result = await connectionPromise;
      
      if (result.success) {
        console.log(`✅ [${this.status.connectionId}] WebSocket connection established`);
      } else {
        console.error(`❌ [${this.status.connectionId}] WebSocket connection failed: ${result.error}`);
      }
      
      return result;
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection establishment failed' 
      };
    }
  }
  
  /**
   * Post-connection validation
   */
  private async performPostConnectionValidation(): Promise<{ success: boolean; error?: string }> {
    console.log(`✅ [${this.status.connectionId}] Performing post-connection validation...`);
    
    try {
      const realtimeSocket = (supabase as any).realtime?.socket;
      
      if (!realtimeSocket) {
        return { success: false, error: 'No socket available after connection' };
      }
      
      if (realtimeSocket.readyState !== WebSocket.OPEN) {
        return { 
          success: false, 
          error: `Socket not in OPEN state: ${this.getSocketStateName(realtimeSocket.readyState)}` 
        };
      }
      
      // Test basic message sending
      try {
        realtimeSocket.send(JSON.stringify({
          topic: 'phoenix',
          event: 'heartbeat',
          payload: {},
          ref: `validation_${Date.now()}`
        }));
      } catch (sendError) {
        return { success: false, error: 'Failed to send test message' };
      }
      
      console.log(`✅ [${this.status.connectionId}] Post-connection validation passed`);
      return { success: true };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Post-connection validation failed' 
      };
    }
  }
  
  /**
   * Schedule retry with exponential backoff
   */
  private async scheduleRetry(): Promise<void> {
    const retryCount = this.status.retryCount + 1;
    const delay = Math.min(
      this.config.initialRetryDelay * Math.pow(2, retryCount - 1),
      this.config.maxRetryDelay
    );
    
    console.log(`🔄 [${this.status.connectionId}] Scheduling retry ${retryCount}/${this.config.maxRetries} in ${delay}ms...`);
    
    this.updateStatus({ 
      retryCount,
      status: 'connecting'
    });
    
    this.connectionAttemptTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  /**
   * Activate fallback mode
   */
  private async activateFallbackMode(): Promise<void> {
    console.warn(`⚠️ [${this.status.connectionId}] Activating fallback mode after ${this.config.maxRetries} failed attempts`);
    
    this.fallbackModeActive = true;
    this.metrics.fallbackActivations++;
    
    this.updateStatus({
      status: 'fallback',
      lastError: 'Max retries reached, operating in fallback mode'
    });
    
    // Alert engineering team (this would trigger monitoring)
    this.sendFallbackAlert();
    
    // Start periodic polling as fallback
    this.startFallbackPolling();
  }
  
  /**
   * Send fallback alert to engineering team
   */
  private sendFallbackAlert(): void {
    // In production, this would integrate with monitoring systems
    console.error(`🚨 [${this.status.connectionId}] FALLBACK MODE ACTIVATED - Real-time functionality degraded`);
    
    // Placeholder for actual alerting integration
    const alertPayload = {
      severity: 'P3',
      title: 'WebSocket Connection Fallback Mode Activated',
      message: `Connection ${this.status.connectionId} failed after ${this.config.maxRetries} attempts`,
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      status: this.status
    };
    
    console.log('Alert payload:', JSON.stringify(alertPayload, null, 2));
  }
  
  /**
   * Start fallback polling
   */
  private startFallbackPolling(): void {
    console.log(`🔄 [${this.status.connectionId}] Starting fallback polling every ${this.config.fallbackMode.refreshInterval}ms`);
    
    const pollData = async () => {
      try {
        // Trigger data refresh - in production, this would refresh queries
        console.log(`📊 [${this.status.connectionId}] Fallback data refresh`);
        
        // Attempt to restore real-time connection periodically
        if (Date.now() % (this.config.fallbackMode.refreshInterval * 10) === 0) {
          console.log(`🔄 [${this.status.connectionId}] Attempting to restore real-time connection...`);
          this.status.retryCount = 0; // Reset retry count
          this.connect();
        }
      } catch (error) {
        console.error(`❌ [${this.status.connectionId}] Fallback polling error:`, error);
      }
    };
    
    // Start polling
    setInterval(pollData, this.config.fallbackMode.refreshInterval);
  }
  
  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      const realtimeSocket = (supabase as any).realtime?.socket;
      
      if (realtimeSocket && realtimeSocket.readyState === WebSocket.OPEN) {
        try {
          realtimeSocket.send(JSON.stringify({
            topic: 'phoenix',
            event: 'heartbeat',
            payload: {},
            ref: `heartbeat_${Date.now()}`
          }));
          
          console.log(`💓 [${this.status.connectionId}] Heartbeat sent`);
        } catch (error) {
          console.error(`❌ [${this.status.connectionId}] Heartbeat failed:`, error);
          this.handleConnectionLoss();
        }
      } else {
        console.warn(`⚠️ [${this.status.connectionId}] Heartbeat failed - socket not available or not open`);
        this.handleConnectionLoss();
      }
    }, this.config.heartbeatInterval);
  }
  
  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    setInterval(() => {
      const realtimeSocket = (supabase as any).realtime?.socket;
      const isHealthy = realtimeSocket && realtimeSocket.readyState === WebSocket.OPEN;
      
      if (this.status.isConnected && !isHealthy) {
        console.warn(`⚠️ [${this.status.connectionId}] Health check failed - connection lost`);
        this.handleConnectionLoss();
      }
      
      // Update diagnostics
      this.updateStatus({
        diagnostics: {
          ...this.status.diagnostics,
          socketState: realtimeSocket?.readyState || null,
          socketStateName: this.getSocketStateName(realtimeSocket?.readyState)
        }
      });
      
    }, this.config.healthCheckInterval);
  }
  
  /**
   * Handle connection loss
   */
  private handleConnectionLoss(): void {
    console.warn(`⚠️ [${this.status.connectionId}] Connection loss detected`);
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.updateStatus({
      isConnected: false,
      status: 'error',
      lastError: 'Connection lost'
    });
    
    // Attempt reconnection
    this.status.retryCount = 0; // Reset for reconnection
    this.connect();
  }
  
  /**
   * Update status and notify callbacks
   */
  private updateStatus(updates: Partial<ProductionConnectionStatus>): void {
    const previousUptime = this.status.uptime;
    
    this.status = {
      ...this.status,
      ...updates,
      lastUpdate: new Date(),
      uptime: this.connectionStartTime && this.status.isConnected 
        ? Date.now() - this.connectionStartTime 
        : 0
    };
    
    // Update metrics
    if (this.status.uptime > this.metrics.longestUptime) {
      this.metrics.longestUptime = this.status.uptime;
    }
    
    console.log(`📊 [${this.status.connectionId}] Status updated:`, {
      status: this.status.status,
      isConnected: this.status.isConnected,
      retryCount: this.status.retryCount,
      uptime: this.status.uptime
    });
    
    // Notify callbacks
    this.statusCallbacks.forEach(callback => {
      try {
        callback({ ...this.status });
      } catch (error) {
        console.error(`❌ [${this.status.connectionId}] Status callback error:`, error);
      }
    });
  }
  
  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (status: ProductionConnectionStatus) => void): () => void {
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
   * Get socket state name
   */
  private getSocketStateName(state: number | undefined): string {
    const states = {
      0: 'CONNECTING',
      1: 'OPEN',
      2: 'CLOSING',
      3: 'CLOSED'
    };
    return states[state as keyof typeof states] || 'UNKNOWN';
  }
  
  /**
   * Get current status
   */
  getStatus(): ProductionConnectionStatus {
    return { ...this.status };
  }
  
  /**
   * Get connection metrics
   */
  getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Force disconnect
   */
  disconnect(): void {
    console.log(`🔌 [${this.status.connectionId}] Disconnecting...`);
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.connectionAttemptTimeout) {
      clearTimeout(this.connectionAttemptTimeout);
      this.connectionAttemptTimeout = null;
    }
    
    try {
      (supabase as any).realtime?.disconnect();
    } catch (error) {
      console.warn(`⚠️ [${this.status.connectionId}] Disconnect error:`, error);
    }
    
    this.updateStatus({
      isConnected: false,
      status: 'disconnected',
      lastError: null
    });
    
    this.fallbackModeActive = false;
  }
  
  /**
   * Destroy manager
   */
  destroy(): void {
    console.log(`🗑️ [${this.status.connectionId}] Destroying connection manager...`);
    
    this.disconnect();
    this.statusCallbacks.length = 0;
    
    console.log(`✅ [${this.status.connectionId}] Connection manager destroyed`);
  }
}
