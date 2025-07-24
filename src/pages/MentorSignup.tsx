
/**
 * @fileoverview Mentor Signup Page
 * 
 * Complete mentor application form with country code support,
 * topic selection, availability settings, and form validation.
 * 
 * @version 2.0.0
 * @author 26ideas Development Team
 */

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PhoneInput } from '@/components/ui/phone-input';
import { Loader2, Heart, Users, Lightbulb, Target } from 'lucide-react';

/**
 * Available mentorship topics
 */
const MENTORSHIP_TOPICS = [
  'Startup Strategy',
  'Product Development',
  'Marketing & Sales',
  'Fundraising',
  'Technology & Engineering',
  'Design & UX',
  'Operations',
  'Leadership',
  'Finance & Accounting',
  'Legal & Compliance',
  'HR & Talent',
  'International Expansion'
];

/**
 * Available days for mentoring
 */
const AVAILABILITY_DAYS = [
  'Monday',
  'Tuesday', 
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

/**
 * Available time slots
 */
const TIME_SLOTS = [
  'Morning (9 AM - 12 PM)',
  'Afternoon (12 PM - 5 PM)', 
  'Evening (5 PM - 8 PM)',
  'Flexible'
];

/**
 * Form data interface
 */
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  countryIsoCode: string;
  city: string;
  country: string;
  topicsOfInterest: string[];
  availabilityDays: string[];
  availabilityTime: string;
  availabilityNotes: string;
  linkedinUrl: string;
  instagramHandle: string;
  privacyConsent: boolean;
  dataProcessingConsent: boolean;
}

/**
 * MentorSignup Component
 * 
 * Comprehensive mentor application form with:
 * - Personal information collection
 * - Topic expertise selection
 * - Availability scheduling
 * - Social media links
 * - Privacy consent handling
 * 
 * @returns JSX.Element - The complete mentor signup form
 */
const MentorSignup: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    countryCode: '+91',
    countryIsoCode: 'IN',
    city: '',
    country: '',
    topicsOfInterest: [],
    availabilityDays: [],
    availabilityTime: '',
    availabilityNotes: '',
    linkedinUrl: '',
    instagramHandle: '',
    privacyConsent: false,
    dataProcessingConsent: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  /**
   * Handles input field changes
   */
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Handles checkbox changes
   */
  const handleCheckboxChange = (field: keyof FormData, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  /**
   * Handles topic selection
   */
  const handleTopicToggle = (topic: string) => {
    setFormData(prev => ({
      ...prev,
      topicsOfInterest: prev.topicsOfInterest.includes(topic)
        ? prev.topicsOfInterest.filter(t => t !== topic)
        : [...prev.topicsOfInterest, topic]
    }));
  };

  /**
   * Handles availability day selection
   */
  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availabilityDays: prev.availabilityDays.includes(day)
        ? prev.availabilityDays.filter(d => d !== day)
        : [...prev.availabilityDays, day]
    }));
  };

  /**
   * Validates form data
   */
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.firstName.trim()) errors.push('First name is required');
    if (!formData.lastName.trim()) errors.push('Last name is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!formData.phoneNumber.trim()) errors.push('Phone number is required');
    if (!formData.city.trim()) errors.push('City is required');
    if (!formData.country.trim()) errors.push('Country is required');
    if (formData.topicsOfInterest.length === 0) errors.push('Please select at least one topic of interest');
    if (formData.availabilityDays.length === 0) errors.push('Please select at least one available day');
    if (!formData.availabilityTime) errors.push('Please select your preferred time');
    if (!formData.privacyConsent) errors.push('Privacy consent is required');
    if (!formData.dataProcessingConsent) errors.push('Data processing consent is required');

    return errors;
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Starting mentor application submission...');

      // First, create or get individual record
      const { data: individual, error: individualError } = await supabase
        .from('individuals')
        .upsert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          mobile: formData.phoneNumber,
          country_code: formData.countryCode,
          country_iso_code: formData.countryIsoCode,
          city: formData.city,
          country: formData.country,
          privacy_consent: formData.privacyConsent,
          data_processing_consent: formData.dataProcessingConsent,
        }, {
          onConflict: 'email'
        })
        .select()
        .single();

      if (individualError) {
        console.error('Error creating individual:', individualError);
        throw individualError;
      }

      console.log('Individual created/updated:', individual);

      // Then create mentor application
      const { error: applicationError } = await supabase
        .from('mentor_applications')
        .insert({
          individual_id: individual.individual_id,
          topics_of_interest: formData.topicsOfInterest,
          availability_days: formData.availabilityDays,
          availability_time: formData.availabilityTime,
          availability_notes: formData.availabilityNotes,
          linkedin_url: formData.linkedinUrl,
          instagram_handle: formData.instagramHandle,
          country_code: formData.countryCode,
          country_iso_code: formData.countryIsoCode,
          application_status: 'submitted'
        });

      if (applicationError) {
        console.error('Error creating mentor application:', applicationError);
        throw applicationError;
      }

      console.log('Mentor application submitted successfully');

      toast({
        title: "Application Submitted!",
        description: "Thank you for your interest in becoming a mentor. We'll review your application and get back to you soon.",
      });

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        countryCode: '+91',
        countryIsoCode: 'IN',
        city: '',
        country: '',
        topicsOfInterest: [],
        availabilityDays: [],
        availabilityTime: '',
        availabilityNotes: '',
        linkedinUrl: '',
        instagramHandle: '',
        privacyConsent: false,
        dataProcessingConsent: false,
      });

    } catch (error) {
      console.error('Error submitting mentor application:', error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Become a Mentor
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join our community of experienced professionals and help guide the next generation of founders and entrepreneurs.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Make an Impact</h3>
              <p className="text-gray-600">Help shape the future by mentoring passionate young entrepreneurs</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Build Networks</h3>
              <p className="text-gray-600">Connect with like-minded professionals and expand your network</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Lightbulb className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Stay Sharp</h3>
              <p className="text-gray-600">Learn from fresh perspectives and stay updated with industry trends</p>
            </CardContent>
          </Card>
        </div>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6" />
              Mentor Application
            </CardTitle>
            <CardDescription>
              Tell us about yourself and how you'd like to contribute as a mentor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>

                <PhoneInput
                  label="Phone Number *"
                  value={formData.phoneNumber}
                  onChange={(phone) => handleInputChange('phoneNumber', phone)}
                  countryCode={formData.countryCode}
                  countryIsoCode={formData.countryIsoCode}
                  onCountryChange={(code, iso) => {
                    handleInputChange('countryCode', code);
                    handleInputChange('countryIsoCode', iso);
                  }}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Topics of Interest */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Areas of Expertise *</h3>
                <p className="text-gray-600">Select the topics you'd like to mentor in:</p>
                <div className="flex flex-wrap gap-3">
                  {MENTORSHIP_TOPICS.map((topic) => (
                    <Badge
                      key={topic}
                      variant={formData.topicsOfInterest.includes(topic) ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2"
                      onClick={() => handleTopicToggle(topic)}
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Availability *</h3>
                
                <div>
                  <Label className="text-base font-medium">Available Days *</Label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {AVAILABILITY_DAYS.map((day) => (
                      <Badge
                        key={day}
                        variant={formData.availabilityDays.includes(day) ? "default" : "outline"}
                        className="cursor-pointer px-4 py-2"
                        onClick={() => handleDayToggle(day)}
                      >
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Preferred Time *</Label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {TIME_SLOTS.map((time) => (
                      <Badge
                        key={time}
                        variant={formData.availabilityTime === time ? "default" : "outline"}
                        className="cursor-pointer px-4 py-2"
                        onClick={() => handleInputChange('availabilityTime', time)}
                      >
                        {time}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="availabilityNotes">Additional Availability Notes</Label>
                  <Textarea
                    id="availabilityNotes"
                    value={formData.availabilityNotes}
                    onChange={(e) => handleInputChange('availabilityNotes', e.target.value)}
                    placeholder="Any specific availability constraints or preferences..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Social Links (Optional)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="linkedinUrl">LinkedIn Profile URL</Label>
                    <Input
                      id="linkedinUrl"
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagramHandle">Instagram Handle</Label>
                    <Input
                      id="instagramHandle"
                      value={formData.instagramHandle}
                      onChange={(e) => handleInputChange('instagramHandle', e.target.value)}
                      placeholder="@yourusername"
                    />
                  </div>
                </div>
              </div>

              {/* Consent */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Consent & Agreement</h3>
                
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="privacyConsent"
                    checked={formData.privacyConsent}
                    onCheckedChange={(checked) => handleCheckboxChange('privacyConsent', !!checked)}
                    required
                  />
                  <Label htmlFor="privacyConsent" className="text-sm">
                    I agree to the privacy policy and terms of service *
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="dataProcessingConsent"
                    checked={formData.dataProcessingConsent}
                    onCheckedChange={(checked) => handleCheckboxChange('dataProcessingConsent', !!checked)}
                    required
                  />
                  <Label htmlFor="dataProcessingConsent" className="text-sm">
                    I consent to the processing of my personal data for mentorship matching and communication purposes *
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full md:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MentorSignup;
