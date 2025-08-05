
/**
 * @fileoverview Real-Time YFF Applications Hook with Enhanced Connection Management
 * 
 * Provides real-time updates for YFF applications using robust WebSocket
 * connection management with comprehensive error handling and retry logic.
 * 
 * @version 6.0.0
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
 * Hook for real-time YFF applications with enhanced connection management
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
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 30000,
  });

  /**
   * Start fallback polling when real-time fails
   */
  const startFallbackMode = useCallback(() => {
    if (isFallbackMode) {
      console.log('⚠️ Fallback mode already active');
      return;
    }
    
    console.log('🔄 Starting fallback polling mode...');
    setConnectionStatus('fallback');
    setIsConnected(false);
    setIsFallbackMode(true);
    
    // Clear any existing polling
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
    }
    
    fallbackIntervalRef.current = setInterval(() => {
      console.log('🔄 Fallback polling for updates...');
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
      console.log('⏹️ Stopped fallback polling');
    }
  }, []);

  /**
   * Handle database change events
   */
  const handleDatabaseChange = useCallback((payload: any) => {
    try {
      const applicationId = payload.new?.application_id || payload.old?.application_id;
      
      console.log('📨 Real-time update received:', {
        eventType: payload.eventType,
        applicationId: applicationId ? applicationId.slice(0, 8) + '...' : 'unknown',
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
      console.error('❌ Error handling real-time event:', eventError);
    }
  }, [queryClient, toast]);

  /**
   * Setup real-time subscription with enhanced error handling
   */
  const setupRealtimeSubscription = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔗 Setting up real-time subscription...');
      
      // Clear any existing setup timeout
      if (setupTimeoutRef.current) {
        clearTimeout(setupTimeoutRef.current);
        setupTimeoutRef.current = null;
      }
      
      // Create subscription manager if not exists
      if (!subscriptionManagerRef.current) {
        subscriptionManagerRef.current = new RealtimeSubscriptionManager();
        
        // Add connection state listener
        subscriptionManagerRef.current.addListener((subscriptionState) => {
          const connectionState = subscriptionManagerRef.current?.getConnectionState();
          if (!connectionState) return;

          console.log('📊 Subscription state updated:', {
            connection: connectionState.status,
            subscriptions: subscriptionState.subscriptionCount,
            isActive: subscriptionState.isActive,
            eventCount: subscriptionState.eventCount,
            retryCount: connectionState.retryCount
          });

          // Map connection status
          const mappedStatus = CONNECTION_STATUS_MAP[connectionState.status] || 'error';
          setConnectionStatus(mappedStatus);
          setIsConnected(connectionState.status === 'connected');
          setRetryCount(connectionState.retryCount);

          // Handle connection errors with fallback
          if (connectionState.status === 'error' && connectionState.retryCount >= 3) {
            console.error('💀 Max retries reached, switching to fallback mode');
            startFallbackMode();
          } else if (connectionState.status === 'connected') {
            // Connection successful, stop fallback if running
            stopFallbackMode();
          }
        });
      }

      // Start subscription manager with timeout
      console.log('🚀 Starting subscription manager...');
      const startPromise = subscriptionManagerRef.current.start();
      
      // Set up a timeout for the start operation
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setupTimeoutRef.current = setTimeout(() => {
          console.error('⏰ Subscription manager start timeout');
          resolve(false);
        }, 30000); // 30 second timeout
      });
      
      const started = await Promise.race([startPromise, timeoutPromise]);
      
      if (setupTimeoutRef.current) {
        clearTimeout(setupTimeoutRef.current);
        setupTimeoutRef.current = null;
      }
      
      if (!started) {
        console.error('❌ Failed to start subscription manager');
        startFallbackMode();
        return false;
      }

      // Subscribe to YFF applications changes
      console.log('📡 Creating subscription...');
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
        console.error('❌ Failed to subscribe to YFF applications');
        startFallbackMode();
        return false;
      }

      console.log('✅ Real-time subscription setup completed');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to setup real-time subscription:', error);
      startFallbackMode();
      return false;
    }
  }, [handleDatabaseChange, startFallbackMode, stopFallbackMode]);

  /**
   * Cleanup subscription
   */
  const cleanupSubscription = useCallback(() => {
    console.log('🧹 Cleaning up real-time subscription...');
    
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
  }, [stopFallbackMode]);

  // Initialize subscription on mount
  useEffect(() => {
    if (isInitializedRef.current) {
      return;
    }
    
    console.log('🚀 Initializing real-time subscription hook');
    isInitializedRef.current = true;
    
    // Delay setup to allow auth to settle
    setTimeout(() => {
      setupRealtimeSubscription();
    }, 2000);
    
    return () => {
      console.log('🧹 Cleaning up real-time subscription on unmount');
      isInitializedRef.current = false;
      cleanupSubscription();
    };
  }, [setupRealtimeSubscription, cleanupSubscription]);

  // Handle authentication state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, !!session);
        
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ User signed in, setting up real-time subscription');
          
          // Wait for auth to settle before setting up subscription
          setTimeout(() => {
            setupRealtimeSubscription();
          }, 3000);
          
        } else if (event === 'SIGNED_OUT') {
          console.log('❌ User signed out, cleaning up real-time subscription');
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
        console.log('👁️ Page became visible, checking connection status');
        
        if (!isConnected && connectionStatus !== 'connecting' && !isFallbackMode) {
          console.log('🔄 Page visible and not connected, attempting reconnection...');
          setTimeout(() => {
            setupRealtimeSubscription();
          }, 1000);
        }
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
