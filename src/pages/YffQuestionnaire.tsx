
/**
 * @fileoverview YFF Questionnaire Page
 * 
 * Conditional questionnaire form that shows different questions based on 
 * the user's selected stage (Idea Stage vs Early Revenue). Integrates with 
 * the unified team registration system for seamless data storage.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { YffQuestionnaireForm } from '@/components/forms/YffQuestionnaireForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

/**
 * YFF Questionnaire Page Component
 * 
 * Protected page that requires authentication and completed team registration.
 * Loads the user's registration data and displays the conditional questionnaire form.
 * 
 * @returns {JSX.Element} The questionnaire page or redirect
 */
const YffQuestionnaire = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ensure page starts at top when mounted
  useEffect(() => {
    window.scrollTo(0, 0);
    console.log("📄 YFF Questionnaire page loaded - scrolled to absolute top");
  }, []);

  // Load user's registration data
  useEffect(() => {
    const loadRegistration = async () => {
      if (!user) return;

      try {
        console.log('🔍 Loading registration data for user:', user.id);
        
        const { data: registrationData, error: regError } = await supabase
          .from('yff_team_registrations')
          .select('*')
          .eq('individual_id', user.id)
          .single();

        if (regError) {
          if (regError.code === 'PGRST116') {
            // No registration found - redirect to registration page
            console.log('⚠️ No registration found, redirecting to registration');
            navigate('/yff/team-registration');
            return;
          }
          
          console.error('❌ Error loading registration:', regError);
          setError('Failed to load your registration data. Please try again.');
          return;
        }

        if (!registrationData) {
          console.log('⚠️ No registration data found, redirecting to registration');
          navigate('/yff/team-registration');
          return;
        }

        console.log('✅ Registration data loaded:', registrationData);
        setRegistration(registrationData);
        
      } catch (error) {
        console.error('❌ Error in loadRegistration:', error);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadRegistration();
  }, [user, navigate]);

  /**
   * Handle questionnaire completion
   * Redirects to home page and shows success message
   */
  const handleComplete = () => {
    console.log('✅ Questionnaire completed successfully');
    
    toast.success('Application submitted successfully!', {
      description: 'Thank you for applying to the Young Founders Floor program.',
      duration: 5000,
    });

    // Redirect to home page
    navigate('/');
  };

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/young-founders-floor" replace />;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your questionnaire...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Questionnaire</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show questionnaire form with proper props
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          YFF Application Questionnaire
        </h1>
        <p className="text-gray-600">
          Please complete the following questions to finalize your application.
        </p>
      </div>

      <YffQuestionnaireForm 
        registration={registration} 
        onComplete={handleComplete} 
      />
    </div>
  );
};

export default YffQuestionnaire;
