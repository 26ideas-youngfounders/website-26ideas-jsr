
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { YffFormSections } from './YffFormSections';
import { validateWordCount, validateAge } from '@/utils/registration-validation';

/**
 * Strict type definition for YFF registration data
 */
interface YffRegistration {
  id: string;
  individual_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  country_code: string;
  date_of_birth: string;
  current_city: string;
  state: string;
  pin_code: string;
  permanent_address: string;
  gender: string;
  institution_name: string;
  course_program: string;
  current_year_of_study: string;
  expected_graduation: string;
  number_of_team_members: number;
  team_members: any[];
  venture_name?: string;
  industry_sector?: string;
  team_name?: string;
  website?: string;
  linkedin_profile?: string;
  social_media_handles?: string;
  referral_id?: string;
  questionnaire_answers?: Record<string, any>;
  application_status?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Props interface for YffQuestionnaireForm component
 */
interface YffQuestionnaireFormProps {
  registration: YffRegistration;
  onComplete: () => void;
}

/**
 * Questionnaire form schema with word count validation
 * NOTE: All fields are REQUIRED to maintain type consistency
 */
const questionnaireSchema = z.object({
  whyApplying: z.string()
    .min(1, 'This field is required')
    .refine(text => validateWordCount(text, 300), 'Answer must not exceed 300 words'),
  
  businessIdea: z.string()
    .min(1, 'This field is required')
    .refine(text => validateWordCount(text, 300), 'Answer must not exceed 300 words'),
  
  experience: z.string()
    .min(1, 'This field is required')
    .refine(text => validateWordCount(text, 300), 'Answer must not exceed 300 words'),
  
  challenges: z.string()
    .min(1, 'This field is required')
    .refine(text => validateWordCount(text, 300), 'Answer must not exceed 300 words'),
  
  goals: z.string()
    .min(1, 'This field is required')
    .refine(text => validateWordCount(text, 300), 'Answer must not exceed 300 words'),
  
  commitment: z.string()
    .min(1, 'This field is required')
    .refine(text => validateWordCount(text, 300), 'Answer must not exceed 300 words'),
});

/**
 * QuestionnaireFormData type - all fields are REQUIRED
 * WARNING: Keep this interface in sync with the form schema above.
 * If you make any field optional here, you must also update the schema and default values.
 */
type QuestionnaireFormData = z.infer<typeof questionnaireSchema>;

/**
 * YFF Questionnaire Form Component
 * 
 * Handles questionnaire submission for registered YFF applicants
 */
export const YffQuestionnaireForm: React.FC<YffQuestionnaireFormProps> = ({
  registration,
  onComplete
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<QuestionnaireFormData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      // All fields have string defaults to match required interface
      whyApplying: registration.questionnaire_answers?.whyApplying || '',
      businessIdea: registration.questionnaire_answers?.businessIdea || '',
      experience: registration.questionnaire_answers?.experience || '',
      challenges: registration.questionnaire_answers?.challenges || '',
      goals: registration.questionnaire_answers?.goals || '',
      commitment: registration.questionnaire_answers?.commitment || '',
    },
  });

  // Validate age on component mount
  useEffect(() => {
    const ageValidation = validateAge(registration.date_of_birth);
    if (!ageValidation.isValid) {
      toast.error('Age Validation Error', {
        description: ageValidation.error,
        duration: 8000,
      });
      console.error('❌ Age validation failed for team leader:', ageValidation.error);
    }

    // Validate team members' ages
    const teamMembers = Array.isArray(registration.team_members) ? registration.team_members : [];
    teamMembers.forEach((member: any, index: number) => {
      if (member.dateOfBirth) {
        const memberAgeValidation = validateAge(member.dateOfBirth);
        if (!memberAgeValidation.isValid) {
          toast.error(`Team Member ${index + 1} Age Error`, {
            description: memberAgeValidation.error,
            duration: 8000,
          });
          console.error(`❌ Age validation failed for team member ${index + 1}:`, memberAgeValidation.error);
        }
      }
    });
  }, [registration]);

  /**
   * Handle form submission with comprehensive validation
   */
  const onSubmit = async (data: QuestionnaireFormData) => {
    try {
      setIsSubmitting(true);
      
      console.log('📝 Submitting questionnaire data:', data);

      // Validate all answers for word count
      const wordCountErrors: string[] = [];
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'string') {
          const validation = validateWordCount(value, 300);
          if (!validation) {
            wordCountErrors.push(`${key}: Answer exceeds 300 words`);
          }
        }
      });

      if (wordCountErrors.length > 0) {
        toast.error('Word Count Validation Failed', {
          description: wordCountErrors.join(', '),
          duration: 8000,
        });
        console.error('❌ Word count validation failed:', wordCountErrors);
        return;
      }

      // Update registration with questionnaire answers
      const { error } = await supabase
        .from('yff_team_registrations')
        .update({
          questionnaire_answers: data,
          questionnaire_completed_at: new Date().toISOString(),
          application_status: 'questionnaire_completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', registration.id);

      if (error) {
        console.error('❌ Error updating questionnaire:', error);
        toast.error('Submission Failed', {
          description: 'There was an error submitting your questionnaire. Please try again.',
          duration: 5000,
        });
        return;
      }

      console.log('✅ Questionnaire submitted successfully');
      
      toast.success('Questionnaire Submitted!', {
        description: 'Your application has been completed successfully.',
        duration: 5000,
      });

      onComplete();
      
    } catch (error) {
      console.error('❌ Error in questionnaire submission:', error);
      toast.error('Submission Error', {
        description: 'An unexpected error occurred. Please try again.',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          YFF Application Questionnaire
        </CardTitle>
        <p className="text-center text-gray-600">
          Complete your application by answering the following questions. Each answer must not exceed 300 words.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <YffFormSections form={form} />
            
            <div className="flex justify-center pt-6">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="px-8 py-3 text-lg"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
