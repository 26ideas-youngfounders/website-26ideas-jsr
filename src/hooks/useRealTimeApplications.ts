
/**
 * @fileoverview Real-Time YFF Applications Hook with Enhanced WebSocket Management
 * 
 * Provides real-time updates for YFF applications using Supabase
 * real-time subscriptions with comprehensive WebSocket state handling,
 * robust error recovery, and reliable connection management.
 * 
 * @version 6.0.0
 * @author 26ideas Development Team
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WebSocketConnectionManager } from '@/utils/websocket-connection-manager';
import { RealtimeSubscriptionManager } from '@/utils/realtime-subscription-manager';
import type { YffApplicationWithIndividual } from '@/types/yff-application';
import type { ConnectionStatus } from '@/utils/websocket-connection-manager';

interface UseRealTimeApplicationsReturn {
  applications: YffApplicationWithIndividual[];
  isLoading: boolean;
  error: Error | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' | 'fallback';
  retryCount: number;
  lastUpdate: Date | null;
  forceReconnect: () => Promise<void>;
}

/**
 * Hook for real-time YFF applications with enhanced reliability
 */
export const useRealTimeApplications = (): UseRealTimeApplicationsReturn => {
  const [connectionState, setConnectionState] = useState<ConnectionStatus>({
    isConnected: false,
    status: 'disconnected',
    retryCount: 0,
    lastError: null,
    lastUpdate: null,
    connectionId: `hook_${Date.now()}`,
    uptime: 0
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Refs for managing connections and subscriptions
  const connectionManagerRef = useRef<WebSocketConnectionManager | null>(null);
  const subscriptionManagerRef = useRef<RealtimeSubscriptionManager | null>(null);
  const initializationRef = useRef<boolean>(false);

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
        
        // Update connection state with successful data fetch
        setConnectionState(prev => ({
          ...prev,
          lastUpdate: new Date()
        }));
        
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
   * Initialize connection and subscription managers
   */
  const initializeManagers = useCallback(() => {
    if (initializationRef.current) {
      console.log('⏳ Managers already initialized, skipping...');
      return;
    }

    console.log('🚀 Initializing connection and subscription managers...');
    
    // Create connection manager
    connectionManagerRef.current = new WebSocketConnectionManager({
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      timeoutMs: 15000,
      enableAutoReconnect: true
    });

    // Subscribe to connection status changes
    connectionManagerRef.current.onStatusChange((status) => {
      console.log('📊 Connection status changed:', status);
      setConnectionState(status);
      
      // Show appropriate toast notifications
      if (status.status === 'connected' && status.retryCount === 0) {
        toast({
          title: "Real-time Updates Active",
          description: "Dashboard will now update automatically.",
          variant: "default"
        });
      } else if (status.status === 'error' && status.retryCount >= 3) {
        toast({
          title: "Real-time Updates Unavailable",
          description: "Using periodic refresh instead.",
          variant: "destructive"
        });
      }
    });

    // Create subscription manager
    subscriptionManagerRef.current = new RealtimeSubscriptionManager(
      connectionManagerRef.current
    );

    initializationRef.current = true;
    console.log('✅ Managers initialized successfully');
  }, [toast]);

  /**
   * Setup realtime subscription
   */
  const setupRealtimeSubscription = useCallback(async (): Promise<void> => {
    if (!subscriptionManagerRef.current || !connectionManagerRef.current) {
      console.error('❌ Managers not initialized, cannot setup subscription');
      return;
    }

    try {
      console.log('📡 Setting up realtime subscription...');
      
      await subscriptionManagerRef.current.createSubscription(
        {
          channelName: `yff-applications-${Date.now()}`,
          table: 'yff_applications',
          schema: 'public',
          event: '*',
          validationTimeoutMs: 20000,
          maxValidationAttempts: 200
        },
        (payload) => {
          console.log('📨 Realtime update received:', {
            eventType: payload.eventType,
            timestamp: new Date().toISOString()
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
        },
        (status) => {
          console.log('📊 Subscription status updated:', status);
        }
      );

      console.log('✅ Realtime subscription established successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to setup realtime subscription:', errorMessage);
      throw error;
    }
  }, [queryClient, toast]);

  /**
   * Force reconnection
   */
  const forceReconnect = useCallback(async (): Promise<void> => {
    console.log('🔄 Forcing reconnection...');
    
    if (connectionManagerRef.current) {
      await connectionManagerRef.current.forceReconnect();
      await setupRealtimeSubscription();
    }
  }, [setupRealtimeSubscription]);

  // Initialize managers on mount
  useEffect(() => {
    initializeManagers();
    
    return () => {
      console.log('🧹 Cleaning up real-time subscription hook');
      initializationRef.current = false;
    };
  }, [initializeManagers]);

  // Setup subscription after managers are initialized
  useEffect(() => {
    if (initializationRef.current && connectionManagerRef.current) {
      console.log('🔗 Starting connection and subscription setup...');
      setupRealtimeSubscription().catch(error => {
        console.error('❌ Failed to setup subscription:', error);
      });
    }
  }, [setupRealtimeSubscription]);

  // Handle authentication state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, !!session);
        
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ User signed in, establishing real-time subscription');
          
          // Wait a moment for auth to settle, then setup subscription
          setTimeout(() => {
            setupRealtimeSubscription().catch(error => {
              console.error('❌ Failed to setup subscription after sign in:', error);
            });
          }, 1000);
          
        } else if (event === 'SIGNED_OUT') {
          console.log('❌ User signed out, cleaning up real-time subscription');
          
          if (subscriptionManagerRef.current) {
            subscriptionManagerRef.current.cleanup();
          }
          
          if (connectionManagerRef.current) {
            connectionManagerRef.current.disconnect();
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setupRealtimeSubscription]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting, cleaning up managers...');
      
      if (subscriptionManagerRef.current) {
        subscriptionManagerRef.current.cleanup();
      }
      
      if (connectionManagerRef.current) {
        connectionManagerRef.current.destroy();
      }
    };
  }, []);

  return {
    applications,
    isLoading,
    error: error as Error | null,
    isConnected: connectionState.isConnected,
    connectionStatus: connectionState.status,
    retryCount: connectionState.retryCount,
    lastUpdate: connectionState.lastUpdate,
    forceReconnect
  };
};
