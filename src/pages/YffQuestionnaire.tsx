
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { YffQuestionnaireForm } from '@/components/forms/YffQuestionnaireForm';

/**
 * YFF Questionnaire Page
 * Displays conditional questions based on product stage
 */
const YffQuestionnaire = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user's team registration data
  useEffect(() => {
    const loadRegistration = async () => {
      if (!user?.id) {
        navigate('/young-founders-floor');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('yff_team_registrations')
          .select('*')
          .eq('individual_id', user.id)
          .single();

        if (error) {
          console.error('Error loading registration:', error);
          toast.error('Registration not found. Please complete team registration first.');
          navigate('/yff/team-registration');
          return;
        }

        // If questionnaire is already completed, redirect to home
        if (data.application_status === 'application_completed') {
          toast.success('Your application has already been submitted!');
          navigate('/', { state: { applicationSubmitted: true } });
          return;
        }

        setRegistration(data);
      } catch (error) {
        console.error('Error loading registration:', error);
        toast.error('Failed to load registration data.');
        navigate('/yff/team-registration');
      } finally {
        setIsLoading(false);
      }
    };

    loadRegistration();
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-600">Loading your application...</p>
        </div>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">Registration not found. Please complete team registration first.</p>
          <Button 
            onClick={() => navigate('/yff/team-registration')} 
            className="mt-4"
          >
            Go to Team Registration
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          YFF Application Questionnaire
        </h1>
        <p className="text-gray-600">
          Complete your application by answering the questions below
        </p>
      </div>

      <YffQuestionnaireForm 
        registration={registration}
        onComplete={() => {
          toast.success('Application submitted successfully!');
          navigate('/', { state: { applicationSubmitted: true } });
        }}
      />
    </div>
  );
};

export default YffQuestionnaire;
