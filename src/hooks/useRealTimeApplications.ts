
/**
 * @fileoverview Real-Time YFF Applications Hook with Enhanced Error Handling
 * 
 * Provides real-time updates for YFF applications using Supabase
 * real-time subscriptions with comprehensive error handling and reconnection logic.
 * 
 * @version 2.2.0
 * @author 26ideas Development Team
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { YffApplicationWithIndividual } from '@/types/yff-application';

interface UseRealTimeApplicationsReturn {
  applications: YffApplicationWithIndividual[];
  isLoading: boolean;
  error: Error | null;
  isConnected: boolean;
  retryCount: number;
  lastUpdate: Date | null;
  subscriptionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
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
 * Hook for real-time YFF applications with enhanced reliability
 */
export const useRealTimeApplications = (): UseRealTimeApplicationsReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionAttemptRef = useRef<number>(0);

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
   * Enhanced connection monitoring with detailed status tracking
   */
  const monitorConnection = useCallback(() => {
    const checkConnection = () => {
      const now = Date.now();
      const currentAttempt = connectionAttemptRef.current;
      
      console.log(`🔍 Connection check #${currentAttempt} at ${new Date(now).toISOString()}`);
      
      if (channelRef.current && channelRef.current.socket) {
        const socketState = channelRef.current.socket.readyState;
        console.log(`📡 WebSocket state: ${socketState} (0=connecting, 1=open, 2=closing, 3=closed)`);
        
        if (socketState === 1) { // WebSocket.OPEN
          if (!isConnected) {
            console.log('✅ Connection established successfully');
            setIsConnected(true);
            setSubscriptionStatus('connected');
            setRetryCount(0);
          }
        } else if (socketState === 3) { // WebSocket.CLOSED
          console.log('❌ Connection lost, will attempt reconnection');
          setIsConnected(false);
          setSubscriptionStatus('disconnected');
        }
      }
    };

    checkConnection();
    return setInterval(checkConnection, 2000); // Check every 2 seconds
  }, [isConnected]);

  /**
   * Handle real-time subscription setup with enhanced reliability
   */
  const setupRealtimeSubscription = useCallback(() => {
    try {
      connectionAttemptRef.current += 1;
      const attemptNumber = connectionAttemptRef.current;
      
      console.log(`🔗 Setting up real-time subscription (attempt #${attemptNumber})...`);
      setSubscriptionStatus('connecting');
      
      // Clean up existing subscription
      if (channelRef.current) {
        console.log('🧹 Cleaning up existing subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Clear any existing reconnection timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Use consistent channel name matching E2E tests
      const channelName = `yff-applications-realtime-main`;
      console.log(`📡 Creating channel: ${channelName} (attempt #${attemptNumber})`);

      const channel = supabase
        .channel(channelName, {
          config: {
            presence: { key: `admin-${Date.now()}` },
            broadcast: { self: true }
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
              attempt: attemptNumber,
              payload: payload
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
            console.log(`✅ Real-time subscription active (attempt #${attemptNumber})`);
            setIsConnected(true);
            setSubscriptionStatus('connected');
            setRetryCount(0);
            
            // Clear any pending reconnection attempts
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = null;
            }
            
            // Start connection monitoring
            const monitorInterval = monitorConnection();
            
            // Clean up monitor on channel removal
            const originalRemove = channel.unsubscribe;
            channel.unsubscribe = () => {
              clearInterval(monitorInterval);
              return originalRemove.call(channel);
            };
            
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.error(`❌ Real-time subscription error (attempt #${attemptNumber}):`, { 
              status, 
              error: err, 
              channelName 
            });
            
            setIsConnected(false);
            setSubscriptionStatus('error');
            
            // Implement exponential backoff for reconnection
            const currentRetryCount = retryCount + 1;
            const maxRetries = 8; // Increased max retries
            const baseDelay = 1000;
            const maxDelay = 60000; // Max 1 minute
            const delay = Math.min(baseDelay * Math.pow(1.5, currentRetryCount), maxDelay);
            
            if (currentRetryCount <= maxRetries) {
              console.log(`🔄 Scheduling reconnection attempt ${currentRetryCount} in ${delay}ms`);
              
              reconnectTimeoutRef.current = setTimeout(() => {
                setRetryCount(currentRetryCount);
                setupRealtimeSubscription();
              }, delay);
              
            } else {
              console.error('💀 Max reconnection attempts reached');
              setSubscriptionStatus('error');
              toast({
                title: "Connection Lost",
                description: "Real-time updates are unavailable. Please refresh the page.",
                variant: "destructive"
              });
            }
            
          } else if (status === 'CHANNEL_TIMEOUT') {
            console.warn(`⏰ Subscription timeout (attempt #${attemptNumber}), retrying...`);
            setSubscriptionStatus('error');
            
            // Immediate retry on timeout
            setTimeout(() => setupRealtimeSubscription(), 2000);
          }
        });

      channelRef.current = channel;
      console.log(`📡 Real-time subscription setup completed (attempt #${attemptNumber})`);
      
    } catch (error) {
      console.error(`❌ Failed to setup real-time subscription (attempt #${connectionAttemptRef.current}):`, error);
      setIsConnected(false);
      setSubscriptionStatus('error');
    }
  }, [queryClient, toast, retryCount, monitorConnection]);

  // Initialize subscription on mount with immediate setup
  useEffect(() => {
    console.log('🚀 Initializing real-time subscription hook');
    
    // Reset attempt counter
    connectionAttemptRef.current = 0;
    
    // Immediate setup
    setupRealtimeSubscription();
    
    return () => {
      console.log('🧹 Cleaning up real-time subscription on unmount');
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      setIsConnected(false);
      setSubscriptionStatus('disconnected');
    };
  }, []); // Remove setupRealtimeSubscription from deps to prevent re-setup

  // Handle visibility change for better resource management
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Page became visible, checking connection');
        
        if (!isConnected && subscriptionStatus !== 'connecting') {
          console.log('🔄 Page visible and not connected, reconnecting...');
          setupRealtimeSubscription();
        }
      } else {
        console.log('👁️ Page hidden');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConnected, subscriptionStatus, setupRealtimeSubscription]);

  // Periodic connection health check
  useEffect(() => {
    const healthCheck = setInterval(() => {
      if (subscriptionStatus === 'connected' && channelRef.current) {
        // Verify the channel is still active
        const channel = channelRef.current;
        if (channel.socket && channel.socket.readyState !== 1) {
          console.warn('🔧 Connection health check failed, reconnecting...');
          setupRealtimeSubscription();
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(healthCheck);
  }, [subscriptionStatus, setupRealtimeSubscription]);

  return {
    applications,
    isLoading,
    error: error as Error | null,
    isConnected,
    retryCount,
    lastUpdate,
    subscriptionStatus
  };
};
