
/**
 * @fileoverview Real-Time YFF Applications Hook with Enhanced WebSocket Management
 * 
 * Provides real-time updates for YFF applications using Supabase
 * real-time subscriptions with comprehensive WebSocket state handling,
 * robust error recovery, and reliable connection management.
 * 
 * @version 4.0.0
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
 * Type guard to check if an object has application_id property
 */
const hasApplicationId = (obj: any): obj is { application_id: string } => {
  return obj && typeof obj === 'object' && typeof obj.application_id === 'string';
};

/**
 * Safe function to extract application ID from payload data
 */
const getApplicationId = (newRecord: any, oldRecord: any): string | null => {
  if (hasApplicationId(newRecord)) {
    return newRecord.application_id;
  }
  if (hasApplicationId(oldRecord)) {
    return oldRecord.application_id;
  }
  return null;
};

/**
 * Hook for real-time YFF applications with enhanced WebSocket reliability
 */
export const useRealTimeApplications = (): UseRealTimeApplicationsReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error' | 'fallback'>('disconnected');
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Refs for managing subscriptions and timers
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionAttemptRef = useRef<number>(0);
  const currentSessionRef = useRef<Session | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  // Primary data query with improved error handling
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
    staleTime: 30000, // 30 seconds
  });

  /**
   * Enhanced WebSocket state validation
   */
  const validateWebSocketState = useCallback((channel: any): boolean => {
    if (!channel) {
      console.warn('⚠️ No channel provided for WebSocket validation');
      return false;
    }

    if (!channel.socket) {
      console.warn('⚠️ No socket found in channel');
      return false;
    }

    const readyState = channel.socket.readyState;
    const states = {
      0: 'CONNECTING',
      1: 'OPEN', 
      2: 'CLOSING',
      3: 'CLOSED'
    };

    console.log(`🔍 WebSocket state: ${readyState} (${states[readyState] || 'UNKNOWN'})`);
    
    return readyState === 1; // WebSocket.OPEN
  }, []);

  /**
   * Validate authentication status for real-time subscription
   */
  const validateAuthentication = useCallback(async (): Promise<Session | null> => {
    try {
      console.log('🔐 Validating authentication for real-time subscription...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Authentication error:', error);
        return null;
      }

      if (!session) {
        console.warn('⚠️ No authenticated session found');
        return null;
      }

      if (!session.access_token) {
        console.warn('⚠️ No access token in session');
        return null;
      }

      console.log('✅ Authentication validated:', {
        userId: session.user?.id,
        email: session.user?.email,
        tokenExists: !!session.access_token,
        tokenLength: session.access_token.length
      });

      currentSessionRef.current = session;
      return session;
      
    } catch (error) {
      console.error('❌ Authentication validation failed:', error);
      return null;
    }
  }, []);

  /**
   * Start polling fallback when real-time fails
   */
  const startPollingFallback = useCallback(() => {
    console.log('🔄 Starting polling fallback...');
    setConnectionStatus('fallback');
    setIsConnected(false);
    
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(() => {
      console.log('🔄 Polling for updates...');
      queryClient.invalidateQueries({ queryKey: ['yff-applications-realtime'] });
    }, 15000); // Poll every 15 seconds
    
    toast({
      title: "Real-time Updates Unavailable",
      description: "Using periodic refresh instead.",
      variant: "default"
    });
  }, [queryClient, toast]);

  /**
   * Stop polling fallback
   */
  const stopPollingFallback = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log('⏹️ Stopped polling fallback');
    }
  }, []);

  /**
   * Clean up existing subscriptions and timers
   */
  const cleanupExistingConnection = useCallback(() => {
    console.log('🧹 Cleaning up existing connection...');
    
    // Clear all timers
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    // Remove existing channel
    if (channelRef.current) {
      try {
        console.log('🗑️ Removing existing channel');
        supabase.removeChannel(channelRef.current);
      } catch (cleanupError) {
        console.warn('⚠️ Error during channel cleanup:', cleanupError);
      }
      channelRef.current = null;
    }

    // Stop polling if active
    stopPollingFallback();
  }, [stopPollingFallback]);

  /**
   * Enhanced real-time subscription setup with WebSocket state monitoring
   */
  const setupRealtimeSubscription = useCallback(async (): Promise<boolean> => {
    try {
      connectionAttemptRef.current += 1;
      const attemptNumber = connectionAttemptRef.current;
      
      console.log(`🔗 Setting up real-time subscription (attempt #${attemptNumber})...`);
      setConnectionStatus('connecting');
      setIsConnected(false);
      
      // Clean up existing connection
      cleanupExistingConnection();

      // Validate authentication first
      const session = await validateAuthentication();
      if (!session) {
        console.error('❌ Cannot establish real-time subscription without valid authentication');
        setConnectionStatus('error');
        startPollingFallback();
        return false;
      }

      // Set realtime auth explicitly
      try {
        console.log('🔐 Setting realtime authentication...');
        supabase.realtime.setAuth(session.access_token);
        console.log('✅ Realtime authentication set successfully');
      } catch (authError) {
        console.error('❌ Failed to set realtime auth:', authError);
        setConnectionStatus('error');
        startPollingFallback();
        return false;
      }

      // Create channel with enhanced configuration
      const channelName = `yff-applications-realtime-${attemptNumber}-${Date.now()}`;
      console.log(`📡 Creating channel: ${channelName}`);

      // Set connection timeout with better error handling
      connectionTimeoutRef.current = setTimeout(() => {
        console.error(`⏰ Connection timeout after 30 seconds (attempt #${attemptNumber})`);
        
        if (channelRef.current) {
          const isOpen = validateWebSocketState(channelRef.current);
          console.log(`🔍 WebSocket state at timeout: ${isOpen ? 'OPEN' : 'NOT OPEN'}`);
          
          if (!isOpen) {
            setConnectionStatus('error');
            const currentRetryCount = retryCount + 1;
            
            if (currentRetryCount <= 3) {
              console.log(`🔄 Will retry connection (attempt ${currentRetryCount}/3)`);
              setRetryCount(currentRetryCount);
              
              // Exponential backoff
              const delay = Math.min(1000 * Math.pow(2, currentRetryCount - 1), 10000);
              console.log(`⏱️ Retrying in ${delay}ms...`);
              reconnectTimeoutRef.current = setTimeout(() => {
                setupRealtimeSubscription();
              }, delay);
            } else {
              console.error('💀 Max connection attempts reached, switching to polling fallback');
              startPollingFallback();
            }
          }
        }
      }, 30000); // 30 second timeout

      const channel = supabase
        .channel(channelName, {
          config: {
            presence: { key: `admin-${session.user.id}-${Date.now()}` },
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
            const applicationId = getApplicationId(payload.new, payload.old);
            
            console.log('📨 Real-time update received:', {
              eventType: payload.eventType,
              applicationId: applicationId || 'unknown',
              timestamp: new Date().toISOString(),
              attempt: attemptNumber
            });
            
            // Invalidate and refetch applications
            queryClient.invalidateQueries({ 
              queryKey: ['yff-applications-realtime'] 
            });
            
            setLastUpdate(new Date());
            
            // Show appropriate notifications
            if (payload.eventType === 'INSERT') {
              toast({
                title: "New Application",
                description: "A new YFF application has been submitted.",
              });
            } else if (payload.eventType === 'UPDATE') {
              const newRecord = payload.new;
              if (newRecord && typeof newRecord === 'object' && 'evaluation_status' in newRecord) {
                if (newRecord.evaluation_status === 'completed') {
                  const displayId = applicationId ? applicationId.slice(0, 8) + '...' : 'Unknown';
                  toast({
                    title: "Evaluation Completed",
                    description: `Application ${displayId} has been evaluated.`,
                  });
                } else if (newRecord.evaluation_status === 'processing') {
                  const displayId = applicationId ? applicationId.slice(0, 8) + '...' : 'Unknown';
                  toast({
                    title: "Evaluation Started",
                    description: `Application ${displayId} is being evaluated.`,
                  });
                }
              }
            }
          }
        )
        .subscribe(async (status, err) => {
          const timestamp = new Date().toISOString();
          
          console.log(`📡 Subscription status change (attempt #${attemptNumber}):`, {
            status,
            error: err,
            timestamp,
            channelName
          });
          
          if (status === 'SUBSCRIBED') {
            // Wait a moment for WebSocket to be fully ready
            setTimeout(() => {
              const isWebSocketOpen = validateWebSocketState(channel);
              
              console.log(`🔍 WebSocket validation after SUBSCRIBED: ${isWebSocketOpen}`);
              
              if (isWebSocketOpen) {
                console.log(`✅ Real-time subscription established successfully (attempt #${attemptNumber})`);
                
                // Clear connection timeout
                if (connectionTimeoutRef.current) {
                  clearTimeout(connectionTimeoutRef.current);
                  connectionTimeoutRef.current = null;
                }
                
                setIsConnected(true);
                setConnectionStatus('connected');
                setRetryCount(0);
                
                // Stop polling fallback
                stopPollingFallback();
                
                // Show success notification
                toast({
                  title: "Real-time Updates Active",
                  description: "Dashboard will now update automatically.",
                  variant: "default"
                });
              } else {
                console.error(`❌ WebSocket not in OPEN state after subscription (attempt #${attemptNumber})`);
                setConnectionStatus('error');
                
                // Retry logic
                const currentRetryCount = retryCount + 1;
                if (currentRetryCount <= 3) {
                  console.log(`🔄 Retrying due to WebSocket state (attempt ${currentRetryCount}/3)`);
                  setRetryCount(currentRetryCount);
                  
                  const delay = Math.min(2000 * Math.pow(1.5, currentRetryCount), 10000);
                  reconnectTimeoutRef.current = setTimeout(() => {
                    setupRealtimeSubscription();
                  }, delay);
                } else {
                  console.error('💀 Max retries reached, switching to polling fallback');
                  startPollingFallback();
                }
              }
            }, 2000); // Wait 2 seconds for WebSocket to be fully ready
            
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.error(`❌ Real-time subscription error (attempt #${attemptNumber}):`, { 
              status, 
              error: err, 
              channelName 
            });
            
            setIsConnected(false);
            setConnectionStatus('error');
            
            // Clear connection timeout
            if (connectionTimeoutRef.current) {
              clearTimeout(connectionTimeoutRef.current);
              connectionTimeoutRef.current = null;
            }
            
            // Implement retry logic with exponential backoff
            const currentRetryCount = retryCount + 1;
            const maxRetries = 3;
            const baseDelay = 2000;
            const maxDelay = 10000;
            const delay = Math.min(baseDelay * Math.pow(1.5, currentRetryCount), maxDelay);
            
            if (currentRetryCount <= maxRetries) {
              console.log(`🔄 Scheduling reconnection attempt ${currentRetryCount} in ${delay}ms`);
              setRetryCount(currentRetryCount);
              
              reconnectTimeoutRef.current = setTimeout(() => {
                setupRealtimeSubscription();
              }, delay);
              
            } else {
              console.error('💀 Max reconnection attempts reached, switching to polling fallback');
              setConnectionStatus('fallback');
              startPollingFallback();
            }
          }
        });

      channelRef.current = channel;
      console.log(`📡 Real-time subscription setup completed (attempt #${attemptNumber})`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to setup real-time subscription (attempt #${connectionAttemptRef.current}):`, error);
      setIsConnected(false);
      setConnectionStatus('error');
      
      // Clear connection timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      // Fallback to polling
      startPollingFallback();
      return false;
    }
  }, [validateAuthentication, queryClient, toast, retryCount, cleanupExistingConnection, validateWebSocketState, stopPollingFallback, startPollingFallback]);

  // Initialize subscription on mount
  useEffect(() => {
    if (isInitializedRef.current) {
      return;
    }
    
    console.log('🚀 Initializing real-time subscription hook');
    isInitializedRef.current = true;
    
    // Reset state
    connectionAttemptRef.current = 0;
    setRetryCount(0);
    
    // Start subscription setup
    setupRealtimeSubscription();
    
    return () => {
      console.log('🧹 Cleaning up real-time subscription on unmount');
      isInitializedRef.current = false;
      
      // Clean up all resources
      cleanupExistingConnection();
      
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
  }, []); // Empty deps to prevent re-setup

  // Handle authentication state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, !!session);
        
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ User signed in, establishing real-time subscription');
          currentSessionRef.current = session;
          
          // Wait a moment for auth to settle, then setup subscription
          setTimeout(() => {
            setupRealtimeSubscription();
          }, 1000);
          
        } else if (event === 'SIGNED_OUT') {
          console.log('❌ User signed out, cleaning up real-time subscription');
          currentSessionRef.current = null;
          
          cleanupExistingConnection();
          
          setIsConnected(false);
          setConnectionStatus('disconnected');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setupRealtimeSubscription, cleanupExistingConnection]);

  // Handle visibility change for better resource management
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Page became visible, checking connection status');
        
        if (!isConnected && connectionStatus !== 'connecting' && connectionStatus !== 'fallback') {
          console.log('🔄 Page visible and not connected, attempting reconnection...');
          setupRealtimeSubscription();
        } else if (channelRef.current && !validateWebSocketState(channelRef.current)) {
          console.log('🔄 Page visible but WebSocket not open, attempting reconnection...');
          setupRealtimeSubscription();
        }
      } else {
        console.log('👁️ Page hidden, connection will be managed by existing logic');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConnected, connectionStatus, setupRealtimeSubscription, validateWebSocketState]);

  // Periodic connection health check with enhanced validation
  useEffect(() => {
    const healthCheck = setInterval(() => {
      if (connectionStatus === 'connected' && channelRef.current) {
        const isWebSocketOpen = validateWebSocketState(channelRef.current);
        
        if (!isWebSocketOpen) {
          console.warn('🔧 Connection health check failed - WebSocket not open, reconnecting...');
          setConnectionStatus('error');
          setIsConnected(false);
          setupRealtimeSubscription();
        } else {
          console.log('✅ Connection health check passed');
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(healthCheck);
  }, [connectionStatus, setupRealtimeSubscription, validateWebSocketState]);

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
