
/**
 * @fileoverview Autosave Data Types
 * 
 * Strict type definitions for autosave data to prevent TypeScript errors
 * and ensure type safety across all form data operations.
 */

/**
 * Team Member interface for autosave data
 */
export interface AutosaveTeamMember {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  countryCode?: string;
  dateOfBirth?: string;
  currentCity?: string;
  state?: string;
  pinCode?: string;
  permanentAddress?: string;
  gender?: string;
  institutionName?: string;
  courseProgram?: string;
  currentYearOfStudy?: string;
  expectedGraduation?: string;
  linkedinProfile?: string;
}

/**
 * Autosave form data interface with strict typing
 */
export interface AutosaveFormData {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  countryCode?: string;
  dateOfBirth?: string;
  currentCity?: string;
  state?: string;
  pinCode?: string;
  permanentAddress?: string;
  gender?: string;
  institutionName?: string;
  courseProgram?: string;
  currentYearOfStudy?: string;
  expectedGraduation?: string;
  numberOfTeamMembers?: number;
  teamMembers?: AutosaveTeamMember[];
  ventureName?: string;
  industrySector?: string;
  teamName?: string;
  website?: string;
  linkedinProfile?: string;
  socialMediaHandles?: string;
  referralId?: string;
}

/**
 * Type guard to check if data is valid AutosaveFormData
 */
export const isAutosaveFormData = (data: any): data is AutosaveFormData => {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  // Check if teamMembers is valid if present
  if (data.teamMembers && !Array.isArray(data.teamMembers)) {
    return false;
  }
  
  // Check if numberOfTeamMembers is valid if present
  if (data.numberOfTeamMembers !== undefined && typeof data.numberOfTeamMembers !== 'number') {
    return false;
  }
  
  return true;
};

/**
 * Safely extract team members from autosave data
 */
export const extractTeamMembers = (data: any): AutosaveTeamMember[] => {
  if (!isAutosaveFormData(data) || !data.teamMembers) {
    return [];
  }
  
  return data.teamMembers.filter((member: any): member is AutosaveTeamMember => {
    return member && typeof member === 'object';
  });
};

/**
 * Safely extract number of team members from autosave data
 */
export const extractNumberOfTeamMembers = (data: any): number => {
  if (!isAutosaveFormData(data) || typeof data.numberOfTeamMembers !== 'number') {
    return 1;
  }
  
  return Math.max(1, Math.min(5, data.numberOfTeamMembers));
};
