/**
 * @fileoverview Comprehensive E2E Testing Suite for YFF Applications
 * 
 * Tests the complete flow from application submission through AI scoring
 * to dashboard display with enhanced real-time WebSocket validation.
 * 
 * @version 4.0.0
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';
import { AIComprehensiveScoringService } from '@/services/ai-comprehensive-scoring-service';
import { BackgroundJobService } from '@/services/background-job-service';
import { YffFormData } from '@/types/yff-form';
import { v4 as uuidv4 } from 'uuid';
import type { Json } from '@/integrations/supabase/types';

export interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'running';
  message: string;
  timestamp: string;
  duration?: number;
  details?: any;
}

export class E2ETestingSuite {
  private results: TestResult[] = [];
  private testApplicationId: string | null = null;
  private testIndividualId: string | null = null;
  private testEmail: string | null = null;
  private realtimeChannel: any = null;

  constructor() {
    this.results = [];
  }

  /**
   * Enhanced WebSocket state validation
   */
  private validateWebSocketState(channel: any): { 
    isOpen: boolean; 
    state: string; 
    details: any 
  } {
    if (!channel) {
      return {
        isOpen: false,
        state: 'NO_CHANNEL',
        details: { error: 'No channel provided' }
      };
    }

    if (!channel.socket) {
      return {
        isOpen: false,
        state: 'NO_SOCKET',
        details: { error: 'No socket found in channel' }
      };
    }

    const readyState = channel.socket.readyState;
    const states = {
      0: 'CONNECTING',
      1: 'OPEN', 
      2: 'CLOSING',
      3: 'CLOSED'
    };

    const state = states[readyState] || 'UNKNOWN';
    const isOpen = readyState === 1;

    return {
      isOpen,
      state,
      details: {
        readyState,
        url: channel.socket.url,
        protocol: channel.socket.protocol,
        extensions: channel.socket.extensions
      }
    };
  }

  /**
   * Run complete E2E test suite with enhanced WebSocket validation
   */
  async runCompleteTestSuite(): Promise<TestResult[]> {
    console.log('🚀 Starting comprehensive E2E test suite...');
    
    try {
      // Test 1: Database connectivity
      await this.testDatabaseConnection();
      
      // Test 2: Application submission
      await this.testApplicationSubmission();
      
      // Test 3: Dashboard display
      await this.testDashboardDisplay();
      
      // Test 4: AI scoring trigger
      await this.testAIScoringTrigger();
      
      // Test 5: Enhanced real-time updates test with WebSocket validation
      await this.testRealTimeUpdates();
      
      // Test 6: Results display
      await this.testResultsDisplay();
      
      // Test 7: Error handling
      await this.testErrorHandling();
      
      // Test 8: Performance metrics
      await this.testPerformanceMetrics();
      
      // Cleanup test data
      await this.cleanupTestData();
      
      console.log('✅ E2E test suite completed successfully');
      
    } catch (error) {
      console.error('❌ E2E test suite failed:', error);
      
      this.addTestResult({
        testName: 'Test Suite Error',
        status: 'failed',
        message: `Test suite failed: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
    
    return this.results;
  }

  /**
   * Test database connection with proper count query
   */
  private async testDatabaseConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing database connection...');
      
      // Use correct Supabase count syntax
      const { count, error } = await supabase
        .from('yff_applications')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }
      
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Database Connection',
        status: 'passed',
        message: `Successfully connected to database. Found ${count || 0} applications.`,
        timestamp: new Date().toISOString(),
        duration,
        details: { applicationCount: count }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Database Connection',
        status: 'failed',
        message: `Database connection failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      throw error;
    }
  }

  /**
   * Test application submission with unique identifiers and proper types
   */
  private async testApplicationSubmission(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing application submission...');
      
      // Generate unique test data with proper UUIDs and timestamp-based uniqueness
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 15);
      this.testEmail = `e2etest-${timestamp}-${randomSuffix}@example.com`;
      this.testIndividualId = uuidv4();
      this.testApplicationId = uuidv4();
      
      console.log(`🔍 Generated test IDs: individual=${this.testIndividualId}, application=${this.testApplicationId}, email=${this.testEmail}`);
      
      // Create test individual first
      const { data: individual, error: individualError } = await supabase
        .from('individuals')
        .insert({
          individual_id: this.testIndividualId,
          email: this.testEmail,
          first_name: 'E2E',
          last_name: 'Test',
          privacy_consent: true,
          data_processing_consent: true,
          email_verified: true
        })
        .select()
        .single();
      
      if (individualError) {
        throw new Error(`Failed to create test individual: ${individualError.message}`);
      }
      
      console.log('✅ Test individual created successfully');
      
      // Create test application data with proper typing
      const testFormData: YffFormData = {
        tell_us_about_idea: 'This is a comprehensive test of an innovative AI-powered platform that revolutionizes how young entrepreneurs develop and validate their business ideas through intelligent mentorship and automated feedback systems.',
        problem_statement: 'Young entrepreneurs lack access to experienced mentors and struggle with validating their business ideas early in the development process, leading to higher failure rates and wasted resources.',
        whose_problem: 'This problem affects aspiring entrepreneurs aged 18-25 who have innovative ideas but lack the network, resources, and expertise to properly validate and develop their concepts into viable businesses.',
        how_solve_problem: 'Our platform uses AI-powered analysis to provide instant feedback on business ideas, connects entrepreneurs with relevant mentors, and offers structured validation frameworks to test market assumptions.',
        how_make_money: 'Revenue streams include subscription fees for premium AI analysis, commission from successful mentor matches, and partnerships with educational institutions and accelerator programs.',
        acquire_customers: 'Customer acquisition through university partnerships, social media marketing targeting entrepreneurship communities, referral programs, and strategic partnerships with startup ecosystems.',
        team_roles: 'Our founding team combines technical expertise in AI/ML with deep entrepreneurship experience, including former startup founders, product managers, and engineers from leading tech companies.'
      };
      
      // Submit test application with proper database structure
      const { data: application, error: applicationError } = await supabase
        .from('yff_applications')
        .insert({
          application_id: this.testApplicationId,
          individual_id: this.testIndividualId,
          answers: testFormData,
          status: 'submitted',
          evaluation_status: 'pending'
        })
        .select()
        .single();
      
      if (applicationError) {
        throw new Error(`Failed to submit test application: ${applicationError.message}`);
      }
      
      console.log('✅ Test application submitted successfully');
      
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Application Submission',
        status: 'passed',
        message: `Successfully submitted test application with ID: ${this.testApplicationId}`,
        timestamp: new Date().toISOString(),
        duration,
        details: { applicationId: this.testApplicationId, email: this.testEmail }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Application Submission',
        status: 'failed',
        message: `Application submission failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      throw error;
    }
  }

  /**
   * Test dashboard display functionality
   */
  private async testDashboardDisplay(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing dashboard display...');
      
      if (!this.testApplicationId) {
        throw new Error('No test application ID available');
      }
      
      // Wait briefly for database consistency
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Query application from dashboard perspective
      const { data: applications, error } = await supabase
        .from('yff_applications')
        .select(`
          *,
          individuals(
            first_name,
            last_name,
            email
          )
        `)
        .eq('application_id', this.testApplicationId);
      
      if (error) {
        throw new Error(`Failed to fetch application for dashboard: ${error.message}`);
      }
      
      if (!applications || applications.length === 0) {
        throw new Error('Test application not found in dashboard query');
      }
      
      const application = applications[0];
      
      // Validate application data structure
      if (!application.answers || typeof application.answers !== 'object') {
        throw new Error('Application answers not properly stored');
      }
      
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Dashboard Display',
        status: 'passed',
        message: `Successfully retrieved application in dashboard format`,
        timestamp: new Date().toISOString(),
        duration,
        details: { 
          applicationFound: true,
          hasAnswers: Object.keys(application.answers).length > 0,
          hasIndividual: !!application.individuals
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Dashboard Display',
        status: 'failed',
        message: `Dashboard display test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      throw error;
    }
  }

  /**
   * Test AI scoring trigger
   */
  private async testAIScoringTrigger(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing AI scoring trigger...');
      
      if (!this.testApplicationId) {
        throw new Error('No test application ID available');
      }
      
      // Trigger AI scoring
      const result = await AIComprehensiveScoringService.triggerEvaluation(this.testApplicationId);
      
      if (!result.success) {
        throw new Error(`AI scoring failed: ${result.message}`);
      }
      
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'AI Scoring Trigger',
        status: 'passed',
        message: `Successfully triggered AI evaluation: ${result.message}`,
        timestamp: new Date().toISOString(),
        duration,
        details: { 
          scoringResult: result.result,
          overallScore: result.result?.overall_score 
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'AI Scoring Trigger',
        status: 'failed',
        message: `AI scoring trigger failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      throw error;
    }
  }

  /**
   * Enhanced real-time updates test with comprehensive WebSocket validation
   */
  private async testRealTimeUpdates(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing real-time updates with comprehensive WebSocket validation...');
      
      if (!this.testApplicationId) {
        throw new Error('No test application ID available');
      }

      // First, validate authentication status
      const authValidation = await this.validateAuthenticationForRealtime();
      if (!authValidation.success) {
        throw new Error(`Authentication validation failed: ${authValidation.error}`);
      }

      // Test the real-time subscription system with WebSocket state monitoring
      const subscriptionTest = await this.validateEnhancedRealtimeSubscription();
      
      if (!subscriptionTest.success) {
        throw new Error(`Enhanced real-time subscription test failed: ${subscriptionTest.error}`);
      }

      // Perform database updates and wait for real-time notification with WebSocket monitoring
      const updateTest = await this.testEnhancedUpdatePropagation();
      
      if (!updateTest.success) {
        throw new Error(`Enhanced real-time update propagation failed: ${updateTest.error}`);
      }

      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Real-Time Updates',
        status: 'passed',
        message: `Enhanced real-time updates working correctly. Subscription established within ${subscriptionTest.connectionTime}ms, WebSocket in ${subscriptionTest.webSocketState} state, updates propagated within ${updateTest.latency}ms.`,
        timestamp: new Date().toISOString(),
        duration,
        details: {
          authValidation: authValidation.details,
          subscriptionDetails: subscriptionTest.details,
          webSocketValidation: subscriptionTest.webSocketValidation,
          updateLatency: updateTest.latency,
          eventsReceived: updateTest.eventsReceived,
          connectionTime: subscriptionTest.connectionTime
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Real-Time Updates',
        status: 'failed',
        message: `Enhanced real-time updates test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      // Don't throw here to allow other tests to continue
      console.error('❌ Enhanced real-time updates test failed, but continuing with other tests');
    } finally {
      // Always cleanup the channel
      if (this.realtimeChannel) {
        try {
          supabase.removeChannel(this.realtimeChannel);
        } catch (cleanupError) {
          console.warn('⚠️ Error during real-time channel cleanup:', cleanupError);
        }
        this.realtimeChannel = null;
      }
    }
  }

  /**
   * Validate authentication for real-time subscription
   */
  private async validateAuthenticationForRealtime(): Promise<{
    success: boolean;
    error?: string;
    details?: any;
  }> {
    try {
      console.log('🔐 Validating authentication for real-time subscription...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return {
          success: false,
          error: `Authentication error: ${error.message}`,
          details: { error }
        };
      }

      if (!session) {
        return {
          success: false,
          error: 'No authenticated session found',
          details: { sessionExists: false }
        };
      }

      if (!session.access_token) {
        return {
          success: false,
          error: 'No access token in session',
          details: { sessionExists: true, hasAccessToken: false }
        };
      }

      // Set realtime auth explicitly
      try {
        supabase.realtime.setAuth(session.access_token);
        console.log('✅ Realtime authentication configured successfully');
      } catch (authError) {
        return {
          success: false,
          error: `Failed to set realtime auth: ${authError.message}`,
          details: { authError }
        };
      }

      return {
        success: true,
        details: {
          userId: session.user?.id,
          email: session.user?.email,
          hasAccessToken: true,
          realtimeAuthSet: true
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Authentication validation exception: ${error.message}`,
        details: { exception: error }
      };
    }
  }

  /**
   * Validate enhanced real-time subscription with comprehensive WebSocket monitoring
   */
  private async validateEnhancedRealtimeSubscription(): Promise<{
    success: boolean;
    error?: string;
    details?: any;
    connectionTime?: number;
    webSocketState?: string;
    webSocketValidation?: any;
  }> {
    return new Promise((resolve) => {
      console.log('🔍 Validating enhanced real-time subscription with WebSocket monitoring...');
      
      const startTime = Date.now();
      let subscriptionTimeout: NodeJS.Timeout;
      let connectionMonitor: NodeJS.Timeout;
      let webSocketMonitor: NodeJS.Timeout;
      let isResolved = false;
      
      const resolveOnce = (result: any) => {
        if (isResolved) return;
        isResolved = true;
        if (subscriptionTimeout) clearTimeout(subscriptionTimeout);
        if (connectionMonitor) clearTimeout(connectionMonitor);
        if (webSocketMonitor) clearTimeout(webSocketMonitor);
        
        // Add connection time to result
        if (result.success) {
          result.connectionTime = Date.now() - startTime;
        }
        
        resolve(result);
      };

      try {
        // Create a unique channel name to avoid conflicts
        const timestamp = Date.now();
        const channelName = `e2e-websocket-test-${timestamp}`;
        console.log(`📡 Testing enhanced subscription with WebSocket monitoring: ${channelName}`);
        
        this.realtimeChannel = supabase
          .channel(channelName, {
            config: {
              presence: { key: `e2e-websocket-${timestamp}` },
              broadcast: { self: false }
            }
          })
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'yff_applications'
            },
            (payload) => {
              console.log('📨 Real-time event received in WebSocket test:', {
                eventType: payload.eventType,
                timestamp: new Date().toISOString()
              });
            }
          )
          .subscribe((status, err) => {
            const connectionTime = Date.now() - startTime;
            console.log('📡 Enhanced subscription status with WebSocket monitoring:', {
              status,
              error: err,
              connectionTime: `${connectionTime}ms`,
              channelName
            });
            
            if (status === 'SUBSCRIBED') {
              console.log(`✅ Enhanced subscription established successfully in ${connectionTime}ms`);
              
              // Start comprehensive WebSocket validation after a brief delay
              webSocketMonitor = setTimeout(() => {
                const webSocketValidation = this.validateWebSocketState(this.realtimeChannel);
                
                console.log(`🔍 Comprehensive WebSocket validation:`, webSocketValidation);
                
                if (webSocketValidation.isOpen) {
                  // Additional stability check - wait longer to ensure connection is stable
                  connectionMonitor = setTimeout(() => {
                    const finalValidation = this.validateWebSocketState(this.realtimeChannel);
                    
                    console.log(`🔍 Final WebSocket stability check:`, finalValidation);
                    
                    if (finalValidation.isOpen) {
                      resolveOnce({
                        success: true,
                        webSocketState: finalValidation.state,
                        webSocketValidation: finalValidation,
                        details: {
                          subscriptionStatus: status,
                          channelName,
                          timestamp: new Date().toISOString(),
                          stabilityCheckPassed: true
                        }
                      });
                    } else {
                      resolveOnce({
                        success: false,
                        error: `WebSocket state changed during stability check: ${finalValidation.state}`,
                        webSocketState: finalValidation.state,
                        webSocketValidation: finalValidation,
                        details: { 
                          status, 
                          channelName, 
                          connectionTime,
                          stabilityCheckFailed: true
                        }
                      });
                    }
                  }, 5000); // Wait 5 seconds for stability
                  
                } else {
                  resolveOnce({
                    success: false,
                    error: `WebSocket not in OPEN state after subscription: ${webSocketValidation.state}`,
                    webSocketState: webSocketValidation.state,
                    webSocketValidation: webSocketValidation,
                    details: { status, channelName, connectionTime }
                  });
                }
              }, 3000); // Wait 3 seconds before first WebSocket check
              
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              resolveOnce({
                success: false,
                error: `Enhanced subscription failed with status: ${status}`,
                details: { status, error: err, channelName, connectionTime }
              });
            }
          });

        // Set extended timeout for subscription establishment (45 seconds for comprehensive testing)
        subscriptionTimeout = setTimeout(() => {
          const connectionTime = Date.now() - startTime;
          console.error(`⏰ Enhanced connection timeout after ${connectionTime}ms`);
          
          const webSocketValidation = this.realtimeChannel ? 
            this.validateWebSocketState(this.realtimeChannel) : 
            { isOpen: false, state: 'TIMEOUT_NO_CHANNEL', details: {} };
            
          resolveOnce({
            success: false,
            error: `Enhanced subscription did not establish within 45 seconds (took ${connectionTime}ms)`,
            webSocketState: webSocketValidation.state,
            webSocketValidation: webSocketValidation,
            details: { 
              timeout: true, 
              channelName, 
              connectionTime,
              timeoutReason: 'SUBSCRIPTION_ESTABLISHMENT'
            }
          });
        }, 45000); // 45 second timeout

      } catch (error) {
        const connectionTime = Date.now() - startTime;
        resolveOnce({
          success: false,
          error: `Enhanced subscription setup failed: ${error.message}`,
          details: { exception: error, connectionTime }
        });
      }
    });
  }

  /**
   * Test enhanced update propagation with WebSocket state monitoring
   */
  private async testEnhancedUpdatePropagation(): Promise<{
    success: boolean;
    error?: string;
    latency?: number;
    eventsReceived?: number;
  }> {
    return new Promise((resolve) => {
      console.log('🔍 Testing enhanced real-time update propagation with WebSocket monitoring...');
      
      let updateTimeout: NodeJS.Timeout;
      let eventsReceived = 0;
      let updateStartTime: number;
      let isResolved = false;
      let eventListener: any = null;
      
      const resolveOnce = (result: any) => {
        if (isResolved) return;
        isResolved = true;
        if (updateTimeout) clearTimeout(updateTimeout);
        if (eventListener) {
          try {
            supabase.removeChannel(eventListener);
          } catch (cleanupError) {
            console.warn('⚠️ Error cleaning up event listener:', cleanupError);
          }
        }
        resolve(result);
      };

      // The main channel should already be subscribed from the previous test
      if (!this.realtimeChannel) {
        resolveOnce({
          success: false,
          error: 'No active enhanced real-time channel for testing updates',
          eventsReceived
        });
        return;
      }

      // Validate WebSocket state before starting update test
      const initialWebSocketState = this.validateWebSocketState(this.realtimeChannel);
      console.log('🔍 Initial WebSocket state for update test:', initialWebSocketState);
      
      if (!initialWebSocketState.isOpen) {
        resolveOnce({
          success: false,
          error: `WebSocket not ready for update test: ${initialWebSocketState.state}`,
          eventsReceived
        });
        return;
      }

      // Create a dedicated listener for our test application updates
      const timestamp = Date.now();
      const updateChannelName = `e2e-update-websocket-test-${timestamp}`;
      eventListener = supabase
        .channel(updateChannelName, {
          config: {
            presence: { key: `update-websocket-test-${timestamp}` },
            broadcast: { self: false }
          }
        })
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'yff_applications',
            filter: `application_id=eq.${this.testApplicationId}`
          },
          (payload) => {
            eventsReceived++;
            const latency = Date.now() - updateStartTime;
            
            console.log(`📨 Enhanced real-time update received with WebSocket monitoring. Latency: ${latency}ms`, {
              eventType: payload.eventType,
              applicationId: payload.new?.application_id || payload.old?.application_id,
              evaluationStatus: payload.new?.evaluation_status,
              eventsReceived
            });
            
            // Validate WebSocket state when event is received
            const eventWebSocketState = this.validateWebSocketState(eventListener);
            console.log('🔍 WebSocket state when event received:', eventWebSocketState);
            
            resolveOnce({
              success: true,
              latency,
              eventsReceived,
              webSocketStateAtEvent: eventWebSocketState
            });
          }
        )
        .subscribe(async (status) => {
          console.log(`📡 Enhanced update test channel with WebSocket monitoring status: ${status}`);
          
          if (status === 'SUBSCRIBED') {
            // Validate WebSocket state after subscription
            const subscriptionWebSocketState = this.validateWebSocketState(eventListener);
            console.log('🔍 WebSocket state after update channel subscription:', subscriptionWebSocketState);
            
            if (!subscriptionWebSocketState.isOpen) {
              resolveOnce({
                success: false,
                error: `Update channel WebSocket not open after subscription: ${subscriptionWebSocketState.state}`,
                eventsReceived
              });
              return;
            }
            
            console.log('✅ Enhanced update test channel subscribed with WebSocket monitoring, triggering database updates...');
            
            // Give subscription more time to be fully ready with WebSocket validation
            setTimeout(async () => {
              updateStartTime = Date.now();
              
              // Perform multiple database updates with better spacing
              const updates = [
                { evaluation_status: 'processing', updated_at: new Date().toISOString() },
                { status: 'under_review', updated_at: new Date().toISOString() },
                { evaluation_status: 'completed', updated_at: new Date().toISOString() },
                { status: 'completed', updated_at: new Date().toISOString() }
              ];

              for (let i = 0; i < updates.length; i++) {
                // Check WebSocket state before each update
                const preUpdateWebSocketState = this.validateWebSocketState(eventListener);
                console.log(`🔍 WebSocket state before update ${i + 1}:`, preUpdateWebSocketState);
                
                if (!preUpdateWebSocketState.isOpen) {
                  console.warn(`⚠️ WebSocket not open before update ${i + 1}: ${preUpdateWebSocketState.state}`);
                }
                
                console.log(`🔄 Performing enhanced update with WebSocket monitoring ${i + 1}/${updates.length}:`, updates[i]);
                
                try {
                  const { error } = await supabase
                    .from('yff_applications')
                    .update(updates[i])
                    .eq('application_id', this.testApplicationId);
                  
                  if (error) {
                    console.error(`❌ Enhanced update ${i + 1} failed:`, error);
                  } else {
                    console.log(`✅ Enhanced update ${i + 1} successful`);
                  }
                } catch (updateError) {
                  console.error(`❌ Exception during enhanced update ${i + 1}:`, updateError);
                }

                // Wait between updates to allow propagation
                if (i < updates.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 4000));
                }
              }

            }, 7000); // Wait 7 seconds for subscription to be fully ready
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            resolveOnce({
              success: false,
              error: `Enhanced update test channel failed: ${status}`,
              eventsReceived
            });
          }
        });

      // Set extended timeout for update propagation (50 seconds for comprehensive WebSocket testing)
      updateTimeout = setTimeout(() => {
        const finalWebSocketState = eventListener ? 
          this.validateWebSocketState(eventListener) : 
          { isOpen: false, state: 'TIMEOUT_NO_LISTENER', details: {} };
          
        console.log(`⏰ Enhanced real-time update test timeout. Events received: ${eventsReceived}, Final WebSocket state:`, finalWebSocketState);
        
        resolveOnce({
          success: false,
          error: `Enhanced real-time update not received within 50 seconds. Events received: ${eventsReceived}, WebSocket state: ${finalWebSocketState.state}`,
          eventsReceived,
          finalWebSocketState
        });
      }, 50000); // 50 second timeout
    });
  }

  /**
   * Test results display
   */
  private async testResultsDisplay(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing results display...');
      
      if (!this.testApplicationId) {
        throw new Error('No test application ID available');
      }
      
      // Fetch application with evaluation data
      const { data: application, error } = await supabase
        .from('yff_applications')
        .select('*')
        .eq('application_id', this.testApplicationId)
        .single();
      
      if (error) {
        throw new Error(`Failed to fetch application results: ${error.message}`);
      }
      
      // Validate evaluation data exists and has proper structure
      if (!application.evaluation_data || typeof application.evaluation_data !== 'object') {
        throw new Error('Evaluation data not found or improperly formatted');
      }
      
      const evaluationData = application.evaluation_data as any;
      
      if (!evaluationData.scores || typeof evaluationData.scores !== 'object') {
        throw new Error('Question scores not found in evaluation data');
      }
      
      if (typeof application.overall_score !== 'number') {
        throw new Error('Overall score not found or not a number');
      }
      
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Results Display',
        status: 'passed',
        message: `Successfully retrieved and validated evaluation results. Overall score: ${application.overall_score}/10`,
        timestamp: new Date().toISOString(),
        duration,
        details: {
          overallScore: application.overall_score,
          questionsScored: Object.keys(evaluationData.scores).length,
          evaluationStatus: application.evaluation_status
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Results Display',
        status: 'failed',
        message: `Results display test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      // Don't throw here to allow other tests to continue
      console.error('❌ Results display test failed, but continuing with other tests');
    }
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing error handling...');
      
      // Test invalid application ID handling
      const invalidResult = await AIComprehensiveScoringService.triggerEvaluation('invalid-uuid-format');
      
      if (invalidResult.success) {
        throw new Error('Error handling test failed: should have rejected invalid UUID');
      }
      
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Error Handling',
        status: 'passed',
        message: 'Successfully handled invalid input and returned appropriate error response',
        timestamp: new Date().toISOString(),
        duration,
        details: { errorMessage: invalidResult.message }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Error Handling',
        status: 'failed',
        message: `Error handling test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      console.error('❌ Error handling test failed, but continuing with other tests');
    }
  }

  /**
   * Test performance metrics
   */
  private async testPerformanceMetrics(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing performance metrics...');
      
      // Test database query performance
      const queryStart = Date.now();
      const { count, error } = await supabase
        .from('yff_applications')
        .select('*', { count: 'exact', head: true });
      const queryDuration = Date.now() - queryStart;
      
      if (error) {
        throw new Error(`Performance test query failed: ${error.message}`);
      }
      
      // Validate acceptable performance thresholds
      const maxAcceptableQueryTime = 2000; // 2 seconds
      const performanceGrade = queryDuration < maxAcceptableQueryTime ? 'Good' : 'Needs Improvement';
      
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Performance Metrics',
        status: queryDuration < maxAcceptableQueryTime ? 'passed' : 'failed',
        message: `Database query performance: ${queryDuration}ms (Grade: ${performanceGrade})`,
        timestamp: new Date().toISOString(),
        duration,
        details: {
          queryDuration,
          performanceGrade,
          maxAcceptable: maxAcceptableQueryTime,
          recordCount: count
        }
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addTestResult({
        testName: 'Performance Metrics',
        status: 'failed',
        message: `Performance metrics test failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration
      });
      
      console.error('❌ Performance metrics test failed, but continuing with other tests');
    }
  }

  /**
   * Clean up test data
   */
  private async cleanupTestData(): Promise<void> {
    console.log('🧹 Cleaning up test data...');
    
    try {
      // Clean up in reverse order of creation
      if (this.testApplicationId) {
        await supabase
          .from('yff_applications')
          .delete()
          .eq('application_id', this.testApplicationId);
        
        console.log(`🗑️ Deleted test application: ${this.testApplicationId}`);
      }
      
      if (this.testIndividualId) {
        await supabase
          .from('individuals')
          .delete()
          .eq('individual_id', this.testIndividualId);
        
        console.log(`🗑️ Deleted test individual: ${this.testIndividualId}`);
      }
      
      // Clean up any remaining realtime channels
      if (this.realtimeChannel) {
        try {
          supabase.removeChannel(this.realtimeChannel);
        } catch (cleanupError) {
          console.warn('⚠️ Error during realtime channel cleanup:', cleanupError);
        }
        this.realtimeChannel = null;
      }
      
    } catch (error) {
      console.error('⚠️ Error during cleanup:', error);
      // Don't throw cleanup errors
    }
  }

  /**
   * Add test result to results array
   */
  private addTestResult(result: TestResult): void {
    this.results.push(result);
  }

  /**
   * Generate markdown test report
   */
  generateTestReport(): string {
    const timestamp = new Date().toISOString();
    const passedTests = this.results.filter(r => r.status === 'passed').length;
    const failedTests = this.results.filter(r => r.status === 'failed').length;
    const totalTests = this.results.length;
    
    let report = `# E2E Test Report\n\n`;
    report += `**Generated:** ${timestamp}\n`;
    report += `**Tests Passed:** ${passedTests}/${totalTests}\n`;
    report += `**Tests Failed:** ${failedTests}/${totalTests}\n\n`;
    
    if (failedTests === 0) {
      report += `✅ **All tests passed!** The YFF application system is working correctly.\n\n`;
    } else {
      report += `⚠️ **${failedTests} test(s) failed.** Please review the results below.\n\n`;
    }
    
    report += `## Test Results\n\n`;
    
    this.results.forEach(result => {
      const icon = result.status === 'passed' ? '✅' : '❌';
      report += `### ${icon} ${result.testName}\n\n`;
      report += `**Status:** ${result.status.toUpperCase()}\n`;
      report += `**Message:** ${result.message}\n`;
      report += `**Timestamp:** ${result.timestamp}\n`;
      
      if (result.duration) {
        report += `**Duration:** ${result.duration}ms\n`;
      }
      
      if (result.details) {
        report += `**Details:** \`${JSON.stringify(result.details, null, 2)}\`\n`;
      }
      
      report += `\n`;
    });
    
    return report;
  }
}
