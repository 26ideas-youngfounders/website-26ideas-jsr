/**
 * @fileoverview YFF Conversational Questionnaire Types
 * 
 * Type definitions for the conversational questionnaire system,
 * including database schema extensions.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

/**
 * Conversational answers stored in database
 */
export interface ConversationalAnswers {
  idea_description?: string;
  [key: string]: string | undefined;
}

/**
 * Extended YFF team registration with conversational fields
 */
export interface YffTeamRegistrationExtended {
  id: string;
  individual_id: string;
  created_at: string;
  updated_at: string;
  
  full_name: string;
  email: string;
  phone_number: string;
  country_code: string;
  date_of_birth: string;
  gender: string;
  linkedin_profile?: string;
  social_media_handles?: string;
  institution_name: string;
  course_program: string;
  current_year_of_study: string;
  expected_graduation: string;
  current_city: string;
  state: string;
  pin_code: string;
  permanent_address: string;
  team_name?: string;
  venture_name?: string;
  industry_sector?: string;
  website?: string;
  number_of_team_members?: number;
  team_members?: any[];
  referral_id?: string;
  application_status?: string;
  questionnaire_answers?: any;
  questionnaire_completed_at?: string;
  
  // New conversational fields
  conversational_answers?: ConversationalAnswers;
  conversational_completed_at?: string;
}
