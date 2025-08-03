
/**
 * @fileoverview YFF Questionnaire Form with Automatic AI Evaluation
 * 
 * Main questionnaire form that collects all application data and submits
 * through the auto-evaluation service for immediate AI processing.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2 } from 'lucide-react';
import { YffFormSections } from './YffFormSections';
import { YffQuestionnaireFormSubmission } from './YffQuestionnaireFormSubmission';
import { useAutosave } from '@/hooks/useAutosave';
import { YffAutosaveIndicator } from './YffAutosaveIndicator';
import type { YffFormData } from '@/types/yff-form';

const YffQuestionnaireForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Initialize form data with all required fields
  const [formData, setFormData] = useState<YffFormData>({
    // Basic Information
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    phoneNumber: '',
    countryCode: '+91',
    dateOfBirth: '',
    nationality: '',
    gender: '',
    
    // Team Information
    ventureName: '',
    teamName: '',
    numberOfTeamMembers: 1,
    teamMembers: [],
    
    // Location & Institution
    currentCity: '',
    state: '',
    pinCode: '',
    permanentAddress: '',
    institutionName: '',
    courseProgram: '',
    currentYearOfStudy: '',
    expectedGraduation: '',
    
    // Professional Details
    industrySector: '',
    website: '',
    linkedinProfile: '',
    socialMediaHandles: '',
    
    // Questionnaire Answers
    productStage: '',
    businessModel: '',
    targetMarket: '',
    problemSolution: '',
    marketSize: '',
    competitiveAdvantage: '',
    teamExperience: '',
    fundingNeeds: '',
    currentChallenges: '',
    whyYff: '',
    
    // Application Questions (backward compatibility)
    whyApplying: '',
    businessIdea: '',
    experience: '',
    challenges: '',
    goals: '',
    commitment: '',
    
    // Additional fields
    referralId: '',
  });

  // Autosave functionality
  const { saveData, lastSaved, isSaving, status } = useAutosave({
    formData,
    formType: 'yff-questionnaire'
  });

  // Auto-save when form data changes
  useEffect(() => {
    if (user?.id && Object.keys(formData).some(key => formData[key as keyof YffFormData])) {
      saveData(formData, 'yff-questionnaire');
    }
  }, [formData, user?.id, saveData]);

  // Form steps configuration
  const steps = [
    { title: 'Basic Information', fields: 8 },
    { title: 'Team Details', fields: 4 },
    { title: 'Location & Education', fields: 8 },
    { title: 'Professional Profile', fields: 4 },
    { title: 'Venture Questions', fields: 10 },
    { title: 'Review & Submit', fields: 0 },
  ];

  // Calculate progress
  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Handle form field updates
  const updateFormData = (updates: Partial<YffFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Form validation
  const validateCurrentStep = (): boolean => {
    // Basic validation logic - can be enhanced
    switch (currentStep) {
      case 0: // Basic Information
        return !!(formData.firstName && formData.lastName && formData.email && formData.phoneNumber);
      case 1: // Team Details
        return !!(formData.ventureName && formData.numberOfTeamMembers);
      case 2: // Location & Education
        return !!(formData.currentCity && formData.institutionName);
      case 3: // Professional Profile
        return !!(formData.industrySector);
      case 4: // Venture Questions
        return !!(formData.productStage && formData.problemSolution && formData.targetMarket);
      default:
        return true;
    }
  };

  // Handle successful submission
  const handleSubmissionSuccess = () => {
    setIsSubmitted(true);
    
    // Show success message and redirect after delay
    setTimeout(() => {
      navigate('/yff/success', { 
        state: { 
          message: 'Your application has been submitted successfully and is being evaluated by our AI system!' 
        } 
      });
    }, 2000);
  };

  // Handle step navigation with validation
  const handleStepNavigation = (direction: 'next' | 'previous') => {
    if (direction === 'next') {
      if (!validateCurrentStep()) {
        toast({
          title: "Incomplete Information",
          description: "Please fill in all required fields before proceeding.",
          variant: "destructive",
        });
        return;
      }
      handleNext();
    } else {
      handlePrevious();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-gray-600 mb-4">Please sign in to access the YFF application form.</p>
            <Button onClick={() => navigate('/young-founders-floor')}>
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Success!</h2>
            <p className="text-gray-600 mb-4">
              Your YFF application has been submitted and is being automatically evaluated.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>AI evaluation in progress...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Young Founders Floor Application
          </h1>
          <p className="text-gray-600">
            Step {currentStep + 1} of {totalSteps}: {steps[currentStep].title}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            {steps.map((step, index) => (
              <span 
                key={index}
                className={`${index <= currentStep ? 'text-blue-600 font-medium' : ''}`}
              >
                {step.title}
              </span>
            ))}
          </div>
        </div>

        {/* Autosave Indicator */}
        <YffAutosaveIndicator 
          status={status}
          lastSaved={lastSaved}
          isSaving={isSaving}
          className="mb-6"
        />

        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep].title}</CardTitle>
          </CardHeader>
          <CardContent>
            <YffFormSections
              currentStep={currentStep}
              formData={formData}
              updateFormData={updateFormData}
            />
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={() => handleStepNavigation('previous')}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          <div className="flex space-x-4">
            {currentStep === totalSteps - 1 ? (
              <YffQuestionnaireFormSubmission
                formData={formData}
                isSubmitting={isSubmitting}
                setIsSubmitting={setIsSubmitting}
                onSubmissionSuccess={handleSubmissionSuccess}
              />
            ) : (
              <Button
                onClick={() => handleStepNavigation('next')}
                disabled={!validateCurrentStep()}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YffQuestionnaireForm;
