
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { YffTeamRegistrationForm } from '@/components/forms/YffTeamRegistrationForm';

/**
 * YFF Team Registration page - only accessible to authenticated users
 * Handles team leader registration for Young Founders Floor program
 */
export const YffTeamRegistration = () => {
  const { user } = useAuth();

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/young-founders-floor" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <YffTeamRegistrationForm />
    </div>
  );
};
