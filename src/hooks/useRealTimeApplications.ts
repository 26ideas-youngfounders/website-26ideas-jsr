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
import { WebSocketProductionManager } from '@/utils/websocket-production-manager';
import { initializeHeartbeatMonitoring } from '@/utils/websocket-heartbeat-monitor';
import type { YffApplicationWithIndividual } from '@/types/yff-application';
import type { ProductionConnectionStatus } from '@/utils/websocket-production-manager';

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
 * Hook for real-time YFF applications with production-grade reliability
 */
export const useRealTimeApplications = (): UseRealTimeApplicationsReturn => {
  const [connectionState, setConnectionState] = useState<ProductionConnectionStatus>({
    isConnected: false,
    status: 'disconnected',
    retryCount: 0,
    lastError: null,
    lastUpdate: null,
    connectionId: `hook_${Date.now()}`,
    uptime: 0,
    diagnostics: {
      socketState: null,
      socketStateName: 'UNKNOWN',
      authenticationValid: false,
      networkLatency: null,
      connectionAttempts: 0
    }
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Refs for managing connections and subscriptions
  const productionManagerRef = useRef<WebSocketProductionManager | null>(null);
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
   * Initialize production connection manager
   */
  const initializeProductionManager = useCallback(() => {
    if (initializationRef.current) {
      console.log('⏳ Production manager already initialized, skipping...');
      return;
    }

    console.log('🚀 Initializing production WebSocket manager...');
    
    // Create production manager
    productionManagerRef.current = new WebSocketProductionManager();

    // Subscribe to connection status changes
    productionManagerRef.current.onStatusChange((status) => {
      console.log('📊 Production connection status changed:', status);
      setConnectionState(status);
      
      // Show appropriate toast notifications
      if (status.status === 'connected' && status.retryCount === 0) {
        toast({
          title: "Real-time Updates Active",
          description: "Dashboard will now update automatically with production-grade reliability.",
          variant: "default"
        });
      } else if (status.status === 'fallback') {
        toast({
          title: "Real-time Updates in Fallback Mode",
          description: "Using periodic refresh. Engineering team has been alerted.",
          variant: "destructive"
        });
      } else if (status.status === 'error' && status.retryCount >= 3) {
        toast({
          title: "Real-time Connection Issues",
          description: "Experiencing connectivity problems. Attempting recovery...",
          variant: "destructive"
        });
      }
    });

    // Initialize heartbeat monitoring
    try {
      initializeHeartbeatMonitoring({
        enabled: true,
        failureThreshold: 3,
        timeoutThreshold: 10000,
        alertCooldown: 300000
      });
      console.log('✅ Heartbeat monitoring initialized');
    } catch (monitoringError) {
      console.warn('⚠️ Failed to initialize heartbeat monitoring:', monitoringError);
    }

    initializationRef.current = true;
    console.log('✅ Production manager initialized successfully');
  }, [toast]);

  /**
   * Setup realtime subscription with production manager
   */
  const setupProductionSubscription = useCallback(async (): Promise<void> => {
    if (!productionManagerRef.current) {
      console.error('❌ Production manager not initialized, cannot setup subscription');
      return;
    }

    try {
      console.log('📡 Setting up production real-time subscription...');
      
      // Ensure connection is established
      const connected = await productionManagerRef.current.connect();
      if (!connected) {
        console.error('❌ Failed to establish production connection');
        return;
      }

      // Create subscription
      const channel = supabase
        .channel(`yff-applications-prod-${Date.now()}`)
        .on(
          'postgres_changes' as any,
          {
            event: '*',
            schema: 'public',
            table: 'yff_applications'
          } as any,
          (payload) => {
            console.log('📨 Production realtime update received:', {
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
          }
        )
        .subscribe((status, error) => {
          console.log('📡 Subscription status:', status, error || '');
          if (error) {
            console.error('❌ Subscription error:', error);
          }
        });

      console.log('✅ Production realtime subscription established successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to setup production subscription:', errorMessage);
      throw error;
    }
  }, [queryClient, toast]);

  /**
   * Force reconnection with production manager
   */
  const forceReconnect = useCallback(async (): Promise<void> => {
    console.log('🔄 Forcing production reconnection...');
    
    if (productionManagerRef.current) {
      // Disconnect and reconnect
      productionManagerRef.current.disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay
      
      const connected = await productionManagerRef.current.connect();
      if (connected) {
        await setupProductionSubscription();
      }
    }
  }, [setupProductionSubscription]);

  // Initialize production manager on mount
  useEffect(() => {
    initializeProductionManager();
    
    return () => {
      console.log('🧹 Cleaning up production real-time subscription hook');
      initializationRef.current = false;
    };
  }, [initializeProductionManager]);

  // Setup subscription after manager is initialized
  useEffect(() => {
    if (initializationRef.current && productionManagerRef.current) {
      console.log('🔗 Starting production connection and subscription setup...');
      setupProductionSubscription().catch(error => {
        console.error('❌ Failed to setup production subscription:', error);
      });
    }
  }, [setupProductionSubscription]);

  // Handle authentication state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, !!session);
        
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ User signed in, establishing production real-time subscription');
          
          // Wait a moment for auth to settle, then setup subscription
          setTimeout(() => {
            setupProductionSubscription().catch(error => {
              console.error('❌ Failed to setup production subscription after sign in:', error);
            });
          }, 1000);
          
        } else if (event === 'SIGNED_OUT') {
          console.log('❌ User signed out, cleaning up production real-time subscription');
          
          if (productionManagerRef.current) {
            productionManagerRef.current.disconnect();
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setupProductionSubscription]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting, cleaning up production managers...');
      
      if (productionManagerRef.current) {
        productionManagerRef.current.destroy();
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
