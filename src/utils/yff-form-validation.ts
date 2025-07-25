
/**
 * @fileoverview YFF Form Validation Utilities
 * 
 * Comprehensive form validation for YFF registration data
 * with age and word count enforcement.
 */

import { validateAge, validateTeamMembersAges, validateQuestionnaireWordCounts } from '@/utils/registration-validation';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors: { [key: string]: string };
}

/**
 * Validate complete form data
 */
export const validateFormData = (data: any): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: { [key: string]: string } = {};

  // Validate age for main applicant
  if (data.dateOfBirth) {
    const ageValidation = validateAge(data.dateOfBirth);
    if (!ageValidation.isValid) {
      errors.push(`Team leader: ${ageValidation.error}`);
      fieldErrors.dateOfBirth = ageValidation.error || 'Invalid age';
    }
  }

  // Validate team members' ages
  if (data.teamMembers && data.teamMembers.length > 0) {
    const teamAgeValidation = validateTeamMembersAges(data.teamMembers);
    if (!teamAgeValidation.isValid) {
      errors.push(...teamAgeValidation.errors);
    }
  }

  // Validate questionnaire word counts if present
  if (data.questionnaireAnswers) {
    const wordCountValidation = validateQuestionnaireWordCounts(data.questionnaireAnswers);
    if (!wordCountValidation.isValid) {
      errors.push(...wordCountValidation.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors
  };
};

/**
 * Sanitize form data for submission
 */
export const sanitizeFormData = (data: any, userId: string) => {
  return {
    individual_id: userId,
    full_name: data.fullName?.trim() || '',
    email: data.email?.trim() || '',
    phone_number: data.phoneNumber?.trim() || '',
    country_code: data.countryCode || '+91',
    date_of_birth: data.dateOfBirth || '',
    current_city: data.currentCity?.trim() || '',
    state: data.state?.trim() || '',
    pin_code: data.pinCode?.trim() || '',
    permanent_address: data.permanentAddress?.trim() || '',
    gender: data.gender || '',
    institution_name: data.institutionName?.trim() || '',
    course_program: data.courseProgram?.trim() || '',
    current_year_of_study: data.currentYearOfStudy?.trim() || '',
    expected_graduation: data.expectedGraduation?.trim() || '',
    number_of_team_members: data.numberOfTeamMembers || 1,
    team_members: JSON.stringify(data.teamMembers || []),
    venture_name: data.ventureName?.trim() || null,
    industry_sector: data.industrySector?.trim() || null,
    team_name: data.teamName?.trim() || null,
    website: data.website?.trim() || null,
    linkedin_profile: data.linkedinProfile?.trim() || null,
    social_media_handles: data.socialMediaHandles?.trim() || null,
    referral_id: data.referralId?.trim() || null,
    application_status: 'registration_completed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};
