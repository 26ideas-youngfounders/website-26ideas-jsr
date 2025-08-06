/**
 * @fileoverview Background Job Service for YFF Application Scoring
 * 
 * Implements reliable, scalable background processing for AI-based application
 * evaluation with automatic triggering, retry logic, and comprehensive monitoring.
 */

import { supabase } from '@/integrations/supabase/client';
import { AIComprehensiveScoringService } from './ai-comprehensive-scoring-service';

/**
 * Job queue entry interface
 */
interface ScoringJob {
  id: string;
  applicationId: string;
  submissionVersion: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'retrying';
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
  lastError?: string;
  processingStartedAt?: string;
  completedAt?: string;
}

/**
 * Job processing result interface
 */
interface JobResult {
  success: boolean;
  applicationId: string;
  overallScore?: number;
  error?: string;
  processingTimeMs?: number;
}

/**
 * Background Job Service for automated scoring
 */
export class BackgroundJobService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [30000, 120000, 300000]; // 30s, 2m, 5m
  private static readonly PROCESSING_TIMEOUT = 600000; // 10 minutes
  
  private static processingJobs = new Map<string, NodeJS.Timeout>();
  private static isWorkerRunning = false;
  
  /**
   * Automatically trigger scoring job on application submission
   */
  static async triggerScoringOnSubmission(applicationId: string, submissionVersion: string): Promise<void> {
    try {
      console.log(`🚀 Triggering automatic scoring for application: ${applicationId}`);
      
      // Create job entry
      const job: ScoringJob = {
        id: `job_${applicationId}_${Date.now()}`,
        applicationId,
        submissionVersion,
        status: 'queued',
        retryCount: 0,
        maxRetries: this.MAX_RETRIES,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Store job in queue
      await this.enqueueJob(job);
      
      // Update application status to pending
      await this.updateApplicationEvaluationStatus(applicationId, 'pending');
      
      // Start worker if not already running
      if (!this.isWorkerRunning) {
        this.startWorker();
      }
      
      console.log(`✅ Scoring job queued successfully: ${job.id}`);
      
    } catch (error) {
      console.error(`❌ Failed to trigger scoring for ${applicationId}:`, error);
      await this.updateApplicationEvaluationStatus(applicationId, 'failed');
      throw error;
    }
  }
  
  /**
   * Start the background worker process
   */
  private static startWorker(): void {
    if (this.isWorkerRunning) return;
    
    this.isWorkerRunning = true;
    console.log('🔄 Starting background scoring worker...');
    
    // Process jobs every 10 seconds
    const processJobs = async () => {
      try {
        await this.processQueuedJobs();
        await this.checkTimeoutJobs();
      } catch (error) {
        console.error('Worker error:', error);
      }
      
      if (this.isWorkerRunning) {
        setTimeout(processJobs, 10000);
      }
    };
    
    processJobs();
  }
  
  /**
   * Stop the background worker
   */
  static stopWorker(): void {
    this.isWorkerRunning = false;
    
    // Clear all processing timeouts
    this.processingJobs.forEach(timeout => clearTimeout(timeout));
    this.processingJobs.clear();
    
    console.log('🛑 Background scoring worker stopped');
  }
  
  /**
   * Process queued jobs
   */
  private static async processQueuedJobs(): Promise<void> {
    const jobs = await this.getQueuedJobs();
    
    for (const job of jobs) {
      // Skip if already processing
      if (this.processingJobs.has(job.id)) continue;
      
      // Process job
      this.processJob(job);
    }
  }
  
  /**
   * Process individual job
   */
  private static async processJob(job: ScoringJob): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Processing scoring job: ${job.id} for application: ${job.applicationId}`);
      
      // Update job status
      job.status = 'processing';
      job.processingStartedAt = new Date().toISOString();
      job.updatedAt = new Date().toISOString();
      await this.updateJob(job);
      
      // Update application status
      await this.updateApplicationEvaluationStatus(job.applicationId, 'processing');
      
      // Set processing timeout
      const timeoutId = setTimeout(async () => {
        console.error(`⏰ Job ${job.id} timed out after ${this.PROCESSING_TIMEOUT}ms`);
        await this.handleJobFailure(job, 'Processing timeout exceeded');
      }, this.PROCESSING_TIMEOUT);
      
      this.processingJobs.set(job.id, timeoutId);
      
      // Execute scoring
      const result = await AIComprehensiveScoringService.evaluateApplication(job.applicationId);
      
      // Clear timeout
      clearTimeout(timeoutId);
      this.processingJobs.delete(job.id);
      
      // Update application status to completed (this is the key fix)
      await this.updateApplicationEvaluationStatus(job.applicationId, 'completed');
      
      // Mark job as completed
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.updatedAt = new Date().toISOString();
      await this.updateJob(job);
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ Job ${job.id} completed successfully in ${processingTime}ms. Score: ${result.overall_score}`);
      
      // Log successful completion
      await this.logJobResult({
        success: true,
        applicationId: job.applicationId,
        overallScore: result.overall_score,
        processingTimeMs: processingTime
      });
      
    } catch (error) {
      // Clear timeout
      const timeoutId = this.processingJobs.get(job.id);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.processingJobs.delete(job.id);
      }
      
      console.error(`❌ Job ${job.id} failed:`, error);
      await this.handleJobFailure(job, error.message || 'Unknown error');
    }
  }
  
  /**
   * Handle job failure with retry logic
   */
  private static async handleJobFailure(job: ScoringJob, errorMessage: string): Promise<void> {
    job.lastError = errorMessage;
    job.retryCount += 1;
    job.updatedAt = new Date().toISOString();
    
    if (job.retryCount <= job.maxRetries) {
      // Retry with exponential backoff
      job.status = 'retrying';
      await this.updateJob(job);
      
      const delayMs = this.RETRY_DELAYS[job.retryCount - 1] || 300000;
      console.log(`🔄 Retrying job ${job.id} in ${delayMs}ms (attempt ${job.retryCount}/${job.maxRetries})`);
      
      setTimeout(async () => {
        job.status = 'queued';
        job.updatedAt = new Date().toISOString();
        await this.updateJob(job);
      }, delayMs);
      
    } else {
      // Max retries exceeded
      job.status = 'failed';
      await this.updateJob(job);
      await this.updateApplicationEvaluationStatus(job.applicationId, 'failed');
      
      console.error(`💀 Job ${job.id} failed permanently after ${job.retryCount} attempts`);
      
      // Log failure
      await this.logJobResult({
        success: false,
        applicationId: job.applicationId,
        error: errorMessage
      });
      
      // Send alert
      await this.sendFailureAlert(job, errorMessage);
    }
  }
  
  /**
   * Check for jobs that have timed out
   */
  private static async checkTimeoutJobs(): Promise<void> {
    const timeoutThreshold = new Date(Date.now() - this.PROCESSING_TIMEOUT);
    const jobs = await this.getProcessingJobs();
    
    for (const job of jobs) {
      if (job.processingStartedAt && new Date(job.processingStartedAt) < timeoutThreshold) {
        console.warn(`⚠️ Found timed out job: ${job.id}`);
        await this.handleJobFailure(job, 'Job processing timeout');
      }
    }
  }
  
  /**
   * Store job in queue (using localStorage for demo - would use Redis/DB in production)
   */
  private static async enqueueJob(job: ScoringJob): Promise<void> {
    const jobs = this.getStoredJobs();
    jobs.push(job);
    localStorage.setItem('scoring_jobs', JSON.stringify(jobs));
  }
  
  /**
   * Update job in queue
   */
  private static async updateJob(job: ScoringJob): Promise<void> {
    const jobs = this.getStoredJobs();
    const index = jobs.findIndex(j => j.id === job.id);
    
    if (index !== -1) {
      jobs[index] = job;
      localStorage.setItem('scoring_jobs', JSON.stringify(jobs));
    }
  }
  
  /**
   * Get queued jobs
   */
  private static async getQueuedJobs(): Promise<ScoringJob[]> {
    const jobs = this.getStoredJobs();
    return jobs.filter(job => job.status === 'queued');
  }
  
  /**
   * Get processing jobs
   */
  private static async getProcessingJobs(): Promise<ScoringJob[]> {
    const jobs = this.getStoredJobs();
    return jobs.filter(job => job.status === 'processing');
  }
  
  /**
   * Get stored jobs from localStorage
   */
  private static getStoredJobs(): ScoringJob[] {
    try {
      const stored = localStorage.getItem('scoring_jobs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  /**
   * Update application evaluation status
   */
  private static async updateApplicationEvaluationStatus(
    applicationId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed'
  ): Promise<void> {
    const updateData: any = {
      evaluation_status: status,
      updated_at: new Date().toISOString()
    };

    // Add completion timestamp when marking as completed
    if (status === 'completed') {
      updateData.evaluation_completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('yff_applications')
      .update(updateData)
      .eq('application_id', applicationId);
    
    if (error) {
      console.error(`❌ Failed to update application status to ${status}:`, error);
    } else {
      console.log(`✅ Application ${applicationId} status updated to ${status}`);
    }
  }
  
  /**
   * Log job result for monitoring
   */
  private static async logJobResult(result: JobResult): Promise<void> {
    console.log(`📊 Job Result:`, {
      success: result.success,
      applicationId: result.applicationId,
      overallScore: result.overallScore,
      error: result.error,
      processingTimeMs: result.processingTimeMs,
      timestamp: new Date().toISOString()
    });
    
    // In production, this would send to monitoring service
  }
  
  /**
   * Send failure alert
   */
  private static async sendFailureAlert(job: ScoringJob, error: string): Promise<void> {
    console.error(`🚨 ALERT: Scoring job failed permanently`, {
      jobId: job.id,
      applicationId: job.applicationId,
      error,
      retryCount: job.retryCount,
      timestamp: new Date().toISOString()
    });
    
    // In production, this would send to alerting service (email, Slack, etc.)
  }
  
  /**
   * Get job queue status for admin monitoring
   */
  static async getQueueStatus(): Promise<{
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    const jobs = this.getStoredJobs();
    
    return {
      queued: jobs.filter(j => j.status === 'queued').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      total: jobs.length
    };
  }
  
  /**
   * Manually retry failed job
   */
  static async retryFailedJob(jobId: string): Promise<boolean> {
    const jobs = this.getStoredJobs();
    const job = jobs.find(j => j.id === jobId);
    
    if (!job || job.status !== 'failed') {
      return false;
    }
    
    // Reset job for retry
    job.status = 'queued';
    job.retryCount = 0;
    job.lastError = undefined;
    job.updatedAt = new Date().toISOString();
    
    await this.updateJob(job);
    
    // Start worker if needed
    if (!this.isWorkerRunning) {
      this.startWorker();
    }
    
    console.log(`🔄 Manually retrying job: ${jobId}`);
    return true;
  }
  
  /**
   * Clear completed jobs older than specified days
   */
  static async cleanupOldJobs(daysOld: number = 7): Promise<number> {
    const jobs = this.getStoredJobs();
    const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
    
    const activeJobs = jobs.filter(job => {
      const jobDate = new Date(job.updatedAt);
      return jobDate > cutoffDate || job.status === 'processing' || job.status === 'queued';
    });
    
    const cleanedCount = jobs.length - activeJobs.length;
    
    if (cleanedCount > 0) {
      localStorage.setItem('scoring_jobs', JSON.stringify(activeJobs));
      console.log(`🧹 Cleaned up ${cleanedCount} old jobs`);
    }
    
    return cleanedCount;
  }
}

// Initialize worker on service load
if (typeof window !== 'undefined') {
  // Start worker after a short delay to allow app initialization
  setTimeout(() => {
    BackgroundJobService['startWorker']();
  }, 5000);
}
