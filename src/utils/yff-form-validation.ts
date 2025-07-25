
import { FormValues, TeamMember } from '@/components/forms/YffTeamRegistrationForm';

/**
 * Validation utility for YFF Team Registration Form
 * Ensures data integrity before submission to prevent 400 errors
 */

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates required fields for the team leader
 */
export const validateLeaderData = (data: FormValues): string[] => {
  const errors: string[] = [];
  
  const requiredFields = {
    fullName: 'Full name',
    email: 'Email',
    phoneNumber: 'Phone number',
    dateOfBirth: 'Date of birth',
    currentCity: 'Current city',
    state: 'State',
    pinCode: 'Pin code',
    permanentAddress: 'Permanent address',
    gender: 'Gender',
    institutionName: 'Institution name',
    courseProgram: 'Course/program',
    currentYearOfStudy: 'Current year of study',
    expectedGraduation: 'Expected graduation',
  };

  Object.entries(requiredFields).forEach(([key, label]) => {
    const value = data[key as keyof FormValues];
    if (!value || (typeof value === 'string' && !value.trim())) {
      errors.push(`${label} is required`);
    }
  });

  return errors;
};

/**
 * Validates team member data
 */
export const validateTeamMemberData = (member: TeamMember, index: number): string[] => {
  const errors: string[] = [];
  const memberNum = index + 1;
  
  const requiredFields = {
    fullName: 'Full name',
    email: 'Email',
    phoneNumber: 'Phone number',
    dateOfBirth: 'Date of birth',
    currentCity: 'Current city',
    state: 'State',
    pinCode: 'Pin code',
    permanentAddress: 'Permanent address',
    gender: 'Gender',
    institutionName: 'Institution name',
    courseProgram: 'Course/program',
    currentYearOfStudy: 'Current year of study',
    expectedGraduation: 'Expected graduation',
  };

  Object.entries(requiredFields).forEach(([key, label]) => {
    const value = member[key as keyof TeamMember];
    if (!value || (typeof value === 'string' && !value.trim())) {
      errors.push(`Team member ${memberNum}: ${label} is required`);
    }
  });

  return errors;
};

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
 * Validates pin code format
 */
export const validatePinCode = (pinCode: string): boolean => {
  const pinRegex = /^\d{6}$/;
  return pinRegex.test(pinCode);
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
export const validateFormData = (data: FormValues): ValidationResult => {
  const errors: string[] = [];
  
  // Validate leader data
  errors.push(...validateLeaderData(data));
  
  // Validate number of team members
  if (data.numberOfTeamMembers < 1 || data.numberOfTeamMembers > 5) {
    errors.push('Number of team members must be between 1 and 5');
  }
  
  // Validate team members if more than 1 member
  if (data.numberOfTeamMembers > 1) {
    const requiredMembers = data.numberOfTeamMembers - 1;
    
    if (!data.teamMembers || data.teamMembers.length < requiredMembers) {
      errors.push(`Please provide information for all ${requiredMembers} team member(s)`);
    } else {
      // Validate each team member
      data.teamMembers.slice(0, requiredMembers).forEach((member, index) => {
        errors.push(...validateTeamMemberData(member, index));
      });
    }
  }
  
  // Validate email formats
  if (data.email && !validateEmail(data.email)) {
    errors.push('Invalid email format');
  }
  
  data.teamMembers?.forEach((member, index) => {
    if (member.email && !validateEmail(member.email)) {
      errors.push(`Team member ${index + 1}: Invalid email format`);
    }
  });
  
  // Validate phone numbers
  if (data.phoneNumber && !validatePhoneNumber(data.phoneNumber)) {
    errors.push('Invalid phone number format');
  }
  
  data.teamMembers?.forEach((member, index) => {
    if (member.phoneNumber && !validatePhoneNumber(member.phoneNumber)) {
      errors.push(`Team member ${index + 1}: Invalid phone number format`);
    }
  });
  
  // Validate pin codes
  if (data.pinCode && !validatePinCode(data.pinCode)) {
    errors.push('Pin code must be 6 digits');
  }
  
  data.teamMembers?.forEach((member, index) => {
    if (member.pinCode && !validatePinCode(member.pinCode)) {
      errors.push(`Team member ${index + 1}: Pin code must be 6 digits`);
    }
  });
  
  // Validate URLs if provided
  if (data.website && !validateUrl(data.website)) {
    errors.push('Invalid website URL format');
  }
  
  if (data.linkedinProfile && !validateUrl(data.linkedinProfile)) {
    errors.push('Invalid LinkedIn URL format');
  }
  
  data.teamMembers?.forEach((member, index) => {
    if (member.linkedinProfile && !validateUrl(member.linkedinProfile)) {
      errors.push(`Team member ${index + 1}: Invalid LinkedIn URL format`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitizes and prepares data for database submission
 */
export const sanitizeFormData = (data: FormValues, userId: string) => {
  // Prepare team members data (exclude the leader)
  const teamMembersData = data.numberOfTeamMembers > 1 
    ? data.teamMembers.slice(0, data.numberOfTeamMembers - 1)
    : [];

  // Sanitize team members data
  const sanitizedTeamMembers = teamMembersData.map(member => ({
    fullName: member.fullName?.trim() || '',
    email: member.email?.trim() || '',
    phoneNumber: member.phoneNumber?.trim() || '',
    countryCode: member.countryCode || '+91',
    dateOfBirth: member.dateOfBirth?.trim() || '',
    currentCity: member.currentCity?.trim() || '',
    state: member.state?.trim() || '',
    pinCode: member.pinCode?.trim() || '',
    permanentAddress: member.permanentAddress?.trim() || '',
    gender: member.gender?.trim() || '',
    institutionName: member.institutionName?.trim() || '',
    courseProgram: member.courseProgram?.trim() || '',
    currentYearOfStudy: member.currentYearOfStudy?.trim() || '',
    expectedGraduation: member.expectedGraduation?.trim() || '',
    linkedinProfile: member.linkedinProfile?.trim() || null,
  }));

  // Return sanitized data matching the database schema
  return {
    individual_id: userId,
    full_name: data.fullName?.trim() || '',
    email: data.email?.trim() || '',
    phone_number: data.phoneNumber?.trim() || '',
    country_code: data.countryCode || '+91',
    date_of_birth: data.dateOfBirth?.trim() || '',
    current_city: data.currentCity?.trim() || '',
    state: data.state?.trim() || '',
    pin_code: data.pinCode?.trim() || '',
    permanent_address: data.permanentAddress?.trim() || '',
    gender: data.gender?.trim() || '',
    institution_name: data.institutionName?.trim() || '',
    course_program: data.courseProgram?.trim() || '',
    current_year_of_study: data.currentYearOfStudy?.trim() || '',
    expected_graduation: data.expectedGraduation?.trim() || '',
    number_of_team_members: data.numberOfTeamMembers || 1,
    team_members: sanitizedTeamMembers,
    venture_name: data.ventureName?.trim() || null,
    industry_sector: data.industrySector?.trim() || null,
    team_name: data.teamName?.trim() || null,
    website: data.website?.trim() || null,
    linkedin_profile: data.linkedinProfile?.trim() || null,
    social_media_handles: data.socialMediaHandles?.trim() || null,
    referral_id: data.referralId?.trim() || null,
  };
};
