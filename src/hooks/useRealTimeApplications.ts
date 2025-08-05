
/**
 * @fileoverview Real-time YFF Applications Hook with Enhanced Error Handling
 * 
 * Provides real-time updates for YFF applications using Supabase
 * real-time subscriptions with comprehensive error handling and reconnection logic.
 * 
 * @version 2.0.0
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
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
   * Handle real-time subscription setup with reconnection logic
   */
  const setupRealtimeSubscription = useCallback(() => {
    try {
      console.log('🔗 Setting up real-time subscription...');
      
      // Clean up existing subscription
      if (channelRef.current) {
        console.log('🧹 Cleaning up existing subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel = supabase
        .channel(`yff-applications-realtime-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'yff_applications'
          },
          (payload) => {
            // Safe extraction of application ID
            const applicationId = getApplicationId(payload.new, payload.old);
            
            console.log('📨 Real-time update received:', {
              eventType: payload.eventType,
              applicationId: applicationId || 'unknown',
              timestamp: new Date().toISOString()
            });
            
            // Invalidate and refetch applications
            queryClient.invalidateQueries({ 
              queryKey: ['yff-applications-realtime'] 
            });
            
            setLastUpdate(new Date());
            
            // Show appropriate notifications with safe property access
            if (payload.eventType === 'INSERT') {
              toast({
                title: "New Application",
                description: "A new YFF application has been submitted.",
              });
            } else if (payload.eventType === 'UPDATE') {
              const newRecord = payload.new;
              if (newRecord && typeof newRecord === 'object' && 'evaluation_status' in newRecord && newRecord.evaluation_status === 'completed') {
                const displayId = applicationId ? applicationId.slice(0, 8) + '...' : 'Unknown';
                toast({
                  title: "Evaluation Completed",
                  description: `Application ${displayId} has been evaluated.`,
                });
              }
            }
          }
        )
        .subscribe((status, err) => {
          console.log('📡 Subscription status change:', status, err);
          
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setRetryCount(0);
            console.log('✅ Real-time subscription active');
            
            // Clear any pending reconnection attempts
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = null;
            }
            
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setIsConnected(false);
            console.error('❌ Real-time subscription error:', status, err);
            
            // Attempt reconnection with exponential backoff
            const nextRetryCount = retryCount + 1;
            const delay = Math.min(1000 * 2 ** nextRetryCount, 30000);
            
            if (nextRetryCount <= 5) {
              console.log(`🔄 Scheduling reconnection attempt ${nextRetryCount} in ${delay}ms`);
              
              reconnectTimeoutRef.current = setTimeout(() => {
                setRetryCount(nextRetryCount);
                setupRealtimeSubscription();
              }, delay);
            } else {
              console.error('💀 Max reconnection attempts reached');
              toast({
                title: "Connection Lost",
                description: "Real-time updates are unavailable. Please refresh the page.",
                variant: "destructive"
              });
            }
          }
        });

      channelRef.current = channel;
      
    } catch (error) {
      console.error('❌ Failed to setup real-time subscription:', error);
      setIsConnected(false);
    }
  }, [queryClient, toast, retryCount]);

  // Initialize subscription on mount
  useEffect(() => {
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
    };
  }, [setupRealtimeSubscription]);

  // Handle visibility change for better resource management
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Page became visible, ensuring connection');
        if (!isConnected && channelRef.current) {
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
  }, [isConnected, setupRealtimeSubscription]);

  return {
    applications,
    isLoading,
    error: error as Error | null,
    isConnected,
    retryCount,
    lastUpdate
  };
};
