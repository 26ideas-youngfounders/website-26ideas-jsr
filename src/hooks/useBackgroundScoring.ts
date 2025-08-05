
/**
 * @fileoverview React Hook for Background Scoring Integration
 * 
 * Provides React integration for automatic background scoring triggers
 * and job monitoring capabilities.
 */

import { useState, useEffect, useCallback } from 'react';
import { BackgroundJobService } from '@/services/background-job-service';
import { useToast } from '@/hooks/use-toast';

interface QueueStatus {
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

interface UseBackgroundScoringReturn {
  queueStatus: QueueStatus;
  isWorkerActive: boolean;
  triggerScoring: (applicationId: string, submissionVersion?: string) => Promise<void>;
  retryFailedJob: (jobId: string) => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  cleanupOldJobs: (daysOld?: number) => Promise<number>;
}

/**
 * Hook for managing background scoring operations
 */
export const useBackgroundScoring = (): UseBackgroundScoringReturn => {
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0
  });
  
  const [isWorkerActive, setIsWorkerActive] = useState(false);
  const { toast } = useToast();
  
  /**
   * Refresh queue status
   */
  const refreshStatus = useCallback(async () => {
    try {
      const status = await BackgroundJobService.getQueueStatus();
      setQueueStatus(status);
      setIsWorkerActive(status.processing > 0 || status.queued > 0);
    } catch (error) {
      console.error('Failed to refresh queue status:', error);
    }
  }, []);
  
  /**
   * Trigger scoring for an application
   */
  const triggerScoring = useCallback(async (
    applicationId: string, 
    submissionVersion: string = new Date().toISOString()
  ): Promise<void> => {
    try {
      await BackgroundJobService.triggerScoringOnSubmission(applicationId, submissionVersion);
      
      toast({
        title: "Scoring Started",
        description: "AI evaluation has been queued and will process in the background.",
      });
      
      // Refresh status after short delay
      setTimeout(refreshStatus, 1000);
      
    } catch (error) {
      console.error('Failed to trigger scoring:', error);
      
      toast({
        title: "Scoring Failed",
        description: "Failed to start AI evaluation. Please try again.",
        variant: "destructive"
      });
      
      throw error;
    }
  }, [toast, refreshStatus]);
  
  /**
   * Retry failed job
   */
  const retryFailedJob = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      const success = await BackgroundJobService.retryFailedJob(jobId);
      
      if (success) {
        toast({
          title: "Job Retried",
          description: "Failed job has been queued for retry.",
        });
        
        setTimeout(refreshStatus, 1000);
      } else {
        toast({
          title: "Retry Failed",
          description: "Job could not be retried. It may not exist or not be in failed state.",
          variant: "destructive"
        });
      }
      
      return success;
      
    } catch (error) {
      console.error('Failed to retry job:', error);
      
      toast({
        title: "Retry Error",
        description: "An error occurred while retrying the job.",
        variant: "destructive"
      });
      
      return false;
    }
  }, [toast, refreshStatus]);
  
  /**
   * Cleanup old jobs
   */
  const cleanupOldJobs = useCallback(async (daysOld: number = 7): Promise<number> => {
    try {
      const cleanedCount = await BackgroundJobService.cleanupOldJobs(daysOld);
      
      if (cleanedCount > 0) {
        toast({
          title: "Cleanup Complete",
          description: `Removed ${cleanedCount} old jobs from the queue.`,
        });
        
        setTimeout(refreshStatus, 500);
      }
      
      return cleanedCount;
      
    } catch (error) {
      console.error('Failed to cleanup jobs:', error);
      
      toast({
        title: "Cleanup Failed",
        description: "Failed to cleanup old jobs.",
        variant: "destructive"
      });
      
      return 0;
    }
  }, [toast, refreshStatus]);
  
  // Auto-refresh status periodically
  useEffect(() => {
    refreshStatus();
    
    const interval = setInterval(refreshStatus, 15000); // Every 15 seconds
    
    return () => clearInterval(interval);
  }, [refreshStatus]);
  
  return {
    queueStatus,
    isWorkerActive,
    triggerScoring,
    retryFailedJob,
    refreshStatus,
    cleanupOldJobs
  };
};
