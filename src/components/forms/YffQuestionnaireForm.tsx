
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { WordCounter } from '@/components/ui/word-counter';
import { validateWordLimit, validateEssayAnswers } from '@/utils/registration-validation';

// Define the schema with word limit validation
const questionnaireSchema = z.object({
  whyApplying: z.string().min(1, 'This field is required').refine(
    (text) => validateWordLimit(text, 300).isValid,
    'Please limit your answer to 300 words'
  ),
  businessIdea: z.string().min(1, 'This field is required').refine(
    (text) => validateWordLimit(text, 300).isValid,
    'Please limit your answer to 300 words'
  ),
  experience: z.string().min(1, 'This field is required').refine(
    (text) => validateWordLimit(text, 300).isValid,
    'Please limit your answer to 300 words'
  ),
  challenges: z.string().min(1, 'This field is required').refine(
    (text) => validateWordLimit(text, 300).isValid,
    'Please limit your answer to 300 words'
  ),
  goals: z.string().min(1, 'This field is required').refine(
    (text) => validateWordLimit(text, 300).isValid,
    'Please limit your answer to 300 words'
  ),
  commitment: z.string().min(1, 'This field is required').refine(
    (text) => validateWordLimit(text, 300).isValid,
    'Please limit your answer to 300 words'
  ),
  ventureDescription: z.string().min(1, 'This field is required').refine(
    (text) => validateWordLimit(text, 300).isValid,
    'Please limit your answer to 300 words'
  ),
  targetMarket: z.string().min(1, 'This field is required').refine(
    (text) => validateWordLimit(text, 300).isValid,
    'Please limit your answer to 300 words'
  ),
  competitiveAdvantage: z.string().min(1, 'This field is required').refine(
    (text) => validateWordLimit(text, 300).isValid,
    'Please limit your answer to 300 words'
  ),
  businessModel: z.string().min(1, 'This field is required').refine(
    (text) => validateWordLimit(text, 300).isValid,
    'Please limit your answer to 300 words'
  ),
  fundingNeeds: z.string().min(1, 'This field is required').refine(
    (text) => validateWordLimit(text, 300).isValid,
    'Please limit your answer to 300 words'
  ),
  teamStrengths: z.string().min(1, 'This field is required').refine(
    (text) => validateWordLimit(text, 300).isValid,
    'Please limit your answer to 300 words'
  ),
  mentorshipNeeds: z.string().min(1, 'This field is required').refine(
    (text) => validateWordLimit(text, 300).isValid,
    'Please limit your answer to 300 words'
  ),
  longTermVision: z.string().min(1, 'This field is required').refine(
    (text) => validateWordLimit(text, 300).isValid,
    'Please limit your answer to 300 words'
  ),
  hearAboutUs: z.string().min(1, 'This field is required'),
  additionalInfo: z.string().optional(),
});

type QuestionnaireFormData = z.infer<typeof questionnaireSchema>;

/**
 * YFF Questionnaire Form Component with word limit validation
 */
export const YffQuestionnaireForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingRegistration, setHasExistingRegistration] = useState(false);
  const [wordCountErrors, setWordCountErrors] = useState<string[]>([]);

  const form = useForm<QuestionnaireFormData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      whyApplying: '',
      businessIdea: '',
      experience: '',
      challenges: '',
      goals: '',
      commitment: '',
      ventureDescription: '',
      targetMarket: '',
      competitiveAdvantage: '',
      businessModel: '',
      fundingNeeds: '',
      teamStrengths: '',
      mentorshipNeeds: '',
      longTermVision: '',
      hearAboutUs: '',
      additionalInfo: '',
    },
  });

  const watchedValues = form.watch();

  // Real-time word count validation
  useEffect(() => {
    const essayValidation = validateEssayAnswers(watchedValues);
    setWordCountErrors(essayValidation.errors);
  }, [watchedValues]);

  // Check for existing registration
  useEffect(() => {
    const checkRegistration = async () => {
      if (!user) return;

      try {
        const { data: registration, error } = await supabase
          .from('yff_team_registrations')
          .select('*')
          .eq('individual_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking registration:', error);
          return;
        }

        if (registration) {
          setHasExistingRegistration(true);
          
          // Pre-fill form with existing answers if available
          if (registration.questionnaire_answers) {
            const answers = registration.questionnaire_answers;
            Object.keys(answers).forEach(key => {
              if (answers[key] && form.getValues(key as keyof QuestionnaireFormData) !== undefined) {
                form.setValue(key as keyof QuestionnaireFormData, answers[key]);
              }
            });
          }
        } else {
          toast({
            title: 'No Registration Found',
            description: 'Please complete your team registration first.',
            variant: 'destructive',
          });
          navigate('/yff/register');
        }
      } catch (error) {
        console.error('Error in checkRegistration:', error);
      }
    };

    checkRegistration();
  }, [user, form, navigate, toast]);

  const onSubmit = async (data: QuestionnaireFormData) => {
    if (!user || !hasExistingRegistration) return;

    // Final validation for word limits
    const essayValidation = validateEssayAnswers(data);
    if (!essayValidation.isValid) {
      setWordCountErrors(essayValidation.errors);
      toast({
        title: 'Word Limit Exceeded',
        description: 'Please reduce the length of your answers to 300 words or less.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🚀 Submitting questionnaire answers...', {
        userId: user.id,
        wordCounts: essayValidation.wordCounts,
        timestamp: new Date().toISOString()
      });

      const { error } = await supabase
        .from('yff_team_registrations')
        .update({
          questionnaire_answers: data,
          questionnaire_completed_at: new Date().toISOString(),
        })
        .eq('individual_id', user.id);

      if (error) {
        console.error('❌ Error updating questionnaire:', error);
        toast({
          title: 'Submission Failed',
          description: 'There was an error submitting your questionnaire. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ Questionnaire submitted successfully');
      
      toast({
        title: 'Success!',
        description: 'Your questionnaire has been submitted successfully.',
      });

      // Redirect to homepage with success message
      navigate('/', { 
        state: { applicationSubmitted: true },
        replace: true 
      });

    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasExistingRegistration) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-600">Loading your registration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          YFF Application Questionnaire
        </h1>
        <p className="text-gray-600">
          Complete your application by answering the following questions. Each answer should be limited to 300 words.
        </p>
      </div>

      {/* Word count validation errors */}
      {wordCountErrors.length > 0 && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="font-semibold mb-2">Word limit exceeded in the following fields:</div>
            <ul className="list-disc list-inside space-y-1">
              {wordCountErrors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Personal Motivation Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Personal Motivation</h2>
            
            <FormField
              control={form.control}
              name="whyApplying"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why are you applying to the Young Founders Fellowship? *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Share your motivation for joining the fellowship..."
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <WordCounter text={field.value} maxWords={300} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Describe your entrepreneurial experience or relevant background *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Share your experience in entrepreneurship, business, or related fields..."
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <WordCounter text={field.value} maxWords={300} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Business Idea Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Business Idea</h2>
            
            <FormField
              control={form.control}
              name="businessIdea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Describe your business idea or venture *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Provide a clear description of your business idea..."
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <WordCounter text={field.value} maxWords={300} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ventureDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provide a detailed description of your venture *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Elaborate on your venture, its purpose, and objectives..."
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <WordCounter text={field.value} maxWords={300} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetMarket"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Who is your target market? *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe your target customers and market..."
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <WordCounter text={field.value} maxWords={300} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="competitiveAdvantage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What is your competitive advantage? *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Explain what sets your venture apart from competitors..."
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <WordCounter text={field.value} maxWords={300} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Describe your business model *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Explain how your business will generate revenue..."
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <WordCounter text={field.value} maxWords={300} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Goals and Challenges Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Goals and Challenges</h2>
            
            <FormField
              control={form.control}
              name="goals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What are your main goals for this fellowship? *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Share what you hope to achieve through this fellowship..."
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <WordCounter text={field.value} maxWords={300} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="challenges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What challenges do you anticipate in your entrepreneurial journey? *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe the main challenges you expect to face..."
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <WordCounter text={field.value} maxWords={300} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="longTermVision"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What is your long-term vision for your venture? *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Share your vision for the future of your venture..."
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <WordCounter text={field.value} maxWords={300} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Team and Resources Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Team and Resources</h2>
            
            <FormField
              control={form.control}
              name="teamStrengths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What are your team's key strengths? *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe the strengths and skills of your team..."
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <WordCounter text={field.value} maxWords={300} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mentorshipNeeds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What specific mentorship and support do you need? *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Explain what kind of mentorship would be most valuable..."
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <WordCounter text={field.value} maxWords={300} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fundingNeeds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What are your funding requirements? *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe your funding needs and how you plan to use the resources..."
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <WordCounter text={field.value} maxWords={300} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Commitment and Additional Information */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Commitment and Additional Information</h2>
            
            <FormField
              control={form.control}
              name="commitment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How will you demonstrate your commitment to the fellowship? *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Explain how you will actively participate and contribute..."
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <WordCounter text={field.value} maxWords={300} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hearAboutUs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How did you hear about the Young Founders Fellowship? *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select how you heard about us" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="social-media">Social Media</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral from a friend/colleague</SelectItem>
                      <SelectItem value="event">Event or workshop</SelectItem>
                      <SelectItem value="partner">Partner organization</SelectItem>
                      <SelectItem value="search">Online search</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Any additional information you'd like to share? (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Share any additional information that might be relevant..."
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <WordCounter text={field.value} maxWords={300} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end pt-6">
            <Button 
              type="submit" 
              disabled={isSubmitting || wordCountErrors.length > 0}
              className="min-w-32"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
