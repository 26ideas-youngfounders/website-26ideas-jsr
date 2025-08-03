
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import YffQuestionnaireForm from '@/components/forms/YffQuestionnaireForm';

/**
 * YFF Questionnaire page - only accessible to authenticated users
 * Handles questionnaire submission for Young Founders Floor program
 */
export const YffQuestionnaire = () => {
  const { user } = useAuth();

  // Ensure page starts at top when mounted
  useEffect(() => {
    window.scrollTo(0, 0);
    console.log("📄 YFF Questionnaire page loaded - scrolled to absolute top");
  }, []);

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/young-founders-floor" replace />;
  }

  return <YffQuestionnaireForm />;
};
