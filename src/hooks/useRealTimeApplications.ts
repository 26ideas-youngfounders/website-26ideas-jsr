
/**
 * @fileoverview Bulletproof Real-Time YFF Applications Hook
 * 
 * Completely rebuilt real-time applications hook with bulletproof connection management,
 * comprehensive error handling, and robust event processing.
 * 
 * @version 3.0.0 - COMPLETE SYSTEM REBUILD
 * @author 26ideas Development Team
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RealtimeSubscriptionManager } from '@/utils/realtime-subscription-manager';
import type { YffApplicationWithIndividual } from '@/types/yff-application';

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
  
  console.log(`[${timestamp}] REALTIME_HOOK_${operation.toUpperCase()}:`, logEntry);
  
  if (error) {
    console.error(`[${timestamp}] REALTIME_HOOK_ERROR in ${operation}:`, error);
  }
};

/**
 * Enhanced WebSocket state constants for better error handling
 */
const CONNECTION_STATUS_MAP = {
  disconnected: 'disconnected',
  connecting: 'connecting',
  connected: 'connected',
  error: 'error',
  reconnecting: 'connecting',
} as const;

/**
 * BULLETPROOF REAL-TIME APPLICATIONS HOOK
 */
export const useRealTimeApplications = (): UseRealTimeApplicationsReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error' | 'fallback'>('disconnected');
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Refs for managing subscription lifecycle
  const subscriptionManagerRef = useRef<RealtimeSubscriptionManager | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const setupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Primary data query with enhanced error handling
  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ['yff-applications-realtime'],
    queryFn: async (): Promise<YffApplicationWithIndividual[]> => {
      try {
        logOperation('DATA_FETCH_START', {});
        
        // Verify authentication before making query
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session) {
          throw new Error(`Authentication required: ${authError?.message || 'No session'}`);
        }

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
          logOperation('DATA_FETCH_ERROR', { error }, error);
          throw new Error(`Database query failed: ${error.message} (${error.code})`);
        }

        logOperation('DATA_FETCH_SUCCESS', { 
          recordCount: data?.length || 0,
          firstRecord: data?.[0]?.application_id?.slice(0, 8) + '...' || 'none'
        });
        
        setLastUpdate(new Date());
        
        return (data as YffApplicationWithIndividual[]) || [];
        
      } catch (error) {
        logOperation('DATA_FETCH_FAILED', {}, error);
        throw error;
      }
    },
    retry: (failureCount, error: any) => {
      logOperation('DATA_FETCH_RETRY_DECISION', { 
        failureCount, 
        errorMessage: error?.message,
        willRetry: failureCount < 3 
      });
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 10000);
      logOperation('DATA_FETCH_RETRY_DELAY', { attemptIndex, delay });
      return delay;
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 30000,
  });

  /**
   * Start fallback polling when real-time fails
   */
  const startFallbackMode = useCallback(() => {
    if (isFallbackMode) {
      logOperation('FALLBACK_ALREADY_ACTIVE', {});
      return;
    }
    
    logOperation('FALLBACK_MODE_START', {});
    setConnectionStatus('fallback');
    setIsConnected(false);
    setIsFallbackMode(true);
    
    // Clear any existing polling
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
    }
    
    fallbackIntervalRef.current = setInterval(() => {
      logOperation('FALLBACK_POLLING', {});
      queryClient.invalidateQueries({ queryKey: ['yff-applications-realtime'] });
    }, 15000);
    
    toast({
      title: "Real-time Updates Unavailable",
      description: "Using periodic refresh instead.",
      variant: "default"
    });
  }, [queryClient, toast, isFallbackMode]);

  /**
   * Stop fallback polling
   */
  const stopFallbackMode = useCallback(() => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
      setIsFallbackMode(false);
      logOperation('FALLBACK_MODE_STOPPED', {});
    }
  }, []);

  /**
   * Handle database change events
   */
  const handleDatabaseChange = useCallback((payload: any) => {
    try {
      const applicationId = payload.new?.application_id || payload.old?.application_id;
      
      logOperation('DATABASE_EVENT_RECEIVED', {
        eventType: payload.eventType,
        table: payload.table,
        schema: payload.schema,
        applicationId: applicationId ? applicationId.slice(0, 8) + '...' : 'unknown',
        hasNew: !!payload.new,
        hasOld: !!payload.old,
        timestamp: new Date().toISOString()
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
          const displayId = applicationId ? applicationId.slice(0, 8) + '...' : 'Unknown';
          
          if (newRecord.evaluation_status === 'completed') {
            toast({
              title: "Evaluation Completed",
              description: `Application ${displayId} has been evaluated.`,
            });
          } else if (newRecord.evaluation_status === 'processing') {
            toast({
              title: "Evaluation Started",
              description: `Application ${displayId} is being evaluated.`,
            });
          }
        }
      }
    } catch (eventError) {
      logOperation('DATABASE_EVENT_HANDLER_ERROR', {}, eventError);
    }
  }, [queryClient, toast]);

  /**
   * BULLETPROOF REAL-TIME SUBSCRIPTION SETUP
   */
  const setupRealtimeSubscription = useCallback(async (): Promise<boolean> => {
    try {
      logOperation('REALTIME_SETUP_START', {});
      
      // Clear any existing setup timeout
      if (setupTimeoutRef.current) {
        clearTimeout(setupTimeoutRef.current);
        setupTimeoutRef.current = null;
      }
      
      // Create subscription manager if not exists
      if (!subscriptionManagerRef.current) {
        logOperation('REALTIME_CREATING_MANAGER', {});
        subscriptionManagerRef.current = new RealtimeSubscriptionManager();
        
        // Add connection state listener
        subscriptionManagerRef.current.addListener((subscriptionState) => {
          const connectionState = subscriptionManagerRef.current?.getConnectionState();
          if (!connectionState) return;

          logOperation('REALTIME_STATE_UPDATE', {
            connection: connectionState.status,
            subscriptions: subscriptionState.subscriptionCount,
            isActive: subscriptionState.isActive,
            eventCount: subscriptionState.eventCount,
            retryCount: connectionState.retryCount,
            authenticated: connectionState.isAuthenticated
          });

          // Map connection status
          const mappedStatus = CONNECTION_STATUS_MAP[connectionState.status] || 'error';
          setConnectionStatus(mappedStatus);
          setIsConnected(connectionState.status === 'connected' && connectionState.isAuthenticated);
          setRetryCount(connectionState.retryCount);

          // Handle connection errors with fallback
          if (connectionState.status === 'error' && connectionState.retryCount >= 3) {
            logOperation('REALTIME_MAX_RETRIES_REACHED', { retryCount: connectionState.retryCount });
            startFallbackMode();
          } else if (connectionState.status === 'connected' && connectionState.isAuthenticated) {
            // Connection successful, stop fallback if running
            stopFallbackMode();
          }
        });
      }

      // Start subscription manager with timeout
      logOperation('REALTIME_STARTING_MANAGER', {});
      
      const startPromise = subscriptionManagerRef.current.start();
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setupTimeoutRef.current = setTimeout(() => {
          logOperation('REALTIME_START_TIMEOUT', {});
          resolve(false);
        }, 25000); // 25 second timeout
      });
      
      const started = await Promise.race([startPromise, timeoutPromise]);
      
      if (setupTimeoutRef.current) {
        clearTimeout(setupTimeoutRef.current);
        setupTimeoutRef.current = null;
      }
      
      if (!started) {
        logOperation('REALTIME_START_FAILED', {});
        startFallbackMode();
        return false;
      }

      // Subscribe to YFF applications changes
      logOperation('REALTIME_CREATING_SUBSCRIPTION', {});
      const subscribed = subscriptionManagerRef.current.subscribe(
        'yff-applications',
        {
          table: 'yff_applications',
          schema: 'public',
          event: '*'
        },
        handleDatabaseChange
      );

      if (!subscribed) {
        logOperation('REALTIME_SUBSCRIPTION_FAILED', {});
        startFallbackMode();
        return false;
      }

      logOperation('REALTIME_SETUP_SUCCESS', {});
      return true;
      
    } catch (error) {
      logOperation('REALTIME_SETUP_ERROR', {}, error);
      startFallbackMode();
      return false;
    }
  }, [handleDatabaseChange, startFallbackMode, stopFallbackMode]);

  /**
   * Cleanup subscription
   */
  const cleanupSubscription = useCallback(() => {
    logOperation('REALTIME_CLEANUP_START', {});
    
    // Clear setup timeout
    if (setupTimeoutRef.current) {
      clearTimeout(setupTimeoutRef.current);
      setupTimeoutRef.current = null;
    }
    
    if (subscriptionManagerRef.current) {
      subscriptionManagerRef.current.stop();
      subscriptionManagerRef.current = null;
    }

    stopFallbackMode();
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setRetryCount(0);
    
    logOperation('REALTIME_CLEANUP_COMPLETE', {});
  }, [stopFallbackMode]);

  // Initialize subscription on mount
  useEffect(() => {
    if (isInitializedRef.current) {
      return;
    }
    
    logOperation('REALTIME_HOOK_INITIALIZE', {});
    isInitializedRef.current = true;
    
    // Setup real-time subscription with slight delay
    setTimeout(() => {
      setupRealtimeSubscription();
    }, 2000);
    
    return () => {
      logOperation('REALTIME_HOOK_UNMOUNT', {});
      isInitializedRef.current = false;
      cleanupSubscription();
    };
  }, [setupRealtimeSubscription, cleanupSubscription]);

  // Handle authentication state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logOperation('AUTH_STATE_CHANGE', { event, hasSession: !!session });
        
        if (event === 'SIGNED_IN' && session) {
          logOperation('AUTH_SIGNED_IN', { userId: session.user.id });
          
          // Wait for auth to settle before setting up subscription
          setTimeout(() => {
            setupRealtimeSubscription();
          }, 2000);
          
        } else if (event === 'SIGNED_OUT') {
          logOperation('AUTH_SIGNED_OUT', {});
          cleanupSubscription();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setupRealtimeSubscription, cleanupSubscription]);

  // Handle visibility change for better resource management
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logOperation('PAGE_VISIBLE', { 
          isConnected, 
          connectionStatus, 
          isFallbackMode 
        });
        
        if (!isConnected && connectionStatus !== 'connecting' && !isFallbackMode) {
          logOperation('PAGE_VISIBLE_RECONNECT', {});
          setTimeout(() => {
            setupRealtimeSubscription();
          }, 1000);
        }
      } else {
        logOperation('PAGE_HIDDEN', {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConnected, connectionStatus, isFallbackMode, setupRealtimeSubscription]);

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
