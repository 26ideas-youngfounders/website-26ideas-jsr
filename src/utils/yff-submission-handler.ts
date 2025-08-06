
/**
 * @fileoverview YFF Application Submission Handler
 * 
 * Handles application submission with automatic AI evaluation trigger
 * and comprehensive error handling.
 */

import { supabase } from '@/integrations/supabase/client';
import { triggerEvaluationOnSubmission } from '@/services/ai-evaluation-service';
import { YffFormData } from '@/types/yff-form';
import { convertFormDataToJson } from '@/types/yff-application';

interface SubmissionResult {
  success: boolean;
  applicationId?: string;
  error?: string;
  evaluationTriggered?: boolean;
}

/**
 * Handle YFF application submission with automatic AI evaluation
 */
export const handleApplicationSubmission = async (
  formData: YffFormData,
  individualId: string
): Promise<SubmissionResult> => {
  try {
    console.log('🚀 Starting application submission for individual:', individualId);
    console.log('📋 Form data received:', {
      keys: Object.keys(formData),
      hasAnswers: Boolean(formData.answers),
      answersKeys: formData.answers ? Object.keys(formData.answers) : 'none'
    });
    
    // Convert form data to JSON
    const answersJson = convertFormDataToJson(formData);
    console.log('📝 Converted answers JSON:', answersJson);
    
    // Validate that we have some data to submit
    if (!answersJson || Object.keys(answersJson).length === 0) {
      throw new Error('No form data to submit - form appears to be empty');
    }
    
    // Submit application to database
    console.log('💾 Attempting database insertion...');
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
      console.error('❌ Database submission error:', submitError);
      throw new Error(`Database submission failed: ${submitError.message}`);
    }
    
    if (!application?.application_id) {
      console.error('❌ No application ID returned:', application);
      throw new Error('No application ID returned from database');
    }
    
    const applicationId = application.application_id;
    console.log('✅ Application submitted successfully:', applicationId);
    
    // Trigger AI evaluation automatically
    let evaluationTriggered = false;
    try {
      console.log('🤖 Triggering AI evaluation...');
      await triggerEvaluationOnSubmission(applicationId);
      evaluationTriggered = true;
      console.log('✅ AI evaluation triggered for:', applicationId);
      
    } catch (evaluationError) {
      console.error('⚠️ Failed to trigger AI evaluation:', evaluationError);
      // Don't fail the entire submission if evaluation trigger fails
      console.log('📝 Application submitted but evaluation will need to be triggered manually');
    }
    
    return {
      success: true,
      applicationId,
      evaluationTriggered
    };
    
  } catch (error) {
    console.error('❌ Application submission failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Submission failed'
    };
  }
};

/**
 * Manually trigger AI evaluation for existing application
 */
export const triggerManualEvaluation = async (applicationId: string): Promise<SubmissionResult> => {
  try {
    console.log('🔄 Manually triggering AI evaluation for:', applicationId);
    
    // Verify application exists
    const { data: application, error: fetchError } = await supabase
      .from('yff_applications')
      .select('application_id')
      .eq('application_id', applicationId)
      .single();
    
    if (fetchError || !application) {
      throw new Error(`Application not found: ${applicationId}`);
    }
    
    // Trigger AI evaluation
    await triggerEvaluationOnSubmission(applicationId);
    
    console.log('✅ Manual AI evaluation triggered successfully for:', applicationId);
    
    return {
      success: true,
      applicationId,
      evaluationTriggered: true
    };
    
  } catch (error) {
    console.error('❌ Manual AI evaluation trigger failed:', error);
    
    return {
      success: false,
      applicationId,
      error: error instanceof Error ? error.message : 'Manual AI evaluation trigger failed',
      evaluationTriggered: false
    };
  }
};
