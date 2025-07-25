
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { YffAutosaveIndicator } from './YffAutosaveIndicator';
import { useAutosave } from '@/hooks/useAutosave';

// Define form schema with conditional validation
const questionnaireSchema = z.object({
  ideaDescription: z.string().min(50, 'Please provide a detailed description (at least 50 characters)'),
  productStage: z.enum(['Idea Stage / MLP / Working Prototype', 'Early Revenue']),
  problemSolved: z.string().min(20, 'Please describe the problem (at least 20 characters)'),
  targetAudience: z.string().min(20, 'Please describe your target audience (at least 20 characters)'),
  solutionApproach: z.string().min(20, 'Please describe your solution approach (at least 20 characters)'),
  monetizationStrategy: z.string().min(20, 'Please describe your monetization strategy (at least 20 characters)'),
  customerAcquisition: z.string().min(20, 'Please describe your customer acquisition plan (at least 20 characters)'),
  competitors: z.string().min(20, 'Please list your competitors (at least 20 characters)'),
  developmentApproach: z.string().min(20, 'Please describe your development approach (at least 20 characters)'),
  teamInfo: z.string().optional(),
  timeline: z.string().min(10, 'Please provide a timeline (at least 10 characters)'),
  // Additional fields for Early Revenue stage
  currentRevenue: z.string().optional(),
  payingCustomers: z.string().optional(),
  workingDuration: z.string().optional(),
});

type QuestionnaireFormData = z.infer<typeof questionnaireSchema>;

/**
 * Props interface for YffQuestionnaireForm
 * 
 * @interface YffQuestionnaireFormProps
 * @property {any} registration - The user's registration data from yff_team_registrations table
 * @property {() => void} onComplete - Callback function called when questionnaire is successfully submitted
 */
interface YffQuestionnaireFormProps {
  registration: any;
  onComplete: () => void;
}

/**
 * YFF Questionnaire Form with conditional questions
 * 
 * Displays different question sets based on the user's selected product stage.
 * Includes autosave functionality and proper validation for all fields.
 * 
 * @param {YffQuestionnaireFormProps} props - Component props
 * @returns {JSX.Element} The questionnaire form component
 */
export const YffQuestionnaireForm: React.FC<YffQuestionnaireFormProps> = ({
  registration,
  onComplete,
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productStage, setProductStage] = useState<string>('');

  // Validate required props at runtime in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (!registration) {
        console.error('❌ YffQuestionnaireForm: Missing required prop "registration"');
        toast.error('Developer Error: Missing registration data');
      }
      if (!onComplete || typeof onComplete !== 'function') {
        console.error('❌ YffQuestionnaireForm: Missing required prop "onComplete" or it is not a function');
        toast.error('Developer Error: Missing onComplete callback');
      }
    }
  }, [registration, onComplete]);

  const form = useForm<QuestionnaireFormData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      ideaDescription: '',
      productStage: undefined,
      problemSolved: '',
      targetAudience: '',
      solutionApproach: '',
      monetizationStrategy: '',
      customerAcquisition: '',
      competitors: '',
      developmentApproach: '',
      teamInfo: '',
      timeline: '',
      currentRevenue: '',
      payingCustomers: '',
      workingDuration: '',
    },
  });

  const watchedValues = form.watch();
  const { status: autosaveStatus } = useAutosave({
    formData: watchedValues,
    formType: 'yff_questionnaire',
  });

  // Don't show conflict status for questionnaire - it's expected to have a registration
  const displayStatus = autosaveStatus === 'conflict' ? 'idle' : autosaveStatus;

  // Load existing questionnaire answers
  useEffect(() => {
    if (registration?.questionnaire_answers) {
      const answers = registration.questionnaire_answers;
      console.log('🔄 Loading existing questionnaire answers:', answers);
      
      Object.keys(answers).forEach(key => {
        if (key in form.getValues()) {
          form.setValue(key as keyof QuestionnaireFormData, answers[key]);
        }
      });
      
      if (answers.productStage) {
        setProductStage(answers.productStage);
      }
    }
  }, [registration, form]);

  // Watch product stage changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'productStage') {
        setProductStage(value.productStage || '');
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Auto-save functionality - save directly to the registration record
  useEffect(() => {
    if (!registration?.id) return;

    const timeoutId = setTimeout(async () => {
      const formData = form.getValues();
      
      // Only save if there's meaningful data
      const hasData = Object.values(formData).some(value => 
        typeof value === 'string' && value.trim().length > 0
      );
      
      if (hasData) {
        try {
          await supabase
            .from('yff_team_registrations')
            .update({
              questionnaire_answers: formData,
              updated_at: new Date().toISOString(),
            })
            .eq('id', registration.id);
          
          console.log('💾 Autosaved questionnaire data');
        } catch (error) {
          console.error('❌ Autosave failed:', error);
        }
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [watchedValues, registration?.id, form]);

  const onSubmit = async (data: QuestionnaireFormData) => {
    if (!registration?.id) {
      toast.error('Registration not found');
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate required fields based on product stage
      if (data.productStage === 'Early Revenue') {
        if (!data.payingCustomers || !data.workingDuration) {
          toast.error('Please fill in all required fields for Early Revenue stage');
          setIsSubmitting(false);
          return;
        }
      }

      console.log('📤 Submitting questionnaire data:', data);

      // Update the registration with questionnaire answers
      const { error } = await supabase
        .from('yff_team_registrations')
        .update({
          questionnaire_answers: data,
          application_status: 'application_completed',
          questionnaire_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', registration.id);

      if (error) {
        console.error('❌ Submission error:', error);
        toast.error('Failed to submit questionnaire. Please try again.');
        return;
      }

      console.log('✅ Questionnaire submitted successfully');
      onComplete();
    } catch (error) {
      console.error('❌ Submission error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEarlyRevenue = productStage === 'Early Revenue';

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Common Questions */}
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="ideaDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tell us about your idea *</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        placeholder="Describe your business idea in detail..."
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productStage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What stage is your product/service currently at? *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your current stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Idea Stage / MLP / Working Prototype">
                          Idea Stage / MLP / Working Prototype
                        </SelectItem>
                        <SelectItem value="Early Revenue">
                          Early Revenue
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Conditional Questions */}
          {productStage && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {isEarlyRevenue ? 'Early Revenue Stage Questions' : 'Idea Stage Questions'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="problemSolved"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What problem does your idea solve? *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe the problem you're solving..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Whose problem does your idea solve for? *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe your target audience..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="solutionApproach"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How does your idea solve this problem? *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe your solution approach..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monetizationStrategy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {isEarlyRevenue 
                          ? 'How is your idea making money by solving the problem? *' 
                          : 'How does your idea plan to make money by solving this problem? *'
                        }
                      </FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe your monetization strategy..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerAcquisition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {isEarlyRevenue 
                          ? 'How are you acquiring first paying customers? *' 
                          : 'How do you plan to acquire first paying customers? *'
                        }
                      </FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe your customer acquisition strategy..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isEarlyRevenue && (
                  <FormField
                    control={form.control}
                    name="payingCustomers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How many paying customers does your idea already have? *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Number of paying customers..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="competitors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>List 3 potential competitors in the similar space or attempting to solve a similar problem? *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="List your competitors..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="developmentApproach"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How are you developing the product: in-house, with a technical co-founder, or outsourcing to an agency/partner? *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe your development approach..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teamInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Who is on your team, and what are their roles?</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe your team members and their roles..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {isEarlyRevenue 
                          ? 'Since when have you been working on the idea? *' 
                          : 'When do you plan to proceed with the idea? *'
                        }
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={isEarlyRevenue ? "e.g., January 2024" : "e.g., Next month"} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end pt-6">
            <Button 
              type="submit" 
              disabled={isSubmitting || !productStage}
              className="min-w-32"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </Form>

      <YffAutosaveIndicator status={displayStatus} />
    </div>
  );
};
