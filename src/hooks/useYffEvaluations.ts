/**
 * @fileoverview Custom hook for managing YFF application evaluations
 * 
 * Provides comprehensive evaluation management including batch processing,
 * status monitoring, and automated evaluation workflows.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { evaluateApplication, reEvaluateApplication } from '@/services/ai-evaluation-service';

export interface EvaluationStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number; // 8-10
    good: number; // 6-7.9
    fair: number; // 4-5.9
    poor: number; // 0-3.9
  };
}

/**
 * Custom hook for managing YFF application evaluations
 */
export const useYffEvaluations = () => {
  const [batchProcessing, setBatchProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Fetch evaluation statistics
   */
  const { data: evaluationStats, isLoading: statsLoading } = useQuery({
    queryKey: ['yff-evaluation-stats'],
    queryFn: async (): Promise<EvaluationStats> => {
      const { data: applications, error } = await supabase
        .from('yff_applications')
        .select('evaluation_status, overall_score');

      if (error) throw error;

      const total = applications?.length || 0;
      const pending = applications?.filter(app => app.evaluation_status === 'pending').length || 0;
      const processing = applications?.filter(app => app.evaluation_status === 'processing').length || 0;
      const completed = applications?.filter(app => app.evaluation_status === 'completed').length || 0;
      const failed = applications?.filter(app => app.evaluation_status === 'failed').length || 0;

      const completedApps = applications?.filter(app => app.evaluation_status === 'completed' && app.overall_score && app.overall_score > 0) || [];
      const averageScore = completedApps.length > 0
        ? completedApps.reduce((sum, app) => sum + (app.overall_score || 0), 0) / completedApps.length
        : 0;

      const scoreDistribution = {
        excellent: completedApps.filter(app => (app.overall_score || 0) >= 8).length,
        good: completedApps.filter(app => (app.overall_score || 0) >= 6 && (app.overall_score || 0) < 8).length,
        fair: completedApps.filter(app => (app.overall_score || 0) >= 4 && (app.overall_score || 0) < 6).length,
        poor: completedApps.filter(app => (app.overall_score || 0) < 4).length,
      };

      return {
        total,
        pending,
        processing,
        completed,
        failed,
        averageScore: Math.round(averageScore * 10) / 10,
        scoreDistribution
      };
    },
    refetchInterval: 5000, // Refresh every 5 seconds to catch status changes
  });

  /**
   * Fetch applications needing evaluation
   */
  const { data: pendingApplications } = useQuery({
    queryKey: ['pending-evaluations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yff_applications')
        .select(`
          application_id,
          status,
          evaluation_status,
          submitted_at,
          individuals(first_name, last_name, email)
        `)
        .in('evaluation_status', ['pending', 'failed'])
        .order('submitted_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  /**
   * Single application evaluation mutation
   */
  const evaluateSingleMutation = useMutation({
    mutationFn: ({ applicationId }: { applicationId: string }) => 
      evaluateApplication(applicationId),
    onSuccess: (result) => {
      toast({
        title: "Evaluation Completed",
        description: `Application evaluated with score: ${result.overall_score}/10`,
      });
      
      // Invalidate all related queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['yff-evaluation-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pending-evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['yff-applications'] });
      queryClient.invalidateQueries({ queryKey: ['yff-applications-enhanced'] });
      
      // Force refetch of specific application data
      queryClient.refetchQueries({ queryKey: ['yff-evaluation-stats'] });
      queryClient.refetchQueries({ queryKey: ['yff-applications'] });
    },
    onError: (error: any) => {
      toast({
        title: "Evaluation Failed",
        description: error.message || "Failed to evaluate application",
        variant: "destructive",
      });
      
      // Still invalidate queries to refresh status
      queryClient.invalidateQueries({ queryKey: ['yff-evaluation-stats'] });
      queryClient.invalidateQueries({ queryKey: ['yff-applications'] });
    },
  });

  /**
   * Re-evaluation mutation
   */
  const reEvaluateMutation = useMutation({
    mutationFn: ({ applicationId }: { applicationId: string }) => 
      reEvaluateApplication(applicationId),
    onSuccess: (result) => {
      toast({
        title: "Re-evaluation Completed",
        description: `Application re-evaluated with score: ${result.overall_score}/10`,
      });
      
      // Invalidate all related queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['yff-evaluation-stats'] });
      queryClient.invalidateQueries({ queryKey: ['yff-applications'] });
      queryClient.invalidateQueries({ queryKey: ['yff-applications-enhanced'] });
      
      // Force refetch
      queryClient.refetchQueries({ queryKey: ['yff-evaluation-stats'] });
      queryClient.refetchQueries({ queryKey: ['yff-applications'] });
    },
    onError: (error: any) => {
      toast({
        title: "Re-evaluation Failed",
        description: error.message || "Failed to re-evaluate application",
        variant: "destructive",
      });
      
      // Still invalidate queries to refresh status
      queryClient.invalidateQueries({ queryKey: ['yff-evaluation-stats'] });
      queryClient.invalidateQueries({ queryKey: ['yff-applications'] });
    },
  });

  /**
   * Batch evaluation processing
   */
  const processBatchEvaluations = async (applicationIds: string[]) => {
    if (applicationIds.length === 0) {
      toast({
        title: "No Applications",
        description: "No applications selected for batch processing",
        variant: "destructive",
      });
      return;
    }

    setBatchProcessing(true);
    let successCount = 0;
    let failureCount = 0;

    try {
      // Process applications in batches of 3 to avoid overwhelming the AI service
      const batchSize = 3;
      const batches = [];
      
      for (let i = 0; i < applicationIds.length; i += batchSize) {
        batches.push(applicationIds.slice(i, i + batchSize));
      }

      toast({
        title: "Batch Processing Started",
        description: `Processing ${applicationIds.length} applications in ${batches.length} batches`,
      });

      for (const batch of batches) {
        const batchPromises = batch.map(async (applicationId) => {
          try {
            await evaluateApplication(applicationId);
            successCount++;
            console.log(`✅ Successfully evaluated application: ${applicationId}`);
          } catch (error) {
            failureCount++;
            console.error(`❌ Failed to evaluate application ${applicationId}:`, error);
          }
        });

        await Promise.all(batchPromises);
        
        // Small delay between batches to prevent API rate limiting
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      toast({
        title: "Batch Processing Complete",
        description: `${successCount} applications evaluated successfully, ${failureCount} failed`,
        variant: failureCount === 0 ? "default" : "destructive",
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['yff-evaluation-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pending-evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['yff-applications'] });

    } catch (error) {
      console.error('Batch processing error:', error);
      toast({
        title: "Batch Processing Error",
        description: "An error occurred during batch processing",
        variant: "destructive",
      });
    } finally {
      setBatchProcessing(false);
    }
  };

  /**
   * Evaluate all pending applications
   */
  const evaluateAllPending = () => {
    const pendingIds = pendingApplications?.map(app => app.application_id) || [];
    return processBatchEvaluations(pendingIds);
  };

  /**
   * Export evaluation results
   */
  const exportEvaluations = async () => {
    try {
      const { data: evaluations, error } = await supabase
        .from('yff_evaluations')
        .select(`
          *,
          yff_applications(
            application_id,
            status,
            submitted_at,
            individuals(first_name, last_name, email)
          )
        `)
        .order('evaluation_completed_at', { ascending: false });

      if (error) throw error;

      // Convert to CSV format
      const csvData = evaluations?.map(evaluation => ({
        'Application ID': evaluation.application_id?.slice(0, 8) + '...',
        'Applicant Name': evaluation.yff_applications?.individuals?.first_name + ' ' + evaluation.yff_applications?.individuals?.last_name,
        'Email': evaluation.yff_applications?.individuals?.email,
        'Overall Score': evaluation.overall_score,
        'Evaluation Date': evaluation.evaluation_completed_at ? new Date(evaluation.evaluation_completed_at).toLocaleDateString() : 'N/A',
        'Questions Evaluated': Object.keys(evaluation.question_scores || {}).length,
        'Status': evaluation.yff_applications?.status,
      }));

      return csvData;
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export evaluation data",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    // Data
    evaluationStats,
    pendingApplications,
    
    // Loading states
    statsLoading,
    batchProcessing,
    
    // Mutations
    evaluateSingle: evaluateSingleMutation.mutate,
    reEvaluate: reEvaluateMutation.mutate,
    isEvaluating: evaluateSingleMutation.isPending,
    isReEvaluating: reEvaluateMutation.isPending,
    
    // Batch operations
    processBatchEvaluations,
    evaluateAllPending,
    
    // Export
    exportEvaluations,
  };
};
