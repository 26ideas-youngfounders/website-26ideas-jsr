
/**
 * @fileoverview YFF Application Submission Handler
 * 
 * Handles application submission with automatic AI evaluation trigger
 * and comprehensive error handling for both Idea and Early Revenue stages.
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
 * Enhanced application submission handler with better stage detection
 */
export const handleApplicationSubmission = async (
  formData: YffFormData,
  individualId: string
): Promise<SubmissionResult> => {
  try {
    console.log('🚀 Starting application submission for individual:', individualId);
    console.log('📝 Form data received:', formData);
    
    // Convert form data to JSON
    const answersJson = convertFormDataToJson(formData);
    console.log('🔄 Converted answers JSON:', answersJson);
    
    // Determine application round based on product stage
    let applicationRound = 'yff_2025';
    if (formData.questionnaire?.productStage === 'Early Revenue') {
      applicationRound = 'yff_2025_early_revenue';
    }
    
    console.log('📊 Application round determined:', applicationRound);
    
    // Submit application to database with enhanced logging
    const { data: application, error: submitError } = await supabase
      .from('yff_applications')
      .insert({
        individual_id: individualId,
        answers: answersJson,
        status: 'submitted',
        evaluation_status: 'pending',
        application_round: applicationRound,
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
      console.error('❌ No application ID returned from database');
      throw new Error('No application ID returned from database');
    }
    
    const applicationId = application.application_id;
    console.log('✅ Application submitted successfully:', applicationId);
    
    // Trigger AI evaluation automatically
    let evaluationTriggered = false;
    try {
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
      error: error.message || 'Submission failed'
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
      .select('application_id, application_round')
      .eq('application_id', applicationId)
      .single();
    
    if (fetchError || !application) {
      throw new Error(`Application not found: ${applicationId}`);
    }
    
    console.log('📊 Application found with round:', application.application_round);
    
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
      error: error.message || 'Manual AI evaluation trigger failed',
      evaluationTriggered: false
    };
  }
};
