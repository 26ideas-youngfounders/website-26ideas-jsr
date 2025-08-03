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
import { evaluateApplication } from '@/services/ai-evaluation-service';
import type { YffFormData } from '@/types/yff-form';

/**
 * Transform YFF form data into the format expected by the database
 */
const transformFormDataForDB = (formData: YffFormData, individualId: string) => {
  return {
    // Personal information
    personal_info: {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phoneNumber: formData.phoneNumber || formData.phone,
      countryCode: formData.countryCode,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
    },
    
    // Team information
    team: {
      ventureName: formData.ventureName,
      teamName: formData.teamName,
      numberOfTeamMembers: formData.numberOfTeamMembers,
      teamMembers: formData.teamMembers || [],
    },
    
    // Location and education
    location_education: {
      currentCity: formData.currentCity,
      state: formData.state,
      pinCode: formData.pinCode,
      permanentAddress: formData.permanentAddress,
      institutionName: formData.institutionName,
      courseProgram: formData.courseProgram,
      currentYearOfStudy: formData.currentYearOfStudy,
      expectedGraduation: formData.expectedGraduation,
    },
    
    // Professional details
    professional: {
      industrySector: formData.industrySector,
      website: formData.website,
      linkedinProfile: formData.linkedinProfile,
      socialMediaHandles: formData.socialMediaHandles,
    },
    
    // Questionnaire answers - the key data for AI evaluation
    questionnaire_answers: {
      productStage: formData.productStage,
      businessModel: formData.businessModel || formData.businessIdea,
      targetMarket: formData.targetMarket,
      problemSolution: formData.problemSolution,
      marketSize: formData.marketSize,
      competitiveAdvantage: formData.competitiveAdvantage,
      teamExperience: formData.teamExperience || formData.experience,
      fundingNeeds: formData.fundingNeeds,
      currentChallenges: formData.currentChallenges || formData.challenges,
      whyYff: formData.whyYff || formData.whyApplying,
    },
    
    // Additional data
    additional: {
      referralId: formData.referralId,
    }
  };
};

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
    const evaluationResult = await evaluateApplication(applicationId);
    
    console.log(`✅ Automatic AI evaluation completed for application: ${applicationId}`, evaluationResult);
    
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
  formData: YffFormData
): Promise<{ success: boolean; applicationId?: string; error?: string }> => {
  try {
    console.log('📝 Submitting YFF application with automatic evaluation...');
    
    // Transform form data to database format
    const dbFormData = transformFormDataForDB(formData, individualId);
    
    // First, insert the application into the database
    const { data: application, error: insertError } = await supabase
      .from('yff_applications')
      .insert({
        individual_id: individualId,
        answers: dbFormData,
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

/**
 * Batch process multiple applications for evaluation
 * Useful for processing applications that may have been submitted without evaluation
 */
export const batchEvaluateApplications = async (applicationIds: string[]): Promise<void> => {
  console.log(`🚀 Starting batch evaluation for ${applicationIds.length} applications`);
  
  for (const applicationId of applicationIds) {
    try {
      await autoEvaluateNewApplication(applicationId);
      // Small delay to avoid overwhelming the AI service
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to evaluate application ${applicationId} in batch:`, error);
    }
  }
  
  console.log('✅ Batch evaluation completed');
};
