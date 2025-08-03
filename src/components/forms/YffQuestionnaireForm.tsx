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
import { AIFeedbackButton } from './AIFeedbackButton';
import { AIFeedbackDisplay } from './AIFeedbackDisplay';
import { useAIFeedback } from '@/hooks/useAIFeedback';

/**
 * Counts the number of words in a text string
 * 
 * @param text - The text to count words in
 * @returns The number of words in the text
 */
const countWords = (text: string | null | undefined) => {
  if (!text) return 0;
  // Trim whitespace from both ends, replace multiple spaces with a single space, then split by space.
  const trimmedText = text.trim();
  if (trimmedText === "") return 0;
  return trimmedText.split(/\s+/).length;
};

// Define form schema with conditional validation
const questionnaireSchema = z.object({
  ideaDescription: z.string()
    .refine(text => countWords(text) >= 50, 'Please provide a detailed description (at least 50 words)')
    .refine(text => countWords(text) <= 300, 'Description must not exceed 300 words'),
  productStage: z.enum(['Idea Stage / MLP / Working Prototype', 'Early Revenue'], {
    required_error: 'Please select a product stage',
  }),
  problemSolved: z.string()
    .refine(text => countWords(text) >= 20, 'Please describe the problem (at least 20 words)')
    .refine(text => countWords(text) <= 300, 'Description must not exceed 300 words'),
  targetAudience: z.string()
    .refine(text => countWords(text) >= 20, 'Please describe your target audience (at least 20 words)')
    .refine(text => countWords(text) <= 300, 'Description must not exceed 300 words'),
  solutionApproach: z.string()
    .refine(text => countWords(text) >= 20, 'Please describe your solution approach (at least 20 words)')
    .refine(text => countWords(text) <= 300, 'Description must not exceed 300 words'),
  monetizationStrategy: z.string()
    .refine(text => countWords(text) >= 20, 'Please describe your monetization strategy (at least 20 words)')
    .refine(text => countWords(text) <= 300, 'Description must not exceed 300 words'),
  customerAcquisition: z.string()
    .refine(text => countWords(text) >= 20, 'Please describe your customer acquisition plan (at least 20 words)')
    .refine(text => countWords(text) <= 300, 'Description must not exceed 300 words'),
  competitors: z.string()
    .refine(text => countWords(text) >= 20, 'Please list your competitors (at least 20 words)')
    .refine(text => countWords(text) <= 300, 'Description must not exceed 300 words'),
  developmentApproach: z.string()
    .refine(text => countWords(text) >= 20, 'Please describe your development approach (at least 20 words)')
    .refine(text => countWords(text) <= 300, 'Description must not exceed 300 words'),
  teamInfo: z.string()
  .refine(text => countWords(text) >= 20, 'Please provide information about your team (at least 20 words)')
  .refine(text => countWords(text) <= 300, 'Description must not exceed 300 words'),
  timeline: z.string()
    .refine(text => countWords(text) >= 20, 'Please provide a timeline (at least 20 words)')
    .refine(text => countWords(text) <= 300, 'Timeline must not exceed 300 words'),
  // Additional fields for Early Revenue stage - make them optional
  payingCustomers: z.string().optional(),
  workingDuration: z.string().optional(),
}).refine((data) => {
  // Only validate Early Revenue fields if product stage is Early Revenue
  if (data.productStage === 'Early Revenue') {
    if (!data.payingCustomers || countWords(data.payingCustomers) < 20) {
      return false;
    }
    if (!data.workingDuration || countWords(data.workingDuration) < 20) {
      return false;
    }
  }
  return true;
}, {
  message: "Early Revenue fields are required when product stage is 'Early Revenue' (minimum 20 words each)",
  path: ["payingCustomers", "workingDuration"]
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

  // AI Feedback hooks for different questions
  const problemSolvedFeedback = useAIFeedback();
  const targetAudienceFeedback = useAIFeedback();
  const solutionApproachFeedback = useAIFeedback();

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
    mode: 'onChange', // Validate on change
    defaultValues: {
      ideaDescription: '',
      productStage: '' as any, // Use empty string instead of undefined
      problemSolved: '',
      targetAudience: '',
      solutionApproach: '',
      monetizationStrategy: '',
      customerAcquisition: '',
      competitors: '',
      developmentApproach: '',
      teamInfo: '',
      timeline: '',
      payingCustomers: undefined,
      workingDuration: undefined,
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
    console.log('Attempting form submission. Data:', data);
    console.log('Form errors before submission logic:', form.formState.errors);
    console.log('Form is valid:', form.formState.isValid);
    console.log('Form is dirty:', form.formState.isDirty);
    
    if (!registration?.id) {
      toast.error('Registration not found');
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate required fields based on product stage
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
          {/* Global form error display */}
          {form.formState.errors.root?.message && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600 text-sm font-medium">
                {form.formState.errors.root.message}
              </p>
            </div>
          )}
          
          {/* Debug information - only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-xs">
              <p className="font-medium mb-2">Debug Info:</p>
              <p>Form Valid: {form.formState.isValid ? 'Yes' : 'No'}</p>
              <p>Form Dirty: {form.formState.isDirty ? 'Yes' : 'No'}</p>
              <p>Product Stage: {productStage || 'Not selected'}</p>
              <p>Error Count: {Object.keys(form.formState.errors).length}</p>
              {Object.keys(form.formState.errors).length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Errors:</p>
                  <ul className="list-disc list-inside">
                    {Object.entries(form.formState.errors).map(([field, error]) => (
                      <li key={field} className="text-red-600">
                        {field}: {error?.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
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
                        className="h-[120px] resize-none"
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

          {/* Conditional Questions with AI Feedback */}
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
                        <Textarea {...field} placeholder="Describe the problem you're solving..." className="h-[120px] resize-none" />
                      </FormControl>
                      <FormMessage />
                      
                      {/* AI Feedback Integration */}
                      <AIFeedbackButton
                        questionId="problemSolved"
                        userAnswer={field.value || ''}
                        onFeedbackReceived={problemSolvedFeedback.handleFeedbackReceived}
                        disabled={isSubmitting}
                      />
                      
                      {problemSolvedFeedback.shouldShowFeedback && problemSolvedFeedback.feedback && (
                        <AIFeedbackDisplay
                          feedback={problemSolvedFeedback.feedback}
                          onDismiss={problemSolvedFeedback.handleDismiss}
                        />
                      )}
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
                        <Textarea {...field} placeholder="Describe your target audience..." className="h-[120px] resize-none" />
                      </FormControl>
                      <FormMessage />
                      
                      {/* AI Feedback Integration */}
                      <AIFeedbackButton
                        questionId="targetAudience"
                        userAnswer={field.value || ''}
                        onFeedbackReceived={targetAudienceFeedback.handleFeedbackReceived}
                        disabled={isSubmitting}
                      />
                      
                      {targetAudienceFeedback.shouldShowFeedback && targetAudienceFeedback.feedback && (
                        <AIFeedbackDisplay
                          feedback={targetAudienceFeedback.feedback}
                          onDismiss={targetAudienceFeedback.handleDismiss}
                        />
                      )}
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
                        <Textarea {...field} placeholder="Describe your solution approach..." className="h-[120px] resize-none" />
                      </FormControl>
                      <FormMessage />
                      
                      {/* AI Feedback Integration */}
                      <AIFeedbackButton
                        questionId="solutionApproach"
                        userAnswer={field.value || ''}
                        onFeedbackReceived={solutionApproachFeedback.handleFeedbackReceived}
                        disabled={isSubmitting}
                      />
                      
                      {solutionApproachFeedback.shouldShowFeedback && solutionApproachFeedback.feedback && (
                        <AIFeedbackDisplay
                          feedback={solutionApproachFeedback.feedback}
                          onDismiss={solutionApproachFeedback.handleDismiss}
                        />
                      )}
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
                        <Textarea {...field} placeholder="Describe your monetization strategy..." className="h-[120px] resize-none" />
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
                        <Textarea {...field} placeholder="Describe your customer acquisition strategy..." className="h-[120px] resize-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isEarlyRevenue && (
                  <>
                  <FormField
                    control={form.control}
                    name="payingCustomers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How many paying customers does your idea already have? *</FormLabel>
                        <FormControl>
                            <Textarea {...field} placeholder="Describe your number of paying customers..." className="h-[120px] resize-none" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="workingDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How long have you been working on this idea? *</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Describe how long you've been working on this idea..." className="h-[120px] resize-none" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="competitors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>List 3 potential competitors in the similar space or attempting to solve a similar problem? *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="List your competitors..." className="h-[120px] resize-none" />
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
                        <Textarea {...field} placeholder="Describe your development approach..." className="h-[120px] resize-none" />
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
                        <Textarea {...field} placeholder="Describe your team members and their roles..." className="h-[120px] resize-none" />
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
                        <Textarea {...field} placeholder={isEarlyRevenue ? "e.g., January 2024" : "e.g., Next month"} className="h-[120px] resize-none" />
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
              onClick={() => {
                console.log('Submit button clicked');
                console.log('Current form values:', form.getValues());
                console.log('Current form errors:', form.formState.errors);
                form.trigger(); // Trigger validation
              }}
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
