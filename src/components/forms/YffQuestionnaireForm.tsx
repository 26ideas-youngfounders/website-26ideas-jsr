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
  // Early Revenue specific field
  payingCustomers: z.string().optional(),
}).refine((data) => {
  // Only validate Early Revenue fields if product stage is Early Revenue
  if (data.productStage === 'Early Revenue') {
    if (!data.payingCustomers || countWords(data.payingCustomers) < 20) {
      return false;
    }
  }
  return true;
}, {
  message: "Early Revenue fields are required when product stage is 'Early Revenue' (minimum 20 words each)",
  path: ["payingCustomers"]
});

type QuestionnaireFormData = z.infer<typeof questionnaireSchema>;

/**
 * Props interface for YffQuestionnaireForm
 * 
 * @interface YffQuestionnaireFormProps
 * @property {any} registration - The user's registration data from yff_team_registrations table
 * @property {() => void} onComplete - Callback function called when questionnaire is successfully submitted
 * @property {string} currentStage - The current product stage ('idea' | 'early_revenue')
 */
interface YffQuestionnaireFormProps {
  registration: any;
  onComplete: () => void;
  currentStage: 'idea' | 'early_revenue';
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
  currentStage,
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productStage, setProductStage] = useState<string>('');

  // AI Feedback hooks for ALL questions that need feedback
  const ideaDescriptionFeedback = useAIFeedback();
  const problemSolvedFeedback = useAIFeedback();
  const targetAudienceFeedback = useAIFeedback();
  const solutionApproachFeedback = useAIFeedback();
  const monetizationStrategyFeedback = useAIFeedback();
  const customerAcquisitionFeedback = useAIFeedback();
  const competitorsFeedback = useAIFeedback();
  const developmentApproachFeedback = useAIFeedback();
  const teamInfoFeedback = useAIFeedback();
  const timelineFeedback = useAIFeedback();
  const payingCustomersFeedback = useAIFeedback();

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
      if (!currentStage) {
        console.error('❌ YffQuestionnaireForm: Missing required prop "currentStage"');
        toast.error('Developer Error: Missing currentStage prop');
      }
    }
  }, [registration, onComplete, currentStage]);

  const form = useForm<QuestionnaireFormData>({
    resolver: zodResolver(questionnaireSchema),
    mode: 'onChange',
    defaultValues: {
      ideaDescription: '',
      productStage: '' as any,
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

  // Use the form's productStage value to determine current flow, not the prop
  // Determine effective stage for AI feedback based on form selection
  const effectiveStage = isEarlyRevenue ? 'early_revenue' : 'idea';

  // Enhanced retry handler for all questions
  const handleRetryFeedback = (questionId: string) => {
    console.log('🔄 Retrying AI feedback for:', questionId);
    switch (questionId) {
      case 'ideaDescription':
        ideaDescriptionFeedback.setFeedback(null);
        break;
      case 'problemSolved':
        problemSolvedFeedback.setFeedback(null);
        break;
      case 'targetAudience':
        targetAudienceFeedback.setFeedback(null);
        break;
      case 'solutionApproach':
        solutionApproachFeedback.setFeedback(null);
        break;
      case 'monetizationStrategy':
        monetizationStrategyFeedback.setFeedback(null);
        break;
      case 'customerAcquisition':
        customerAcquisitionFeedback.setFeedback(null);
        break;
      case 'competitors':
        competitorsFeedback.setFeedback(null);
        break;
      case 'developmentApproach':
        developmentApproachFeedback.setFeedback(null);
        break;
      case 'teamInfo':
        teamInfoFeedback.setFeedback(null);
        break;
      case 'timeline':
        timelineFeedback.setFeedback(null);
        break;
      case 'payingCustomers':
        payingCustomersFeedback.setFeedback(null);
        break;
    }
  };

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

          {/* For Idea Stage, show the Tell us about your idea question first */}
          {!isEarlyRevenue && (
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
                      
                      <AIFeedbackButton
                        questionId="idea_description"
                        questionText="Tell us about your idea"
                        userAnswer={field.value || ''}
                        stage={currentStage}
                        onFeedbackReceived={ideaDescriptionFeedback.handleFeedbackReceived}
                        disabled={isSubmitting}
                      />
                      
                      {ideaDescriptionFeedback.shouldShowFeedback && ideaDescriptionFeedback.feedback && (
                        <AIFeedbackDisplay
                          feedback={ideaDescriptionFeedback.feedback}
                          onDismiss={ideaDescriptionFeedback.handleDismiss}
                          onRetry={() => handleRetryFeedback('ideaDescription')}
                        />
                      )}
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
          )}

          {/* Stage-Specific Questions */}
          {productStage && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {isEarlyRevenue ? 'Early Revenue Stage Questions' : 'Idea Stage Questions'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEarlyRevenue ? (
                  // EARLY REVENUE: Show only the 10 specified questions
                  <>
                    {/* 1. Tell us about your idea - moved here for Early Revenue */}
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
                          
                          <AIFeedbackButton
                            questionId="early_revenue_idea"
                            questionText="Tell us about your idea"
                            userAnswer={field.value || ''}
                            stage={currentStage}
                            onFeedbackReceived={ideaDescriptionFeedback.handleFeedbackReceived}
                            disabled={isSubmitting}
                          />
                          
                          {ideaDescriptionFeedback.shouldShowFeedback && ideaDescriptionFeedback.feedback && (
                            <AIFeedbackDisplay
                              feedback={ideaDescriptionFeedback.feedback}
                              onDismiss={ideaDescriptionFeedback.handleDismiss}
                              onRetry={() => handleRetryFeedback('ideaDescription')}
                            />
                          )}
                        </FormItem>
                      )}
                    />

                    {/* 2. What problem does your idea solve? */}
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
                          
                          <AIFeedbackButton
                            questionId="early_revenue_problem"
                            questionText="What problem does your idea solve?"
                            userAnswer={field.value || ''}
                            stage={effectiveStage}
                            onFeedbackReceived={problemSolvedFeedback.handleFeedbackReceived}
                            disabled={isSubmitting}
                          />
                          
                          {problemSolvedFeedback.shouldShowFeedback && problemSolvedFeedback.feedback && (
                            <AIFeedbackDisplay
                              feedback={problemSolvedFeedback.feedback}
                              onDismiss={problemSolvedFeedback.handleDismiss}
                              onRetry={() => handleRetryFeedback('problemSolved')}
                            />
                          )}
                        </FormItem>
                      )}
                    />

                    {/* 3. Whose problem does your idea solve for? */}
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
                          
                          <AIFeedbackButton
                            questionId="early_revenue_target"
                            questionText="Whose problem does your idea solve for?"
                            userAnswer={field.value || ''}
                            stage={currentStage}
                            onFeedbackReceived={targetAudienceFeedback.handleFeedbackReceived}
                            disabled={isSubmitting}
                          />
                          
                          {targetAudienceFeedback.shouldShowFeedback && targetAudienceFeedback.feedback && (
                            <AIFeedbackDisplay
                              feedback={targetAudienceFeedback.feedback}
                              onDismiss={targetAudienceFeedback.handleDismiss}
                              onRetry={() => handleRetryFeedback('targetAudience')}
                            />
                          )}
                        </FormItem>
                      )}
                    />

                    {/* 4. How does your idea solve this problem? */}
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
                          
                          <AIFeedbackButton
                            questionId="early_revenue_how_solve"
                            questionText="How does your idea solve this problem?"
                            userAnswer={field.value || ''}
                            stage={currentStage}
                            onFeedbackReceived={solutionApproachFeedback.handleFeedbackReceived}
                            disabled={isSubmitting}
                          />
                          
                          {solutionApproachFeedback.shouldShowFeedback && solutionApproachFeedback.feedback && (
                            <AIFeedbackDisplay
                              feedback={solutionApproachFeedback.feedback}
                              onDismiss={solutionApproachFeedback.handleDismiss}
                              onRetry={() => handleRetryFeedback('solutionApproach')}
                            />
                          )}
                        </FormItem>
                      )}
                    />

                    {/* 5. How is your idea making money by solving the problem? */}
                    <FormField
                      control={form.control}
                      name="monetizationStrategy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How is your idea making money by solving the problem? *</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Describe your monetization strategy..." className="h-[120px] resize-none" />
                          </FormControl>
                          <FormMessage />
                          
                          <AIFeedbackButton
                            questionId="early_revenue_monetization"
                            questionText="How is your idea making money by solving the problem?"
                            userAnswer={field.value || ''}
                            stage={currentStage}
                            onFeedbackReceived={monetizationStrategyFeedback.handleFeedbackReceived}
                            disabled={isSubmitting}
                          />
                          
                          {monetizationStrategyFeedback.shouldShowFeedback && monetizationStrategyFeedback.feedback && (
                            <AIFeedbackDisplay
                              feedback={monetizationStrategyFeedback.feedback}
                              onDismiss={monetizationStrategyFeedback.handleDismiss}
                              onRetry={() => handleRetryFeedback('monetizationStrategy')}
                            />
                          )}
                        </FormItem>
                      )}
                    />

                    {/* 6. How are you acquiring first paying customers? */}
                    <FormField
                      control={form.control}
                      name="customerAcquisition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How are you acquiring first paying customers? *</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Describe your customer acquisition strategy..." className="h-[120px] resize-none" />
                          </FormControl>
                          <FormMessage />
                          
                          <AIFeedbackButton
                            questionId="early_revenue_customers"
                            questionText="How are you acquiring first paying customers?"
                            userAnswer={field.value || ''}
                            stage={currentStage}
                            onFeedbackReceived={customerAcquisitionFeedback.handleFeedbackReceived}
                            disabled={isSubmitting}
                          />
                          
                          {customerAcquisitionFeedback.shouldShowFeedback && customerAcquisitionFeedback.feedback && (
                            <AIFeedbackDisplay
                              feedback={customerAcquisitionFeedback.feedback}
                              onDismiss={customerAcquisitionFeedback.handleDismiss}
                              onRetry={() => handleRetryFeedback('customerAcquisition')}
                            />
                          )}
                        </FormItem>
                      )}
                    />

                    {/* 7. How many paying customers does your idea already have? */}
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
                          
                          <AIFeedbackButton
                            questionId="early_revenue_existing_customers"
                            questionText="How many paying customers does your idea already have?"
                            userAnswer={field.value || ''}
                            stage={currentStage}
                            onFeedbackReceived={payingCustomersFeedback.handleFeedbackReceived}
                            disabled={isSubmitting}
                          />
                          
                          {payingCustomersFeedback.shouldShowFeedback && payingCustomersFeedback.feedback && (
                            <AIFeedbackDisplay
                              feedback={payingCustomersFeedback.feedback}
                              onDismiss={payingCustomersFeedback.handleDismiss}
                              onRetry={() => handleRetryFeedback('payingCustomers')}
                            />
                          )}
                        </FormItem>
                      )}
                    />

                    {/* 8. List 3 potential competitors... */}
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
                          
                          <AIFeedbackButton
                            questionId="early_revenue_competitors"
                            questionText="List 3 potential competitors in the similar space or attempting to solve a similar problem?"
                            userAnswer={field.value || ''}
                            stage={currentStage}
                            onFeedbackReceived={competitorsFeedback.handleFeedbackReceived}
                            disabled={isSubmitting}
                          />
                          
                          {competitorsFeedback.shouldShowFeedback && competitorsFeedback.feedback && (
                            <AIFeedbackDisplay
                              feedback={competitorsFeedback.feedback}
                              onDismiss={competitorsFeedback.handleDismiss}
                              onRetry={() => handleRetryFeedback('competitors')}
                            />
                          )}
                        </FormItem>
                      )}
                    />

                    {/* 9. How are you developing the product... */}
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
                          
                          <AIFeedbackButton
                            questionId="early_revenue_development"
                            questionText="How are you developing the product: in-house, with a technical co-founder, or outsourcing to an agency/partner?"
                            userAnswer={field.value || ''}
                            stage={currentStage}
                            onFeedbackReceived={developmentApproachFeedback.handleFeedbackReceived}
                            disabled={isSubmitting}
                          />
                          
                          {developmentApproachFeedback.shouldShowFeedback && developmentApproachFeedback.feedback && (
                            <AIFeedbackDisplay
                              feedback={developmentApproachFeedback.feedback}
                              onDismiss={developmentApproachFeedback.handleDismiss}
                              onRetry={() => handleRetryFeedback('developmentApproach')}
                            />
                          )}
                        </FormItem>
                      )}
                    />

                    {/* 10. Who is on your team, and what are their roles? */}
                    <FormField
                      control={form.control}
                      name="teamInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Who is on your team, and what are their roles? *</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Describe your team members and their roles..." className="h-[120px] resize-none" />
                          </FormControl>
                          <FormMessage />
                          
                          <AIFeedbackButton
                            questionId="early_revenue_team"
                            questionText="Who is on your team, and what are their roles?"
                            userAnswer={field.value || ''}
                            stage={currentStage}
                            onFeedbackReceived={teamInfoFeedback.handleFeedbackReceived}
                            disabled={isSubmitting}
                          />
                          
                          {teamInfoFeedback.shouldShowFeedback && teamInfoFeedback.feedback && (
                            <AIFeedbackDisplay
                              feedback={teamInfoFeedback.feedback}
                              onDismiss={teamInfoFeedback.handleDismiss}
                              onRetry={() => handleRetryFeedback('teamInfo')}
                            />
                          )}
                        </FormItem>
                      )}
                    />

                    {/* 11. Since when have you been working on the idea? */}
                    <FormField
                      control={form.control}
                      name="timeline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Since when have you been working on the idea? *</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="e.g., January 2024" className="h-[120px] resize-none" />
                          </FormControl>
                          <FormMessage />
                          
                          <AIFeedbackButton
                            questionId="early_revenue_timeline"
                            questionText="Since when have you been working on the idea?"
                            userAnswer={field.value || ''}
                            stage={currentStage}
                            onFeedbackReceived={timelineFeedback.handleFeedbackReceived}
                            disabled={isSubmitting}
                          />
                          
                          {timelineFeedback.shouldShowFeedback && timelineFeedback.feedback && (
                            <AIFeedbackDisplay
                              feedback={timelineFeedback.feedback}
                              onDismiss={timelineFeedback.handleDismiss}
                              onRetry={() => handleRetryFeedback('timeline')}
                            />
                          )}
                        </FormItem>
                      )}
                    />
                  </>
                ) : (
                  // IDEA STAGE: Show the original idea stage questions
                  <>
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
                          
                          <AIFeedbackButton
                            questionId="idea_problem"
                            questionText="What problem does your idea solve?"
                            userAnswer={field.value || ''}
                            stage={currentStage}
                            onFeedbackReceived={problemSolvedFeedback.handleFeedbackReceived}
                            disabled={isSubmitting}
                          />
                          
                          {problemSolvedFeedback.shouldShowFeedback && problemSolvedFeedback.feedback && (
                            <AIFeedbackDisplay
                              feedback={problemSolvedFeedback.feedback}
                              onDismiss={problemSolvedFeedback.handleDismiss}
                              onRetry={() => handleRetryFeedback('problemSolved')}
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
                          
                          <AIFeedbackButton
                            questionId="idea_target"
                            questionText="Whose problem does your idea solve for?"
                            userAnswer={field.value || ''}
                            stage={currentStage}
                            onFeedbackReceived={targetAudienceFeedback.handleFeedbackReceived}
                            disabled={isSubmitting}
                          />
                          
                          {targetAudienceFeedback.shouldShowFeedback && targetAudienceFeedback.feedback && (
                            <AIFeedbackDisplay
                              feedback={targetAudienceFeedback.feedback}
                              onDismiss={targetAudienceFeedback.handleDismiss}
                              onRetry={() => handleRetryFeedback('targetAudience')}
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
                          
                          <AIFeedbackButton
                            questionId="idea_how_solve"
                            questionText="How does your idea solve this problem?"
                            userAnswer={field.value || ''}
                            stage={currentStage}
                            onFeedbackReceived={solutionApproachFeedback.handleFeedbackReceived}
                            disabled={isSubmitting}
                          />
                          
                          {solutionApproachFeedback.shouldShowFeedback && solutionApproachFeedback.feedback && (
                            <AIFeedbackDisplay
                              feedback={solutionApproachFeedback.feedback}
                              onDismiss={solutionApproachFeedback.handleDismiss}
                              onRetry={() => handleRetryFeedback('solutionApproach')}
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
                          <FormLabel>How does your idea plan to make money by solving this problem? *</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Describe your monetization strategy..." className="h-[120px] resize-none" />
                          </FormControl>
                          <FormMessage />
                          
                          <AIFeedbackButton
                            questionId="idea_monetization"
                            questionText="How does your idea plan to make money by solving this problem?"
                            userAnswer={field.value || ''}
                            stage={currentStage}
                            onFeedbackReceived={monetizationStrategyFeedback.handleFeedbackReceived}
                            disabled={isSubmitting}
                          />
                          
                          {monetizationStrategyFeedback.shouldShowFeedback && monetizationStrategyFeedback.feedback && (
                            <AIFeedbackDisplay
                              feedback={monetizationStrategyFeedback.feedback}
                              onDismiss={monetizationStrategyFeedback.handleDismiss}
                              onRetry={() => handleRetryFeedback('monetizationStrategy')}
                            />
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerAcquisition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How do you plan to acquire first paying customers? *</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Describe your customer acquisition strategy..." className="h-[120px] resize-none" />
                          </FormControl>
                          <FormMessage />
                          
                          <AIFeedbackButton
                            questionId="idea_customers"
                            questionText="How do you plan to acquire first paying customers?"
                            userAnswer={field.value || ''}
                            stage={currentStage}
                            onFeedbackReceived={customerAcquisitionFeedback.handleFeedbackReceived}
                            disabled={isSubmitting}
                          />
                          
                          {customerAcquisitionFeedback.shouldShowFeedback && customerAcquisitionFeedback.feedback && (
                            <AIFeedbackDisplay
                              feedback={customerAcquisitionFeedback.feedback}
                              onDismiss={customerAcquisitionFeedback.handleDismiss}
                              onRetry={() => handleRetryFeedback('customerAcquisition')}
                            />
                          )}
                        </FormItem>
                      )}
                    />

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
                          
                          <AIFeedbackButton
                            questionId="idea_competitors"
                            questionText="List 3 potential competitors in the similar space or attempting to solve a similar problem?"
                            userAnswer={field.value || ''}
                            stage={currentStage}
                            onFeedbackReceived={competitorsFeedback.handleFeedbackReceived}
                            disabled={isSubmitting}
                          />
                          
                          {competitorsFeedback.shouldShowFeedback && competitorsFeedback.feedback && (
                            <AIFeedbackDisplay
                              feedback={competitorsFeedback.feedback}
                              onDismiss={competitorsFeedback.handleDismiss}
                              onRetry={() => handleRetryFeedback('competitors')}
                            />
                          )}
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
                          
                          <AIFeedbackButton
                            questionId="idea_development"
                            questionText="How are you developing the product: in-house, with a technical co-founder, or outsourcing to an agency/partner?"
                            userAnswer={field.value || ''}
                            stage={currentStage}
                            onFeedbackReceived={developmentApproachFeedback.handleFeedbackReceived}
                            disabled={isSubmitting}
                          />
                          
                          {developmentApproachFeedback.shouldShowFeedback && developmentApproachFeedback.feedback && (
                            <AIFeedbackDisplay
                              feedback={developmentApproachFeedback.feedback}
                              onDismiss={developmentApproachFeedback.handleDismiss}
                              onRetry={() => handleRetryFeedback('developmentApproach')}
                            />
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="teamInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Who is on your team, and what are their roles? *</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Describe your team members and their roles..." className="h-[120px] resize-none" />
                          </FormControl>
                          <FormMessage />
                          
                          <AIFeedbackButton
                            questionId="idea_team"
                            questionText="Who is on your team, and what are their roles?"
                            userAnswer={field.value || ''}
                            stage={currentStage}
                            onFeedbackReceived={teamInfoFeedback.handleFeedbackReceived}
                            disabled={isSubmitting}
                          />
                          
                          {teamInfoFeedback.shouldShowFeedback && teamInfoFeedback.feedback && (
                            <AIFeedbackDisplay
                              feedback={teamInfoFeedback.feedback}
                              onDismiss={teamInfoFeedback.handleDismiss}
                              onRetry={() => handleRetryFeedback('teamInfo')}
                            />
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="timeline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>When do you plan to proceed with the idea? *</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="e.g., Next month" className="h-[120px] resize-none" />
                          </FormControl>
                          <FormMessage />
                          
                          <AIFeedbackButton
                            questionId="idea_timeline"
                            questionText="When do you plan to proceed with the idea?"
                            userAnswer={field.value || ''}
                            stage={currentStage}
                            onFeedbackReceived={timelineFeedback.handleFeedbackReceived}
                            disabled={isSubmitting}
                          />
                          
                          {timelineFeedback.shouldShowFeedback && timelineFeedback.feedback && (
                            <AIFeedbackDisplay
                              feedback={timelineFeedback.feedback}
                              onDismiss={timelineFeedback.handleDismiss}
                              onRetry={() => handleRetryFeedback('timeline')}
                            />
                          )}
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stage Selector - Show when Early Revenue is selected to allow switching back */}
          {isEarlyRevenue && (
            <Card>
              <CardHeader>
                <CardTitle>Change Stage</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="productStage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Switch to different stage *</FormLabel>
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
          )}

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isValid}
              className="w-full max-w-md"
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
