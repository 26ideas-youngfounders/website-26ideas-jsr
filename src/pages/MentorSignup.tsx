/**
 * MentorSignup Component
 * 
 * This component provides a comprehensive form for potential mentors to express
 * interest in mentoring within the 26ideas Young Founders Ecosystem.
 * 
 * Features:
 * - Multi-section form with validation
 * - Duplicate prevention using mobile number as primary key
 * - Integration with Supabase database
 * - Real-time form validation with user feedback
 * - Success/error handling with toast notifications
 * 
 * Route: /community/mentors
 * Navigation: Main Navigation → Our Community → Mentors
 * 
 * @author 26ideas Team
 * @version 1.0.0
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
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/ui/phone-input";
import { X, Check, Heart, Users, Lightbulb, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

/**
 * Form validation schema using Zod
 * Defines all validation rules and error messages for the mentor signup form
 * 
 * Key validation rules:
 * - Names must be at least 2 characters
 * - Email must be valid format
 * - Phone must be at least 10 characters (international formats)
 * - LinkedIn URL must be valid URL format (optional)
 * - At least one topic of interest must be selected
 * - At least one availability day must be selected
 * - Privacy consent is mandatory (GDPR compliance)
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

/**
 * Predefined Data Constants
 * 
 * These arrays contain the standardized options available in the form.
 * They should be kept in sync with database enum values and business requirements.
 */

// Topics available for mentorship - should align with database 'interests' field
const TOPICS = [
  "Entrepreneurship", "Business Strategy", "Fundraising", "Marketing", 
  "Technology", "Artificial Intelligence", "Fintech", "E-commerce",
  "Social Impact", "Sustainability", "Leadership", "Product Development",
  "Sales", "Operations", "HR & Talent", "Legal & Compliance"
];

// Countries list - can be expanded based on operational regions
const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany",
  "France", "Netherlands", "Spain", "Italy", "Sweden", "Norway",
  "Denmark", "Switzerland", "Singapore", "India", "Nigeria", "South Africa"
];

// Days of the week for availability selection
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Time slots for mentoring sessions
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
  const [isSubmitted, setIsSubmitted] = useState(false); // Tracks successful form submission
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]); // Currently selected topics
  const [selectedDays, setSelectedDays] = useState<string[]>([]); // Currently selected days
  const { toast } = useToast(); // Toast notification system

  // Form Setup with React Hook Form
  // Uses Zod resolver for validation and provides default values
  const form = useForm<MentorFormData>({
    resolver: zodResolver(mentorFormSchema),
    defaultValues: {
      // Personal Information defaults
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      countryCode: "+91",
      countryIsoCode: "IN",
      linkedinUrl: "",
      instagram: "",
      
      // Location defaults
      city: "",
      country: "",
      
      // Mentorship preferences defaults
      topicsOfInterest: [],
      availabilityDays: [],
      availabilityTime: "",
      availabilityNotes: "",
      
      // Consent and communication defaults
      privacyConsent: false,
      emailUpdates: false,
      smsUpdates: false,
    },
  });

  /**
   * Handles topic selection/deselection
   * Updates both local state and form validation state
   * 
   * @param {string} topic - The topic to toggle
   */
  const toggleTopic = (topic: string) => {
    const updatedTopics = selectedTopics.includes(topic)
      ? selectedTopics.filter(t => t !== topic) // Remove if already selected
      : [...selectedTopics, topic]; // Add if not selected
    
    setSelectedTopics(updatedTopics);
    form.setValue("topicsOfInterest", updatedTopics); // Update form validation
  };

  /**
   * Handles availability day selection/deselection
   * Updates both local state and form validation state
   * 
   * @param {string} day - The day to toggle
   */
  const toggleDay = (day: string) => {
    const updatedDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day) // Remove if already selected
      : [...selectedDays, day]; // Add if not selected
    
    setSelectedDays(updatedDays);
    form.setValue("availabilityDays", updatedDays); // Update form validation
  };

  /**
   * Handles form submission with comprehensive error handling and duplicate prevention
   * 
   * This function:
   * 1. Calls the database function for safe mentor profile creation
   * 2. Handles duplicate detection based on email/phone
   * 3. Provides user feedback through toast notifications
   * 4. Updates UI state based on submission result
   * 
   * @param {MentorFormData} data - Validated form data from React Hook Form
   */
  const onSubmit = async (data: MentorFormData) => {
    try {
      console.log('Starting mentor signup submission...', data);
      
      // Call the secure database function for mentor profile creation
      // This function handles duplicate detection and atomic operations
      const { data: result, error } = await supabase.rpc('create_or_update_mentor_profile', {
        // Personal information parameters
        p_email: data.email,
        p_mobile: data.phone,
        p_first_name: data.firstName,
        p_last_name: data.lastName,
        p_city: data.city,
        p_country: data.country,
        p_country_code: data.countryCode,
        p_country_iso_code: data.countryIsoCode,
        
        // Social media parameters (nullable)
        p_linkedin: data.linkedinUrl || null,
        p_instagram: data.instagram || null,
        
        // Mentorship preferences parameters
        p_topics_of_interest: data.topicsOfInterest,
        p_availability_days: data.availabilityDays,
        p_availability_time: data.availabilityTime,
        p_availability_notes: data.availabilityNotes || null,
        
        // GDPR and communication preferences
        p_privacy_consent: data.privacyConsent,
        p_communication_email: data.emailUpdates,
        p_communication_sms: data.smsUpdates
      });

      // Handle database errors (network issues, permissions, etc.)
      if (error) {
        console.error('Error submitting mentor application:', error);
        toast({
          title: "Error",
          description: "There was an error submitting your application. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('Database function result:', result);

      // Parse the JSON response from the database function
      // Type assertion is necessary as Supabase returns Json type
      const response = result as any;
      
      // Handle business logic errors (duplicates, validation failures, etc.)
      if (response?.success === false) {
        if (response?.error === 'duplicate_mentor') {
          // User-friendly message for duplicate mentor registration
          toast({
            title: "Already Registered",
            description: response?.message || "A mentor profile already exists with this email or phone number.",
            variant: "destructive",
          });
        } else {
          // Generic error message for other business logic failures
          toast({
            title: "Error",
            description: response?.message || "There was an error creating your mentor profile.",
            variant: "destructive",
          });
        }
        return;
      }

      // Success case - mentor profile created/updated successfully
      console.log('Successfully created/updated mentor profile:', response);
      setIsSubmitted(true); // Trigger success UI
      toast({
        title: "Success!",
        description: "Thank you for your interest in mentoring with 26ideas. We'll contact you soon!",
      });

    } catch (error) {
      // Handle unexpected errors (network failures, parsing errors, etc.)
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    }
  };

  /**
   * Success Screen Render
   * 
   * Displays a confirmation message after successful form submission.
   * Includes thank you message and navigation back to home page.
   */
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-8">
              {/* Success icon with visual feedback */}
              <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-foreground mb-4">Thank You!</h1>
              <p className="text-muted-foreground text-lg">
                Thank you for your interest in mentoring with 26ideas. We'll contact you soon with next steps.
              </p>
            </div>
            {/* Return to home button */}
            <Button onClick={() => window.location.href = "/"} className="mt-4">
              Return to Home
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /**
   * Main Form Render
   * 
   * Renders the complete mentor signup form with multiple sections:
   * 1. Header with branding and messaging
   * 2. Basic Information section
   * 3. Mentorship Details section  
   * 4. Consent & Preferences section
   */
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Section - Branding and Call to Action */}
          <div className="text-center mb-12">
            {/* Visual branding with icons */}
            <div className="flex items-center justify-center mb-6">
              <Heart className="h-8 w-8 text-primary mr-3" />
              <Users className="h-8 w-8 text-primary mr-3" />
              <Lightbulb className="h-8 w-8 text-primary" />
            </div>
            {/* Main heading and subtitle */}
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Become a Mentor
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join our thriving community and shape the next generation of founders.
            </p>
          </div>

          {/* Form Container - Styled card with form sections */}
          <div className="bg-card rounded-xl shadow-lg p-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* ===== SECTION 1: BASIC INFORMATION ===== */}
              <div className="space-y-6">
                {/* Section header with icon and title */}
                <div className="flex items-center mb-4">
                  <Target className="h-5 w-5 text-primary mr-2" />
                  <h2 className="text-2xl font-semibold text-foreground">Basic Information</h2>
                </div>
                
                {/* Name fields - side by side on larger screens */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{/* First Name Input */}
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      {...form.register("firstName")}
                      className="mt-1"
                    />
                    {/* Display validation error if present */}
                    {form.formState.errors.firstName && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  
                  {/* Last Name Input */}
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      {...form.register("lastName")}
                      className="mt-1"
                    />
                    {/* Display validation error if present */}
                    {form.formState.errors.lastName && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact Information - side by side on larger screens */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email Input - Required for communication */}
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      className="mt-1"
                    />
                    {/* Display validation error if present */}
                    {form.formState.errors.email && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  
                  {/* Phone Input with Country Code Dropdown */}
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

                {/* Social Media Links - Optional professional networking */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* LinkedIn URL - Professional networking */}
                  <div>
                    <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                    <Input
                      id="linkedinUrl"
                      type="url"
                      placeholder="https://linkedin.com/in/your-profile"
                      {...form.register("linkedinUrl")}
                      className="mt-1"
                    />
                    {/* Display validation error if present */}
                    {form.formState.errors.linkedinUrl && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.linkedinUrl.message}
                      </p>
                    )}
                  </div>
                  
                  {/* Instagram Handle - Social media presence */}
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

                {/* Location Information - Required for mentor matching */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* City Input */}
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      {...form.register("city")}
                      className="mt-1"
                    />
                    {/* Display validation error if present */}
                    {form.formState.errors.city && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.city.message}
                      </p>
                    )}
                  </div>
                  
                  {/* Country Dropdown - Searchable selection */}
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Select onValueChange={(value) => form.setValue("country", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Render predefined country list */}
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* Display validation error if present */}
                    {form.formState.errors.country && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.country.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ===== SECTION 2: MENTORSHIP DETAILS ===== */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-foreground">Mentorship Details</h2>
                
                {/* Topics of Interest - Multi-select with visual feedback */}
                <div>
                  <Label>Topics of Interest *</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select the topics you'd like to mentor young founders in:
                  </p>
                  {/* Interactive topic selection buttons */}
                  <div className="flex flex-wrap gap-2">
                    {/* Render topic selection buttons with interactive states */}
                    {TOPICS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => toggleTopic(topic)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedTopics.includes(topic)
                            ? "bg-primary text-primary-foreground" // Selected state
                            : "bg-muted text-muted-foreground hover:bg-muted/80" // Unselected state
                        }`}
                      >
                        {topic}
                        {/* Show X icon for selected topics */}
                        {selectedTopics.includes(topic) && (
                          <X className="h-3 w-3 ml-1 inline" />
                        )}
                      </button>
                    ))}
                  </div>
                  {/* Display validation error if no topics selected */}
                  {form.formState.errors.topicsOfInterest && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.topicsOfInterest.message}
                    </p>
                  )}
                </div>

                {/* Availability Section - Days and time preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Availability</h3>
                  
                  {/* Day Selection - Multiple days can be selected */}
                  <div>
                    <Label>Preferred Days *</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {/* Render day selection buttons */}
                      {DAYS.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`px-3 py-2 rounded-md text-sm transition-colors ${
                            selectedDays.includes(day)
                              ? "bg-primary text-primary-foreground" // Selected state
                              : "bg-muted text-muted-foreground hover:bg-muted/80" // Unselected state
                          }`}
                        >
                          {/* Show abbreviated day name (first 3 letters) */}
                          {day.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                    {/* Display validation error if no days selected */}
                    {form.formState.errors.availabilityDays && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.availabilityDays.message}
                      </p>
                    )}
                  </div>

                  {/* Time Preference - Single selection dropdown */}
                  <div>
                    <Label htmlFor="availabilityTime">Preferred Time *</Label>
                    <Select onValueChange={(value) => form.setValue("availabilityTime", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select your preferred time" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Render predefined time slots */}
                        {TIMES.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* Display validation error if no time selected */}
                    {form.formState.errors.availabilityTime && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.availabilityTime.message}
                      </p>
                    )}
                  </div>

                  {/* Additional Availability Notes - Optional free text */}
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

              {/* ===== SECTION 3: CONSENT & PREFERENCES ===== */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-foreground">Consent & Preferences</h2>
                
                <div className="space-y-4">
                  {/* Privacy Consent - Required for GDPR compliance */}
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
                  {/* Display validation error for required consent */}
                  {form.formState.errors.privacyConsent && (
                    <p className="text-destructive text-sm">
                      {form.formState.errors.privacyConsent.message}
                    </p>
                  )}

                  {/* Communication Preferences - Optional opt-ins */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Communication Preferences</Label>
                    
                    {/* Email Updates Opt-in */}
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

                    {/* SMS/WhatsApp Updates Opt-in */}
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

                {/* Submit Button - Final call to action */}
                <div className="pt-6">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full md:w-auto px-8 py-3 text-lg"
                    disabled={form.formState.isSubmitting} // Disable during submission
                  >
                    {/* Show loading state during submission */}
                    {form.formState.isSubmitting ? "Submitting..." : "Submit Mentor Interest"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
      
      {/* Footer component */}
      <Footer />
    </div>
  );
};

// Export the component as default
export default MentorSignup;