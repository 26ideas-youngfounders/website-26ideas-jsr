import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAutosave } from '@/hooks/useAutosave';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { YffRegistrationFormSections } from './YffRegistrationFormSections';
import { YffAutosaveIndicator } from './YffAutosaveIndicator';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { 
  AutosaveFormData, 
  isAutosaveFormData, 
  extractTeamMembers, 
  extractNumberOfTeamMembers 
} from '@/types/autosave';
import { validateFormData, sanitizeFormData } from '@/utils/yff-form-validation';

// Define the schema for individual team members
const teamMemberSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  phoneNumber: z.string().min(8, { message: 'Phone number must be at least 8 digits.' }),
  countryCode: z.string().default('+91'),
  dateOfBirth: z.string().min(1, { message: 'Date of birth is required.' }),
  currentCity: z.string().min(2, { message: 'City must be at least 2 characters.' }),
  state: z.string().min(2, { message: 'State must be at least 2 characters.' }),
  pinCode: z.string().min(6, { message: 'Pin code must be 6 digits.' }),
  permanentAddress: z.string().min(5, { message: 'Address must be at least 5 characters.' }),
  gender: z.string().min(1, { message: 'Gender is required.' }),
  institutionName: z.string().min(2, { message: 'Institution name must be at least 2 characters.' }),
  courseProgram: z.string().min(2, { message: 'Course/program must be at least 2 characters.' }),
  currentYearOfStudy: z.string().min(1, { message: 'Current year of study is required.' }),
  expectedGraduation: z.string().min(4, { message: 'Expected graduation year is required.' }),
  linkedinProfile: z.string().url({ message: 'Invalid LinkedIn URL.' }).optional(),
});

// Define the main form schema
const formSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  phoneNumber: z.string().min(8, { message: 'Phone number must be at least 8 digits.' }),
  countryCode: z.string().default('+91'),
  dateOfBirth: z.string().min(1, { message: 'Date of birth is required.' }),
  currentCity: z.string().min(2, { message: 'City must be at least 2 characters.' }),
  state: z.string().min(2, { message: 'State must be at least 2 characters.' }),
  pinCode: z.string().min(6, { message: 'Pin code must be 6 digits.' }),
  permanentAddress: z.string().min(5, { message: 'Address must be at least 5 characters.' }),
  gender: z.string().min(1, { message: 'Gender is required.' }),
  institutionName: z.string().min(2, { message: 'Institution name must be at least 2 characters.' }),
  courseProgram: z.string().min(2, { message: 'Course/program must be at least 2 characters.' }),
  currentYearOfStudy: z.string().min(1, { message: 'Current year of study is required.' }),
  expectedGraduation: z.string().min(4, { message: 'Expected graduation year is required.' }),
  numberOfTeamMembers: z.number().min(1, { message: 'Number of team members must be at least 1.' }).max(5, { message: 'Cannot have more than 5 team members' }).default(1),
  teamMembers: z.array(teamMemberSchema).default([]),
  ventureName: z.string().optional(),
  industrySector: z.string().optional(),
  teamName: z.string().optional(),
  website: z.string().url({ message: 'Invalid website URL.' }).optional(),
  linkedinProfile: z.string().url({ message: 'Invalid LinkedIn URL.' }).optional(),
  socialMediaHandles: z.string().optional(),
  referralId: z.string().optional(),
});

// Define the form values type
export type FormValues = z.infer<typeof formSchema>;

// Define the team member type
export type TeamMember = z.infer<typeof teamMemberSchema>;

/**
 * Handles Supabase error responses and provides user-friendly messages
 */
const handleSubmissionError = (error: any, toast: any) => {
  console.error('❌ Registration submission failed:', error);
  
  let userMessage = 'Registration failed. Please try again.';
  
  if (error?.message) {
    // Check for specific database constraint errors
    if (error.message.includes('duplicate key')) {
      userMessage = 'A registration with this email already exists.';
    } else if (error.message.includes('violates not-null constraint')) {
      userMessage = 'Some required fields are missing. Please review your information and try again.';
    } else if (error.message.includes('violates check constraint')) {
      userMessage = 'Some field values are invalid. Please check your entries and try again.';
    } else if (error.message.includes('invalid input syntax')) {
      userMessage = 'Some field values have invalid format. Please check your entries and try again.';
    } else if (error.message.includes('violates foreign key constraint')) {
      userMessage = 'Invalid reference data. Please contact support.';
    } else {
      userMessage = `Registration failed: ${error.message}`;
    }
  }
  
  // Show user-friendly error
  toast({
    title: 'Registration Failed',
    description: userMessage,
    variant: 'destructive',
  });
};

/**
 * Safely restore autosaved data to form with proper type checking
 */
const restoreAutosavedData = (
  autosavedData: AutosaveFormData,
  form: ReturnType<typeof useForm<FormValues>>
): void => {
  try {
    // Validate and restore form fields
    Object.entries(autosavedData).forEach(([key, value]) => {
      if (key in form.getValues() && value !== undefined) {
        // Special handling for team members
        if (key === 'teamMembers') {
          const teamMembers = extractTeamMembers(autosavedData);
          form.setValue('teamMembers', teamMembers);
        } else if (key === 'numberOfTeamMembers') {
          const numberOfMembers = extractNumberOfTeamMembers(autosavedData);
          form.setValue('numberOfTeamMembers', numberOfMembers);
        } else {
          form.setValue(key as keyof FormValues, value);
        }
      }
    });
  } catch (error) {
    console.error('❌ Error restoring autosaved data:', error);
    throw error;
  }
};

/**
 * YFF Team Registration Form Component
 * Handles team registration with robust validation and error handling
 */
export const YffTeamRegistrationForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [showProfileCreation, setShowProfileCreation] = useState(false);
  const [dataRestored, setDataRestored] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      countryCode: '+91',
      dateOfBirth: '',
      currentCity: '',
      state: '',
      pinCode: '',
      permanentAddress: '',
      gender: '',
      institutionName: '',
      courseProgram: '',
      currentYearOfStudy: '',
      expectedGraduation: '',
      numberOfTeamMembers: 1,
      teamMembers: [],
      ventureName: '',
      industrySector: '',
      teamName: '',
      website: '',
      linkedinProfile: '',
      socialMediaHandles: '',
      referralId: '',
    },
  });

  const watchedValues = form.watch();
  const { status: autosaveStatus, loadSavedData, clearSavedData, isLoading: autosaveLoading } = useAutosave({
    formData: watchedValues,
    formType: 'yff_team_registration',
  });

  // Create a basic profile for authenticated users who don't have one
  const createBasicProfile = async () => {
    if (!user?.email) return false;

    try {
      console.log('📝 Creating basic profile for user:', user.email);
      
      // Extract potential name from email
      const emailUsername = user.email.split('@')[0];
      const nameParts = emailUsername.split('.');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts[1] || '';

      const { error } = await supabase
        .from('individuals')
        .insert({
          individual_id: user.id,
          first_name: firstName,
          last_name: lastName,
          email: user.email,
          privacy_consent: true,
          data_processing_consent: true,
          country_code: '+91',
          country_iso_code: 'IN',
          is_active: true,
          email_verified: true,
        });

      if (error) {
        console.error('❌ Error creating basic profile:', error);
        return false;
      }

      console.log('✅ Basic profile created successfully');
      return true;
    } catch (error) {
      console.error('❌ Error in createBasicProfile:', error);
      return false;
    }
  };

  // Enhanced data loading with better cross-session handling
  useEffect(() => {
    const loadData = async () => {
      if (!user?.email) {
        setProfileError('User email not found. Please sign in again.');
        return;
      }

      try {
        console.log('🔍 Loading profile for user:', user.email);
        
        // First, try to fetch user profile by email
        let { data: individual, error: individualError } = await supabase
          .from('individuals')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        // If no profile found by email, try by individual_id
        if (!individual && !individualError) {
          console.log('🔍 No profile found by email, trying by individual_id');
          const { data: individualById, error: individualByIdError } = await supabase
            .from('individuals')
            .select('*')
            .eq('individual_id', user.id)
            .maybeSingle();
          
          individual = individualById;
          individualError = individualByIdError;
        }

        if (individualError && individualError.code !== 'PGRST116') {
          console.error('❌ Error fetching individual profile:', individualError);
          setProfileError('Could not load your profile. Please refresh or contact support.');
          return;
        }

        if (!individual) {
          console.log('⚠️ No individual profile found, offering to create one');
          setShowProfileCreation(true);
          setProfileLoaded(true);
          
          // Pre-fill with available user data
          form.setValue('email', user.email);
          form.setValue('fullName', user.user_metadata?.full_name || '');
          
          return;
        }

        console.log('✅ Individual profile loaded:', individual);

        // Pre-fill form with profile data
        form.setValue('fullName', `${individual.first_name} ${individual.last_name}`);
        form.setValue('email', individual.email);
        form.setValue('countryCode', individual.country_code || '+91');

        // Load autosaved data - this is crucial for cross-session persistence
        console.log('📋 Loading autosaved data...');
        const autosavedData = await loadSavedData();
        
        if (autosavedData && isAutosaveFormData(autosavedData)) {
          console.log('🔄 Restoring autosaved form data');
          
          try {
            restoreAutosavedData(autosavedData, form);
            setDataRestored(true);
            
            // Show restoration message
            toast({
              title: 'Progress Restored',
              description: 'Your previous form progress has been restored. Continue where you left off!',
              duration: 5000,
            });
          } catch (error) {
            console.error('❌ Error restoring autosaved data:', error);
            toast({
              title: 'Restoration Warning',
              description: 'Some of your previous data could not be restored, but your progress is being saved.',
              variant: 'destructive',
            });
          }
        } else {
          console.log('📭 No valid autosaved data found');
        }

        setProfileLoaded(true);
        setProfileError(null);
        setShowProfileCreation(false);
      } catch (error) {
        console.error('❌ Error loading data:', error);
        setProfileError('An unexpected error occurred. Please try again.');
      }
    };

    loadData();
  }, [user, form, loadSavedData, toast]);

  // Handle profile creation
  const handleCreateProfile = async () => {
    const success = await createBasicProfile();
    if (success) {
      setShowProfileCreation(false);
      toast({
        title: 'Profile Created',
        description: 'Your basic profile has been created. You can now proceed with registration.',
      });
      // Reload the page to refresh the profile data
      window.location.reload();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to create profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!user || !profileLoaded) {
      toast({
        title: 'Error',
        description: 'Profile not loaded. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      // Validate the form data before submission
      const validation = validateFormData(data);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        toast({
          title: 'Validation Failed',
          description: 'Please fix the errors below and try again.',
          variant: 'destructive',
        });
        return;
      }

      // Sanitize and prepare the submission data
      const submissionData = sanitizeFormData(data, user.id);
      
      console.log('📤 Submitting registration data:', submissionData);

      const { error } = await supabase
        .from('yff_team_registrations')
        .insert(submissionData);

      if (error) {
        handleSubmissionError(error, toast);
        return;
      }

      console.log('✅ Registration submitted successfully');
      
      // Clear autosaved data after successful submission
      await clearSavedData();

      toast({
        title: 'Success!',
        description: 'Your team registration has been submitted successfully.',
      });

      // Reset form and states
      form.reset();
      setDataRestored(false);
      setValidationErrors([]);
      
    } catch (error) {
      handleSubmissionError(error, toast);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show profile creation option
  if (showProfileCreation) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            We need to create your profile before you can register for the YFF program.
          </p>
        </div>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You're signed in as <strong>{user?.email}</strong>, but we need to create your profile 
            in our system to continue with the registration process.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">What happens next:</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• We'll create a basic profile with your email address</li>
              <li>• You can complete the full registration form</li>
              <li>• Your progress will be automatically saved</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleCreateProfile} className="flex-1">
              Create Profile & Continue
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if profile couldn't be loaded
  if (profileError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Profile Loading Error</h2>
          <p className="text-red-600 mb-4">{profileError}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="mr-2"
          >
            Refresh Page
          </Button>
          <Button onClick={() => window.location.href = '/'}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state while profile is being loaded
  if (!profileLoaded || autosaveLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-600">
            {autosaveLoading ? 'Loading your saved progress...' : 'Loading your profile...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          YFF Team Registration
        </h1>
        <p className="text-gray-600">
          Register your team for the Young Founders Fellowship program
        </p>
      </div>

      {/* Show restoration success message */}
      {dataRestored && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your previous form progress has been restored. All your data is automatically saved as you type.
          </AlertDescription>
        </Alert>
      )}

      {/* Show validation errors */}
      {validationErrors.length > 0 && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="font-semibold mb-2">Please fix the following errors:</div>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <YffRegistrationFormSections form={form} />
          
          <div className="flex justify-end pt-6">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-32"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Registration'}
            </Button>
          </div>
        </form>
      </Form>

      <YffAutosaveIndicator status={autosaveStatus} />
    </div>
  );
};
