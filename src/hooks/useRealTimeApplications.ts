
/**
 * @fileoverview Real-Time YFF Applications Hook with Enhanced WebSocket Management
 * 
 * Provides real-time updates for YFF applications using Supabase
 * real-time subscriptions with comprehensive WebSocket state handling,
 * robust error recovery, and reliable connection management.
 * 
 * @version 5.0.0
 * @author 26ideas Development Team
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { YffApplicationWithIndividual } from '@/types/yff-application';
import type { Session } from '@supabase/supabase-js';

interface UseRealTimeApplicationsReturn {
  applications: YffApplicationWithIndividual[];
  isLoading: boolean;
  error: Error | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' | 'fallback';
  retryCount: number;
  lastUpdate: Date | null;
}

/**
 * WebSocket state constants with proper mapping
 */
const WEBSOCKET_STATES = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
} as const;

const WEBSOCKET_STATE_NAMES = {
  [WEBSOCKET_STATES.CONNECTING]: 'CONNECTING',
  [WEBSOCKET_STATES.OPEN]: 'OPEN', 
  [WEBSOCKET_STATES.CLOSING]: 'CLOSING',
  [WEBSOCKET_STATES.CLOSED]: 'CLOSED'
} as const;

/**
 * Enhanced diagnostic logging for WebSocket connection
 */
const diagnoseWebSocketConnection = async () => {
  console.log('=== WebSocket Diagnostic Start ===');
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL || 'Not configured');
  console.log('Supabase Key Present:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  
  // Check auth status
  const { data: { session }, error } = await supabase.auth.getSession();
  console.log('Auth Session:', session ? 'Valid' : 'Invalid');
  console.log('Auth Error:', error || 'None');
  console.log('User ID:', session?.user?.id || 'None');
  console.log('Access Token Present:', !!session?.access_token);
  
  // Check realtime configuration
  const realtimeSocket = (supabase as any).realtime?.socket;
  console.log('Realtime Socket Exists:', !!realtimeSocket);
  
  if (realtimeSocket) {
    console.log('Socket ReadyState:', realtimeSocket.readyState, `(${WEBSOCKET_STATE_NAMES[realtimeSocket.readyState] || 'UNKNOWN'})`);
    console.log('Socket URL:', realtimeSocket.endPoint || 'Not set');
    console.log('Socket Connection State:', realtimeSocket.connectionState || 'Unknown');
  }
  
  // Check environment variables
  console.log('Environment Check:');
  console.log('- Window location:', window.location.href);
  console.log('- User Agent:', navigator.userAgent);
  console.log('=== Diagnostic End ===');
  
  return { session, realtimeSocket };
};

/**
 * Force WebSocket connection establishment with timeout
 */
const ensureWebSocketConnection = async (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.error('❌ WebSocket connection timeout after 10 seconds');
      reject(new Error('WebSocket connection timeout'));
    }, 10000);

    const realtimeSocket = (supabase as any).realtime?.socket;
    
    if (!realtimeSocket) {
      clearTimeout(timeout);
      reject(new Error('Realtime socket not available'));
      return;
    }

    // Force connection if not connected
    const currentState = realtimeSocket.readyState;
    console.log(`🔍 Current WebSocket state: ${currentState} (${WEBSOCKET_STATE_NAMES[currentState] || 'UNKNOWN'})`);
    
    if (currentState !== WEBSOCKET_STATES.OPEN) {
      console.log('🔄 Forcing WebSocket connection...');
      try {
        (supabase as any).realtime.connect();
      } catch (connectError) {
        console.error('❌ Error forcing connection:', connectError);
      }
    }

    // Monitor connection state with detailed logging
    const checkConnection = (attempt = 1) => {
      const state = realtimeSocket.readyState;
      const stateName = WEBSOCKET_STATE_NAMES[state] || 'UNKNOWN';
      
      console.log(`🔍 WebSocket state check ${attempt}: ${state} (${stateName})`);
      
      if (state === WEBSOCKET_STATES.OPEN) {
        console.log('✅ WebSocket connection established successfully');
        clearTimeout(timeout);
        resolve(true);
      } else if (state === WEBSOCKET_STATES.CLOSED) {
        console.error('❌ WebSocket connection closed unexpectedly');
        clearTimeout(timeout);
        reject(new Error('WebSocket connection closed'));
      } else if (attempt >= 100) { // Max 10 seconds of checking
        console.error('❌ WebSocket failed to reach OPEN state after maximum attempts');
        clearTimeout(timeout);
        reject(new Error(`WebSocket stuck in ${stateName} state`));
      } else {
        // Still connecting, check again
        setTimeout(() => checkConnection(attempt + 1), 100);
      }
    };
    
    checkConnection();
  });
};

/**
 * Setup realtime authentication with comprehensive error handling
 */
const setupRealtimeAuth = async (): Promise<Session> => {
  console.log('🔐 Setting up realtime authentication...');
  
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('❌ Auth error:', error);
    throw new Error(`Authentication error: ${error.message}`);
  }
  
  if (!session) {
    console.error('❌ No valid session for realtime');
    throw new Error('Authentication required for realtime - user must be signed in');
  }
  
  if (!session.access_token) {
    console.error('❌ Session missing access token');
    throw new Error('Session missing access token');
  }
  
  // Set realtime auth explicitly with error handling
  try {
    (supabase as any).realtime.setAuth(session.access_token);
    console.log('✅ Realtime auth set successfully');
  } catch (authError) {
    const errorMessage = authError instanceof Error ? authError.message : 'Unknown error';
    console.error('❌ Failed to set realtime auth:', errorMessage);
    throw new Error(`Failed to set realtime authentication: ${errorMessage}`);
  }
  
  console.log('✅ Authentication setup complete');
  return session;
};

/**
 * Create robust realtime subscription with full diagnostics
 */
const createRobustRealtimeSubscription = async (
  queryClient: ReturnType<typeof useQueryClient>,
  toast: ReturnType<typeof useToast>['toast']
): Promise<any> => {
  try {
    console.log('🚀 Creating robust realtime subscription...');
    
    // Step 1: Comprehensive diagnostics
    const { session } = await diagnoseWebSocketConnection();
    
    // Step 2: Ensure authentication
    const validSession = await setupRealtimeAuth();
    
    // Step 3: Ensure WebSocket connection
    await ensureWebSocketConnection();
    
    // Step 4: Create subscription with enhanced configuration
    const channelName = `yff-applications-robust-${Date.now()}`;
    console.log(`📡 Creating channel: ${channelName}`);
    
    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: `admin-${validSession.user.id}` }
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
          console.log('📨 Realtime update received:', {
            eventType: payload.eventType,
            table: payload.table,
            schema: payload.schema,
            timestamp: new Date().toISOString(),
            hasNewRecord: !!payload.new,
            hasOldRecord: !!payload.old
          });
          
          // Invalidate and refetch applications
          queryClient.invalidateQueries({ 
            queryKey: ['yff-applications-realtime'] 
          });
          
          // Show appropriate notifications
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Application",
              description: "A new YFF application has been submitted.",
            });
          } else if (payload.eventType === 'UPDATE' && payload.new && typeof payload.new === 'object') {
            const newRecord = payload.new as any;
            if (newRecord.evaluation_status === 'completed') {
              toast({
                title: "Evaluation Completed",
                description: "An application evaluation has been completed.",
              });
            }
          }
        }
      )
      .subscribe(async (status, err) => {
        const timestamp = new Date().toISOString();
        
        console.log(`📡 Subscription status: ${status}`, {
          timestamp,
          error: err,
          channelName
        });
        
        if (err) {
          // Handle different error types safely
          let errorMessage = 'Unknown error';
          let errorCode: string | undefined;
          let errorDetails: string | undefined;
          
          if (err instanceof Error) {
            errorMessage = err.message;
          } else if (typeof err === 'object' && err !== null) {
            if ('message' in err) errorMessage = String(err.message);
            if ('code' in err) errorCode = String(err.code);
            if ('details' in err) errorDetails = String(err.details);
          }
          
          console.error('❌ Subscription error details:', {
            message: errorMessage,
            code: errorCode || 'No code',
            details: errorDetails || 'No details'
          });
        }
      });

    // Step 5: Verify subscription establishment with enhanced checking
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timeout = setTimeout(() => {
        const elapsed = Date.now() - startTime;
        console.error(`❌ Subscription timeout after ${elapsed}ms`);
        reject(new Error(`Subscription did not establish within 15 seconds (${elapsed}ms elapsed)`));
      }, 15000);

      const checkSubscription = (attempt = 1) => {
        const realtimeSocket = (supabase as any).realtime?.socket;
        const socketState = realtimeSocket?.readyState;
        const socketStateName = WEBSOCKET_STATE_NAMES[socketState] || 'UNKNOWN';
        const channelState = (channel as any).state;
        const elapsed = Date.now() - startTime;
        
        console.log(`🔍 Subscription check ${attempt} (${elapsed}ms):`, {
          socketState: `${socketState} (${socketStateName})`,
          channelState,
          attempt,
          elapsed
        });
        
        if (channelState === 'joined' && socketState === WEBSOCKET_STATES.OPEN) {
          console.log('✅ Subscription established successfully!', {
            elapsed: `${elapsed}ms`,
            socketState: socketStateName,
            channelState
          });
          clearTimeout(timeout);
          resolve(channel);
        } else if (channelState === 'errored' || channelState === 'closed') {
          console.error('❌ Subscription failed:', {
            channelState,
            socketState: socketStateName,
            elapsed: `${elapsed}ms`
          });
          clearTimeout(timeout);
          reject(new Error(`Subscription failed with channel state: ${channelState}, socket state: ${socketStateName}`));
        } else if (attempt >= 150) { // Max attempts (15 seconds / 100ms)
          console.error('❌ Subscription check timeout:', {
            finalChannelState: channelState,
            finalSocketState: socketStateName,
            totalAttempts: attempt,
            elapsed: `${elapsed}ms`
          });
          clearTimeout(timeout);
          reject(new Error(`Subscription establishment timeout: channel=${channelState}, socket=${socketStateName}`));
        } else {
          // Continue checking
          setTimeout(() => checkSubscription(attempt + 1), 100);
        }
      };
      
      // Start checking immediately
      checkSubscription();
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Realtime subscription setup failed:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

/**
 * Hook for real-time YFF applications with enhanced reliability
 */
export const useRealTimeApplications = (): UseRealTimeApplicationsReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error' | 'fallback'>('disconnected');
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Refs for managing subscriptions and state
  const channelRef = useRef<any>(null);
  const isSetupInProgressRef = useRef<boolean>(false);
  const connectionAttemptRef = useRef<number>(0);

  // Primary data query
  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ['yff-applications-realtime'],
    queryFn: async (): Promise<YffApplicationWithIndividual[]> => {
      try {
        console.log('🔄 Fetching YFF applications...');
        
        const { data, error } = await supabase
          .from('yff_applications')
          .select(`
            *,
            individuals(
              first_name,
              last_name,
              email
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Supabase query error:', error);
          throw new Error(`Database query failed: ${error.message}`);
        }

        console.log(`✅ Fetched ${data?.length || 0} applications`);
        setLastUpdate(new Date());
        
        return (data as YffApplicationWithIndividual[]) || [];
        
      } catch (error) {
        console.error('❌ Application fetch error:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 30000,
  });

  /**
   * Setup realtime subscription with enhanced error handling
   */
  const setupRealtimeSubscription = useCallback(async (): Promise<boolean> => {
    // Prevent multiple simultaneous setup attempts
    if (isSetupInProgressRef.current) {
      console.log('⏳ Subscription setup already in progress, skipping...');
      return false;
    }
    
    isSetupInProgressRef.current = true;
    connectionAttemptRef.current += 1;
    const attemptNumber = connectionAttemptRef.current;
    
    try {
      console.log(`🔗 Setting up realtime subscription (attempt #${attemptNumber})...`);
      setConnectionStatus('connecting');
      setIsConnected(false);
      
      // Clean up existing subscription
      if (channelRef.current) {
        console.log('🧹 Cleaning up existing subscription...');
        try {
          await supabase.removeChannel(channelRef.current);
        } catch (cleanupError) {
          console.warn('⚠️ Error during cleanup:', cleanupError);
        }
        channelRef.current = null;
      }
      
      // Create new subscription
      const channel = await createRobustRealtimeSubscription(queryClient, toast);
      channelRef.current = channel;
      
      console.log('✅ Realtime subscription established successfully!');
      setIsConnected(true);
      setConnectionStatus('connected');
      setRetryCount(0);
      
      toast({
        title: "Real-time Updates Active",
        description: "Dashboard will now update automatically.",
        variant: "default"
      });
      
      return true;
      
    } catch (error) {
      console.error(`❌ Subscription setup failed (attempt #${attemptNumber}):`, error);
      setIsConnected(false);
      setConnectionStatus('error');
      
      // Implement retry logic
      const currentRetryCount = retryCount + 1;
      const maxRetries = 3;
      
      if (currentRetryCount <= maxRetries) {
        console.log(`🔄 Scheduling retry ${currentRetryCount}/${maxRetries} in 5 seconds...`);
        setRetryCount(currentRetryCount);
        
        setTimeout(() => {
          setupRealtimeSubscription();
        }, 5000);
      } else {
        console.error('💀 Max retries reached, switching to fallback mode');
        setConnectionStatus('fallback');
        
        toast({
          title: "Real-time Updates Unavailable",
          description: "Using periodic refresh instead.",
          variant: "destructive"
        });
      }
      
      return false;
      
    } finally {
      isSetupInProgressRef.current = false;
    }
  }, [queryClient, toast, retryCount]);

  // Initialize subscription on mount
  useEffect(() => {
    console.log('🚀 Initializing real-time subscription hook');
    
    // Reset counters
    connectionAttemptRef.current = 0;
    setRetryCount(0);
    
    // Start subscription setup
    setupRealtimeSubscription();
    
    return () => {
      console.log('🧹 Cleaning up real-time subscription on unmount');
      
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.warn('⚠️ Error during unmount cleanup:', error);
        }
      }
      
      setIsConnected(false);
      setConnectionStatus('disconnected');
      isSetupInProgressRef.current = false;
    };
  }, []); // Empty deps to prevent re-setup

  // Handle authentication state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, !!session);
        
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ User signed in, establishing real-time subscription');
          
          // Wait a moment for auth to settle, then setup subscription
          setTimeout(() => {
            setupRealtimeSubscription();
          }, 1000);
          
        } else if (event === 'SIGNED_OUT') {
          console.log('❌ User signed out, cleaning up real-time subscription');
          
          if (channelRef.current) {
            try {
              supabase.removeChannel(channelRef.current);
            } catch (error) {
              console.warn('⚠️ Error during auth cleanup:', error);
            }
            channelRef.current = null;
          }
          
          setIsConnected(false);
          setConnectionStatus('disconnected');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setupRealtimeSubscription]);

  return {
    applications,
    isLoading,
    error: error as Error | null,
    isConnected,
    connectionStatus,
    retryCount,
    lastUpdate
  };
};
