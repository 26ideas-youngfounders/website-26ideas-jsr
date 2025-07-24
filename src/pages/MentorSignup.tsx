
/**
 * MentorSignup Component
 * 
 * This component provides a comprehensive form for potential mentors to express
 * interest in mentoring within the 26ideas Young Founders Ecosystem.
 * 
 * Features:
 * - Multi-section form with validation
 * - Duplicate prevention using email as primary key
 * - Integration with Supabase database
 * - Real-time form validation with user feedback
 * - Success/error handling with toast notifications
 * - Dynamic country code selection from database
 * 
 * Route: /community/mentors
 * Navigation: Main Navigation → Our Community → Mentors
 * 
 * @author 26ideas Team
 * @version 2.0.0
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneInput } from "@/components/ui/phone-input";
import { X, Check, Heart, Users, Lightbulb, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

/**
 * Form validation schema using Zod
 * Defines all validation rules and error messages for the mentor signup form
 */
const mentorFormSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  
  // Country information
  countryCode: z.string().min(2, "Please select a country code"),
  countryIsoCode: z.string().length(2, "Invalid country ISO code"),
  
  // Social Media & Professional Links
  linkedinUrl: z.string().url("Please enter a valid LinkedIn URL").optional().or(z.literal("")),
  instagram: z.string().optional(),
  
  // Location Information
  city: z.string().min(2, "City is required"),
  country: z.string().min(2, "Country is required"),
  
  // Mentorship Preferences
  topicsOfInterest: z.array(z.string()).min(1, "Please select at least one topic"),
  availabilityDays: z.array(z.string()).min(1, "Please select at least one day"),
  availabilityTime: z.string().min(1, "Please select a preferred time"),
  availabilityNotes: z.string().optional(),
  
  // GDPR Compliance & Communication Preferences
  privacyConsent: z.boolean().refine(val => val === true, "Privacy consent is required"),
  emailUpdates: z.boolean().default(false),
  smsUpdates: z.boolean().default(false),
});

// TypeScript type derived from the schema
type MentorFormData = z.infer<typeof mentorFormSchema>;

// Predefined data constants
const TOPICS = [
  "Entrepreneurship", "Business Strategy", "Fundraising", "Marketing", 
  "Technology", "Artificial Intelligence", "Fintech", "E-commerce",
  "Social Impact", "Sustainability", "Leadership", "Product Development",
  "Sales", "Operations", "HR & Talent", "Legal & Compliance"
];

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany",
  "France", "Netherlands", "Spain", "Italy", "Sweden", "Norway",
  "Denmark", "Switzerland", "Singapore", "India", "Nigeria", "South Africa"
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIMES = ["Morning (8AM-12PM)", "Afternoon (12PM-6PM)", "Evening (6PM-10PM)"];

/**
 * MentorSignup Component
 * 
 * Main component that renders the mentor interest signup form.
 * Handles form state, validation, submission, and user feedback.
 * 
 * @returns {JSX.Element} The complete mentor signup page
 */
const MentorSignup = () => {
  // State Management
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const { toast } = useToast();

  // Form Setup with React Hook Form
  const form = useForm<MentorFormData>({
    resolver: zodResolver(mentorFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      countryCode: "+91",
      countryIsoCode: "IN",
      linkedinUrl: "",
      instagram: "",
      city: "",
      country: "",
      topicsOfInterest: [],
      availabilityDays: [],
      availabilityTime: "",
      availabilityNotes: "",
      privacyConsent: false,
      emailUpdates: false,
      smsUpdates: false,
    },
  });

  /**
   * Handles topic selection/deselection
   */
  const toggleTopic = (topic: string) => {
    const updatedTopics = selectedTopics.includes(topic)
      ? selectedTopics.filter(t => t !== topic)
      : [...selectedTopics, topic];
    
    setSelectedTopics(updatedTopics);
    form.setValue("topicsOfInterest", updatedTopics);
  };

  /**
   * Handles availability day selection/deselection
   */
  const toggleDay = (day: string) => {
    const updatedDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day];
    
    setSelectedDays(updatedDays);
    form.setValue("availabilityDays", updatedDays);
  };

  /**
   * Handles form submission with comprehensive error handling
   */
  const onSubmit = async (data: MentorFormData) => {
    try {
      console.log('Starting mentor signup submission...', data);
      
      // Create individual record first
      const { data: individualData, error: individualError } = await supabase
        .from('individuals')
        .insert({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          country_code: data.countryCode,
          country_iso_code: data.countryIsoCode,
          privacy_consent: data.privacyConsent,
          data_processing_consent: true,
          is_active: true,
          email_verified: false,
        })
        .select()
        .single();

      if (individualError) {
        console.error('❌ Error creating individual record:', individualError);
        
        if (individualError.code === '23505') { // Unique constraint violation
          toast({
            title: "Already Registered",
            description: "A profile already exists with this email address.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "There was an error creating your profile. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

      // Create comprehensive mentor application record with all form fields
      const { error: applicationError } = await supabase
        .from('mentor_applications')
        .insert({
          individual_id: individualData.individual_id,
          application_status: 'submitted',
          submitted_at: new Date().toISOString(),
          // Personal information
          phone_number: data.phone,
          country_code: data.countryCode,
          country_iso_code: data.countryIsoCode,
          // Social links
          linkedin_url: data.linkedinUrl || null,
          instagram_handle: data.instagram || null,
          // Location
          city: data.city,
          country: data.country,
          // Mentorship preferences
          topics_of_interest: JSON.stringify(data.topicsOfInterest),
          availability_days: JSON.stringify(data.availabilityDays),
          availability_time: data.availabilityTime,
          availability_notes: data.availabilityNotes || null,
          // Communication preferences
          email_updates_consent: data.emailUpdates,
          sms_updates_consent: data.smsUpdates,
        });

      if (applicationError) {
        console.error('❌ Error creating mentor application:', applicationError);
        toast({
          title: "Error",
          description: "There was an error submitting your mentor application. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Successfully created mentor application with all fields');
      setIsSubmitted(true);
      toast({
        title: "Success!",
        description: "Thank you for your interest in mentoring with 26ideas. We'll contact you soon!",
      });

    } catch (error) {
      console.error('❌ Unexpected error during submission:', error);
      toast({
        title: "Error",
        description: "There was an unexpected error. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Success Screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-8">
              <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-foreground mb-4">Thank You!</h1>
              <p className="text-muted-foreground text-lg">
                Thank you for your interest in mentoring with 26ideas. We'll contact you soon with next steps.
              </p>
            </div>
            <Button onClick={() => window.location.href = "/"} className="mt-4">
              Return to Home
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Main Form
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Heart className="h-8 w-8 text-primary mr-3" />
              <Users className="h-8 w-8 text-primary mr-3" />
              <Lightbulb className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Become a Mentor
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join our thriving community and shape the next generation of founders.
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-card rounded-xl shadow-lg p-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* BASIC INFORMATION SECTION */}
              <div className="space-y-6">
                <div className="flex items-center mb-4">
                  <Target className="h-5 w-5 text-primary mr-2" />
                  <h2 className="text-2xl font-semibold text-foreground">Basic Information</h2>
                </div>
                
                {/* Name fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      {...form.register("firstName")}
                      className="mt-1"
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      {...form.register("lastName")}
                      className="mt-1"
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      className="mt-1"
                    />
                    {form.formState.errors.email && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <PhoneInput
                      label="Phone Number"
                      value={form.watch("phone") || ""}
                      onChange={(phone) => form.setValue("phone", phone)}
                      countryCode={form.watch("countryCode") || "+91"}
                      countryIsoCode={form.watch("countryIsoCode") || "IN"}
                      onCountryChange={(countryCode, isoCode) => {
                        form.setValue("countryCode", countryCode);
                        form.setValue("countryIsoCode", isoCode);
                      }}
                      required
                      error={form.formState.errors.phone?.message}
                      placeholder="Enter your mobile number"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                    <Input
                      id="linkedinUrl"
                      type="url"
                      placeholder="https://linkedin.com/in/your-profile"
                      {...form.register("linkedinUrl")}
                      className="mt-1"
                    />
                    {form.formState.errors.linkedinUrl && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.linkedinUrl.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="instagram">Instagram Handle</Label>
                    <Input
                      id="instagram"
                      placeholder="@yourhandle"
                      {...form.register("instagram")}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Location Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      {...form.register("city")}
                      className="mt-1"
                    />
                    {form.formState.errors.city && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.city.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Select onValueChange={(value) => form.setValue("country", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.country && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.country.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* MENTORSHIP DETAILS SECTION */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-foreground">Mentorship Details</h2>
                
                {/* Topics of Interest */}
                <div>
                  <Label>Topics of Interest *</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select the topics you'd like to mentor young founders in:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TOPICS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => toggleTopic(topic)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedTopics.includes(topic)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {topic}
                        {selectedTopics.includes(topic) && (
                          <X className="h-3 w-3 ml-1 inline" />
                        )}
                      </button>
                    ))}
                  </div>
                  {form.formState.errors.topicsOfInterest && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.topicsOfInterest.message}
                    </p>
                  )}
                </div>

                {/* Availability Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Availability</h3>
                  
                  {/* Day Selection */}
                  <div>
                    <Label>Preferred Days *</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {DAYS.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`px-3 py-2 rounded-md text-sm transition-colors ${
                            selectedDays.includes(day)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                    {form.formState.errors.availabilityDays && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.availabilityDays.message}
                      </p>
                    )}
                  </div>

                  {/* Time Preference */}
                  <div>
                    <Label htmlFor="availabilityTime">Preferred Time *</Label>
                    <Select onValueChange={(value) => form.setValue("availabilityTime", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select your preferred time" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMES.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.availabilityTime && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.availabilityTime.message}
                      </p>
                    )}
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <Label htmlFor="availabilityNotes">Additional Availability Notes</Label>
                    <Textarea
                      id="availabilityNotes"
                      placeholder="Any other specifics or preferences about availability?"
                      {...form.register("availabilityNotes")}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* CONSENT & PREFERENCES SECTION */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-foreground">Consent & Preferences</h2>
                
                <div className="space-y-4">
                  {/* Privacy Consent */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="privacyConsent"
                      checked={form.watch("privacyConsent")}
                      onCheckedChange={(checked) => form.setValue("privacyConsent", checked as boolean)}
                    />
                    <Label htmlFor="privacyConsent" className="text-sm leading-relaxed">
                      I consent to the storage and handling of my data as outlined in the Privacy Policy. *
                    </Label>
                  </div>
                  {form.formState.errors.privacyConsent && (
                    <p className="text-destructive text-sm">
                      {form.formState.errors.privacyConsent.message}
                    </p>
                  )}

                  {/* Communication Preferences */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Communication Preferences</Label>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="emailUpdates"
                        checked={form.watch("emailUpdates")}
                        onCheckedChange={(checked) => form.setValue("emailUpdates", checked as boolean)}
                      />
                      <Label htmlFor="emailUpdates" className="text-sm">
                        Opt-in for email updates
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="smsUpdates"
                        checked={form.watch("smsUpdates")}
                        onCheckedChange={(checked) => form.setValue("smsUpdates", checked as boolean)}
                      />
                      <Label htmlFor="smsUpdates" className="text-sm">
                        Opt-in for SMS/WhatsApp updates
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full md:w-auto px-8 py-3 text-lg"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? "Submitting..." : "Submit Mentor Interest"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MentorSignup;
