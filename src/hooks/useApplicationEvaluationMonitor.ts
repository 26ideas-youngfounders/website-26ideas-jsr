
/**
 * @fileoverview Application Evaluation Monitor Hook
 * 
 * Monitors applications and ensures they are evaluated automatically
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ensureApplicationEvaluated } from '@/services/yff-auto-evaluation-service';

/**
 * Hook to monitor and ensure all applications are properly evaluated
 */
export const useApplicationEvaluationMonitor = () => {
  const queryClient = useQueryClient();

  // Check for applications that need evaluation every 2 minutes
  const { data: pendingApplications } = useQuery({
    queryKey: ['pending-evaluations-monitor'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yff_applications')
        .select('application_id, evaluation_status, created_at')
        .in('evaluation_status', ['pending', 'failed'])
        .lt('created_at', new Date(Date.now() - 2 * 60 * 1000).toISOString()); // Older than 2 minutes

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 2 * 60 * 1000, // Check every 2 minutes
  });

  // Auto-trigger evaluations for applications that have been pending too long
  useEffect(() => {
    if (!pendingApplications?.length) return;

    const evaluatePendingApplications = async () => {
      for (const app of pendingApplications) {
        try {
          console.log(`🔄 Auto-triggering evaluation for stale application: ${app.application_id}`);
          await ensureApplicationEvaluated(app.application_id);
        } catch (error) {
          console.error(`Failed to auto-evaluate application ${app.application_id}:`, error);
        }
      }
      
      // Refresh the main applications list after attempting evaluations
      queryClient.invalidateQueries({ queryKey: ['yff-applications'] });
    };

    evaluatePendingApplications();
  }, [pendingApplications, queryClient]);

  return {
    pendingCount: pendingApplications?.length || 0
  };
};
