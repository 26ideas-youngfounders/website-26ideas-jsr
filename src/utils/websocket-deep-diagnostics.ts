
/**
 * @fileoverview Deep WebSocket Diagnostic Tool
 * 
 * Comprehensive diagnostic utility to identify the exact root cause
 * of WebSocket connection failures with detailed network analysis.
 * 
 * @version 3.0.0
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';

export interface NetworkDiagnosticResult {
  timestamp: string;
  testName: string;
  success: boolean;
  error?: string;
  details: Record<string, unknown>;
  duration: number;
}

export class WebSocketDeepDiagnostics {
  private results: NetworkDiagnosticResult[] = [];
  
  /**
   * Run comprehensive WebSocket diagnostics
   */
  async runComprehensiveDiagnostics(): Promise<NetworkDiagnosticResult[]> {
    console.log('🔬 Starting Deep WebSocket Diagnostics...');
    this.results = [];
    
    await this.testBasicConnectivity();
    await this.testSupabaseRealtimeEndpoint();
    await this.testAuthenticationFlow();
    await this.testDirectWebSocketConnection();
    await this.testSupabaseClientInitialization();
    await this.testConnectionPoolLimits();
    await this.testNetworkLatency();
    
    return this.results;
  }
  
  /**
   * Test basic network connectivity
   */
  private async testBasicConnectivity(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test basic HTTP connectivity to Supabase
      const response = await fetch('https://jdqsgigwbcukxijiunwl.supabase.co/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcXNnaWd3YmN1a3hpaml1bndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODA2NDcsImV4cCI6MjA2ODk1NjY0N30.QWqLMVIH_ej2A7shVjN-FEWzMA6uP0_L5w315Fxhx08'
        }
      });
      
      this.addResult('Basic HTTP Connectivity', true, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      }, Date.now() - startTime);
      
    } catch (error) {
      this.addResult('Basic HTTP Connectivity', false, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, Date.now() - startTime);
    }
  }
  
  /**
   * Test Supabase Realtime endpoint specifically
   */
  private async testSupabaseRealtimeEndpoint(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test the realtime endpoint
      const wsUrl = 'wss://jdqsgigwbcukxijiunwl.supabase.co/realtime/v1/websocket';
      
      const testSocket = new WebSocket(wsUrl + '?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcXNnaWd3YmN1a3hpaml1bndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODA2NDcsImV4cCI6MjA2ODk1NjY0N30.QWqLMVIH_ej2A7shVjN-FEWzMA6uP0_L5w315Fxhx08&vsn=1.0.0');
      
      const result = await new Promise<{ success: boolean; details: Record<string, unknown> }>((resolve) => {
        const timeout = setTimeout(() => {
          testSocket.close();
          resolve({ 
            success: false, 
            details: { error: 'Connection timeout after 10 seconds' } 
          });
        }, 10000);
        
        testSocket.onopen = () => {
          clearTimeout(timeout);
          testSocket.close();
          resolve({ 
            success: true, 
            details: { 
              readyState: testSocket.readyState,
              url: testSocket.url,
              protocol: testSocket.protocol
            } 
          });
        };
        
        testSocket.onerror = (error) => {
          clearTimeout(timeout);
          resolve({ 
            success: false, 
            details: { 
              error: 'WebSocket connection failed',
              readyState: testSocket.readyState,
              event: error
            } 
          });
        };
      });
      
      this.addResult('Direct WebSocket Connection', result.success, result.details, Date.now() - startTime);
      
    } catch (error) {
      this.addResult('Direct WebSocket Connection', false, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, Date.now() - startTime);
    }
  }
  
  /**
   * Test authentication flow
   */
  private async testAuthenticationFlow(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        this.addResult('Authentication Flow', false, { error: error.message }, Date.now() - startTime);
        return;
      }
      
      if (!session) {
        this.addResult('Authentication Flow', false, { error: 'No active session' }, Date.now() - startTime);
        return;
      }
      
      // Test token validity
      const tokenParts = session.access_token.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      const now = Date.now() / 1000;
      const isExpired = payload.exp < now;
      
      this.addResult('Authentication Flow', true, {
        userId: session.user.id,
        tokenExpiry: new Date(payload.exp * 1000).toISOString(),
        isExpired,
        timeUntilExpiry: payload.exp - now
      }, Date.now() - startTime);
      
    } catch (error) {
      this.addResult('Authentication Flow', false, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, Date.now() - startTime);
    }
  }
  
  /**
   * Test direct WebSocket connection without Supabase client
   */
  private async testDirectWebSocketConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authentication session');
      }
      
      const wsUrl = 'wss://jdqsgigwbcukxijiunwl.supabase.co/realtime/v1/websocket';
      const fullUrl = `${wsUrl}?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcXNnaWd3YmN1a3hpaml1bndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODA2NDcsImV4cCI6MjA2ODk1NjY0N30.QWqLMVIH_ej2A7shVjN-FEWzMA6uP0_L5w315Fxhx08&token=${session.access_token}&vsn=1.0.0`;
      
      const testSocket = new WebSocket(fullUrl);
      
      const result = await new Promise<{ success: boolean; details: Record<string, unknown> }>((resolve) => {
        const timeout = setTimeout(() => {
          testSocket.close();
          resolve({ 
            success: false, 
            details: { error: 'Authenticated connection timeout after 15 seconds' } 
          });
        }, 15000);
        
        testSocket.onopen = () => {
          clearTimeout(timeout);
          
          // Send a test message
          testSocket.send(JSON.stringify({
            topic: 'phoenix',
            event: 'heartbeat',
            payload: {},
            ref: 'test'
          }));
          
          setTimeout(() => {
            testSocket.close();
            resolve({ 
              success: true, 
              details: { 
                readyState: testSocket.readyState,
                url: 'wss://jdqsgigwbcukxijiunwl.supabase.co/realtime/v1/websocket',
                authenticated: true
              } 
            });
          }, 1000);
        };
        
        testSocket.onerror = (error) => {
          clearTimeout(timeout);
          resolve({ 
            success: false, 
            details: { 
              error: 'Authenticated WebSocket connection failed',
              readyState: testSocket.readyState
            } 
          });
        };
        
        testSocket.onmessage = (event) => {
          console.log('WebSocket message received:', event.data);
        };
      });
      
      this.addResult('Authenticated WebSocket Connection', result.success, result.details, Date.now() - startTime);
      
    } catch (error) {
      this.addResult('Authenticated WebSocket Connection', false, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, Date.now() - startTime);
    }
  }
  
  /**
   * Test Supabase client initialization
   */
  private async testSupabaseClientInitialization(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Force initialize realtime
      const realtimeClient = (supabase as any).realtime;
      
      if (!realtimeClient) {
        this.addResult('Supabase Client Initialization', false, { 
          error: 'Realtime client not available' 
        }, Date.now() - startTime);
        return;
      }
      
      // Try to connect
      realtimeClient.connect();
      
      // Wait and check socket
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const socket = realtimeClient.socket;
      const isConnected = socket && socket.readyState === WebSocket.OPEN;
      
      this.addResult('Supabase Client Initialization', isConnected, {
        hasRealtimeClient: !!realtimeClient,
        hasSocket: !!socket,
        socketState: socket?.readyState,
        socketStateName: this.getSocketStateName(socket?.readyState),
        connectionState: realtimeClient.connectionState
      }, Date.now() - startTime);
      
    } catch (error) {
      this.addResult('Supabase Client Initialization', false, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, Date.now() - startTime);
    }
  }
  
  /**
   * Test connection pool limits
   */
  private async testConnectionPoolLimits(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Make multiple concurrent requests to check for rate limiting
      const promises = Array.from({ length: 10 }, async (_, i) => {
        try {
          const response = await fetch('https://jdqsgigwbcukxijiunwl.supabase.co/rest/v1/yff_applications', {
            method: 'HEAD',
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcXNnaWd3YmN1a3hpaml1bndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODA2NDcsImV4cCI6MjA2ODk1NjY0N30.QWqLMVIH_ej2A7shVjN-FEWzMA6uP0_L5w315Fxhx08'
            }
          });
          return { index: i, status: response.status, success: response.ok };
        } catch (error) {
          return { index: i, success: false, error: error instanceof Error ? error.message : 'Unknown' };
        }
      });
      
      const results = await Promise.all(promises);
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      this.addResult('Connection Pool Limits', true, {
        totalRequests: results.length,
        successful,
        failed,
        successRate: (successful / results.length) * 100,
        results: results.slice(0, 3) // Just show first 3 for brevity
      }, Date.now() - startTime);
      
    } catch (error) {
      this.addResult('Connection Pool Limits', false, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, Date.now() - startTime);
    }
  }
  
  /**
   * Test network latency
   */
  private async testNetworkLatency(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const latencyTests = [];
      
      for (let i = 0; i < 5; i++) {
        const pingStart = Date.now();
        try {
          await fetch('https://jdqsgigwbcukxijiunwl.supabase.co/rest/v1/', { 
            method: 'HEAD',
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcXNnaWd3YmN1a3hpaml1bndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODA2NDcsImV4cCI6MjA2ODk1NjY0N30.QWqLMVIH_ej2A7shVjN-FEWzMA6uP0_L5w315Fxhx08'
            }
          });
          latencyTests.push(Date.now() - pingStart);
        } catch (error) {
          latencyTests.push(-1); // Error marker
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const validLatencies = latencyTests.filter(l => l > 0);
      const avgLatency = validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length;
      const maxLatency = Math.max(...validLatencies);
      const minLatency = Math.min(...validLatencies);
      
      this.addResult('Network Latency', true, {
        tests: latencyTests,
        avgLatency: avgLatency || 0,
        maxLatency: maxLatency || 0,
        minLatency: minLatency || 0,
        packetLoss: ((latencyTests.length - validLatencies.length) / latencyTests.length) * 100
      }, Date.now() - startTime);
      
    } catch (error) {
      this.addResult('Network Latency', false, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, Date.now() - startTime);
    }
  }
  
  /**
   * Add diagnostic result
   */
  private addResult(testName: string, success: boolean, details: Record<string, unknown>, duration: number): void {
    const result: NetworkDiagnosticResult = {
      timestamp: new Date().toISOString(),
      testName,
      success,
      details,
      duration
    };
    
    if (!success && details.error) {
      result.error = details.error as string;
    }
    
    this.results.push(result);
    
    const status = success ? '✅' : '❌';
    console.log(`${status} ${testName}: ${success ? 'PASSED' : 'FAILED'} (${duration}ms)`);
    
    if (!success) {
      console.error(`   Error: ${result.error || 'Unknown error'}`);
    }
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
   * Generate diagnostic report
   */
  generateReport(): string {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    let report = `# WebSocket Deep Diagnostic Report\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Total Tests:** ${totalTests}\n`;
    report += `**Passed:** ${passedTests}\n`;
    report += `**Failed:** ${failedTests}\n`;
    report += `**Success Rate:** ${((passedTests / totalTests) * 100).toFixed(1)}%\n\n`;
    
    report += `## Detailed Results\n\n`;
    
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      report += `### ${index + 1}. ${result.testName} ${status}\n\n`;
      report += `- **Status:** ${result.success ? 'PASSED' : 'FAILED'}\n`;
      report += `- **Duration:** ${result.duration}ms\n`;
      report += `- **Timestamp:** ${result.timestamp}\n`;
      
      if (result.error) {
        report += `- **Error:** ${result.error}\n`;
      }
      
      report += `- **Details:**\n\`\`\`json\n${JSON.stringify(result.details, null, 2)}\n\`\`\`\n\n`;
    });
    
    return report;
  }
}
