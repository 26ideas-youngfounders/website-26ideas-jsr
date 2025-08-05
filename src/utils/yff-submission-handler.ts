
/**
 * @fileoverview YFF Application Submission Handler
 * 
 * Handles application submission with automatic background scoring trigger
 * and comprehensive error handling.
 */

import { supabase } from '@/integrations/supabase/client';
import { BackgroundJobService } from '@/services/background-job-service';
import { YffFormData } from '@/types/yff-form';
import { convertFormDataToJson } from '@/types/yff-application';

interface SubmissionResult {
  success: boolean;
  applicationId?: string;
  error?: string;
  scoringTriggered?: boolean;
}

/**
 * Handle YFF application submission with automatic scoring
 */
export const handleApplicationSubmission = async (
  formData: YffFormData,
  individualId: string
): Promise<SubmissionResult> => {
  try {
    console.log('🚀 Starting application submission for individual:', individualId);
    
    // Convert form data to JSON
    const answersJson = convertFormDataToJson(formData);
    
    // Submit application to database
    const { data: application, error: submitError } = await supabase
      .from('yff_applications')
      .insert({
        individual_id: individualId,
        answers: answersJson,
        status: 'submitted',
        evaluation_status: 'pending',
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('application_id')
      .single();
    
    if (submitError) {
      throw new Error(`Database submission failed: ${submitError.message}`);
    }
    
    if (!application?.application_id) {
      throw new Error('No application ID returned from database');
    }
    
    const applicationId = application.application_id;
    console.log('✅ Application submitted successfully:', applicationId);
    
    // Trigger background scoring automatically
    let scoringTriggered = false;
    try {
      await BackgroundJobService.triggerScoringOnSubmission(
        applicationId,
        new Date().toISOString()
      );
      
      scoringTriggered = true;
      console.log('✅ Background scoring triggered for:', applicationId);
      
    } catch (scoringError) {
      console.error('⚠️ Failed to trigger background scoring:', scoringError);
      
      // Don't fail the entire submission if scoring trigger fails
      // The application is still submitted successfully
      console.log('📝 Application submitted but scoring will need to be triggered manually');
    }
    
    return {
      success: true,
      applicationId,
      scoringTriggered
    };
    
  } catch (error) {
    console.error('❌ Application submission failed:', error);
    
    return {
      success: false,
      error: error.message || 'Submission failed'
    };
  }
};

/**
 * Manually trigger scoring for existing application
 */
export const triggerManualScoring = async (applicationId: string): Promise<SubmissionResult> => {
  try {
    console.log('🔄 Manually triggering scoring for:', applicationId);
    
    // Verify application exists
    const { data: application, error: fetchError } = await supabase
      .from('yff_applications')
      .select('application_id')
      .eq('application_id', applicationId)
      .single();
    
    if (fetchError || !application) {
      throw new Error(`Application not found: ${applicationId}`);
    }
    
    // Trigger background scoring
    await BackgroundJobService.triggerScoringOnSubmission(
      applicationId,
      new Date().toISOString()
    );
    
    console.log('✅ Manual scoring triggered successfully for:', applicationId);
    
    return {
      success: true,
      applicationId,
      scoringTriggered: true
    };
    
  } catch (error) {
    console.error('❌ Manual scoring trigger failed:', error);
    
    return {
      success: false,
      applicationId,
      error: error.message || 'Manual scoring trigger failed',
      scoringTriggered: false
    };
  }
};
