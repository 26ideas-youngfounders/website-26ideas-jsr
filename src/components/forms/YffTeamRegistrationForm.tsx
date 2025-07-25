
import React, { useState } from 'react';
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
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Form validation schema
const teamRegistrationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  linkedinProfile: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  dateOfBirth: z.date({ required_error: "Date of birth is required" }),
  socialMediaHandles: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"]),
  institutionName: z.string().min(2, "Institution name is required"),
  courseProgram: z.string().min(2, "Course/Program is required"),
  currentYearOfStudy: z.string().min(1, "Current year of study is required"),
  expectedGraduation: z.string().min(4, "Expected graduation year is required"),
  currentCity: z.string().min(2, "Current city is required"),
  state: z.string().min(2, "State is required"),
  pinCode: z.string().min(6, "PIN code must be at least 6 digits"),
  permanentAddress: z.string().min(10, "Permanent address is required"),
});

type TeamRegistrationData = z.infer<typeof teamRegistrationSchema>;

/**
 * YFF Team Registration Form component
 * Handles team leader registration with comprehensive validation
 */
export const YffTeamRegistrationForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingRegistration, setHasExistingRegistration] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [countryIsoCode, setCountryIsoCode] = useState("IN");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
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
          .single();

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

  const onSubmit = async (data: TeamRegistrationData) => {
    if (!user) {
      toast.error("You must be signed in to register");
      return;
    }

    if (hasExistingRegistration) {
      toast.error("You have already registered for this program");
      return;
    }

    setIsSubmitting(true);

    try {
      const registrationData = {
        individual_id: user.id,
        full_name: data.fullName,
        email: data.email,
        linkedin_profile: data.linkedinProfile || null,
        phone_number: data.phoneNumber,
        country_code: countryCode,
        date_of_birth: data.dateOfBirth.toISOString().split('T')[0],
        social_media_handles: data.socialMediaHandles || null,
        gender: data.gender,
        institution_name: data.institutionName,
        course_program: data.courseProgram,
        current_year_of_study: data.currentYearOfStudy,
        expected_graduation: data.expectedGraduation,
        current_city: data.currentCity,
        state: data.state,
        pin_code: data.pinCode,
        permanent_address: data.permanentAddress,
      };

      const { error } = await supabase
        .from('yff_team_registrations')
        .insert([registrationData]);

      if (error) {
        console.error("❌ Registration failed:", error);
        
        if (error.code === '23505') {
          toast.error("You have already registered for this program");
          setHasExistingRegistration(true);
        } else {
          toast.error("Registration failed. Please try again.");
        }
        return;
      }

      console.log("✅ Registration successful");
      toast.success("Registration submitted successfully!");
      
      // Redirect to questionnaire or next step
      navigate('/yff/questionnaire');
      
    } catch (error) {
      console.error("❌ Registration error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user has already registered, show message
  if (hasExistingRegistration) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Already Registered</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 mb-4">
              You have already registered for the Young Founders Floor program. 
              Your registration is locked and cannot be modified.
            </p>
            <Button 
              onClick={() => navigate('/yff/questionnaire')}
              className="bg-green-600 hover:bg-green-700"
            >
              Continue to Questionnaire
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Young Founders Floor - Team Registration
        </h1>
        <p className="text-gray-600">
          Complete your team leader registration to participate in the program
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1: Team Leader Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">
              Team Leader Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  {...register("fullName")}
                  placeholder="Enter your full name"
                  className="mt-1"
                />
                {errors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="Enter your email"
                  className="mt-1 bg-gray-50"
                  readOnly
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="linkedinProfile">LinkedIn Profile</Label>
              <Input
                id="linkedinProfile"
                {...register("linkedinProfile")}
                placeholder="https://linkedin.com/in/yourprofile"
                className="mt-1"
              />
              {errors.linkedinProfile && (
                <p className="text-red-500 text-sm mt-1">{errors.linkedinProfile.message}</p>
              )}
            </div>

            <div>
              <PhoneInput
                label="Phone Number *"
                value={watch("phoneNumber") || ""}
                onChange={(value) => setValue("phoneNumber", value)}
                countryCode={countryCode}
                countryIsoCode={countryIsoCode}
                onCountryChange={handleCountryChange}
                placeholder="Enter phone number"
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register("dateOfBirth", { 
                    valueAsDate: true,
                    required: "Date of birth is required"
                  })}
                  className="mt-1"
                />
                {errors.dateOfBirth && (
                  <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select 
                  onValueChange={(value) => setValue("gender", value as any)}
                  defaultValue="Male"
                >
                  <SelectTrigger className="mt-1">
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
              <Label htmlFor="socialMediaHandles">Social Media Handles</Label>
              <Input
                id="socialMediaHandles"
                {...register("socialMediaHandles")}
                placeholder="@username, @handle2 (comma-separated)"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Educational Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">
              Educational Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="institutionName">Institution Name *</Label>
              <Input
                id="institutionName"
                {...register("institutionName")}
                placeholder="Enter your institution name"
                className="mt-1"
              />
              {errors.institutionName && (
                <p className="text-red-500 text-sm mt-1">{errors.institutionName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="courseProgram">Course/Program *</Label>
              <Input
                id="courseProgram"
                {...register("courseProgram")}
                placeholder="e.g., B.Tech Computer Science, MBA, etc."
                className="mt-1"
              />
              {errors.courseProgram && (
                <p className="text-red-500 text-sm mt-1">{errors.courseProgram.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="currentYearOfStudy">Current Year of Study *</Label>
                <Select 
                  onValueChange={(value) => setValue("currentYearOfStudy", value)}
                  defaultValue="1st Year"
                >
                  <SelectTrigger className="mt-1">
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
                <Label htmlFor="expectedGraduation">Expected Graduation *</Label>
                <Input
                  id="expectedGraduation"
                  {...register("expectedGraduation")}
                  placeholder="e.g., 2025, May 2026"
                  className="mt-1"
                />
                {errors.expectedGraduation && (
                  <p className="text-red-500 text-sm mt-1">{errors.expectedGraduation.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">
              Location Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="currentCity">Current City *</Label>
                <Input
                  id="currentCity"
                  {...register("currentCity")}
                  placeholder="Enter your current city"
                  className="mt-1"
                />
                {errors.currentCity && (
                  <p className="text-red-500 text-sm mt-1">{errors.currentCity.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  {...register("state")}
                  placeholder="Enter your state"
                  className="mt-1"
                />
                {errors.state && (
                  <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="pinCode">PIN Code *</Label>
              <Input
                id="pinCode"
                {...register("pinCode")}
                placeholder="Enter PIN code"
                className="mt-1"
                maxLength={6}
              />
              {errors.pinCode && (
                <p className="text-red-500 text-sm mt-1">{errors.pinCode.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="permanentAddress">Permanent Address *</Label>
              <Textarea
                id="permanentAddress"
                {...register("permanentAddress")}
                placeholder="Enter your permanent address"
                className="mt-1"
                rows={4}
              />
              {errors.permanentAddress && (
                <p className="text-red-500 text-sm mt-1">{errors.permanentAddress.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="text-center">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg font-semibold"
          >
            {isSubmitting ? "Submitting..." : "Submit Registration"}
          </Button>
          <p className="text-gray-500 text-sm mt-2">
            By submitting, you confirm that all information is accurate and complete.
          </p>
        </div>
      </form>
    </div>
  );
};
