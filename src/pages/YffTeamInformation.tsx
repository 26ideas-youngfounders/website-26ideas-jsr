
/**
 * @fileoverview Young Founders Floor Team Information Collection Form
 * 
 * This component handles the first phase of the YFF application process where
 * users provide team details, education information, and basic venture data.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { PhoneInput } from "@/components/ui/phone-input";

/**
 * Type definitions for form data
 */
interface TeamMember {
  name: string;
  email: string;
  linkedin: string;
  role: string;
}

interface FormData {
  fullName: string;
  email: string;
  linkedinProfile: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  institutionName: string;
  courseProgram: string;
  currentYear: string;
  expectedGraduation: string;
  currentCity: string;
  state: string;
  pinCode: string;
  permanentAddress: string;
  teamName: string;
  numberOfMembers: string;
  teamMembers: TeamMember[];
  ventureName: string;
  industrySector: string;
  websiteUrl: string;
  pitchVideoUrl: string;
  hearAboutSource: string;
  specialRequirements: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  privacyPolicy: boolean;
  termsConditions: boolean;
  ageVerification: boolean;
}

/**
 * Team Information Form Component
 * Collects comprehensive team and venture details for YFF application
 */
const YffTeamInformation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    // Team Leader Information
    fullName: "",
    email: user?.email || "",
    linkedinProfile: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
    
    // Education Details
    institutionName: "",
    courseProgram: "",
    currentYear: "",
    expectedGraduation: "",
    
    // Address Information
    currentCity: "",
    state: "",
    pinCode: "",
    permanentAddress: "",
    
    // Team Details
    teamName: "",
    numberOfMembers: "1",
    teamMembers: [],
    
    // Venture Information
    ventureName: "",
    industrySector: "",
    websiteUrl: "",
    pitchVideoUrl: "",
    
    // Additional Information
    hearAboutSource: "",
    specialRequirements: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    
    // Consent & Terms
    privacyPolicy: false,
    termsConditions: false,
    ageVerification: false,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/young-founders-floor");
      return;
    }
    
    // Load existing application data if available
    loadExistingApplication();
  }, [user, navigate]);

  /**
   * Load existing application data from database
   */
  const loadExistingApplication = async () => {
    try {
      const { data, error } = await supabase
        .from('yff_applications')
        .select('*')
        .eq('individual_id', user?.id)
        .eq('application_round', 'Round 1')
        .single();

      if (error || !data) {
        console.log("No existing application found, starting fresh");
        return;
      }

      // Safely parse the answers
      if (data.answers && typeof data.answers === 'object' && data.answers !== null) {
        const answers = data.answers as Record<string, any>;
        if (answers.team && typeof answers.team === 'object') {
          const teamData = answers.team as Record<string, any>;
          setFormData(prev => ({
            ...prev,
            ...teamData
          }));
        }
      }
    } catch (error) {
      console.log("No existing application found, starting fresh");
    }
  };

  /**
   * Auto-save functionality
   */
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (formData.fullName || formData.teamName) { // Only save if there's meaningful data
        saveAsDraft();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [formData]);

  /**
   * Save current form data as draft
   */
  const saveAsDraft = async () => {
    if (!user) return;
    
    setAutoSaving(true);
    try {
      // Convert FormData to JSON-serializable object
      const teamDataAsJson = JSON.parse(JSON.stringify(formData));
      
      const { error } = await supabase
        .from('yff_applications')
        .upsert({
          individual_id: user.id,
          status: 'draft',
          application_round: 'Round 1',
          answers: { team: teamDataAsJson } as any
        }, {
          onConflict: 'individual_id,application_round'
        });

      if (error) throw error;
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setAutoSaving(false);
    }
  };

  /**
   * Handle form input changes
   */
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Handle team member changes
   */
  const updateTeamMembers = (count: string) => {
    const numMembers = parseInt(count);
    const currentMembers = formData.teamMembers || [];
    
    if (numMembers > currentMembers.length) {
      // Add new team member slots
      const newMembers = [...currentMembers];
      for (let i = currentMembers.length; i < numMembers - 1; i++) {
        newMembers.push({
          name: "",
          email: "",
          linkedin: "",
          role: ""
        });
      }
      setFormData(prev => ({
        ...prev,
        numberOfMembers: count,
        teamMembers: newMembers
      }));
    } else {
      // Remove excess team member slots
      setFormData(prev => ({
        ...prev,
        numberOfMembers: count,
        teamMembers: currentMembers.slice(0, numMembers - 1)
      }));
    }
  };

  /**
   * Handle team member data changes
   */
  const handleTeamMemberChange = (index: number, field: string, value: string) => {
    const updatedMembers = [...(formData.teamMembers || [])];
    updatedMembers[index] = {
      ...updatedMembers[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      teamMembers: updatedMembers
    }));
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const errors = [];
    
    // Required fields validation
    if (!formData.fullName) errors.push("Full Name is required");
    if (!formData.linkedinProfile) errors.push("LinkedIn Profile is required");
    if (!formData.phoneNumber) errors.push("Phone Number is required");
    if (!formData.dateOfBirth) errors.push("Date of Birth is required");
    if (!formData.gender) errors.push("Gender is required");
    if (!formData.institutionName) errors.push("Institution Name is required");
    if (!formData.courseProgram) errors.push("Course/Program is required");
    if (!formData.currentYear) errors.push("Current Year is required");
    if (!formData.expectedGraduation) errors.push("Expected Graduation is required");
    if (!formData.currentCity) errors.push("Current City is required");
    if (!formData.state) errors.push("State is required");
    if (!formData.pinCode) errors.push("PIN Code is required");
    if (!formData.teamName) errors.push("Team Name is required");
    if (!formData.ventureName) errors.push("Venture Name is required");
    if (!formData.industrySector) errors.push("Industry Sector is required");
    if (!formData.hearAboutSource) errors.push("Source information is required");
    if (!formData.emergencyContactName) errors.push("Emergency Contact Name is required");
    if (!formData.emergencyContactPhone) errors.push("Emergency Contact Phone is required");
    
    // Consent validation
    if (!formData.privacyPolicy) errors.push("Privacy Policy agreement is required");
    if (!formData.termsConditions) errors.push("Terms & Conditions agreement is required");
    if (!formData.ageVerification) errors.push("Age verification is required");
    
    // Age validation (18-25)
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18 || age > 25) {
        errors.push("You must be between 18-25 years old to participate");
      }
    }
    
    // PIN Code validation
    if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode)) {
      errors.push("PIN Code must be 6 digits");
    }
    
    // LinkedIn URL validation
    if (formData.linkedinProfile && !formData.linkedinProfile.includes('linkedin.com')) {
      errors.push("Please provide a valid LinkedIn profile URL");
    }
    
    // Team members validation
    if (parseInt(formData.numberOfMembers) > 1) {
      const teamMembers = formData.teamMembers || [];
      for (let i = 0; i < parseInt(formData.numberOfMembers) - 1; i++) {
        if (!teamMembers[i]?.name) {
          errors.push(`Team member ${i + 2} name is required`);
        }
        if (!teamMembers[i]?.email) {
          errors.push(`Team member ${i + 2} email is required`);
        }
      }
    }
    
    return errors;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors[0],
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      // Convert FormData to JSON-serializable object
      const teamDataAsJson = JSON.parse(JSON.stringify(formData));
      
      const { error } = await supabase
        .from('yff_applications')
        .upsert({
          individual_id: user.id,
          status: 'team_info_completed',
          application_round: 'Round 1',
          answers: { team: teamDataAsJson } as any
        }, {
          onConflict: 'individual_id,application_round'
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Team information saved successfully!",
      });

      // Redirect to questionnaire
      navigate('/yff/questionnaire');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save team information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress
  const calculateProgress = () => {
    const requiredFields = [
      'fullName', 'linkedinProfile', 'phoneNumber', 'dateOfBirth', 'gender',
      'institutionName', 'courseProgram', 'currentYear', 'expectedGraduation',
      'currentCity', 'state', 'pinCode', 'teamName', 'ventureName', 'industrySector',
      'hearAboutSource', 'emergencyContactName', 'emergencyContactPhone'
    ];
    
    const filledFields = requiredFields.filter(field => formData[field as keyof FormData]).length;
    const consentFields = [formData.privacyPolicy, formData.termsConditions, formData.ageVerification].filter(Boolean).length;
    
    return Math.round(((filledFields + consentFields) / (requiredFields.length + 3)) * 100);
  };

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Young Founders Floor Application</h1>
          <p className="text-muted-foreground mb-4">Step 1 of 2: Team Information</p>
          <Progress value={calculateProgress()} className="w-full max-w-md mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">
            {calculateProgress()}% Complete {autoSaving && "• Auto-saving..."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Team Leader Information */}
          <Card>
            <CardHeader>
              <CardTitle>Team Leader Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                
                <div>
                  <Label htmlFor="linkedinProfile">LinkedIn Profile URL *</Label>
                  <Input
                    id="linkedinProfile"
                    value={formData.linkedinProfile}
                    onChange={(e) => handleInputChange('linkedinProfile', e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <PhoneInput
                    value={formData.phoneNumber}
                    onChange={(value) => handleInputChange('phoneNumber', value)}
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange('gender', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Education Details */}
          <Card>
            <CardHeader>
              <CardTitle>Education Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="institutionName">Institution Name *</Label>
                  <Input
                    id="institutionName"
                    value={formData.institutionName}
                    onChange={(e) => handleInputChange('institutionName', e.target.value)}
                    placeholder="University/College name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="courseProgram">Course/Program *</Label>
                  <Input
                    id="courseProgram"
                    value={formData.courseProgram}
                    onChange={(e) => handleInputChange('courseProgram', e.target.value)}
                    placeholder="e.g., B.Tech Computer Science"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="currentYear">Current Year of Study *</Label>
                  <Select
                    value={formData.currentYear}
                    onValueChange={(value) => handleInputChange('currentYear', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st-year">1st Year</SelectItem>
                      <SelectItem value="2nd-year">2nd Year</SelectItem>
                      <SelectItem value="3rd-year">3rd Year</SelectItem>
                      <SelectItem value="4th-year">4th Year</SelectItem>
                      <SelectItem value="5th-year">5th Year</SelectItem>
                      <SelectItem value="graduate">Graduate</SelectItem>
                      <SelectItem value="postgraduate">Post Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="expectedGraduation">Expected Graduation Date *</Label>
                  <Input
                    id="expectedGraduation"
                    type="date"
                    value={formData.expectedGraduation}
                    onChange={(e) => handleInputChange('expectedGraduation', e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="currentCity">Current City *</Label>
                  <Input
                    id="currentCity"
                    value={formData.currentCity}
                    onChange={(e) => handleInputChange('currentCity', e.target.value)}
                    placeholder="City name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => handleInputChange('state', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="andhra-pradesh">Andhra Pradesh</SelectItem>
                      <SelectItem value="arunachal-pradesh">Arunachal Pradesh</SelectItem>
                      <SelectItem value="assam">Assam</SelectItem>
                      <SelectItem value="bihar">Bihar</SelectItem>
                      <SelectItem value="chhattisgarh">Chhattisgarh</SelectItem>
                      <SelectItem value="goa">Goa</SelectItem>
                      <SelectItem value="gujarat">Gujarat</SelectItem>
                      <SelectItem value="haryana">Haryana</SelectItem>
                      <SelectItem value="himachal-pradesh">Himachal Pradesh</SelectItem>
                      <SelectItem value="jharkhand">Jharkhand</SelectItem>
                      <SelectItem value="karnataka">Karnataka</SelectItem>
                      <SelectItem value="kerala">Kerala</SelectItem>
                      <SelectItem value="madhya-pradesh">Madhya Pradesh</SelectItem>
                      <SelectItem value="maharashtra">Maharashtra</SelectItem>
                      <SelectItem value="manipur">Manipur</SelectItem>
                      <SelectItem value="meghalaya">Meghalaya</SelectItem>
                      <SelectItem value="mizoram">Mizoram</SelectItem>
                      <SelectItem value="nagaland">Nagaland</SelectItem>
                      <SelectItem value="odisha">Odisha</SelectItem>
                      <SelectItem value="punjab">Punjab</SelectItem>
                      <SelectItem value="rajasthan">Rajasthan</SelectItem>
                      <SelectItem value="sikkim">Sikkim</SelectItem>
                      <SelectItem value="tamil-nadu">Tamil Nadu</SelectItem>
                      <SelectItem value="telangana">Telangana</SelectItem>
                      <SelectItem value="tripura">Tripura</SelectItem>
                      <SelectItem value="uttar-pradesh">Uttar Pradesh</SelectItem>
                      <SelectItem value="uttarakhand">Uttarakhand</SelectItem>
                      <SelectItem value="west-bengal">West Bengal</SelectItem>
                      <SelectItem value="delhi">Delhi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="pinCode">PIN Code *</Label>
                  <Input
                    id="pinCode"
                    value={formData.pinCode}
                    onChange={(e) => handleInputChange('pinCode', e.target.value)}
                    placeholder="6-digit PIN code"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="permanentAddress">Permanent Address</Label>
                <Textarea
                  id="permanentAddress"
                  value={formData.permanentAddress}
                  onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
                  placeholder="Enter your permanent address"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Team Details */}
          <Card>
            <CardHeader>
              <CardTitle>Team Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="teamName">Team Name *</Label>
                  <Input
                    id="teamName"
                    value={formData.teamName}
                    onChange={(e) => handleInputChange('teamName', e.target.value)}
                    placeholder="Enter your team name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="numberOfMembers">Number of Team Members *</Label>
                  <Select
                    value={formData.numberOfMembers}
                    onValueChange={updateTeamMembers}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select number" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 (Individual)</SelectItem>
                      <SelectItem value="2">2 Members</SelectItem>
                      <SelectItem value="3">3 Members</SelectItem>
                      <SelectItem value="4">4 Members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Additional Team Members */}
              {parseInt(formData.numberOfMembers) > 1 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Additional Team Members</h4>
                  {Array.from({ length: parseInt(formData.numberOfMembers) - 1 }, (_, index) => (
                    <Card key={index} className="p-4">
                      <h5 className="font-medium mb-3">Team Member {index + 2}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Name *</Label>
                          <Input
                            value={formData.teamMembers?.[index]?.name || ""}
                            onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                            placeholder="Full name"
                            required
                          />
                        </div>
                        <div>
                          <Label>Email *</Label>
                          <Input
                            type="email"
                            value={formData.teamMembers?.[index]?.email || ""}
                            onChange={(e) => handleTeamMemberChange(index, 'email', e.target.value)}
                            placeholder="Email address"
                            required
                          />
                        </div>
                        <div>
                          <Label>LinkedIn Profile</Label>
                          <Input
                            value={formData.teamMembers?.[index]?.linkedin || ""}
                            onChange={(e) => handleTeamMemberChange(index, 'linkedin', e.target.value)}
                            placeholder="LinkedIn URL"
                          />
                        </div>
                        <div>
                          <Label>Role in Team</Label>
                          <Input
                            value={formData.teamMembers?.[index]?.role || ""}
                            onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                            placeholder="e.g., Co-founder, Developer"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Venture Information */}
          <Card>
            <CardHeader>
              <CardTitle>Venture Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ventureName">Venture/Startup Name *</Label>
                  <Input
                    id="ventureName"
                    value={formData.ventureName}
                    onChange={(e) => handleInputChange('ventureName', e.target.value)}
                    placeholder="Your startup name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="industrySector">Industry Sector *</Label>
                  <Select
                    value={formData.industrySector}
                    onValueChange={(value) => handleInputChange('industrySector', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="fintech">Fintech</SelectItem>
                      <SelectItem value="e-commerce">E-commerce</SelectItem>
                      <SelectItem value="social-impact">Social Impact</SelectItem>
                      <SelectItem value="agriculture">Agriculture</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="websiteUrl">Website/Portfolio Link</Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="pitchVideoUrl">Pitch Video URL</Label>
                  <Input
                    id="pitchVideoUrl"
                    type="url"
                    value={formData.pitchVideoUrl}
                    onChange={(e) => handleInputChange('pitchVideoUrl', e.target.value)}
                    placeholder="YouTube/Vimeo link"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hearAboutSource">How did you hear about YFF? *</Label>
                <Select
                  value={formData.hearAboutSource}
                  onValueChange={(value) => handleInputChange('hearAboutSource', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social-media">Social Media</SelectItem>
                    <SelectItem value="college-network">College Network</SelectItem>
                    <SelectItem value="friend-referral">Friend Referral</SelectItem>
                    <SelectItem value="entrepreneurship-event">Entrepreneurship Event</SelectItem>
                    <SelectItem value="online-search">Online Search</SelectItem>
                    <SelectItem value="startup-community">Startup Community</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="specialRequirements">Special Requirements/Accommodations</Label>
                <Textarea
                  id="specialRequirements"
                  value={formData.specialRequirements}
                  onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                  placeholder="Any special requirements or accommodations needed"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                    placeholder="Emergency contact person"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
                  <Input
                    id="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                    placeholder="Emergency contact number"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consent & Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Consent & Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="privacyPolicy"
                  checked={formData.privacyPolicy}
                  onCheckedChange={(checked) => handleInputChange('privacyPolicy', checked)}
                />
                <Label htmlFor="privacyPolicy" className="text-sm">
                  I agree to the Privacy Policy and consent to data processing *
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="termsConditions"
                  checked={formData.termsConditions}
                  onCheckedChange={(checked) => handleInputChange('termsConditions', checked)}
                />
                <Label htmlFor="termsConditions" className="text-sm">
                  I agree to the Terms & Conditions of the Young Founders Floor competition *
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ageVerification"
                  checked={formData.ageVerification}
                  onCheckedChange={(checked) => handleInputChange('ageVerification', checked)}
                />
                <Label htmlFor="ageVerification" className="text-sm">
                  I confirm that I am between 18-25 years old and eligible to participate *
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-between items-center">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate('/young-founders-floor')}
            >
              Back to YFF Home
            </Button>
            
            <Button 
              type="submit" 
              disabled={loading}
              className="px-8"
            >
              {loading ? "Saving..." : "Save & Continue to Questionnaire"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default YffTeamInformation;
