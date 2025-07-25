
/**
 * @fileoverview YFF Registration Type Definitions
 * 
 * Comprehensive type definitions for YFF registration data
 * to ensure type safety across all components and prevent
 * TypeScript errors related to prop types and data structures.
 */

/**
 * Team Member interface with all required fields
 */
export interface YffTeamMember {
  fullName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  dateOfBirth: string;
  currentCity: string;
  state: string;
  pinCode: string;
  permanentAddress: string;
  gender: string;
  institutionName: string;
  courseProgram: string;
  currentYearOfStudy: string;
  expectedGraduation: string;
  linkedinProfile?: string;
}

/**
 * Questionnaire answers interface
 */
export interface YffQuestionnaireAnswers {
  whyApplying: string;
  businessIdea: string;
  experience: string;
  challenges: string;
  goals: string;
  commitment: string;
}

/**
 * Complete YFF Registration interface
 */
export interface YffRegistration {
  id: string;
  individual_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  country_code: string;
  date_of_birth: string;
  current_city: string;
  state: string;
  pin_code: string;
  permanent_address: string;
  gender: string;
  institution_name: string;
  course_program: string;
  current_year_of_study: string;
  expected_graduation: string;
  number_of_team_members: number;
  team_members: YffTeamMember[];
  venture_name?: string;
  industry_sector?: string;
  team_name?: string;
  website?: string;
  linkedin_profile?: string;
  social_media_handles?: string;
  referral_id?: string;
  questionnaire_answers?: YffQuestionnaireAnswers;
  questionnaire_completed_at?: string;
  application_status?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Type guard to ensure team_members is always an array
 */
export const ensureTeamMembersArray = (teamMembers: any): YffTeamMember[] => {
  if (Array.isArray(teamMembers)) {
    return teamMembers;
  }
  
  if (typeof teamMembers === 'string') {
    try {
      const parsed = JSON.parse(teamMembers);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.error('❌ Failed to parse team_members string:', error);
    }
  }
  
  // Default to empty array if parsing fails
  return [];
};

/**
 * Safely parse and validate registration data from Supabase
 */
export const parseRegistrationData = (rawData: any): YffRegistration => {
  const teamMembers = ensureTeamMembersArray(rawData.team_members);
  
  return {
    id: rawData.id,
    individual_id: rawData.individual_id,
    full_name: rawData.full_name,
    email: rawData.email,
    phone_number: rawData.phone_number,
    country_code: rawData.country_code,
    date_of_birth: rawData.date_of_birth,
    current_city: rawData.current_city,
    state: rawData.state,
    pin_code: rawData.pin_code,
    permanent_address: rawData.permanent_address,
    gender: rawData.gender,
    institution_name: rawData.institution_name,
    course_program: rawData.course_program,
    current_year_of_study: rawData.current_year_of_study,
    expected_graduation: rawData.expected_graduation,
    number_of_team_members: rawData.number_of_team_members || 1,
    team_members: teamMembers,
    venture_name: rawData.venture_name,
    industry_sector: rawData.industry_sector,
    team_name: rawData.team_name,
    website: rawData.website,
    linkedin_profile: rawData.linkedin_profile,
    social_media_handles: rawData.social_media_handles,
    referral_id: rawData.referral_id,
    questionnaire_answers: rawData.questionnaire_answers || {},
    questionnaire_completed_at: rawData.questionnaire_completed_at,
    application_status: rawData.application_status,
    created_at: rawData.created_at,
    updated_at: rawData.updated_at,
  };
};

/**
 * Type guard to validate if data is a valid YffRegistration
 */
export const isValidYffRegistration = (data: any): data is YffRegistration => {
  return (
    data &&
    typeof data.id === 'string' &&
    typeof data.individual_id === 'string' &&
    typeof data.full_name === 'string' &&
    typeof data.email === 'string' &&
    Array.isArray(data.team_members)
  );
};
