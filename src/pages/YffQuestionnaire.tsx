/**
 * @fileoverview Young Founders Floor Questionnaire Page
 * 
 * Main application form for the Young Founders Floor competition.
 * Features comprehensive form validation, auto-save functionality,
 * and robust error handling with the fixed authentication system.
 * 
 * @version 2.0.1 - Fixed TypeScript compatibility and extracted form sections
 * @author 26ideas Development Team
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Save, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  YffFormData, 
  formSections, 
  renderEntrepreneurialSection, 
  renderMotivationSection, 
  renderAdditionalSection, 
  renderCommitmentSection 
} from '@/components/forms/YffFormSections';

/**
 * Initial form data with empty values
 */
const initialFormData: YffFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  nationality: '',
  currentLocation: '',
  currentEducation: '',
  institution: '',
  fieldOfStudy: '',
  graduationYear: '',
  hasStartupExperience: '',
  startupDetails: '',
  businessIdea: '',
  problemSolving: '',
  targetMarket: '',
  whyYFF: '',
  goals: '',
  contribution: '',
  skills: '',
  achievements: '',
  references: '',
  timeCommitment: '',
  availability: '',
  additionalInfo: '',
};

/**
 * YFF Questionnaire Component
 * 
 * Comprehensive application form with:
 * - Multi-step navigation
 * - Real-time validation
 * - Auto-save functionality
 * - Robust error handling
 * - Progress tracking
 */
const YffQuestionnaire = () => {
  // Authentication and navigation hooks
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state management
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<YffFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [individualId, setIndividualId] = useState<string | null>(null);

  // Calculate progress percentage
  const totalFields = formSections.reduce((sum, section) => sum + section.fields, 0);
  const filledFields = Object.values(formData).filter(value => value.trim() !== '').length;
  const progressPercentage = Math.round((filledFields / totalFields) * 100);

  /**
   * Authentication Check Effect
   * Redirects unauthenticated users to sign-in
   */
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access the YFF application form.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [user, authLoading, navigate, toast]);

  /**
   * User Data Loading Effect
   * Loads existing application data and user profile information
   */
  useEffect(() => {
    if (user?.email) {
      loadUserData();
    }
  }, [user]);

  /**
   * Load User Data Function
   * Fetches existing application and profile data
   */
  const loadUserData = async () => {
    if (!user?.email) return;

    try {
      setIsLoading(true);
      console.log('Loading user data for:', user.email);

      // First, get or create individual record
      const { data: individuals, error: individualsError } = await supabase
        .from('individuals')
        .select('individual_id, first_name, last_name, email, mobile, dob, nationality, city, country')
        .eq('email', user.email)
        .limit(1);

      if (individualsError) {
        console.error('Error fetching individual:', individualsError);
        throw individualsError;
      }

      let currentIndividualId: string;

      if (individuals && individuals.length > 0) {
        // Use existing individual record
        const individual = individuals[0];
        currentIndividualId = individual.individual_id;
        setIndividualId(currentIndividualId);
        
        // Pre-populate form with existing data
        setFormData(prev => ({
          ...prev,
          firstName: individual.first_name || '',
          lastName: individual.last_name || '',
          email: individual.email || '',
          phone: individual.mobile || '',
          dateOfBirth: individual.dob || '',
          nationality: individual.nationality || '',
          currentLocation: `${individual.city || ''}, ${individual.country || ''}`.replace(', ', individual.city && individual.country ? ', ' : ''),
        }));
      } else {
        // Create new individual record
        const { data: newIndividual, error: createError } = await supabase
          .from('individuals')
          .insert({
            first_name: user.user_metadata?.full_name?.split(' ')[0] || '',
            last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            email: user.email,
            is_founder: true,
            privacy_consent: true,
            data_processing_consent: true,
          })
          .select('individual_id')
          .single();

        if (createError) {
          console.error('Error creating individual:', createError);
          throw createError;
        }

        currentIndividualId = newIndividual.individual_id;
        setIndividualId(currentIndividualId);
        
        // Pre-populate with user metadata
        setFormData(prev => ({
          ...prev,
          firstName: user.user_metadata?.full_name?.split(' ')[0] || '',
          lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          email: user.email,
        }));
      }

      // Load existing application data
      const { data: applications, error: appError } = await supabase
        .from('yff_applications')
        .select('application_id, answers, status')
        .eq('individual_id', currentIndividualId)
        .eq('application_round', 'Round 1')
        .limit(1);

      if (appError) {
        console.error('Error fetching application:', appError);
        // Don't throw error here - user might not have an application yet
      } else if (applications && applications.length > 0) {
        const application = applications[0];
        setApplicationId(application.application_id);
        
        // Load saved answers into form
        if (application.answers && typeof application.answers === 'object') {
          const answers = application.answers as Record<string, any>;
          const loadedFormData = { ...initialFormData };
          
          Object.keys(answers).forEach(key => {
            if (key in loadedFormData) {
              loadedFormData[key as keyof YffFormData] = String(answers[key] || '');
            }
          });
          
          setFormData(loadedFormData);
        }

        // Show status message if application was already submitted
        if (application.status === 'submitted') {
          toast({
            title: "Application Found",
            description: "Your YFF application has been loaded. You can review and update it.",
          });
        }
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error Loading Data",
        description: "There was an issue loading your information. You can still fill out the form.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Form Input Change Handler
   * Updates form data and tracks unsaved changes
   */
  const handleInputChange = (field: keyof YffFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };

  /**
   * Convert form data to Supabase Json compatible format
   */
  const convertFormDataToJson = (data: YffFormData): Record<string, any> => {
    return Object.keys(data).reduce((acc, key) => {
      acc[key] = data[key as keyof YffFormData];
      return acc;
    }, {} as Record<string, any>);
  };

  /**
   * Auto-Save Function
   * Saves form progress automatically
   */
  const autoSave = async () => {
    if (!individualId || !hasUnsavedChanges) return;

    try {
      setIsSaving(true);
      console.log('Auto-saving application...');

      // Convert form data to Json format
      const answersJson = convertFormDataToJson(formData);

      if (applicationId) {
        // Update existing application
        const { error } = await supabase
          .from('yff_applications')
          .update({
            answers: answersJson,
            updated_at: new Date().toISOString(),
          })
          .eq('application_id', applicationId);

        if (error) throw error;
      } else {
        // Create new application
        const { data, error } = await supabase
          .from('yff_applications')
          .insert({
            individual_id: individualId,
            application_round: 'Round 1',
            status: 'draft',
            answers: answersJson,
          })
          .select('application_id')
          .single();

        if (error) throw error;
        setApplicationId(data.application_id);
      }

      setHasUnsavedChanges(false);
      console.log('Auto-save successful');
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Manual Save Function
   * Explicitly saves form data with user feedback
   */
  const handleSave = async () => {
    await autoSave();
    if (!hasUnsavedChanges) {
      toast({
        title: "Progress Saved",
        description: "Your application progress has been saved successfully.",
      });
    }
  };

  /**
   * Form Submission Handler
   * Validates and submits the complete application
   */
  const handleSubmit = async () => {
    // Validation check
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phone', 'dateOfBirth',
      'businessIdea', 'problemSolving', 'whyYFF', 'goals'
    ];
    
    const missingFields = requiredFields.filter(field => 
      !formData[field as keyof YffFormData]?.trim()
    );

    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: `Please complete all required fields: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log('Submitting application...');

      // First ensure we have an individual record
      if (!individualId) {
        throw new Error('No individual record found. Please refresh and try again.');
      }

      // Update individual record with latest info
      const { error: updateIndividualError } = await supabase
        .from('individuals')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          mobile: formData.phone,
          dob: formData.dateOfBirth,
          nationality: formData.nationality,
          updated_at: new Date().toISOString(),
        })
        .eq('individual_id', individualId);

      if (updateIndividualError) {
        console.error('Error updating individual:', updateIndividualError);
        throw updateIndividualError;
      }

      // Convert form data to Json format
      const answersJson = convertFormDataToJson(formData);

      // Submit or update application
      if (applicationId) {
        // Update existing application
        const { error } = await supabase
          .from('yff_applications')
          .update({
            status: 'submitted',
            answers: answersJson,
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('application_id', applicationId);

        if (error) throw error;
      } else {
        // Create new application
        const { data, error } = await supabase
          .from('yff_applications')
          .insert({
            individual_id: individualId,
            application_round: 'Round 1',
            status: 'submitted',
            answers: answersJson,
            submitted_at: new Date().toISOString(),
          })
          .select('application_id')
          .single();

        if (error) throw error;
        setApplicationId(data.application_id);
      }

      // Success notification
      toast({
        title: "Application Submitted Successfully!",
        description: "Thank you for applying to Young Founders Floor. We'll review your application and get back to you soon.",
      });

      // Redirect to thank you page
      setTimeout(() => {
        navigate('/young-founders-floor');
      }, 2000);

    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Auto-save effect
   * Triggers auto-save when form data changes
   */
  useEffect(() => {
    if (hasUnsavedChanges && individualId) {
      const timeoutId = setTimeout(autoSave, 2000); // Auto-save after 2 seconds of inactivity
      return () => clearTimeout(timeoutId);
    }
  }, [formData, hasUnsavedChanges, individualId]);

  // Show loading spinner while checking authentication
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your application...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  /**
   * Render Personal Information Section
   */
  const renderPersonalSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            placeholder="Enter your first name"
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            placeholder="Enter your last name"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="Enter your phone number"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <Label htmlFor="nationality">Nationality</Label>
          <Input
            id="nationality"
            value={formData.nationality}
            onChange={(e) => handleInputChange('nationality', e.target.value)}
            placeholder="Enter your nationality"
          />
        </div>
        <div>
          <Label htmlFor="currentLocation">Current Location</Label>
          <Input
            id="currentLocation"
            value={formData.currentLocation}
            onChange={(e) => handleInputChange('currentLocation', e.target.value)}
            placeholder="City, Country"
          />
        </div>
      </div>
    </div>
  );

  /**
   * Render Educational Background Section
   */
  const renderEducationSection = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="currentEducation">Current Education Status</Label>
        <RadioGroup 
          value={formData.currentEducation} 
          onValueChange={(value) => handleInputChange('currentEducation', value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="undergraduate" id="undergraduate" />
            <Label htmlFor="undergraduate">Undergraduate Student</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="graduate" id="graduate" />
            <Label htmlFor="graduate">Graduate Student</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="recent-graduate" id="recent-graduate" />
            <Label htmlFor="recent-graduate">Recent Graduate</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="working-professional" id="working-professional" />
            <Label htmlFor="working-professional">Working Professional</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="institution">Institution/University</Label>
          <Input
            id="institution"
            value={formData.institution}
            onChange={(e) => handleInputChange('institution', e.target.value)}
            placeholder="Enter your institution name"
          />
        </div>
        <div>
          <Label htmlFor="fieldOfStudy">Field of Study</Label>
          <Input
            id="fieldOfStudy"
            value={formData.fieldOfStudy}
            onChange={(e) => handleInputChange('fieldOfStudy', e.target.value)}
            placeholder="Enter your field of study"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="graduationYear">Expected/Actual Graduation Year</Label>
        <Input
          id="graduationYear"
          type="number"
          min="2020"
          max="2030"
          value={formData.graduationYear}
          onChange={(e) => handleInputChange('graduationYear', e.target.value)}
          placeholder="e.g., 2024"
        />
      </div>
    </div>
  );

  /**
   * Render the appropriate section based on current step
   */
  const renderCurrentSection = () => {
    const sectionProps = { formData, handleInputChange };
    
    switch (currentStep) {
      case 0: return renderPersonalSection();
      case 1: return renderEducationSection();
      case 2: return renderEntrepreneurialSection(sectionProps);
      case 3: return renderMotivationSection(sectionProps);
      case 4: return renderAdditionalSection(sectionProps);
      case 5: return renderCommitmentSection(sectionProps);
      default: return renderPersonalSection();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Young Founders Floor Application
          </h1>
          <p className="text-gray-600">
            Complete your application to join the next generation of entrepreneurs
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Progress</span>
            <div className="flex items-center space-x-2">
              {isSaving && (
                <div className="flex items-center text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-1"></div>
                  Saving...
                </div>
              )}
              <span className="text-sm text-gray-600">{progressPercentage}% complete</span>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Step Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 overflow-x-auto">
            {formSections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => setCurrentStep(index)}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  index === currentStep
                    ? 'bg-blue-600 text-white'
                    : index < currentStep
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {index < currentStep && <CheckCircle className="w-4 h-4 inline mr-1" />}
                {section.title}
              </button>
            ))}
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                {currentStep + 1}
              </span>
              {formSections[currentStep].title}
            </CardTitle>
            <CardDescription>
              Step {currentStep + 1} of {formSections.length}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {renderCurrentSection()}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={isSaving || !hasUnsavedChanges}
                  className="flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Progress
                </Button>

                {currentStep === formSections.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex items-center bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2"></div>
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Submit Application
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentStep(Math.min(formSections.length - 1, currentStep + 1))}
                    className="flex items-center"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Need Help?</h4>
                <p className="text-sm text-blue-700">
                  Your progress is automatically saved as you fill out the form. 
                  You can return anytime to complete your application. 
                  For assistance, contact us at support@26ideas.org
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default YffQuestionnaire;
