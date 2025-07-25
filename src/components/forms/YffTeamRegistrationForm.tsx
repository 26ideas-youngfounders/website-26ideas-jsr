
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
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

// Define types for form data and team members
type TeamMember = {
  name: string;
  email: string;
  linkedin?: string;
};

/**
 * YFF Registration Form Data Interface
 * ALL FIELDS ARE REQUIRED - keep in sync with schema and defaults
 */
type YffRegistrationFormData = {
  fullName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  dateOfBirth: Date;
  currentCity: string;
  state: string;
  pinCode: string;
  permanentAddress: string;
  gender: 'male' | 'female' | 'other';
  institutionName: string;
  courseProgram: string;
  currentYearOfStudy: string;
  expectedGraduation: Date;
  numberOfTeamMembers: number;
  ventureName: string;
  industrySector: string;
  teamName: string;
  website: string;
  linkedinProfile: string;
  socialMediaHandles: string;
  referralId: string;
};

export type YffRegistration = YffRegistrationFormData & {
  teamMembers: TeamMember[];
};

/**
 * Yup schema - STRICTLY ALIGNED with YffRegistrationFormData interface
 * All fields must be defined as required with proper error messages to match the interface exactly
 */
const schema: yup.ObjectSchema<YffRegistrationFormData> = yup.object().shape({
  fullName: yup.string().required('Full name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  phoneNumber: yup.string().required('Phone number is required'),
  countryCode: yup.string().required('Country code is required'),
  dateOfBirth: yup.date().required('Date of birth is required'),
  currentCity: yup.string().required('Current city is required'),
  state: yup.string().required('State is required'),
  pinCode: yup.string().required('PIN code is required'),
  permanentAddress: yup.string().required('Permanent address is required'),
  gender: yup.string().required('Gender is required').oneOf(['male', 'female', 'other']),
  institutionName: yup.string().required('Institution name is required'),
  courseProgram: yup.string().required('Course/Program is required'),
  currentYearOfStudy: yup.string().required('Current year of study is required'),
  expectedGraduation: yup.date().required('Expected graduation date is required'),
  numberOfTeamMembers: yup.number().required('Number of team members is required').min(1, 'Must have at least 1 team member'),
  // Venture fields - required as strings but can be empty for optional sections
  ventureName: yup.string().required('Venture name is required'),
  industrySector: yup.string().required('Industry sector is required'),
  teamName: yup.string().required('Team name is required'),
  website: yup.string().required('Website is required'),
  linkedinProfile: yup.string().required('LinkedIn profile is required'),
  socialMediaHandles: yup.string().required('Social media handles is required'),
  referralId: yup.string().required('Referral ID is required'),
});

// Type for country options
type CountryOption = {
  label: string;
  value: string;
};

/**
 * Validate registration data against the schema
 * @param {YffRegistrationFormData} data - The registration data to validate
 * @returns {{ isValid: boolean; errors: string[] }} - An object containing the validation result and any errors
 */
const validateRegistrationData = (data: YffRegistrationFormData): { isValid: boolean; errors: string[] } => {
  try {
    schema.validateSync(data, { abortEarly: false });
    return { isValid: true, errors: [] };
  } catch (error: any) {
    const errors = error.inner.map((err: yup.ValidationError) => err.message);
    return { isValid: false, errors: errors };
  }
};

/**
 * Convert Date to ISO string for database storage
 */
const formatDateForDatabase = (date: Date): string => {
  return date instanceof Date ? date.toISOString().split('T')[0] : '';
};

/**
 * YFF Team Registration Form Component
 * 
 * Enhanced with automatic redirect to questionnaire after successful submission
 */
export const YffTeamRegistrationForm = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  
  // Initialize react-hook-form methods with proper typing and ALL required defaults
  const methods = useForm<YffRegistrationFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      // All required fields must have default values
      fullName: userProfile?.first_name + ' ' + userProfile?.last_name || '',
      email: userProfile?.email || '',
      phoneNumber: '',
      countryCode: userProfile?.country_code || '+91',
      dateOfBirth: new Date(),
      currentCity: '',
      state: '',
      pinCode: '',
      permanentAddress: '',
      gender: 'other',
      institutionName: '',
      courseProgram: '',
      currentYearOfStudy: '',
      expectedGraduation: new Date(),
      numberOfTeamMembers: 1,
      // Optional venture fields - but required as strings
      ventureName: '',
      industrySector: '',
      teamName: '',
      website: '',
      linkedinProfile: '',
      socialMediaHandles: '',
      referralId: '',
    },
    mode: 'onBlur',
  });

  const {
    handleSubmit,
    register,
    setValue,
    getValues,
    formState: { errors },
  } = methods;

  // Autosave setup with proper props
  const { status: autosaveStatus } = useAutosave({
    formData: getValues(),
    formType: 'yff_team_registration',
  });

  // Load countries on component mount
  useEffect(() => {
    const countries = countryList();
    const countryOptions = countries.getData().map((country) => ({
      label: country.label,
      value: country.value,
    }));
    setCountries(countryOptions);
  }, []);

  /**
   * Handle form submission with automatic redirect to questionnaire
   */
  const onSubmit = async (data: YffRegistrationFormData) => {
    if (!user) {
      console.error("❌ User not authenticated");
      toast.error("Authentication Error", {
        description: "You must be signed in to submit this form",
      });
      return;
    }

    setIsSubmitting(true);
    console.log("📝 Submitting YFF team registration form:", { userId: user.id, dataKeys: Object.keys(data) });

    try {
      // Validate required fields
      const validationResult = validateRegistrationData(data);
      if (!validationResult.isValid) {
        console.error("❌ Form validation failed:", validationResult.errors);
        toast.error("Validation Error", {
          description: validationResult.errors[0] || "Please check your form data",
        });
        return;
      }

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

      // Prepare registration data with proper date formatting
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
        team_members: teamMembers,
        venture_name: data.ventureName || null,
        industry_sector: data.industrySector || null,
        team_name: data.teamName || null,
        website: data.website || null,
        linkedin_profile: data.linkedinProfile || null,
        social_media_handles: data.socialMediaHandles || null,
        referral_id: data.referralId || null,
        application_status: 'registration_completed',
        updated_at: new Date().toISOString(),
      };

      let result;
      if (existingRegistration) {
        // Update existing registration
        result = await supabase
          .from('yff_team_registrations')
          .update(registrationData)
          .eq('individual_id', user.id);
      } else {
        // Insert new registration
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
      
      // Show success message
      toast.success("Registration Submitted!", {
        description: "Your team registration has been saved. Redirecting to questionnaire...",
      });

      // Automatic redirect to questionnaire after successful submission
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

  // Add team member
  const addTeamMember = useCallback(() => {
    setTeamMembers((prevMembers) => [
      ...prevMembers,
      { name: '', email: '', linkedin: '' },
    ]);
  }, []);

  // Update team member
  const updateTeamMember = useCallback(
    (index: number, field: string, value: string) => {
      setTeamMembers((prevMembers) => {
        const newMembers = [...prevMembers];
        newMembers[index][field] = value;
        return newMembers;
      });
    },
    []
  );

  // Delete team member
  const deleteTeamMember = useCallback(
    (index: number) => {
      setTeamMembers((prevMembers) => {
        const newMembers = [...prevMembers];
        newMembers.splice(index, 1);
        return newMembers;
      });
    },
    []
  );

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

          {/* Team Information */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Team Information
            </h2>
            <div>
              <Label htmlFor="numberOfTeamMembers">Number of Team Members</Label>
              <Input
                id="numberOfTeamMembers"
                type="number"
                placeholder="Enter the number of team members"
                {...register('numberOfTeamMembers', { valueAsNumber: true })}
              />
              {errors.numberOfTeamMembers && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.numberOfTeamMembers.message}
                </p>
              )}
            </div>

            {/* Team Members List */}
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Team Members
              </h3>
              {teamMembers.map((member, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"
                >
                  <div>
                    <Label htmlFor={`teamMemberName-${index}`}>Name</Label>
                    <Input
                      id={`teamMemberName-${index}`}
                      placeholder="Enter team member name"
                      value={member.name}
                      onChange={(e) =>
                        updateTeamMember(index, 'name', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`teamMemberEmail-${index}`}>Email</Label>
                    <Input
                      id={`teamMemberEmail-${index}`}
                      type="email"
                      placeholder="Enter team member email"
                      value={member.email}
                      onChange={(e) =>
                        updateTeamMember(index, 'email', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`teamMemberLinkedIn-${index}`}>
                      LinkedIn (Optional)
                    </Label>
                    <Input
                      id={`teamMemberLinkedIn-${index}`}
                      placeholder="Enter LinkedIn profile URL"
                      value={member.linkedin || ''}
                      onChange={(e) =>
                        updateTeamMember(index, 'linkedin', e.target.value)
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteTeamMember(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={addTeamMember}>
                Add Team Member
              </Button>
            </div>
          </section>

          {/* Venture Information (Optional) */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Venture Information (Optional)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ventureName">Venture Name</Label>
                <Input
                  id="ventureName"
                  placeholder="Enter your venture name"
                  {...register('ventureName')}
                />
              </div>
              <div>
                <Label htmlFor="industrySector">Industry Sector</Label>
                <Input
                  id="industrySector"
                  placeholder="Enter your industry sector"
                  {...register('industrySector')}
                />
              </div>
              <div>
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  placeholder="Enter your team name"
                  {...register('teamName')}
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="Enter your website URL"
                  {...register('website')}
                />
              </div>
              <div>
                <Label htmlFor="linkedinProfile">LinkedIn Profile</Label>
                <Input
                  id="linkedinProfile"
                  type="url"
                  placeholder="Enter your LinkedIn profile URL"
                  {...register('linkedinProfile')}
                />
              </div>
              <div>
                <Label htmlFor="socialMediaHandles">
                  Social Media Handles
                </Label>
                <Input
                  id="socialMediaHandles"
                  placeholder="Enter your social media handles"
                  {...register('socialMediaHandles')}
                />
              </div>
            </div>
          </section>

          {/* Referral Information (Optional) */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Referral Information (Optional)
            </h2>
            <div>
              <Label htmlFor="referralId">Referral ID</Label>
              <Input
                id="referralId"
                placeholder="Enter referral ID"
                {...register('referralId')}
              />
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

      {/* Autosave Status */}
      <YffAutosaveIndicator status={autosaveStatus} />
    </div>
  );
};
