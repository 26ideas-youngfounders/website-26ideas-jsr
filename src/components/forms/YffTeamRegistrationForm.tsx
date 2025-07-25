
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhoneInput } from '@/components/ui/phone-input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, GraduationCap, MapPin, Users, AlertCircle } from 'lucide-react';

// Enhanced form validation schema with better error messages
const teamRegistrationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100, "Full name is too long"),
  email: z.string().email("Please enter a valid email address"),
  linkedinProfile: z.string().optional().refine((val) => !val || /^https?:\/\/(www\.)?linkedin\.com\/in\//.test(val), {
    message: "Please enter a valid LinkedIn profile URL (https://linkedin.com/in/...)"
  }),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number is too long"),
  dateOfBirth: z.date({ required_error: "Date of birth is required" }),
  socialMediaHandles: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"], { required_error: "Please select your gender" }),
  institutionName: z.string().min(2, "Institution name is required").max(200, "Institution name is too long"),
  courseProgram: z.string().min(2, "Course/Program is required").max(200, "Course/Program is too long"),
  currentYearOfStudy: z.string().min(1, "Current year of study is required"),
  expectedGraduation: z.string().min(4, "Expected graduation year is required").max(50, "Expected graduation is too long"),
  currentCity: z.string().min(2, "Current city is required").max(100, "Current city is too long"),
  state: z.string().min(2, "State is required").max(100, "State is too long"),
  pinCode: z.string().min(6, "PIN code must be at least 6 digits").max(6, "PIN code must be exactly 6 digits").regex(/^\d{6}$/, "PIN code must contain only numbers"),
  permanentAddress: z.string().min(10, "Permanent address is required").max(500, "Permanent address is too long"),
});

type TeamRegistrationData = z.infer<typeof teamRegistrationSchema>;

/**
 * YFF Team Registration Form component
 * Handles team leader registration with comprehensive validation and error handling
 */
export const YffTeamRegistrationForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingRegistration, setHasExistingRegistration] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [countryIsoCode, setCountryIsoCode] = useState("IN");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log("📄 YFF Team Registration form loaded - scrolled to top");
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    clearErrors,
    setError,
  } = useForm<TeamRegistrationData>({
    resolver: zodResolver(teamRegistrationSchema),
    defaultValues: {
      email: user?.email || "",
      gender: "Male",
      currentYearOfStudy: "1st Year",
    },
  });

  // Check for existing registration on component mount
  React.useEffect(() => {
    const checkExistingRegistration = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('yff_team_registrations')
          .select('*')
          .eq('individual_id', user.id)
          .maybeSingle();

        if (data && !error) {
          setHasExistingRegistration(true);
          console.log("✅ Existing registration found:", data);
        }
      } catch (error) {
        console.log("📝 No existing registration found, user can register");
      }
    };

    checkExistingRegistration();
  }, [user]);

  const handleCountryChange = (newCountryCode: string, newIsoCode: string) => {
    setCountryCode(newCountryCode);
    setCountryIsoCode(newIsoCode);
    console.log("📱 Country selection changed:", { countryCode: newCountryCode, isoCode: newIsoCode });
  };

  /**
   * Creates or updates individual profile in the database
   */
  const ensureIndividualExists = async () => {
    if (!user) return false;

    try {
      // Check if individual exists
      const { data: existingIndividual, error: checkError } = await supabase
        .from('individuals')
        .select('*')
        .eq('individual_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error("❌ Error checking individual:", checkError);
        return false;
      }

      if (existingIndividual) {
        console.log("✅ Individual profile already exists");
        return true;
      }

      // Create individual profile
      const { error: insertError } = await supabase
        .from('individuals')
        .insert([{
          individual_id: user.id,
          email: user.email || "",
          first_name: user.user_metadata?.first_name || "",
          last_name: user.user_metadata?.last_name || "",
          is_active: true,
          email_verified: user.email_confirmed_at ? true : false,
          privacy_consent: true,
          data_processing_consent: true,
        }]);

      if (insertError) {
        console.error("❌ Error creating individual:", insertError);
        return false;
      }

      console.log("✅ Individual profile created successfully");
      return true;
    } catch (error) {
      console.error("❌ Unexpected error in ensureIndividualExists:", error);
      return false;
    }
  };

  /**
   * Handles form submission with enhanced error handling
   */
  const onSubmit = async (data: TeamRegistrationData) => {
    if (!user) {
      const errorMsg = "You must be signed in to register. Please sign in and try again.";
      setSubmitError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (hasExistingRegistration) {
      const errorMsg = "You have already registered for this program. Multiple registrations are not allowed.";
      setSubmitError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Ensure individual profile exists before registering
      const individualCreated = await ensureIndividualExists();
      if (!individualCreated) {
        throw new Error("Failed to create or verify individual profile");
      }

      const registrationData = {
        individual_id: user.id,
        full_name: data.fullName.trim(),
        email: data.email.trim(),
        linkedin_profile: data.linkedinProfile?.trim() || null,
        phone_number: data.phoneNumber.trim(),
        country_code: countryCode,
        date_of_birth: data.dateOfBirth.toISOString().split('T')[0],
        social_media_handles: data.socialMediaHandles?.trim() || null,
        gender: data.gender,
        institution_name: data.institutionName.trim(),
        course_program: data.courseProgram.trim(),
        current_year_of_study: data.currentYearOfStudy,
        expected_graduation: data.expectedGraduation.trim(),
        current_city: data.currentCity.trim(),
        state: data.state.trim(),
        pin_code: data.pinCode.trim(),
        permanent_address: data.permanentAddress.trim(),
      };

      console.log("📤 Submitting registration data:", registrationData);

      const { error } = await supabase
        .from('yff_team_registrations')
        .insert([registrationData]);

      if (error) {
        console.error("❌ Registration failed:", error);
        
        // Handle specific error types
        if (error.code === '23505') {
          const errorMsg = "A registration with this email or team leader already exists. Please contact support if you believe this is an error.";
          setSubmitError(errorMsg);
          toast.error(errorMsg);
        } else if (error.code === '23503') {
          const errorMsg = "There was an issue with your profile. Please sign out and sign in again, then try registering.";
          setSubmitError(errorMsg);
          toast.error(errorMsg);
        } else if (error.code === '23514') {
          const errorMsg = "Some of your information doesn't meet the required format. Please check all fields and try again.";
          setSubmitError(errorMsg);
          toast.error(errorMsg);
        } else {
          const errorMsg = "Registration failed due to a technical issue. Please try again in a few minutes.";
          setSubmitError(errorMsg);
          toast.error(errorMsg);
        }
        return;
      }

      console.log("✅ Registration successful");
      toast.success("Registration submitted successfully! Welcome to the Young Founders Floor program.");
      
      // Redirect to questionnaire or next step
      navigate('/yff/questionnaire');
      
    } catch (error) {
      console.error("❌ Registration error:", error);
      const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
      setSubmitError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear submit error when user starts fixing form
  const handleInputChange = () => {
    if (submitError) {
      setSubmitError(null);
    }
  };

  // If user has already registered, show message with matching design
  if (hasExistingRegistration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="max-w-2xl mx-auto p-6">
          <Card className="border-green-200 bg-white shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-800">Already Registered</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-green-700 mb-6 text-lg">
                You have already registered for the Young Founders Floor program. 
                Your registration is locked and cannot be modified.
              </p>
              <Button 
                onClick={() => navigate('/yff/questionnaire')}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                Continue to Questionnaire
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-6">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Young Founders Floor
          </h1>
          <h2 className="text-2xl font-semibold text-blue-600 mb-2">
            Team Registration
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Complete your team leader registration to participate in the program and unlock exclusive opportunities
          </p>
        </div>

        {/* Error Banner */}
        {submitError && (
          <div className="max-w-5xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Registration Error</h3>
                <p className="text-red-700">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Section 1: Personal Information */}
          <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <CardTitle className="text-xl font-semibold">
                  Personal Information
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="fullName" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Full Name *
                  </Label>
                  <Input
                    id="fullName"
                    {...register("fullName")}
                    placeholder="Enter your full name"
                    className={`h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg ${errors.fullName ? 'border-red-500' : ''}`}
                    onChange={(e) => {
                      register("fullName").onChange(e);
                      handleInputChange();
                    }}
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="Enter your email"
                    className="h-12 border-gray-200 bg-gray-50 text-gray-500 rounded-lg"
                    readOnly
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="linkedinProfile" className="text-sm font-semibold text-gray-700 mb-2 block">
                  LinkedIn Profile
                </Label>
                <Input
                  id="linkedinProfile"
                  {...register("linkedinProfile")}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className={`h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg ${errors.linkedinProfile ? 'border-red-500' : ''}`}
                  onChange={(e) => {
                    register("linkedinProfile").onChange(e);
                    handleInputChange();
                  }}
                />
                {errors.linkedinProfile && (
                  <p className="text-red-500 text-sm mt-1">{errors.linkedinProfile.message}</p>
                )}
              </div>

              <div>
                <PhoneInput
                  label="Phone Number *"
                  value={watch("phoneNumber") || ""}
                  onChange={(value) => {
                    setValue("phoneNumber", value);
                    handleInputChange();
                  }}
                  countryCode={countryCode}
                  countryIsoCode={countryIsoCode}
                  onCountryChange={handleCountryChange}
                  placeholder="Enter phone number"
                  className={`[&_input]:h-12 [&_input]:border-gray-200 [&_input]:focus:border-blue-500 [&_input]:focus:ring-blue-500 [&_input]:rounded-lg [&_label]:text-sm [&_label]:font-semibold [&_label]:text-gray-700 ${errors.phoneNumber ? '[&_input]:border-red-500' : ''}`}
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="dateOfBirth" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Date of Birth *
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register("dateOfBirth", { 
                      valueAsDate: true,
                      required: "Date of birth is required"
                    })}
                    className={`h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                    onChange={(e) => {
                      register("dateOfBirth", { valueAsDate: true }).onChange(e);
                      handleInputChange();
                    }}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="gender" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Gender *
                  </Label>
                  <Select 
                    onValueChange={(value) => {
                      setValue("gender", value as any);
                      handleInputChange();
                    }}
                    defaultValue="Male"
                  >
                    <SelectTrigger className={`h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg ${errors.gender ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="socialMediaHandles" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Social Media Handles
                </Label>
                <Input
                  id="socialMediaHandles"
                  {...register("socialMediaHandles")}
                  placeholder="@username, @handle2 (comma-separated)"
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  onChange={(e) => {
                    register("socialMediaHandles").onChange(e);
                    handleInputChange();
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Educational Information */}
          <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <CardTitle className="text-xl font-semibold">
                  Educational Information
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div>
                <Label htmlFor="institutionName" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Institution Name *
                </Label>
                <Input
                  id="institutionName"
                  {...register("institutionName")}
                  placeholder="Enter your institution name"
                  className={`h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg ${errors.institutionName ? 'border-red-500' : ''}`}
                  onChange={(e) => {
                    register("institutionName").onChange(e);
                    handleInputChange();
                  }}
                />
                {errors.institutionName && (
                  <p className="text-red-500 text-sm mt-1">{errors.institutionName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="courseProgram" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Course/Program *
                </Label>
                <Input
                  id="courseProgram"
                  {...register("courseProgram")}
                  placeholder="e.g., B.Tech Computer Science, MBA, etc."
                  className={`h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg ${errors.courseProgram ? 'border-red-500' : ''}`}
                  onChange={(e) => {
                    register("courseProgram").onChange(e);
                    handleInputChange();
                  }}
                />
                {errors.courseProgram && (
                  <p className="text-red-500 text-sm mt-1">{errors.courseProgram.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="currentYearOfStudy" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Current Year of Study *
                  </Label>
                  <Select 
                    onValueChange={(value) => {
                      setValue("currentYearOfStudy", value);
                      handleInputChange();
                    }}
                    defaultValue="1st Year"
                  >
                    <SelectTrigger className={`h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg ${errors.currentYearOfStudy ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st Year">1st Year</SelectItem>
                      <SelectItem value="2nd Year">2nd Year</SelectItem>
                      <SelectItem value="3rd Year">3rd Year</SelectItem>
                      <SelectItem value="4th Year">4th Year</SelectItem>
                      <SelectItem value="5th Year">5th Year</SelectItem>
                      <SelectItem value="Graduate">Graduate</SelectItem>
                      <SelectItem value="Post Graduate">Post Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.currentYearOfStudy && (
                    <p className="text-red-500 text-sm mt-1">{errors.currentYearOfStudy.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="expectedGraduation" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Expected Graduation *
                  </Label>
                  <Input
                    id="expectedGraduation"
                    {...register("expectedGraduation")}
                    placeholder="e.g., 2025, May 2026"
                    className={`h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg ${errors.expectedGraduation ? 'border-red-500' : ''}`}
                    onChange={(e) => {
                      register("expectedGraduation").onChange(e);
                      handleInputChange();
                    }}
                  />
                  {errors.expectedGraduation && (
                    <p className="text-red-500 text-sm mt-1">{errors.expectedGraduation.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Location Information */}
          <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <CardTitle className="text-xl font-semibold">
                  Location Information
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="currentCity" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Current City *
                  </Label>
                  <Input
                    id="currentCity"
                    {...register("currentCity")}
                    placeholder="Enter your current city"
                    className={`h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg ${errors.currentCity ? 'border-red-500' : ''}`}
                    onChange={(e) => {
                      register("currentCity").onChange(e);
                      handleInputChange();
                    }}
                  />
                  {errors.currentCity && (
                    <p className="text-red-500 text-sm mt-1">{errors.currentCity.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="state" className="text-sm font-semibold text-gray-700 mb-2 block">
                    State *
                  </Label>
                  <Input
                    id="state"
                    {...register("state")}
                    placeholder="Enter your state"
                    className={`h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg ${errors.state ? 'border-red-500' : ''}`}
                    onChange={(e) => {
                      register("state").onChange(e);
                      handleInputChange();
                    }}
                  />
                  {errors.state && (
                    <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="pinCode" className="text-sm font-semibold text-gray-700 mb-2 block">
                  PIN Code *
                </Label>
                <Input
                  id="pinCode"
                  {...register("pinCode")}
                  placeholder="Enter 6-digit PIN code"
                  className={`h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg ${errors.pinCode ? 'border-red-500' : ''}`}
                  maxLength={6}
                  onChange={(e) => {
                    register("pinCode").onChange(e);
                    handleInputChange();
                  }}
                />
                {errors.pinCode && (
                  <p className="text-red-500 text-sm mt-1">{errors.pinCode.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="permanentAddress" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Permanent Address *
                </Label>
                <Textarea
                  id="permanentAddress"
                  {...register("permanentAddress")}
                  placeholder="Enter your permanent address"
                  className={`border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg resize-none ${errors.permanentAddress ? 'border-red-500' : ''}`}
                  rows={4}
                  onChange={(e) => {
                    register("permanentAddress").onChange(e);
                    handleInputChange();
                  }}
                />
                {errors.permanentAddress && (
                  <p className="text-red-500 text-sm mt-1">{errors.permanentAddress.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="text-center pb-8">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                "Submit Registration"
              )}
            </Button>
            <p className="text-gray-600 text-sm mt-4 max-w-md mx-auto">
              By submitting, you confirm that all information is accurate and complete. 
              You'll be redirected to the next step of the application process.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
