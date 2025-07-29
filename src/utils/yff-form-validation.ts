
import { YffTeamRegistrationData } from '@/components/forms/YffTeamRegistrationForm';

/**
 * Validation utility for YFF Team Registration Form
 * Ensures data integrity before submission to prevent 400 errors
 */

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors: { [key: string]: string };
}

/**
 * Validates email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format
 */
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  const phoneRegex = /^\d{8,15}$/;
  return phoneRegex.test(phoneNumber.replace(/\D/g, ''));
};

/**
 * Validates URL format
 */
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Main validation function that checks all form data
 */
export const validateFormData = (data: YffTeamRegistrationData): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: { [key: string]: string } = {};
  
  // Validate required fields
  const requiredFields = {
    teamName: 'Team name',
    projectName: 'Project name', 
    projectDescription: 'Project description',
    country: 'Country',
    city: 'City',
    referralSource: 'Referral source'
  };

  Object.entries(requiredFields).forEach(([key, label]) => {
    const value = data[key as keyof YffTeamRegistrationData];
    if (!value || (typeof value === 'string' && !value.trim())) {
      const error = `${label} is required`;
      errors.push(error);
      fieldErrors[key] = error;
    }
  });
  
  // Validate terms acceptance
  if (!data.termsAccepted) {
    const error = 'You must accept the terms and conditions';
    errors.push(error);
    fieldErrors.termsAccepted = error;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors
  };
};

/**
 * Sanitizes and prepares data for database submission
 */
export const sanitizeFormData = (data: YffTeamRegistrationData, userId: string) => {
  return {
    individual_id: userId,
    team_name: data.teamName?.trim() || '',
    project_name: data.projectName?.trim() || '',
    project_description: data.projectDescription?.trim() || '',
    country: data.country?.trim() || '',
    city: data.city?.trim() || '',
    referral_source: data.referralSource?.trim() || '',
    terms_accepted: data.termsAccepted,
    application_status: 'registration_completed'
  };
};
