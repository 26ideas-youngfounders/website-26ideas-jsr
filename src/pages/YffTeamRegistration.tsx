
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { YffTeamRegistrationForm } from '@/components/forms/YffTeamRegistrationForm';

/**
 * YFF Team Registration page - only accessible to authenticated users
 * Handles team leader registration for Young Founders Floor program
 */
export const YffTeamRegistration = () => {
  const { user } = useAuth();

  // Ensure page starts at top when mounted
  useEffect(() => {
    window.scrollTo(0, 0);
    console.log("📄 YFF Team Registration page loaded - scrolled to absolute top");
  }, []);

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/young-founders-floor" replace />;
  }

  const handleComplete = () => {
    console.log('✅ Team registration completed');
  };

  return <YffTeamRegistrationForm onComplete={handleComplete} />;
};
