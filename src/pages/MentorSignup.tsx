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
import { X, Check, Heart, Users, Lightbulb, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Form validation schema
const mentorFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  linkedinUrl: z.string().url("Please enter a valid LinkedIn URL").optional().or(z.literal("")),
  instagram: z.string().optional(),
  city: z.string().min(2, "City is required"),
  country: z.string().min(2, "Country is required"),
  topicsOfInterest: z.array(z.string()).min(1, "Please select at least one topic"),
  availabilityDays: z.array(z.string()).min(1, "Please select at least one day"),
  availabilityTime: z.string().min(1, "Please select a preferred time"),
  availabilityNotes: z.string().optional(),
  privacyConsent: z.boolean().refine(val => val === true, "Privacy consent is required"),
  emailUpdates: z.boolean().default(false),
  smsUpdates: z.boolean().default(false),
});

type MentorFormData = z.infer<typeof mentorFormSchema>;

// Predefined topics and countries
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

const MentorSignup = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<MentorFormData>({
    resolver: zodResolver(mentorFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
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

  const toggleTopic = (topic: string) => {
    const updatedTopics = selectedTopics.includes(topic)
      ? selectedTopics.filter(t => t !== topic)
      : [...selectedTopics, topic];
    setSelectedTopics(updatedTopics);
    form.setValue("topicsOfInterest", updatedTopics);
  };

  const toggleDay = (day: string) => {
    const updatedDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day];
    setSelectedDays(updatedDays);
    form.setValue("availabilityDays", updatedDays);
  };

  const onSubmit = async (data: MentorFormData) => {
    try {
      console.log('Starting mentor signup submission...', data);
      
      // Use the new database function for safe mentor creation
      const { data: result, error } = await supabase.rpc('create_or_update_mentor_profile', {
        p_email: data.email,
        p_mobile: data.phone,
        p_first_name: data.firstName,
        p_last_name: data.lastName,
        p_city: data.city,
        p_country: data.country,
        p_linkedin: data.linkedinUrl || null,
        p_instagram: data.instagram || null,
        p_topics_of_interest: data.topicsOfInterest,
        p_availability_days: data.availabilityDays,
        p_availability_time: data.availabilityTime,
        p_availability_notes: data.availabilityNotes || null,
        p_privacy_consent: data.privacyConsent,
        p_communication_email: data.emailUpdates,
        p_communication_sms: data.smsUpdates
      });

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

      // Handle the response from the database function
      const response = result as any; // Type assertion for the JSON response
      if (response?.success === false) {
        if (response?.error === 'duplicate_mentor') {
          toast({
            title: "Already Registered",
            description: response?.message || "A mentor profile already exists with this email or phone number.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: response?.message || "There was an error creating your mentor profile.",
            variant: "destructive",
          });
        }
        return;
      }

      // Success case
      console.log('Successfully created/updated mentor profile:', response);
      setIsSubmitted(true);
      toast({
        title: "Success!",
        description: "Thank you for your interest in mentoring with 26ideas. We'll contact you soon!",
      });

    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    }
  };

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

          {/* Form Section */}
          <div className="bg-card rounded-xl shadow-lg p-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="flex items-center mb-4">
                  <Target className="h-5 w-5 text-primary mr-2" />
                  <h2 className="text-2xl font-semibold text-foreground">Basic Information</h2>
                </div>
                
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
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...form.register("phone")}
                      className="mt-1"
                    />
                    {form.formState.errors.phone && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

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

              {/* Mentorship Details */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-foreground">Mentorship Details</h2>
                
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

                {/* Availability */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Availability</h3>
                  
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

              {/* Consent & Submit */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-foreground">Consent & Preferences</h2>
                
                <div className="space-y-4">
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