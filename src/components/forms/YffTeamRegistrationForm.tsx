
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PhoneInput } from '@/components/ui/phone-input';
import { CalendarIcon, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Form validation schema
const registrationSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  linkedinProfile: z.string().url('Please enter a valid LinkedIn URL').optional().or(z.literal('')),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  countryCode: z.string().default('+91'),
  dateOfBirth: z.date({
    required_error: 'Date of birth is required',
  }),
  socialMediaHandles: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']),
  institutionName: z.string().min(2, 'Institution name is required'),
  courseProgram: z.string().min(2, 'Course/Program is required'),
  currentYearOfStudy: z.string().min(1, 'Current year of study is required'),
  expectedGraduation: z.string().min(4, 'Expected graduation year is required'),
  currentCity: z.string().min(2, 'Current city is required'),
  state: z.string().min(2, 'State is required'),
  pinCode: z.string().regex(/^\d{6}$/, 'PIN code must be 6 digits'),
  permanentAddress: z.string().min(10, 'Permanent address is required'),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export const YffTeamRegistrationForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRegistration, setExistingRegistration] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      email: user?.email || '',
      countryCode: '+91',
      socialMediaHandles: '',
      linkedinProfile: '',
    },
  });

  // Check if user already has a registration
  useEffect(() => {
    const checkExistingRegistration = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('yff_team_registrations')
          .select('*')
          .eq('individual_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking registration:', error);
          return;
        }

        if (data) {
          setExistingRegistration(data);
        }
      } catch (error) {
        console.error('Error checking registration:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingRegistration();
  }, [user]);

  const onSubmit = async (data: RegistrationFormData) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to register',
        variant: 'destructive',
      });
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
        country_code: data.countryCode,
        date_of_birth: format(data.dateOfBirth, 'yyyy-MM-dd'),
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
        .insert(registrationData);

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already Registered',
            description: 'You have already registered for this event',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: 'Registration Successful!',
        description: 'Your team registration has been submitted successfully.',
      });

      // Refresh to show the success state
      window.location.reload();
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: 'There was an error submitting your registration. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show success state if already registered
  if (existingRegistration) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-700">Registration Complete!</CardTitle>
            <CardDescription>
              You have already registered for the Young Founders Floor program.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Registration Details:</h3>
              <p><strong>Name:</strong> {existingRegistration.full_name}</p>
              <p><strong>Email:</strong> {existingRegistration.email}</p>
              <p><strong>Institution:</strong> {existingRegistration.institution_name}</p>
              <p><strong>Submitted:</strong> {format(new Date(existingRegistration.created_at), 'PPP')}</p>
            </div>
            <p className="text-sm text-gray-600">
              Your registration is locked and cannot be modified. If you need to make changes, please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Registration</h1>
        <p className="text-gray-600">Young Founders Floor - Team Leader Information</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1: Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Please fill in your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  {...form.register('fullName')}
                  placeholder="Enter your full name"
                />
                {form.formState.errors.fullName && (
                  <p className="text-sm text-red-600">{form.formState.errors.fullName.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  readOnly
                  className="bg-gray-100"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="linkedinProfile">LinkedIn Profile</Label>
              <Input
                id="linkedinProfile"
                {...form.register('linkedinProfile')}
                placeholder="https://linkedin.com/in/yourprofile"
              />
              {form.formState.errors.linkedinProfile && (
                <p className="text-sm text-red-600">{form.formState.errors.linkedinProfile.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <PhoneInput
                value={form.watch('phoneNumber') || ''}
                onChange={(value) => form.setValue('phoneNumber', value || '')}
                defaultCountry="IN"
                placeholder="Enter your phone number"
              />
              {form.formState.errors.phoneNumber && (
                <p className="text-sm text-red-600">{form.formState.errors.phoneNumber.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch('dateOfBirth') ? format(form.watch('dateOfBirth'), 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.watch('dateOfBirth')}
                      onSelect={(date) => form.setValue('dateOfBirth', date as Date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {form.formState.errors.dateOfBirth && (
                  <p className="text-sm text-red-600">{form.formState.errors.dateOfBirth.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select onValueChange={(value) => form.setValue('gender', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.gender && (
                  <p className="text-sm text-red-600">{form.formState.errors.gender.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="socialMediaHandles">Social Media Handles</Label>
              <Input
                id="socialMediaHandles"
                {...form.register('socialMediaHandles')}
                placeholder="@username, @handle2, etc."
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Educational Information */}
        <Card>
          <CardHeader>
            <CardTitle>Educational Information</CardTitle>
            <CardDescription>Please provide your educational details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="institutionName">Institution Name *</Label>
              <Input
                id="institutionName"
                {...form.register('institutionName')}
                placeholder="Enter your institution name"
              />
              {form.formState.errors.institutionName && (
                <p className="text-sm text-red-600">{form.formState.errors.institutionName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="courseProgram">Course/Program *</Label>
                <Input
                  id="courseProgram"
                  {...form.register('courseProgram')}
                  placeholder="e.g., B.Tech Computer Science"
                />
                {form.formState.errors.courseProgram && (
                  <p className="text-sm text-red-600">{form.formState.errors.courseProgram.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="currentYearOfStudy">Current Year of Study *</Label>
                <Select onValueChange={(value) => form.setValue('currentYearOfStudy', value)}>
                  <SelectTrigger>
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
                {form.formState.errors.currentYearOfStudy && (
                  <p className="text-sm text-red-600">{form.formState.errors.currentYearOfStudy.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="expectedGraduation">Expected Graduation *</Label>
              <Input
                id="expectedGraduation"
                {...form.register('expectedGraduation')}
                placeholder="e.g., 2025 or May 2025"
              />
              {form.formState.errors.expectedGraduation && (
                <p className="text-sm text-red-600">{form.formState.errors.expectedGraduation.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Location Information */}
        <Card>
          <CardHeader>
            <CardTitle>Location Information</CardTitle>
            <CardDescription>Please provide your location details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentCity">Current City *</Label>
                <Input
                  id="currentCity"
                  {...form.register('currentCity')}
                  placeholder="Enter your current city"
                />
                {form.formState.errors.currentCity && (
                  <p className="text-sm text-red-600">{form.formState.errors.currentCity.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  {...form.register('state')}
                  placeholder="Enter your state"
                />
                {form.formState.errors.state && (
                  <p className="text-sm text-red-600">{form.formState.errors.state.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="pinCode">PIN Code *</Label>
              <Input
                id="pinCode"
                {...form.register('pinCode')}
                placeholder="Enter 6-digit PIN code"
                maxLength={6}
              />
              {form.formState.errors.pinCode && (
                <p className="text-sm text-red-600">{form.formState.errors.pinCode.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="permanentAddress">Permanent Address *</Label>
              <Textarea
                id="permanentAddress"
                {...form.register('permanentAddress')}
                placeholder="Enter your permanent address"
                rows={3}
              />
              {form.formState.errors.permanentAddress && (
                <p className="text-sm text-red-600">{form.formState.errors.permanentAddress.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full md:w-auto min-w-[200px]"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Registration'}
          </Button>
        </div>
      </form>
    </div>
  );
};
