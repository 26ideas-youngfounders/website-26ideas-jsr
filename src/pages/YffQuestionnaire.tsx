
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { YffQuestionnaireForm } from '@/components/forms/YffQuestionnaireForm';
import { parseRegistrationData, type YffRegistration } from '@/types/yff-registration';
import { toast } from 'sonner';

/**
 * YFF Questionnaire page - accessible only to users with completed registration
 * Handles questionnaire completion for registered YFF applicants
 */
export const YffQuestionnaire = () => {
  const { user } = useAuth();
  const [registration, setRegistration] = useState<YffRegistration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Ensure page starts at top when mounted
  useEffect(() => {
    window.scrollTo(0, 0);
    console.log("📄 YFF Questionnaire page loaded - scrolled to absolute top");
  }, []);

  // Load registration data on mount
  useEffect(() => {
    const loadRegistration = async () => {
      if (!user?.id) {
        console.log("🔐 No user found - will redirect to landing page");
        setIsLoading(false);
        return;
      }

      try {
        console.log("📋 Loading registration data for user:", user.id);
        
        const { data, error } = await supabase
          .from('yff_team_registrations')
          .select('*')
          .eq('individual_id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            console.log("❌ No registration found - redirecting to registration page");
            toast.error('Registration Required', {
              description: 'Please complete your team registration first.',
              duration: 5000,
            });
            setIsLoading(false);
            return;
          }
          console.error("❌ Error loading registration:", error);
          toast.error('Error Loading Registration', {
            description: 'Failed to load your registration data. Please try again.',
            duration: 5000,
          });
          setIsLoading(false);
          return;
        }

        if (!data) {
          console.log("❌ No registration data found");
          toast.error('Registration Required', {
            description: 'Please complete your team registration first.',
            duration: 5000,
          });
          setIsLoading(false);
          return;
        }

        // Parse and validate registration data
        const parsedRegistration = parseRegistrationData(data);
        setRegistration(parsedRegistration);
        
        // Check if questionnaire is already completed
        if (parsedRegistration.questionnaire_completed_at) {
          console.log("✅ Questionnaire already completed");
          setHasCompleted(true);
        }
        
        console.log("✅ Registration data loaded successfully");
        setIsLoading(false);
      } catch (error) {
        console.error("❌ Error in loadRegistration:", error);
        toast.error('System Error', {
          description: 'An unexpected error occurred. Please try again.',
          duration: 5000,
        });
        setIsLoading(false);
      }
    };

    loadRegistration();
  }, [user?.id]);

  // Handle questionnaire completion
  const handleQuestionnaireComplete = () => {
    console.log("✅ Questionnaire completed successfully");
    setHasCompleted(true);
    toast.success('Application Complete!', {
      description: 'Your YFF application has been submitted successfully.',
      duration: 5000,
    });
  };

  // Redirect conditions
  if (!user) {
    return <Navigate to="/young-founders-floor" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!registration) {
    return <Navigate to="/yff/team-registration" replace />;
  }

  if (hasCompleted) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-green-800 mb-4">
            Application Completed!
          </h1>
          <p className="text-green-700 mb-6">
            Thank you for completing your YFF application. We will review your submission and get back to you soon.
          </p>
          <div className="text-sm text-green-600">
            <p>Application Status: <span className="font-semibold">Submitted</span></p>
            <p>Submitted At: {new Date(registration.questionnaire_completed_at!).toLocaleString()}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <YffQuestionnaireForm 
        registration={registration} 
        onComplete={handleQuestionnaireComplete}
      />
    </div>
  );
};
