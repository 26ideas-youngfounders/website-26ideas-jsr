/**
 * @fileoverview YFF Team Registration Form Component
 * 
 * Form for registering a team for the Young Founders Floor program.
 * Collects team and individual information, validates input, and 
 * submits data to Supabase.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

/**
 * Form Data Interface for YFF Team Registration
 * Defines the structure and types of the form data.
 */
interface YffTeamRegistrationData {
  teamName: string;
  projectName: string;
  projectDescription: string;
  country: string;
  city: string;
  referralSource: string;
  termsAccepted: boolean;
}

/**
 * Props interface for YffTeamRegistrationForm
 * 
 * @interface YffTeamRegistrationFormProps
 * @property {() => void} onComplete - Callback function called when registration is successful
 */
interface YffTeamRegistrationFormProps {
  onComplete: () => void;
}

/**
 * Zod schema for YFF Team Registration form validation
 * Defines validation rules for each form field.
 */
const teamRegistrationSchema = z.object({
  teamName: z.string()
    .min(2, { message: 'Team name must be at least 2 characters.' })
    .max(50, { message: 'Team name must be less than 50 characters.' }),
  projectName: z.string()
    .min(2, { message: 'Project name must be at least 2 characters.' })
    .max(50, { message: 'Project name must be less than 50 characters.' }),
  projectDescription: z.string()
    .min(10, { message: 'Project description must be at least 10 characters.' })
    .max(500, { message: 'Project description must be less than 500 characters.' }),
  country: z.string()
    .min(2, { message: 'Country must be at least 2 characters.' }),
  city: z.string()
    .min(2, { message: 'City must be at least 2 characters.' }),
  referralSource: z.string()
    .min(2, { message: 'Referral source must be at least 2 characters.' }),
  termsAccepted: z.boolean()
    .refine((val) => val === true, {
      message: 'You must accept the terms and conditions.',
    }),
});

/**
 * YFF Team Registration Form Component
 * 
 * Implements the team registration form with validation and submission logic.
 * 
 * @param {YffTeamRegistrationFormProps} props - Component props
 * @returns {JSX.Element} The team registration form
 */
export const YffTeamRegistrationForm: React.FC<YffTeamRegistrationFormProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<YffTeamRegistrationData>({
    resolver: zodResolver(teamRegistrationSchema),
    defaultValues: {
      teamName: '',
      projectName: '',
      projectDescription: '',
      country: '',
      city: '',
      referralSource: '',
      termsAccepted: false,
    },
  });

  const onSubmit = async (data: YffTeamRegistrationData) => {
    if (!user) {
      toast.error('You must be logged in to register.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📤 Submitting team registration data:', data);

      const { error } = await supabase
        .from('yff_team_registrations')
        .insert({
          individual_id: user.id,
          ...data,
          application_status: 'registration_completed',
        });

      if (error) {
        console.error('❌ Submission error:', error);
        toast.error('Failed to submit registration. Please try again.');
        return;
      }

      console.log('✅ Team registration submitted successfully');
      
      // Redirect to conversational questionnaire instead of regular questionnaire
      toast.success('Registration completed! Starting conversational questionnaire...', {
        description: 'You\'ll now answer questions with AI-powered feedback.',
      });
      
      navigate('/yff/questionnaire/conversational');
    } catch (error) {
      console.error('❌ Submission error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="teamName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your team name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="projectName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your project name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="projectDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Description</FormLabel>
                <FormControl>
                  <Input placeholder="Describe your project" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your country" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your city" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="referralSource"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How did you hear about us?</FormLabel>
                <FormControl>
                  <Input placeholder="Enter referral source" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="termsAccepted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Input type="checkbox" checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Accept terms and conditions</FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Register'}
        </Button>
      </form>
    </Form>
  );
};
