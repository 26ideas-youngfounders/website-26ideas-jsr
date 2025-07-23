
/**
 * @fileoverview Young Founders Floor Questionnaire Page
 * 
 * A comprehensive multi-step application form for YFF program applicants.
 * Features comprehensive form validation, auto-save functionality,
 * and robust error handling with the fixed authentication system.
 * 
 * @version 2.1.6 - Fixed TypeScript deep instantiation error by simplifying types
 * @author 26ideas Development Team
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { YffFormSections } from '@/components/forms/YffFormSections';

/**
 * Simple form data type to avoid deep instantiation
 */
type SimpleFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  whyApplying: string;
  businessIdea: string;
  experience: string;
  challenges: string;
  goals: string;
  commitment: string;
};

/**
 * Initial form data factory function
 */
const createInitialFormData = (): SimpleFormData => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  nationality: '',
  whyApplying: '',
  businessIdea: '',
  experience: '',
  challenges: '',
  goals: '',
  commitment: '',
});

/**
 * YffQuestionnaire Component
 * Handles the complete application process with auto-save and validation
 */
const YffQuestionnaire: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management with explicit simple types
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [individualId, setIndividualId] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SimpleFormData>(createInitialFormData);

  /**
   * Load existing application data on component mount
   */
  useEffect(() => {
    const loadExistingApplication = async () => {
      if (!user?.id) return;

      try {
        console.log('Loading existing application for user:', user.id);

        // First get the individual_id
        const { data: individualData, error: individualError } = await supabase
          .from('individuals')
          .select('individual_id, first_name, last_name, email, mobile, dob, nationality')
          .eq('user_id', user.id)
          .single();

        if (individualError && individualError.code !== 'PGRST116') {
          console.error('Error loading individual data:', individualError);
          return;
        }

        if (individualData) {
          setIndividualId(individualData.individual_id);
          console.log('Individual ID found:', individualData.individual_id);

          // Pre-populate form with individual data using type assertion
          const updatedFormData: SimpleFormData = {
            ...createInitialFormData(),
            firstName: individualData.first_name || '',
            lastName: individualData.last_name || '',
            email: individualData.email || '',
            phone: individualData.mobile || '',
            dateOfBirth: individualData.dob || '',
            nationality: individualData.nationality || '',
          };
          setFormData(updatedFormData);

          // Check for existing application
          const { data: applicationData, error: applicationError } = await supabase
            .from('yff_applications')
            .select('*')
            .eq('individual_id', individualData.individual_id)
            .single();

          if (applicationError && applicationError.code !== 'PGRST116') {
            console.error('Error loading application data:', applicationError);
            return;
          }

          if (applicationData) {
            setApplicationId(applicationData.application_id);
            console.log('Existing application found:', applicationData.application_id);

            // Load saved answers if they exist
            if (applicationData.answers) {
              const savedAnswers = applicationData.answers as Record<string, string>;
              const mergedFormData: SimpleFormData = {
                ...updatedFormData,
                ...savedAnswers,
              };
              setFormData(mergedFormData);
            }

            // If application is already submitted, show success message
            if (applicationData.status === 'submitted') {
              toast.success('Application already submitted!');
              navigate('/');
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error in loadExistingApplication:', error);
        toast.error('Error loading application data');
      }
    };

    loadExistingApplication();
  }, [user?.id, navigate]);

  /**
   * Auto-Save Function
   * Saves form progress automatically
   */
  const autoSave = async () => {
    if (!individualId || !hasUnsavedChanges) return;

    try {
      console.log('Auto-saving application...');
      
      // Convert form data to simple object
      const answersJson: Record<string, string> = { ...formData };

      if (applicationId) {
        // Update existing application
        const { error } = await supabase
          .from('yff_applications')
          .update({
            answers: answersJson,
          })
          .eq('application_id', applicationId);

        if (error) {
          console.error('Auto-save error:', error);
          return;
        }
      } else {
        // Create new application
        const { data, error } = await supabase
          .from('yff_applications')
          .insert({
            individual_id: individualId,
            status: 'draft',
            application_round: 'YFF2024',
            answers: answersJson,
          })
          .select('application_id')
          .single();

        if (error) {
          console.error('Auto-save create error:', error);
          return;
        }

        if (data) {
          setApplicationId(data.application_id);
          console.log('New application created:', data.application_id);
        }
      }

      setHasUnsavedChanges(false);
      console.log('Auto-save completed successfully');
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  useEffect(() => {
    // Auto-save every 10 seconds if there are unsaved changes
    if (hasUnsavedChanges) {
      const timer = setTimeout(() => {
        autoSave();
      }, 10000);

      // Clear timeout if component unmounts or dependencies change
      return () => clearTimeout(timer);
    }
  }, [formData, hasUnsavedChanges, individualId, applicationId]);

  /**
   * Form Submission Handler
   * Validates and submits the complete application
   */
  const handleSubmit = async () => {
    // Validation check
    if (!validateCurrentStep()) {
      toast.error('Please fill in all required fields before submitting.');
      return;
    }

    if (!individualId) {
      toast.error('Individual ID not found. Please try refreshing the page.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Submitting application...');

      // Update individual information first
      const { error: individualError } = await supabase
        .from('individuals')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          mobile: formData.phone,
          dob: formData.dateOfBirth,
          nationality: formData.nationality,
        })
        .eq('individual_id', individualId);

      if (individualError) {
        console.error('Error updating individual:', individualError);
        toast.error('Error updating individual information');
        return;
      }

      // Convert form data to simple object
      const answersJson: Record<string, string> = { ...formData };

      // Submit or update application
      if (applicationId) {
        // Update existing application
        const { error } = await supabase
          .from('yff_applications')
          .update({
            status: 'submitted',
            answers: answersJson,
            submitted_at: new Date().toISOString(),
          })
          .eq('application_id', applicationId);

        if (error) {
          console.error('Error updating application:', error);
          toast.error('Error submitting application');
          return;
        }
      } else {
        // Create new application (shouldn't happen if auto-save works)
        const { error } = await supabase
          .from('yff_applications')
          .insert({
            individual_id: individualId,
            status: 'submitted',
            application_round: 'YFF2024',
            answers: answersJson,
            submitted_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Error creating application:', error);
          toast.error('Error submitting application');
          return;
        }
      }

      toast.success('Application submitted successfully!');
      console.log('Application submitted successfully');
      
      // Navigate to success page or home
      navigate('/', { state: { applicationSubmitted: true } });

    } catch (error) {
      console.error('Submission error:', error);
      toast.error('An unexpected error occurred during submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle form field changes with auto-save trigger
   */
  const handleFieldChange = (field: keyof SimpleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  /**
   * Navigate to next step with validation
   */
  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } else {
      toast.error('Please fill in all required fields before proceeding.');
    }
  };

  /**
   * Navigate to previous step
   */
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  /**
   * Validate current step fields
   */
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.email && 
                 formData.phone && formData.dateOfBirth && formData.nationality);
      case 2:
        return !!(formData.whyApplying && formData.businessIdea && formData.experience);
      case 3:
        return !!(formData.challenges && formData.goals && formData.commitment);
      default:
        return true;
    }
  };

  // Don't render if user is not authenticated
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please sign in to access the application form.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              Young Founders Floor Application
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Step {currentStep} of 3
            </p>
          </CardHeader>
        </Card>

        {/* Form Content */}
        <YffFormSections
          currentStep={currentStep}
          formData={formData}
          onFieldChange={handleFieldChange}
        />

        {/* Navigation */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              {currentStep < 3 ? (
                <Button onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Auto-save indicator */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-4 right-4">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded">
              Auto-saving...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YffQuestionnaire;
