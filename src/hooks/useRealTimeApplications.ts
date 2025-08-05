
/**
 * @fileoverview Real-time YFF Applications Hook
 * 
 * Provides real-time updates for YFF applications using Supabase
 * real-time subscriptions for immediate UI updates.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { YffApplicationWithIndividual } from '@/types/yff-application';

interface UseRealTimeApplicationsReturn {
  applications: YffApplicationWithIndividual[];
  isLoading: boolean;
  error: Error | null;
  isConnected: boolean;
}

/**
 * Hook for real-time YFF applications with Supabase subscriptions
 */
export const useRealTimeApplications = (): UseRealTimeApplicationsReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Primary data query
  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ['yff-applications-realtime'],
    queryFn: async (): Promise<YffApplicationWithIndividual[]> => {
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

      if (error) throw error;
      return data as YffApplicationWithIndividual[];
    },
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('yff-applications-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'yff_applications'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          
          // Invalidate and refetch the applications query
          queryClient.invalidateQueries({ queryKey: ['yff-applications-realtime'] });
          
          // Show toast notification based on event type
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Application",
              description: "A new YFF application has been submitted.",
            });
          } else if (payload.eventType === 'UPDATE') {
            // Check if it's an evaluation update
            const newRecord = payload.new as any;
            if (newRecord.evaluation_status === 'completed') {
              toast({
                title: "Evaluation Completed",
                description: `Application ${newRecord.application_id.slice(0, 8)}... has been evaluated.`,
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'CHANNEL_ERROR') {
          toast({
            title: "Connection Error",
            description: "Real-time updates may be delayed.",
            variant: "destructive"
          });
        }
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);

  return {
    applications,
    isLoading,
    error: error as Error | null,
    isConnected
  };
};
