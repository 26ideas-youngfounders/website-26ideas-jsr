
/**
 * @fileoverview YFF Team Registration Form Component
 * 
 * A comprehensive registration form for Young Founders Floor participants.
 * Handles individual and team information collection with validation,
 * autosave functionality, and duplicate prevention.
 * 
 * @version 1.0.0 
 * @author 26ideas Development Team
 */

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAutosave } from '@/hooks/useAutosave';
import { YffAutosaveIndicator } from './YffAutosaveIndicator';
import { YffRegistrationFormSections } from './YffRegistrationFormSections';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Form validation schema
const yffRegistrationSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone_number: z.string().min(1, 'Phone number is required'),
  country_code: z.string().min(1, 'Country code is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  linkedin_profile: z.string().optional(),
  social_media_handles: z.string().optional(),
  institution_name: z.string().min(1, 'Institution name is required'),
  course_program: z.string().min(1, 'Course/Program is required'),
  current_year_of_study: z.string().min(1, 'Year of study is required'),
  expected_graduation: z.string().min(1, 'Expected graduation is required'),
  current_city: z.string().min(1, 'Current city is required'),
  state: z.string().min(1, 'State is required'),
  pin_code: z.string().min(1, 'PIN code is required'),
  permanent_address: z.string().min(1, 'Permanent address is required'),
  team_name: z.string().optional(),
  venture_name: z.string().optional(),
  industry_sector: z.string().optional(),
  website: z.string().optional(),
  number_of_team_members: z.number().min(1).max(10).optional(),
  team_members: z.array(z.object({
    name: z.string().min(1, 'Team member name is required'),
    email: z.string().email('Please enter a valid email address'),
    role: z.string().min(1, 'Role is required'),
    linkedin: z.string().optional(),
  })).optional(),
  referral_id: z.string().optional(),
});

type FormValues = z.infer<typeof yffRegistrationSchema>;

export interface YffTeamRegistrationData extends FormValues {
  id?: string;
  individual_id?: string;
  created_at?: string;
  updated_at?: string;
  application_status?: string;
  questionnaire_answers?: any;
  questionnaire_completed_at?: string;
}

interface YffTeamRegistrationFormProps {
  onComplete?: () => void;
}

/**
 * YFF Team Registration Form Component
 * 
 * Comprehensive form for team registration with autosave, validation,
 * and duplicate prevention. Handles both new registrations and updates
 * to existing registrations.
 */
export const YffTeamRegistrationForm: React.FC<YffTeamRegistrationFormProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [existingRegistration, setExistingRegistration] = useState<YffTeamRegistrationData | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(yffRegistrationSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone_number: '',
      country_code: '+91',
      date_of_birth: '',
      gender: '',
      linkedin_profile: '',
      social_media_handles: '',
      institution_name: '',
      course_program: '',
      current_year_of_study: '',
      expected_graduation: '',
      current_city: '',
      state: '',
      pin_code: '',
      permanent_address: '',
      team_name: '',
      venture_name: '',
      industry_sector: '',
      website: '',
      number_of_team_members: 1,
      team_members: [],
      referral_id: '',
    },
  });

  // Autosave configuration
  const { status: autosaveStatus } = useAutosave({
    formData: form.watch(),
    userId: user?.id || '',
    tableName: 'yff_team_registrations',
    interval: 5000,
  });

  // Load existing registration data on mount
  useEffect(() => {
    const loadExistingData = async () => {
      if (!user) return;

      try {
        console.log('🔍 Checking for existing registration for user:', user.id);
        
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
          
          // Pre-populate form with existing data
          const formData: Partial<FormValues> = {
            full_name: data.full_name || '',
            email: data.email || '',
            phone_number: data.phone_number || '',
            country_code: data.country_code || '+91',
            date_of_birth: data.date_of_birth || '',
            gender: data.gender || '',
            linkedin_profile: data.linkedin_profile || '',
            social_media_handles: data.social_media_handles || '',
            institution_name: data.institution_name || '',
            course_program: data.course_program || '',
            current_year_of_study: data.current_year_of_study || '',
            expected_graduation: data.expected_graduation || '',
            current_city: data.current_city || '',
            state: data.state || '',
            pin_code: data.pin_code || '',
            permanent_address: data.permanent_address || '',
            team_name: data.team_name || '',
            venture_name: data.venture_name || '',
            industry_sector: data.industry_sector || '',
            website: data.website || '',
            number_of_team_members: data.number_of_team_members || 1,
            team_members: Array.isArray(data.team_members) ? data.team_members : [],
            referral_id: data.referral_id || '',
          };

          // Reset form with existing data
          form.reset(formData);
          console.log('🔄 Form pre-populated with existing data');
        } else {
          console.log('ℹ️ No existing registration found - new registration');
        }
      } catch (error) {
        console.error('❌ Error in loadExistingData:', error);
      } finally {
        setIsLoadingInitialData(false);
      }
    };

    loadExistingData();
  }, [user, form]);

  /**
   * Handle form submission
   */
  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast.error('You must be logged in to submit the form');
      return;
    }

    setIsLoading(true);

    try {
      console.log('📝 Submitting registration form:', data);

      const registrationData = {
        individual_id: user.id,
        ...data,
        updated_at: new Date().toISOString(),
      };

      if (existingRegistration) {
        // Update existing registration
        const { error } = await supabase
          .from('yff_team_registrations')
          .update(registrationData)
          .eq('id', existingRegistration.id);

        if (error) {
          console.error('❌ Error updating registration:', error);
          toast.error('Failed to update registration. Please try again.');
          return;
        }

        console.log('✅ Registration updated successfully');
        toast.success('Registration updated successfully!');
      } else {
        // Create new registration
        const { error } = await supabase
          .from('yff_team_registrations')
          .insert([{
            ...registrationData,
            created_at: new Date().toISOString(),
          }]);

        if (error) {
          console.error('❌ Error creating registration:', error);
          toast.error('Failed to submit registration. Please try again.');
          return;
        }

        console.log('✅ Registration submitted successfully');
        toast.success('Registration submitted successfully!');
      }

      // Call completion callback
      if (onComplete) {
        onComplete();
      } else {
        // Default navigation to conversational questionnaire
        navigate('/yff/questionnaire/conversational');
      }

    } catch (error) {
      console.error('❌ Error in form submission:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/young-founders-floor" replace />;
  }

  // Show loading spinner while loading initial data
  if (isLoadingInitialData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your registration data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {existingRegistration ? 'Update Your Registration' : 'Young Founders Floor Registration'}
        </h1>
        <p className="text-gray-600">
          {existingRegistration 
            ? 'Update your registration information below'
            : 'Please fill out all required information to complete your registration'
          }
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <YffRegistrationFormSections 
          form={form} 
          isLoading={isLoading}
          existingData={existingRegistration}
        />
      </form>

      {/* Autosave Indicator */}
      <YffAutosaveIndicator status={autosaveStatus} />
    </div>
  );
};
