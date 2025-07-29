
import { FormValues, TeamMember } from '@/components/forms/YffTeamRegistrationForm';

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
 * Validates required fields for the team leader
 */
export const validateLeaderData = (data: FormValues): { errors: string[]; fieldErrors: { [key: string]: string } } => {
  const errors: string[] = [];
  const fieldErrors: { [key: string]: string } = {};
  
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
      const error = `${label} is required`;
      errors.push(error);
      fieldErrors[key] = error;
    }
  });

  return { errors, fieldErrors };
};

/**
 * Validates team member data
 */
export const validateTeamMemberData = (member: TeamMember, index: number): { errors: string[]; fieldErrors: { [key: string]: string } } => {
  const errors: string[] = [];
  const fieldErrors: { [key: string]: string } = {};
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
      const error = `Team member ${memberNum}: ${label} is required`;
      errors.push(error);
      fieldErrors[`teamMembers.${index}.${key}`] = error;
    }
  });

  return { errors, fieldErrors };
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
 * Validates and normalizes gender field
 */
export const validateAndNormalizeGender = (gender: string): { isValid: boolean; normalizedValue: string; error?: string } => {
  if (!gender || !gender.trim()) {
    return { isValid: false, normalizedValue: '', error: 'Gender is required' };
  }

  // Normalize gender values to match database constraints
  const normalizedGender = gender.toLowerCase().trim();
  
  switch (normalizedGender) {
    case 'male':
    case 'm':
      return { isValid: true, normalizedValue: 'Male' };
    case 'female':
    case 'f':
      return { isValid: true, normalizedValue: 'Female' };
    case 'other':
    case 'o':
    case 'prefer not to say':
    case 'non-binary':
      return { isValid: true, normalizedValue: 'Other' };
    default:
      return { 
        isValid: false, 
        normalizedValue: gender, 
        error: 'Gender must be Male, Female, or Other' 
      };
  }
};

/**
 * Main validation function that checks all form data
 */
export const validateFormData = (data: FormValues): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: { [key: string]: string } = {};
  
  // Validate leader data
  const leaderValidation = validateLeaderData(data);
  errors.push(...leaderValidation.errors);
  Object.assign(fieldErrors, leaderValidation.fieldErrors);
  
  // Validate gender specifically
  const genderValidation = validateAndNormalizeGender(data.gender || '');
  if (!genderValidation.isValid) {
    errors.push(genderValidation.error || 'Invalid gender value');
    fieldErrors.gender = genderValidation.error || 'Invalid gender value';
  }
  
  // Validate number of team members
  if (data.numberOfTeamMembers < 1 || data.numberOfTeamMembers > 5) {
    const error = 'Number of team members must be between 1 and 5';
    errors.push(error);
    fieldErrors.numberOfTeamMembers = error;
  }
  
  // Validate team members if more than 1 member
  if (data.numberOfTeamMembers > 1) {
    const requiredMembers = data.numberOfTeamMembers - 1;
    
    if (!data.teamMembers || data.teamMembers.length < requiredMembers) {
      const error = `Please provide information for all ${requiredMembers} team member(s)`;
      errors.push(error);
      fieldErrors.teamMembers = error;
    } else {
      // Validate each team member
      data.teamMembers.slice(0, requiredMembers).forEach((member, index) => {
        const memberValidation = validateTeamMemberData(member, index);
        errors.push(...memberValidation.errors);
        Object.assign(fieldErrors, memberValidation.fieldErrors);
        
        // Validate team member gender
        const memberGenderValidation = validateAndNormalizeGender(member.gender || '');
        if (!memberGenderValidation.isValid) {
          const error = `Team member ${index + 1}: ${memberGenderValidation.error || 'Invalid gender value'}`;
          errors.push(error);
          fieldErrors[`teamMembers.${index}.gender`] = error;
        }
      });
    }
  }
  
  // Validate email formats
  if (data.email && !validateEmail(data.email)) {
    const error = 'Invalid email format';
    errors.push(error);
    fieldErrors.email = error;
  }
  
  data.teamMembers?.forEach((member, index) => {
    if (member.email && !validateEmail(member.email)) {
      const error = `Team member ${index + 1}: Invalid email format`;
      errors.push(error);
      fieldErrors[`teamMembers.${index}.email`] = error;
    }
  });
  
  // Validate phone numbers
  if (data.phoneNumber && !validatePhoneNumber(data.phoneNumber)) {
    const error = 'Invalid phone number format';
    errors.push(error);
    fieldErrors.phoneNumber = error;
  }
  
  data.teamMembers?.forEach((member, index) => {
    if (member.phoneNumber && !validatePhoneNumber(member.phoneNumber)) {
      const error = `Team member ${index + 1}: Invalid phone number format`;
      errors.push(error);
      fieldErrors[`teamMembers.${index}.phoneNumber`] = error;
    }
  });
  
  // Validate pin codes
  if (data.pinCode && !validatePinCode(data.pinCode)) {
    const error = 'Pin code must be 6 digits';
    errors.push(error);
    fieldErrors.pinCode = error;
  }
  
  data.teamMembers?.forEach((member, index) => {
    if (member.pinCode && !validatePinCode(member.pinCode)) {
      const error = `Team member ${index + 1}: Pin code must be 6 digits`;
      errors.push(error);
      fieldErrors[`teamMembers.${index}.pinCode`] = error;
    }
  });
  
  // Validate URLs if provided
  if (data.website && !validateUrl(data.website)) {
    const error = 'Invalid website URL format';
    errors.push(error);
    fieldErrors.website = error;
  }
  
  if (data.linkedinProfile && !validateUrl(data.linkedinProfile)) {
    const error = 'Invalid LinkedIn URL format';
    errors.push(error);
    fieldErrors.linkedinProfile = error;
  }
  
  data.teamMembers?.forEach((member, index) => {
    if (member.linkedinProfile && !validateUrl(member.linkedinProfile)) {
      const error = `Team member ${index + 1}: Invalid LinkedIn URL format`;
      errors.push(error);
      fieldErrors[`teamMembers.${index}.linkedinProfile`] = error;
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors
  };
};

/**
 * Sanitizes and prepares data for database submission
 */
export const sanitizeFormData = (data: FormValues, userId: string) => {
  // Normalize gender for leader
  const genderValidation = validateAndNormalizeGender(data.gender || '');
  const normalizedGender = genderValidation.isValid ? genderValidation.normalizedValue : data.gender;

  // Prepare team members data (exclude the leader)
  const teamMembersData = data.numberOfTeamMembers > 1 
    ? data.teamMembers.slice(0, data.numberOfTeamMembers - 1)
    : [];

  // Sanitize team members data
  const sanitizedTeamMembers = teamMembersData.map(member => {
    const memberGenderValidation = validateAndNormalizeGender(member.gender || '');
    const normalizedMemberGender = memberGenderValidation.isValid ? memberGenderValidation.normalizedValue : member.gender;

    return {
      fullName: member.fullName?.trim() || '',
      email: member.email?.trim() || '',
      phoneNumber: member.phoneNumber?.trim() || '',
      countryCode: member.countryCode || '+91',
      dateOfBirth: member.dateOfBirth?.trim() || '',
      currentCity: member.currentCity?.trim() || '',
      state: member.state?.trim() || '',
      pinCode: member.pinCode?.trim() || '',
      permanentAddress: member.permanentAddress?.trim() || '',
      gender: normalizedMemberGender,
      institutionName: member.institutionName?.trim() || '',
      courseProgram: member.courseProgram?.trim() || '',
      currentYearOfStudy: member.currentYearOfStudy?.trim() || '',
      expectedGraduation: member.expectedGraduation?.trim() || '',
      linkedinProfile: member.linkedinProfile?.trim() || null,
    };
  });

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
    gender: normalizedGender,
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
