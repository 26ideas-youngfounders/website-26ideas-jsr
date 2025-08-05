
/**
 * @fileoverview WebSocket Heartbeat Monitor
 * 
 * Standalone monitoring system for WebSocket connection health
 * with alerting capabilities for production environments.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';

export interface HeartbeatMetrics {
  timestamp: string;
  isConnected: boolean;
  socketState: number | null;
  socketStateName: string;
  responseTime: number | null;
  consecutiveFailures: number;
  totalPings: number;
  successfulPings: number;
  failedPings: number;
  uptime: number;
  lastSuccessfulPing: string | null;
}

export interface AlertConfiguration {
  enabled: boolean;
  failureThreshold: number; // consecutive failures before alert
  timeoutThreshold: number; // ms before considering a ping failed
  alertCooldown: number; // ms between alerts
  webhookUrl?: string;
  emailRecipients?: string[];
}

/**
 * Production WebSocket Heartbeat Monitor
 */
export class WebSocketHeartbeatMonitor {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private metrics: HeartbeatMetrics;
  private alertConfig: AlertConfiguration;
  private lastAlertTime = 0;
  private startTime = Date.now();

  constructor(alertConfig: Partial<AlertConfiguration> = {}) {
    this.metrics = {
      timestamp: new Date().toISOString(),
      isConnected: false,
      socketState: null,
      socketStateName: 'UNKNOWN',
      responseTime: null,
      consecutiveFailures: 0,
      totalPings: 0,
      successfulPings: 0,
      failedPings: 0,
      uptime: 0,
      lastSuccessfulPing: null
    };

    this.alertConfig = {
      enabled: true,
      failureThreshold: 3,
      timeoutThreshold: 10000,
      alertCooldown: 300000, // 5 minutes
      ...alertConfig
    };

    console.log('🔍 WebSocket Heartbeat Monitor initialized');
  }

  /**
   * Start monitoring
   */
  start(intervalMs: number = 30000): void {
    if (this.isRunning) {
      console.warn('⚠️ Heartbeat monitor already running');
      return;
    }

    console.log(`🚀 Starting WebSocket heartbeat monitoring (interval: ${intervalMs}ms)`);
    this.isRunning = true;
    this.startTime = Date.now();

    // Run initial check
    this.performHeartbeatCheck();

    // Schedule regular checks
    this.intervalId = setInterval(() => {
      this.performHeartbeatCheck();
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping WebSocket heartbeat monitoring');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Perform heartbeat check
   */
  private async performHeartbeatCheck(): Promise<void> {
    const checkStartTime = Date.now();
    
    try {
      console.log('💓 Performing heartbeat check...');
      
      this.metrics.totalPings++;
      this.metrics.timestamp = new Date().toISOString();
      this.metrics.uptime = Date.now() - this.startTime;

      // Check WebSocket connection
      const realtimeSocket = (supabase as any).realtime?.socket;
      
      if (!realtimeSocket) {
        throw new Error('No realtime socket available');
      }

      const socketState = realtimeSocket.readyState;
      this.metrics.socketState = socketState;
      this.metrics.socketStateName = this.getSocketStateName(socketState);

      if (socketState !== WebSocket.OPEN) {
        throw new Error(`Socket not open: ${this.metrics.socketStateName}`);
      }

      // Send heartbeat message
      const heartbeatPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Heartbeat timeout'));
        }, this.alertConfig.timeoutThreshold);

        const messageHandler = () => {
          clearTimeout(timeout);
          realtimeSocket.removeEventListener('message', messageHandler);
          resolve();
        };

        realtimeSocket.addEventListener('message', messageHandler);
        
        try {
          realtimeSocket.send(JSON.stringify({
            topic: 'phoenix',
            event: 'heartbeat',
            payload: {},
            ref: `heartbeat_${Date.now()}`
          }));
        } catch (sendError) {
          clearTimeout(timeout);
          realtimeSocket.removeEventListener('message', messageHandler);
          reject(sendError);
        }
      });

      await heartbeatPromise;

      // Success
      const responseTime = Date.now() - checkStartTime;
      this.metrics.isConnected = true;
      this.metrics.responseTime = responseTime;
      this.metrics.successfulPings++;
      this.metrics.consecutiveFailures = 0;
      this.metrics.lastSuccessfulPing = new Date().toISOString();

      console.log(`✅ Heartbeat successful (${responseTime}ms)`);

    } catch (error) {
      // Failure
      const responseTime = Date.now() - checkStartTime;
      this.metrics.isConnected = false;
      this.metrics.responseTime = responseTime;
      this.metrics.failedPings++;
      this.metrics.consecutiveFailures++;

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Heartbeat failed (${responseTime}ms): ${errorMessage}`);

      // Check if we need to send an alert
      if (this.shouldSendAlert()) {
        await this.sendAlert(errorMessage);
      }
    }
  }

  /**
   * Check if alert should be sent
   */
  private shouldSendAlert(): boolean {
    if (!this.alertConfig.enabled) {
      return false;
    }

    if (this.metrics.consecutiveFailures < this.alertConfig.failureThreshold) {
      return false;
    }

    const now = Date.now();
    if (now - this.lastAlertTime < this.alertConfig.alertCooldown) {
      return false;
    }

    return true;
  }

  /**
   * Send alert
   */
  private async sendAlert(errorMessage: string): Promise<void> {
    this.lastAlertTime = Date.now();
    
    const alertData = {
      timestamp: new Date().toISOString(),
      severity: 'P2', // High priority for WebSocket failures
      title: 'WebSocket Heartbeat Failure',
      message: `WebSocket connection has failed ${this.metrics.consecutiveFailures} consecutive heartbeat checks`,
      error: errorMessage,
      metrics: { ...this.metrics },
      environment: process.env.NODE_ENV || 'development',
      url: window.location.href
    };

    console.error('🚨 ALERT: WebSocket Heartbeat Failure', alertData);

    // Send to webhook if configured
    if (this.alertConfig.webhookUrl) {
      try {
        await fetch(this.alertConfig.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(alertData)
        });
        console.log('📤 Alert sent to webhook successfully');
      } catch (webhookError) {
        console.error('❌ Failed to send alert to webhook:', webhookError);
      }
    }

    // In production, integrate with your monitoring service:
    // - PagerDuty
    // - DataDog
    // - New Relic
    // - Custom alerting system
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
   * Get current metrics
   */
  getMetrics(): HeartbeatMetrics {
    return { ...this.metrics };
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    successRate: number;
    lastCheck: string;
    consecutiveFailures: number;
  } {
    const successRate = this.metrics.totalPings > 0 
      ? (this.metrics.successfulPings / this.metrics.totalPings) * 100 
      : 0;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (this.metrics.consecutiveFailures >= this.alertConfig.failureThreshold) {
      status = 'unhealthy';
    } else if (this.metrics.consecutiveFailures > 0 || successRate < 95) {
      status = 'degraded';
    }

    return {
      status,
      uptime: this.metrics.uptime,
      successRate,
      lastCheck: this.metrics.timestamp,
      consecutiveFailures: this.metrics.consecutiveFailures
    };
  }

  /**
   * Generate monitoring report
   */
  generateReport(): string {
    const health = this.getHealthStatus();
    const metrics = this.metrics;

    return `# WebSocket Heartbeat Monitor Report

**Generated:** ${new Date().toISOString()}
**Status:** ${health.status.toUpperCase()}
**Uptime:** ${Math.floor(health.uptime / 1000 / 60)} minutes
**Success Rate:** ${health.successRate.toFixed(1)}%

## Current Metrics
- **Connected:** ${metrics.isConnected ? 'Yes' : 'No'}
- **Socket State:** ${metrics.socketStateName}
- **Response Time:** ${metrics.responseTime}ms
- **Consecutive Failures:** ${metrics.consecutiveFailures}
- **Total Pings:** ${metrics.totalPings}
- **Successful Pings:** ${metrics.successfulPings}
- **Failed Pings:** ${metrics.failedPings}
- **Last Successful Ping:** ${metrics.lastSuccessfulPing || 'Never'}

## Alert Configuration
- **Enabled:** ${this.alertConfig.enabled ? 'Yes' : 'No'}
- **Failure Threshold:** ${this.alertConfig.failureThreshold}
- **Timeout Threshold:** ${this.alertConfig.timeoutThreshold}ms
- **Alert Cooldown:** ${Math.floor(this.alertConfig.alertCooldown / 1000 / 60)} minutes
`;
  }
}

// Global monitor instance
let globalHeartbeatMonitor: WebSocketHeartbeatMonitor | null = null;

/**
 * Initialize global heartbeat monitoring
 */
export function initializeHeartbeatMonitoring(config?: Partial<AlertConfiguration>): WebSocketHeartbeatMonitor {
  if (globalHeartbeatMonitor) {
    globalHeartbeatMonitor.stop();
  }

  globalHeartbeatMonitor = new WebSocketHeartbeatMonitor(config);
  globalHeartbeatMonitor.start();

  return globalHeartbeatMonitor;
}

/**
 * Get global heartbeat monitor
 */
export function getHeartbeatMonitor(): WebSocketHeartbeatMonitor | null {
  return globalHeartbeatMonitor;
}

/**
 * Stop global heartbeat monitoring
 */
export function stopHeartbeatMonitoring(): void {
  if (globalHeartbeatMonitor) {
    globalHeartbeatMonitor.stop();
    globalHeartbeatMonitor = null;
  }
}
