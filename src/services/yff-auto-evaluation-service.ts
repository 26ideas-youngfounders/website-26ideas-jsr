
/**
 * @fileoverview Automatic YFF Application Evaluation Service
 * 
 * Handles automatic AI evaluation of YFF applications immediately after submission.
 * Ensures applications are evaluated and appear on admin dashboard without manual intervention.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { supabase } from '@/integrations/supabase/client';
import { evaluateApplication } from './ai-evaluation-service';

/**
 * Automatically trigger AI evaluation for a newly submitted application
 * This runs immediately after application submission to ensure admin visibility
 */
export const autoEvaluateNewApplication = async (applicationId: string): Promise<void> => {
  try {
    console.log(`🤖 Starting automatic AI evaluation for application: ${applicationId}`);
    
    // Set evaluation status to processing to show progress indicator
    await supabase
      .from('yff_applications')
      .update({ 
        evaluation_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId);

    // Trigger the AI evaluation (this will update the application with scores and summary)
    await evaluateApplication(applicationId);
    
    console.log(`✅ Automatic AI evaluation completed for application: ${applicationId}`);
    
  } catch (error) {
    console.error(`❌ Automatic AI evaluation failed for application ${applicationId}:`, error);
    
    // Mark evaluation as failed so admin can see there was an issue
    await supabase
      .from('yff_applications')
      .update({ 
        evaluation_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId);
    
    // Don't throw error - we don't want to break the user's submission flow
    // The admin can manually retry the evaluation later
  }
};

/**
 * Enhanced application submission with automatic evaluation
 * This replaces the standard submission to include immediate AI evaluation
 */
export const submitApplicationWithAutoEvaluation = async (
  individualId: string,
  answers: Record<string, any>
): Promise<{ success: boolean; applicationId?: string; error?: string }> => {
  try {
    console.log('📝 Submitting YFF application with automatic evaluation...');
    
    // First, insert the application into the database
    const { data: application, error: insertError } = await supabase
      .from('yff_applications')
      .insert({
        individual_id: individualId,
        answers: answers,
        status: 'submitted',
        evaluation_status: 'pending',
        submitted_at: new Date().toISOString(),
        application_round: 'current'
      })
      .select('application_id')
      .single();

    if (insertError) {
      console.error('❌ Failed to insert application:', insertError);
      return { success: false, error: insertError.message };
    }

    if (!application?.application_id) {
      console.error('❌ No application ID returned after insert');
      return { success: false, error: 'Failed to create application' };
    }

    const applicationId = application.application_id;
    console.log(`✅ Application inserted successfully: ${applicationId}`);

    // Trigger automatic AI evaluation in the background (don't await to not block user)
    // Use setTimeout to ensure the database transaction is fully committed first
    setTimeout(() => {
      autoEvaluateNewApplication(applicationId);
    }, 1000);

    return { success: true, applicationId };
    
  } catch (error) {
    console.error('❌ Application submission failed:', error);
    return { success: false, error: (error as Error).message };
  }
};

/**
 * Check if application needs evaluation and trigger if necessary
 * Useful for handling applications that may have missed automatic evaluation
 */
export const ensureApplicationEvaluated = async (applicationId: string): Promise<void> => {
  try {
    const { data: application, error } = await supabase
      .from('yff_applications')
      .select('evaluation_status, overall_score')
      .eq('application_id', applicationId)
      .single();

    if (error) {
      console.error('Failed to check application evaluation status:', error);
      return;
    }

    // If not evaluated or evaluation failed, trigger evaluation
    if (!application || 
        application.evaluation_status === 'pending' || 
        application.evaluation_status === 'failed' ||
        (application.evaluation_status === 'completed' && !application.overall_score)) {
      
      console.log(`🔄 Triggering missing evaluation for application: ${applicationId}`);
      await autoEvaluateNewApplication(applicationId);
    }
  } catch (error) {
    console.error('Error ensuring application evaluation:', error);
  }
};
