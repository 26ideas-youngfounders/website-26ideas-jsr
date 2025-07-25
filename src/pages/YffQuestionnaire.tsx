
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

import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { YffQuestionnaireForm } from '@/components/forms/YffQuestionnaireForm';

/**
 * YFF Questionnaire Page Component
 * 
 * Protected page that requires authentication and completed team registration.
 * Displays the conditional questionnaire form based on user's stage selection.
 * 
 * @returns {JSX.Element} The questionnaire page or redirect
 */
const YffQuestionnaire = () => {
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

export default YffQuestionnaire;
