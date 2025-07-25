
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { InferType } from 'yup';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import countryList from 'react-select-country-list';
import { YffAutosaveIndicator } from '@/components/forms/YffAutosaveIndicator';
import { useAutosave } from '@/hooks/useAutosave';
import { AutosaveTeamMember, extractTeamMembers } from '@/types/autosave';

// Team member type with validation
type TeamMember = {
  name: string;
  email: string;
  linkedin?: string;
};

// IMPORTANT: All .required() calls must provide a message, or Yup will infer the field as optional in TypeScript.
const yffRegistrationSchema = yup.object({
  fullName: yup.string().required('Full name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  phoneNumber: yup.string().required('Phone number is required'),
  countryCode: yup.string().required('Country code is required'),
  dateOfBirth: yup.date().required('Date of birth is required'),
  currentCity: yup.string().required('Current city is required'),
  state: yup.string().required('State is required'),
  pinCode: yup.string().required('PIN code is required'),
  permanentAddress: yup.string().required('Permanent address is required'),
  gender: yup.string().required('Gender is required').oneOf(['male', 'female', 'other'], 'Gender must be male, female, or other'),
  institutionName: yup.string().required('Institution name is required'),
  courseProgram: yup.string().required('Course/Program is required'),
  currentYearOfStudy: yup.string().required('Current year of study is required'),
  expectedGraduation: yup.date().required('Expected graduation date is required'),
  numberOfTeamMembers: yup.number().required('Number of team members is required').min(1, 'Must have at least 1 team member').max(4, 'Maximum 4 team members allowed'),
  ventureName: yup.string().required('Venture name is required'),
  industrySector: yup.string().required('Industry sector is required'),
  teamName: yup.string().required('Team name is required'),
  website: yup.string().required('Website is required'),
  linkedinProfile: yup.string().required('LinkedIn profile is required'),
  socialMediaHandles: yup.string().required('Social media handles is required'),
  referralId: yup.string().required('Referral ID is required'),
}).required();

// Generate TypeScript type from Yup schema
type YffRegistrationFormData = InferType<typeof yffRegistrationSchema>;

type CountryOption = {
  label: string;
  value: string;
};

/**
 * Convert AutosaveTeamMember to TeamMember format
 */
const convertAutosaveToTeamMember = (autosaveMember: AutosaveTeamMember): TeamMember => ({
  name: autosaveMember.fullName || '',
  email: autosaveMember.email || '',
  linkedin: autosaveMember.linkedinProfile || '',
});

/**
 * Convert TeamMember to AutosaveTeamMember format for saving
 */
const convertTeamMemberToAutosave = (teamMember: TeamMember): AutosaveTeamMember => ({
  fullName: teamMember.name,
  email: teamMember.email,
  linkedinProfile: teamMember.linkedin || '',
});

/**
 * Enhanced YFF Team Registration Form with auto-resume and profile data integration
 */
export const YffTeamRegistrationForm = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  
  // Auto-fill profile data from user profile
  const getAutoFilledDefaults = useCallback(() => {
    const firstName = userProfile?.first_name || '';
    const lastName = userProfile?.last_name || '';
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : '';
    
    return {
      fullName: fullName,
      email: userProfile?.email || '',
      phoneNumber: '',
      countryCode: userProfile?.country_code || '+91',
      dateOfBirth: new Date(),
      currentCity: '',
      state: '',
      pinCode: '',
      permanentAddress: '',
      gender: 'other' as const,
      institutionName: '',
      courseProgram: '',
      currentYearOfStudy: '',
      expectedGraduation: new Date(),
      numberOfTeamMembers: 1,
      ventureName: '',
      industrySector: '',
      teamName: '',
      website: '',
      linkedinProfile: '',
      socialMediaHandles: '',
      referralId: '',
    };
  }, [userProfile]);

  // Initialize react-hook-form
  const methods = useForm<YffRegistrationFormData>({
    resolver: yupResolver(yffRegistrationSchema),
    defaultValues: getAutoFilledDefaults(),
    mode: 'onBlur',
  });

  const {
    handleSubmit,
    register,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = methods;

  // Watch numberOfTeamMembers for dynamic field generation
  const numberOfTeamMembers = watch('numberOfTeamMembers');

  // Prepare form data for autosave with team members
  const getFormDataForAutosave = useCallback(() => {
    const formData = getValues();
    return {
      ...formData,
      teamMembers: teamMembers.map(convertTeamMemberToAutosave),
    };
  }, [getValues, teamMembers]);

  // Autosave setup
  const { status: autosaveStatus, loadSavedData } = useAutosave({
    formData: getFormDataForAutosave(),
    formType: 'yff_team_registration',
  });

  // Load countries on mount
  useEffect(() => {
    const countries = countryList();
    const countryOptions = countries.getData().map((country) => ({
      label: country.label,
      value: country.value,
    }));
    setCountries(countryOptions);
  }, []);

  // Auto-fill profile data on mount and when userProfile changes
  useEffect(() => {
    if (userProfile && !hasAutoFilled) {
      const autoFilledData = getAutoFilledDefaults();
      
      // Only auto-fill if the fields are currently empty
      const currentValues = getValues();
      Object.entries(autoFilledData).forEach(([key, value]) => {
        if (value && (!currentValues[key] || currentValues[key] === '')) {
          setValue(key as keyof YffRegistrationFormData, value);
        }
      });
      
      setHasAutoFilled(true);
      console.log('✅ Auto-filled profile data:', {
        fullName: autoFilledData.fullName,
        email: autoFilledData.email,
        countryCode: autoFilledData.countryCode
      });
    }
  }, [userProfile, hasAutoFilled, getAutoFilledDefaults, getValues, setValue]);

  // Auto-resume saved draft
  useEffect(() => {
    if (user?.id && !hasAutoFilled) {
      const loadDraft = async () => {
        const savedData = await loadSavedData();
        if (savedData) {
          console.log('🔄 Auto-resuming form from saved draft');
          Object.entries(savedData).forEach(([key, value]) => {
            if (value !== undefined && value !== null && key !== 'teamMembers') {
              setValue(key as keyof YffRegistrationFormData, value);
            }
          });
          
          // Handle team members with type conversion
          if (savedData.teamMembers && Array.isArray(savedData.teamMembers)) {
            const convertedTeamMembers = savedData.teamMembers.map(convertAutosaveToTeamMember);
            setTeamMembers(convertedTeamMembers);
          }
          
          toast.success('Form progress restored', {
            description: 'Your previous work has been recovered'
          });
        }
      };
      
      loadDraft();
    }
  }, [user?.id, hasAutoFilled, loadSavedData, setValue]);

  // Dynamic team member fields based on numberOfTeamMembers
  useEffect(() => {
    const memberCount = Math.max(1, Math.min(4, numberOfTeamMembers || 1));
    
    setTeamMembers(prevMembers => {
      const newMembers = [...prevMembers];
      
      // Add missing team member slots
      while (newMembers.length < memberCount - 1) { // -1 because leader is separate
        newMembers.push({ name: '', email: '', linkedin: '' });
      }
      
      // Remove excess team member slots
      while (newMembers.length > memberCount - 1) {
        newMembers.pop();
      }
      
      console.log(`📊 Updated team members: ${memberCount} total (${newMembers.length} additional members)`);
      return newMembers;
    });
  }, [numberOfTeamMembers]);

  // Team member management functions
  const updateTeamMember = useCallback((index: number, field: keyof TeamMember, value: string) => {
    setTeamMembers(prevMembers => {
      const newMembers = [...prevMembers];
      if (newMembers[index]) {
        newMembers[index][field] = value;
      }
      return newMembers;
    });
  }, []);

  // Convert team members to format expected by database
  const convertTeamMembersForDatabase = (members: TeamMember[]) => {
    return members.map(member => ({
      fullName: member.name,
      email: member.email,
      linkedinProfile: member.linkedin || '',
    }));
  };

  // Form submission with validation
  const onSubmit = async (data: YffRegistrationFormData) => {
    if (!user) {
      console.error("❌ User not authenticated");
      toast.error("Authentication Error", {
        description: "You must be signed in to submit this form",
      });
      return;
    }

    setIsSubmitting(true);
    console.log("📝 Submitting enhanced YFF registration:", { 
      userId: user.id, 
      dataKeys: Object.keys(data),
      teamMemberCount: teamMembers.length 
    });

    try {
      // Check for existing registration
      const { data: existingRegistration, error: checkError } = await supabase
        .from('yff_team_registrations')
        .select('id')
        .eq('individual_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error("❌ Error checking existing registration:", checkError);
        toast.error("Database Error", {
          description: "Failed to check existing registration. Please try again.",
        });
        return;
      }

      // Format dates properly
      const formatDateForDatabase = (date: Date): string => {
        return date instanceof Date ? date.toISOString().split('T')[0] : '';
      };

      // Prepare registration data
      const registrationData = {
        individual_id: user.id,
        full_name: data.fullName,
        email: data.email,
        phone_number: data.phoneNumber,
        country_code: data.countryCode,
        date_of_birth: formatDateForDatabase(data.dateOfBirth),
        current_city: data.currentCity,
        state: data.state,
        pin_code: data.pinCode,
        permanent_address: data.permanentAddress,
        gender: data.gender,
        institution_name: data.institutionName,
        course_program: data.courseProgram,
        current_year_of_study: data.currentYearOfStudy,
        expected_graduation: formatDateForDatabase(data.expectedGraduation),
        number_of_team_members: data.numberOfTeamMembers,
        team_members: convertTeamMembersForDatabase(teamMembers),
        venture_name: data.ventureName,
        industry_sector: data.industrySector,
        team_name: data.teamName,
        website: data.website,
        linkedin_profile: data.linkedinProfile,
        social_media_handles: data.socialMediaHandles,
        referral_id: data.referralId,
        application_status: 'registration_completed',
        updated_at: new Date().toISOString(),
      };

      let result;
      if (existingRegistration) {
        result = await supabase
          .from('yff_team_registrations')
          .update(registrationData)
          .eq('individual_id', user.id);
      } else {
        result = await supabase
          .from('yff_team_registrations')
          .insert(registrationData);
      }

      if (result.error) {
        console.error("❌ Error saving registration:", result.error);
        toast.error("Submission Error", {
          description: "Failed to save your registration. Please try again.",
        });
        return;
      }

      // Clear autosave data on successful submission
      await supabase
        .from('yff_team_registration_autosave')
        .delete()
        .eq('individual_id', user.id);

      console.log("✅ Registration submitted successfully - redirecting to questionnaire");
      
      toast.success("Registration Submitted!", {
        description: "Your team registration has been saved. Redirecting to questionnaire...",
      });

      // Redirect to questionnaire
      setTimeout(() => {
        navigate('/yff/questionnaire');
      }, 1500);

    } catch (error) {
      console.error("❌ Error submitting form:", error);
      toast.error("Submission Error", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          YFF Team Registration
        </h1>
        <p className="text-gray-600">
          Complete your team registration for the Young Founders Floor program
        </p>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Personal Information */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  {...register('fullName')}
                />
                {errors.fullName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.fullName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  placeholder="Enter your phone number"
                  {...register('phoneNumber')}
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="countryCode">Country Code</Label>
                <Select
                  onValueChange={(value) => setValue('countryCode', value)}
                  defaultValue={getValues('countryCode')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.countryCode && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.countryCode.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <DatePicker
                  selected={getValues('dateOfBirth')}
                  onSelect={(date) => setValue('dateOfBirth', date || new Date())}
                />
                {errors.dateOfBirth && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.dateOfBirth.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  onValueChange={(value) => setValue('gender', value as 'male' | 'female' | 'other')}
                  defaultValue={getValues('gender')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.gender.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Address Information */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Address Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentCity">Current City</Label>
                <Input
                  id="currentCity"
                  placeholder="Enter your current city"
                  {...register('currentCity')}
                />
                {errors.currentCity && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.currentCity.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="Enter your state"
                  {...register('state')}
                />
                {errors.state && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.state.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="pinCode">PIN Code</Label>
                <Input
                  id="pinCode"
                  placeholder="Enter your PIN code"
                  {...register('pinCode')}
                />
                {errors.pinCode && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.pinCode.message}
                  </p>
                )}
              </div>
              <div className="col-span-full">
                <Label htmlFor="permanentAddress">Permanent Address</Label>
                <Textarea
                  id="permanentAddress"
                  placeholder="Enter your permanent address"
                  {...register('permanentAddress')}
                />
                {errors.permanentAddress && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.permanentAddress.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Educational Information */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Educational Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="institutionName">Institution Name</Label>
                <Input
                  id="institutionName"
                  placeholder="Enter your institution name"
                  {...register('institutionName')}
                />
                {errors.institutionName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.institutionName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="courseProgram">Course/Program</Label>
                <Input
                  id="courseProgram"
                  placeholder="Enter your course/program"
                  {...register('courseProgram')}
                />
                {errors.courseProgram && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.courseProgram.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="currentYearOfStudy">Current Year of Study</Label>
                <Input
                  id="currentYearOfStudy"
                  placeholder="Enter your current year of study"
                  {...register('currentYearOfStudy')}
                />
                {errors.currentYearOfStudy && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.currentYearOfStudy.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="expectedGraduation">Expected Graduation Date</Label>
                <DatePicker
                  id="expectedGraduation"
                  onSelect={(date) => setValue('expectedGraduation', date || new Date())}
                  selected={getValues('expectedGraduation')}
                />
                {errors.expectedGraduation && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.expectedGraduation.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Enhanced Team Information with Dynamic Fields */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Team Information
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="numberOfTeamMembers">Number of Team Members (Max 4)</Label>
                <Select
                  onValueChange={(value) => setValue('numberOfTeamMembers', parseInt(value))}
                  defaultValue={getValues('numberOfTeamMembers').toString()}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select number of team members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 (Solo)</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                  </SelectContent>
                </Select>
                {errors.numberOfTeamMembers && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.numberOfTeamMembers.message}
                  </p>
                )}
              </div>

              {/* Dynamic Team Member Fields */}
              {teamMembers.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Additional Team Members
                  </h3>
                  {teamMembers.map((member, index) => (
                    <div key={index} className="border rounded-lg p-4 mb-4 bg-gray-50">
                      <h4 className="font-medium text-gray-800 mb-3">
                        Team Member {index + 2}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`teamMember-${index}-name`}>Full Name</Label>
                          <Input
                            id={`teamMember-${index}-name`}
                            placeholder="Enter team member name"
                            value={member.name}
                            onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`teamMember-${index}-email`}>Email</Label>
                          <Input
                            id={`teamMember-${index}-email`}
                            type="email"
                            placeholder="Enter team member email"
                            value={member.email}
                            onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                          />
                        </div>
                        <div className="col-span-full">
                          <Label htmlFor={`teamMember-${index}-linkedin`}>LinkedIn (Optional)</Label>
                          <Input
                            id={`teamMember-${index}-linkedin`}
                            placeholder="Enter LinkedIn profile URL"
                            value={member.linkedin || ''}
                            onChange={(e) => updateTeamMember(index, 'linkedin', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Venture Information */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Venture Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ventureName">Venture Name</Label>
                <Input
                  id="ventureName"
                  placeholder="Enter your venture name"
                  {...register('ventureName')}
                />
                {errors.ventureName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.ventureName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="industrySector">Industry Sector</Label>
                <Input
                  id="industrySector"
                  placeholder="Enter your industry sector"
                  {...register('industrySector')}
                />
                {errors.industrySector && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.industrySector.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  placeholder="Enter your team name"
                  {...register('teamName')}
                />
                {errors.teamName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.teamName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="Enter your website URL"
                  {...register('website')}
                />
                {errors.website && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.website.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="linkedinProfile">LinkedIn Profile</Label>
                <Input
                  id="linkedinProfile"
                  type="url"
                  placeholder="Enter your LinkedIn profile URL"
                  {...register('linkedinProfile')}
                />
                {errors.linkedinProfile && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.linkedinProfile.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="socialMediaHandles">Social Media Handles</Label>
                <Input
                  id="socialMediaHandles"
                  placeholder="Enter your social media handles"
                  {...register('socialMediaHandles')}
                />
                {errors.socialMediaHandles && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.socialMediaHandles.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Referral Information */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Referral Information
            </h2>
            <div>
              <Label htmlFor="referralId">Referral ID</Label>
              <Input
                id="referralId"
                placeholder="Enter referral ID"
                {...register('referralId')}
              />
              {errors.referralId && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.referralId.message}
                </p>
              )}
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Registration"}
            </Button>
          </div>
        </form>
      </FormProvider>

      {/* Enhanced Autosave Status */}
      <YffAutosaveIndicator status={autosaveStatus} />
    </div>
  );
};
