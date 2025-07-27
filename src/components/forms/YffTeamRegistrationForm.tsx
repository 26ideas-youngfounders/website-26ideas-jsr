
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { parseISO, differenceInYears, isValid } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAutosave } from '@/hooks/useAutosave';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { YffRegistrationFormSections } from './YffRegistrationFormSections';
import { YffAutosaveIndicator } from './YffAutosaveIndicator';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Shield, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  AutosaveFormData, 
  AutosaveStatus,
  isAutosaveFormData, 
  extractTeamMembers, 
  extractNumberOfTeamMembers 
} from '@/types/autosave';
import { validateFormData, sanitizeFormData } from '@/utils/yff-form-validation';

// Define the schema for individual team members
const teamMemberSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits.'),
  countryCode: z.string().default('+91'),
  dateOfBirth: z.string()
    .refine((dateString) => {
      if (!dateString) return false; // Ensure it's not empty if required
      const dob = parseISO(dateString);
      return isValid(dob);
    }, "Invalid date format")
    .refine((dateString) => {
      const dob = parseISO(dateString);
      const today = new Date();
      const age = differenceInYears(today, dob);
      return age >= 18 && age <= 27;
    }, "You must be between 18 and 27 years old on the date of registration."),
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
  phoneNumber: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits.'),
  countryCode: z.string().default('+91'),
  dateOfBirth: z.string()
    .refine((dateString) => {
      if (!dateString) return false; // Ensure it's not empty if required
      const dob = parseISO(dateString);
      return isValid(dob);
    }, "Invalid date format")
    .refine((dateString) => {
      const dob = parseISO(dateString);
      const today = new Date();
      const age = differenceInYears(today, dob);
      return age >= 18 && age <= 27;
    }, "You must be between 18 and 27 years old on the date of registration."),
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
 * Enhanced error handler with detailed logging and user-friendly messages
 */
const handleSubmissionError = (error: any, toast: any, formData: any) => {
  const timestamp = new Date().toISOString();
  const errorDetails = {
    timestamp,
    error: error,
    submittedData: formData,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  console.error('❌ REGISTRATION ERROR DETAILS:', errorDetails);
  
  let userMessage = 'Registration failed. Please try again.';
  let isRecoverable = true;
  let actionGuidance = '';
  
  if (error?.code === '23505') {
    // Unique constraint violation - check which field
    if (error.message.includes('email')) {
      userMessage = 'A registration already exists with this email address.';
      actionGuidance = 'Please contact support if you need to edit your existing registration.';
      isRecoverable = false;
    } else if (error.message.includes('individual_id')) {
      userMessage = 'You have already registered your team.';
      actionGuidance = 'Please contact support if you need to edit your registration, or proceed to the questionnaire if you haven\'t completed it yet.';
      isRecoverable = false;
    } else if (error.message.includes('team_name')) {
      userMessage = 'This team name is already taken.';
      actionGuidance = 'Please choose a different team name.';
      isRecoverable = true;
    }
  } else if (error?.code === '23514') {
    // Check constraint violation
    if (error.message.includes('gender')) {
      userMessage = 'Gender field contains an invalid value.';
      actionGuidance = 'Please select Male, Female, or Other for the gender field.';
    } else if (error.message.includes('email')) {
      userMessage = 'Email format is invalid.';
      actionGuidance = 'Please check your email address format.';
    } else if (error.message.includes('phone')) {
      userMessage = 'Phone number format is invalid.';
      actionGuidance = 'Please check your phone number format.';
    }
  } else if (error?.code === '23502') {
    // Not null constraint violation
    userMessage = 'Some required fields are missing.';
    actionGuidance = 'Please fill in all required fields and try again.';
  }
  
  // Log recurring errors
  const errorKey = `yff_registration_error_${error?.code || 'unknown'}`;
  const errorCount = parseInt(localStorage.getItem(errorKey) || '0') + 1;
  localStorage.setItem(errorKey, errorCount.toString());
  
  if (errorCount > 1) {
    console.warn('🚨 RECURRING ERROR DETECTED:', {
      errorCode: error?.code,
      count: errorCount,
      ...errorDetails
    });
  }
  
  toast({
    title: isRecoverable ? 'Registration Error' : 'Registration Not Allowed',
    description: actionGuidance ? `${userMessage} ${actionGuidance}` : userMessage,
    variant: 'destructive',
    duration: isRecoverable ? 5000 : 10000,
  });
  
  return { isRecoverable, actionGuidance };
};

/**
 * Check if user already has a registration
 */
const checkExistingRegistration = async (userId: string, email: string) => {
  try {
    console.log('🔍 Checking for existing registration...', { userId, email });
    
    const { data: existingReg, error } = await supabase
      .from('yff_team_registrations')
      .select('id, application_status, questionnaire_completed_at, email, individual_id')
      .or(`individual_id.eq.${userId},email.eq.${email}`)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error checking existing registration:', error);
      return { exists: false, error };
    }
    
    if (existingReg) {
      console.log('⚠️ Existing registration found:', existingReg);
      return { 
        exists: true, 
        registration: existingReg,
        canProceedToQuestionnaire: existingReg.application_status === 'registration_completed' && !existingReg.questionnaire_completed_at
      };
    }
    
    console.log('✅ No existing registration found');
    return { exists: false };
  } catch (error) {
    console.error('❌ Error in checkExistingRegistration:', error);
    return { exists: false, error };
  }
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
 * Enhanced form data sanitization with strict validation
 */
const sanitizeAndValidateFormData = (data: FormValues, userId: string) => {
  // Trim all string fields
  const sanitized = { ...data };
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitized[key].trim();
    }
  });
  
  // Validate required fields
  const requiredFields = [
    'fullName', 'email', 'phoneNumber', 'dateOfBirth', 'currentCity', 
    'state', 'pinCode', 'permanentAddress', 'gender', 'institutionName',
    'courseProgram', 'currentYearOfStudy', 'expectedGraduation'
  ];
  
  const missingFields = requiredFields.filter(field => !sanitized[field] || sanitized[field] === '');
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized.email)) {
    throw new Error('Invalid email format');
  }
  
  // Validate phone number (basic check)
  if (sanitized.phoneNumber.length < 8) {
    throw new Error('Phone number must be at least 8 digits');
  }
  
  // Validate graduation year
  const currentYear = new Date().getFullYear();
  const gradYear = parseInt(sanitized.expectedGraduation);
  if (gradYear < currentYear || gradYear > currentYear + 10) {
    throw new Error('Invalid graduation year');
  }
  
  return sanitizeFormData(sanitized, userId);
};

/**
 * YFF Team Registration Form Component with Enhanced Error Handling
 */
export const YffTeamRegistrationForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [showProfileCreation, setShowProfileCreation] = useState(false);
  const [dataRestored, setDataRestored] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [existingRegistration, setExistingRegistration] = useState<any>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const [fetchedPhoneNumber, setFetchedPhoneNumber] = useState('');
  const [fetchedDateOfBirth, setFetchedDateOfBirth] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: fetchedPhoneNumber || '',
      countryCode: '+91',
      dateOfBirth: fetchedDateOfBirth || '',
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

  // Fetch user's phone number from profile for auto-fill
  useEffect(() => {
    const fetchUserPhoneNumber = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('individuals')
            .select('phone_number')
            .eq('individual_id', user.id)
            .single();
          
          if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows found'
            console.error('Error fetching user phone number:', error);
          } else if (data?.phone_number) {
            setFetchedPhoneNumber(data.phone_number);
            form.setValue('phoneNumber', data.phone_number, { shouldValidate: true });
          }
        } catch (error) {
          console.error('Error fetching user phone number:', error);
        }
      }
    };
    
    fetchUserPhoneNumber();
  }, [user, form]);

  // Update form values when fetched data becomes available
  useEffect(() => {
    console.log('🔄 useEffect triggered - fetchedPhoneNumber:', fetchedPhoneNumber, 'fetchedDateOfBirth:', fetchedDateOfBirth);
    
    if (fetchedPhoneNumber && form.getValues('phoneNumber') !== fetchedPhoneNumber) {
      console.log('📱 Setting phone number in form:', fetchedPhoneNumber);
      form.setValue('phoneNumber', fetchedPhoneNumber, { shouldValidate: true });
    }
    if (fetchedDateOfBirth && form.getValues('dateOfBirth') !== fetchedDateOfBirth) {
      console.log('📅 Setting date of birth in form:', fetchedDateOfBirth);
      form.setValue('dateOfBirth', fetchedDateOfBirth, { shouldValidate: true });
    }
  }, [fetchedPhoneNumber, fetchedDateOfBirth, form]);

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

  // Enhanced data loading with duplicate checking
  useEffect(() => {
    const loadData = async () => {
      if (!user?.email) {
        setProfileError('User email not found. Please sign in again.');
        return;
      }

      try {
        console.log('🔍 Loading profile and checking for existing registration...', user.email);
        
        // Check for existing registration first
        const registrationCheck = await checkExistingRegistration(user.id, user.email);
        
        if (registrationCheck.error) {
          setProfileError('Could not verify registration status. Please try again.');
          return;
        }
        
        if (registrationCheck.exists) {
          setExistingRegistration(registrationCheck.registration);
          setShowDuplicateWarning(true);
          
          if (registrationCheck.canProceedToQuestionnaire) {
            toast({
              title: 'Registration Complete',
              description: 'You have already registered. Redirecting to questionnaire...',
              duration: 3000,
            });
            setTimeout(() => navigate('/yff/questionnaire'), 3000);
            return;
          }
        }
        
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
        console.log('📱 Phone number from profile:', individual.phone_number);
        console.log('📅 Date of birth from profile:', individual.date_of_birth);

        // Pre-fill form with profile data
        form.setValue('fullName', `${individual.first_name} ${individual.last_name}`);
        form.setValue('email', individual.email);
        form.setValue('countryCode', individual.country_code || '+91');
        
        // Set fetched phone number and date of birth from individual profile
        if (individual.phone_number) {
          setFetchedPhoneNumber(individual.phone_number);
          form.setValue('phoneNumber', individual.phone_number, { shouldValidate: true });
        }
        if (individual.date_of_birth) {
          setFetchedDateOfBirth(individual.date_of_birth);
          form.setValue('dateOfBirth', individual.date_of_birth, { shouldValidate: true });
        }

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
  }, [user, form, loadSavedData, toast, navigate]);

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

    // Prevent double submission
    if (isSubmitting) {
      console.warn('🚫 Double submission prevented');
      return;
    }

    setIsSubmitting(true);
    setSubmitAttempts(prev => prev + 1);
    setValidationErrors([]);
    setFieldErrors({});

    try {
      console.log('🚀 Starting registration submission...', {
        attempt: submitAttempts + 1,
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString()
      });

      // Double-check for existing registration
      const registrationCheck = await checkExistingRegistration(user.id, user.email);
      
      if (registrationCheck.exists) {
        const { isRecoverable } = handleSubmissionError(
          { code: '23505', message: 'Registration already exists' },
          toast,
          data
        );
        
        if (!isRecoverable && registrationCheck.canProceedToQuestionnaire) {
          navigate('/yff/questionnaire');
        }
        return;
      }

      // Validate and sanitize form data
      const validation = validateFormData(data);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setFieldErrors(validation.fieldErrors);
        
        toast({
          title: 'Validation Failed',
          description: 'Please fix the form errors and try again.',
          variant: 'destructive',
        });
        return;
      }

      const submissionData = sanitizeAndValidateFormData(data, user.id);
      
      console.log('📤 Submitting registration data:', {
        userId: user.id,
        email: submissionData.email,
        teamName: submissionData.team_name,
        timestamp: new Date().toISOString()
      });

      const { error } = await supabase
        .from('yff_team_registrations')
        .insert(submissionData);

      if (error) {
        handleSubmissionError(error, toast, submissionData);
        return;
      }

      console.log('✅ Registration submitted successfully');
      
      // Save phone number to user's profile for future auto-fill
      if (user?.id && data.phoneNumber) {
        try {
          const { error: profileError } = await supabase
            .from('individuals')
            .update({ phone_number: data.phoneNumber })
            .eq('individual_id', user.id);
          
          if (profileError) {
            console.error('❌ Failed to update user profile phone number:', profileError);
            // Don't block registration, just log the error
          } else {
            console.log('✅ User profile phone number updated/saved.');
          }
        } catch (error) {
          console.error('❌ Error updating user profile phone number:', error);
        }
      }
      
      // Clear autosaved data after successful submission
      await clearSavedData();
      
      // Clear error counters
      localStorage.removeItem('yff_registration_error_23505');
      localStorage.removeItem('yff_registration_error_23514');
      localStorage.removeItem('yff_registration_error_23502');

      toast({
        title: 'Success!',
        description: 'Your team registration has been submitted successfully.',
      });

      // Reset form and states
      form.reset();
      setDataRestored(false);
      setValidationErrors([]);
      setFieldErrors({});
      setSubmitAttempts(0);
      
      // Redirect to questionnaire
      navigate('/yff/questionnaire');
      
    } catch (error) {
      console.error('❌ Unexpected error during submission:', error);
      handleSubmissionError(error, toast, data);
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

  // Show duplicate warning if registration exists
  if (showDuplicateWarning && existingRegistration) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registration Already Exists
          </h1>
          <p className="text-gray-600">
            You have already registered for the YFF program.
          </p>
        </div>

        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="font-semibold mb-2">Registration Found</div>
            <div className="text-sm space-y-1">
              <p>Email: <strong>{existingRegistration.email}</strong></p>
              <p>Status: <strong>{existingRegistration.application_status}</strong></p>
              {existingRegistration.questionnaire_completed_at ? (
                <p>Questionnaire: <strong>Completed</strong></p>
              ) : (
                <p>Questionnaire: <strong>Pending</strong></p>
              )}
            </div>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">What you can do:</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              {!existingRegistration.questionnaire_completed_at && (
                <li>• Complete your application by filling out the questionnaire</li>
              )}
              <li>• Contact support if you need to edit your registration</li>
              <li>• Return to the homepage to explore other programs</li>
            </ul>
          </div>

          <div className="flex gap-4">
            {!existingRegistration.questionnaire_completed_at && (
              <Button onClick={() => navigate('/yff/questionnaire')} className="flex-1">
                Complete Questionnaire
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/')}>
              Go to Homepage
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

      {/* Show submission attempts warning */}
      {submitAttempts > 0 && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="font-semibold mb-1">Submission Attempt #{submitAttempts + 1}</div>
            <div className="text-sm">
              Your form data is automatically saved. If you encounter issues, please refresh the page.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Show restoration success message */}
      {dataRestored && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your previous form progress has been restored. All your data is automatically saved as you type.
          </AlertDescription>
        </Alert>
      )}

      {/* Show validation errors with field-specific details */}
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
            {Object.keys(fieldErrors).length > 0 && (
              <div className="mt-3 p-3 bg-red-100 rounded">
                <div className="font-medium text-sm mb-1">Field-specific errors:</div>
                <ul className="text-xs space-y-1">
                  {Object.entries(fieldErrors).map(([field, error]) => (
                    <li key={field}><strong>{field}:</strong> {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <YffRegistrationFormSections form={form} />
          
          <div className="flex justify-end pt-6">
            <Button 
              type="submit" 
              disabled={isSubmitting || submitAttempts >= 3}
              className="min-w-32"
            >
              {isSubmitting ? 'Submitting...' : 
               submitAttempts >= 3 ? 'Too Many Attempts' : 
               'Submit Registration'}
            </Button>
          </div>
        </form>
      </Form>

      <YffAutosaveIndicator status={autosaveStatus} />
    </div>
  );
};
