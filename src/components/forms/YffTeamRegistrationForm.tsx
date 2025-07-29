/**
 * @fileoverview YFF Team Registration Form Component
 * 
 * Handles team registration with autosave, validation, and data management.
 * Supports both new registrations and updates to existing ones.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { YffAutosaveIndicator } from './YffAutosaveIndicator';
import { YffRegistrationFormSections } from './YffRegistrationFormSections';
import { yffRegistrationSchema, FormValues } from '@/utils/yff-form-validation';
import { Loader2 } from 'lucide-react';

// Team member interface
export interface TeamMember {
  fullName: string;
  email: string;
  phoneNumber: string;
  country: string;
  linkedin?: string;
  role?: string;
}

interface YffTeamRegistrationFormProps {
  onComplete: () => void;
}

/**
 * YFF Team Registration Form Component
 * 
 * Main registration form that handles user data collection, validation,
 * autosave functionality, and submission to Supabase.
 * 
 * @param props - Component props
 * @returns {JSX.Element} The team registration form
 */
export const YffTeamRegistrationForm: React.FC<YffTeamRegistrationFormProps> = ({
  onComplete,
}) => {
  const { user, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRegistration, setExistingRegistration] = useState<any>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(yffRegistrationSchema),
    defaultValues: {
      fullName: userProfile?.full_name || '',
      email: userProfile?.email || '',
      phoneNumber: '',
      country: 'India',
      dateOfBirth: '',
      gender: '',
      linkedinProfile: '',
      socialMediaHandles: '',
      institutionName: '',
      courseProgram: '',
      currentYearOfStudy: '',
      expectedGraduation: '',
      currentCity: '',
      state: '',
      pinCode: '',
      permanentAddress: '',
      teamName: '',
      projectName: '',
      projectDescription: '',
      industrySector: '',
      website: '',
      numberOfTeamMembers: 1,
      teamMembers: [],
      referralSource: '',
      termsAccepted: false,
    },
  });

  // Load existing registration data
  useEffect(() => {
    const loadExistingData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        console.log('🔍 Loading existing registration for user:', user.id);
        
        const { data, error } = await supabase
          .from('yff_team_registrations')
          .select('*')
          .eq('individual_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('❌ Error loading existing registration:', error);
          return;
        }

        if (data) {
          console.log('✅ Found existing registration:', data);
          setExistingRegistration(data);
          
          // Pre-populate form with existing data if available
          if (data.team_members && Array.isArray(data.team_members) && data.team_members.length > 0) {
            // Safely type cast the first team member
            const existingData = data.team_members[0] as any;
            form.setValue('teamName', data.team_name || '');
            form.setValue('projectName', data.venture_name || '');
            form.setValue('projectDescription', (existingData?.projectDescription as string) || '');
            form.setValue('country', (existingData?.country as string) || 'India');
            form.setValue('industrySector', data.industry_sector || '');
            form.setValue('referralSource', (existingData?.referralSource as string) || '');
            form.setValue('termsAccepted', Boolean(existingData?.termsAccepted));
            
            // Set other basic fields
            form.setValue('fullName', data.full_name || '');
            form.setValue('email', data.email || '');
            form.setValue('phoneNumber', data.phone_number || '');
            form.setValue('dateOfBirth', data.date_of_birth || '');
            form.setValue('gender', data.gender || '');
            form.setValue('linkedinProfile', data.linkedin_profile || '');
            form.setValue('socialMediaHandles', data.social_media_handles || '');
            form.setValue('institutionName', data.institution_name || '');
            form.setValue('courseProgram', data.course_program || '');
            form.setValue('currentYearOfStudy', data.current_year_of_study || '');
            form.setValue('expectedGraduation', data.expected_graduation || '');
            form.setValue('currentCity', data.current_city || '');
            form.setValue('state', data.state || '');
            form.setValue('pinCode', data.pin_code || '');
            form.setValue('permanentAddress', data.permanent_address || '');
            form.setValue('website', data.website || '');
            form.setValue('numberOfTeamMembers', data.number_of_team_members || 1);
          }
        }
      } catch (error) {
        console.error('❌ Error in loadExistingData:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingData();
  }, [user, form]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error('Please sign in to submit your registration.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📤 Submitting registration data:', values);

      // Prepare team members data
      const teamMembersData = values.teamMembers.map((member: TeamMember) => ({
        fullName: member.fullName,
        email: member.email,
        phoneNumber: member.phoneNumber,
        country: member.country,
        linkedin: member.linkedin || '',
        role: member.role || '',
      }));

      // Add the main applicant as the first team member
      const allTeamMembers = [
        {
          fullName: values.fullName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          country: values.country,
          linkedin: values.linkedinProfile || '',
          role: 'Team Lead',
          projectDescription: values.projectDescription,
          referralSource: values.referralSource,
          termsAccepted: values.termsAccepted,
        },
        ...teamMembersData,
      ];

      const registrationData = {
        individual_id: user.id,
        full_name: values.fullName,
        email: values.email,
        phone_number: values.phoneNumber,
        country_code: '+91',
        date_of_birth: values.dateOfBirth,
        gender: values.gender,
        linkedin_profile: values.linkedinProfile || null,
        social_media_handles: values.socialMediaHandles || null,
        institution_name: values.institutionName,
        course_program: values.courseProgram,
        current_year_of_study: values.currentYearOfStudy,
        expected_graduation: values.expectedGraduation,
        current_city: values.currentCity,
        state: values.state,
        pin_code: values.pinCode,
        permanent_address: values.permanentAddress,
        team_name: values.teamName || null,
        venture_name: values.projectName || null,
        industry_sector: values.industrySector || null,
        website: values.website || null,
        number_of_team_members: values.numberOfTeamMembers,
        team_members: allTeamMembers,
        referral_id: values.referralSource || null,
        application_status: 'registration_completed',
        updated_at: new Date().toISOString(),
      };

      let result;

      if (existingRegistration) {
        // Update existing registration
        console.log('🔄 Updating existing registration...');
        result = await supabase
          .from('yff_team_registrations')
          .update(registrationData)
          .eq('id', existingRegistration.id)
          .select()
          .single();
      } else {
        // Create new registration
        console.log('➕ Creating new registration...');
        result = await supabase
          .from('yff_team_registrations')
          .insert({
            ...registrationData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
      }

      if (result.error) {
        console.error('❌ Supabase error:', result.error);
        throw result.error;
      }

      console.log('✅ Registration submitted successfully:', result.data);

      toast.success(existingRegistration ? 'Registration updated successfully!' : 'Registration submitted successfully!', {
        description: 'You can now proceed to the questionnaire.',
      });

      // Call the onComplete callback
      onComplete();

    } catch (error) {
      console.error('❌ Error submitting registration:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      toast.error('Failed to submit registration', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your registration data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {existingRegistration ? 'Update Your Registration' : 'Team Registration'}
          </CardTitle>
          <p className="text-gray-600">
            {existingRegistration 
              ? 'Update your information and continue with your application.' 
              : 'Complete your registration to participate in the Young Founders Floor program.'}
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              <YffRegistrationFormSections form={form} />
              
              <div className="flex justify-end space-x-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-8 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {existingRegistration ? 'Updating...' : 'Submitting...'}
                    </>
                  ) : (
                    existingRegistration ? 'Update Registration' : 'Submit Registration'
                  )}
                </Button>
              </div>
            </form>
          </Form>

          <YffAutosaveIndicator
            formData={form.getValues()}
            userId={user?.id || ''}
            tableName="yff_team_registration_autosave"
            interval={30000}
          />
        </CardContent>
      </Card>
    </div>
  );
};
