
/**
 * @fileoverview YFF Conversational Questionnaire Page
 * 
 * A conversational questionnaire experience with AI-powered feedback
 * for the "Tell us about your idea" question. Can be extended for other questions.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ConversationalQuestionnaire } from '@/components/forms/ConversationalQuestionnaire';
import { QuestionConfig } from '@/types/ai-feedback';
import { YffTeamRegistrationExtended } from '@/types/yff-conversational';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * YFF Conversational Questionnaire Page
 * 
 * Protected page that provides a conversational experience for answering
 * questionnaire questions with AI-powered feedback and guidance.
 * 
 * @returns {JSX.Element} The conversational questionnaire page or redirect
 */
export const YffConversationalQuestionnaire = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState<YffTeamRegistrationExtended | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Question configurations - easily extendable for more questions
  const questions: QuestionConfig[] = [
    {
      id: 'idea_description',
      title: 'Tell us about your idea',
      placeholder: 'Describe your business idea in detail. What problem does it solve? Who is your target audience? What makes it unique?',
      maxWords: 300,
      systemPrompt: `You are an expert startup evaluator for the Young Founders Floor competition. 

Analyze the following business idea description and provide constructive, actionable feedback. Consider:
- Clarity and specificity of the problem being solved
- Target audience definition and size
- Uniqueness and differentiation from existing solutions  
- Market opportunity and potential
- Feasibility and execution potential
- Areas that need more detail or clarification

Provide feedback that helps the founder improve their pitch and think more deeply about their idea.`,
    },
    // More questions can be added here in the future
  ];

  const currentQuestion = questions[currentQuestionIndex];

  // Ensure page starts at top when mounted
  useEffect(() => {
    window.scrollTo(0, 0);
    console.log("📄 YFF Conversational Questionnaire page loaded");
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
        setRegistration(registrationData as YffTeamRegistrationExtended);
        
        // Load existing answers if available - handle both possible field names
        const existingAnswers = (registrationData as any).conversational_answers || {};
        if (Object.keys(existingAnswers).length > 0) {
          setAnswers(existingAnswers);
          console.log('🔄 Loaded existing conversational answers');
        }
        
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
   * Handle answer update
   */
  const handleAnswer = async (answer: string) => {
    if (!currentQuestion || !registration?.id) return;

    const updatedAnswers = {
      ...answers,
      [currentQuestion.id]: answer,
    };

    setAnswers(updatedAnswers);

    // Auto-save to database
    try {
      await supabase
        .from('yff_team_registrations')
        .update({
          conversational_answers: updatedAnswers,
          updated_at: new Date().toISOString(),
        })
        .eq('id', registration.id);

      console.log('💾 Auto-saved conversational answer');
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    }
  };

  /**
   * Handle moving to next question
   */
  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      toast.success('Moving to next question!');
    } else {
      // Complete the conversational questionnaire
      try {
        await supabase
          .from('yff_team_registrations')
          .update({
            conversational_answers: answers,
            conversational_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', registration!.id);

        toast.success('Conversational questionnaire completed!', {
          description: 'Redirecting to the full application form.',
        });

        // Redirect to full questionnaire
        navigate('/yff/questionnaire');
      } catch (error) {
        console.error('❌ Error completing conversational questionnaire:', error);
        toast.error('Failed to save progress. Please try again.');
      }
    }
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      navigate('/yff/team-registration');
    }
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
            <Button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8 space-y-4">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            YFF Application - Step {currentQuestionIndex + 1} of {questions.length}
          </h1>
          <p className="text-gray-600">
            Get AI-powered feedback to improve your answers before submission.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Question */}
      <ConversationalQuestionnaire
        question={currentQuestion}
        onAnswer={handleAnswer}
        onNext={handleNext}
        initialAnswer={answers[currentQuestion.id] || ''}
      />
    </div>
  );
};
