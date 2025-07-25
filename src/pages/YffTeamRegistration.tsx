
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { YffTeamRegistrationForm } from '@/components/forms/YffTeamRegistrationForm';

/**
 * YFF Team Registration page - only accessible to authenticated users
 * Handles team leader registration for Young Founders Floor program
 */
export const YffTeamRegistration = () => {
  const { user, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <YffTeamRegistrationForm />
    </div>
  );
};
