
/**
 * @fileoverview Type definitions for YFF Applications
 * 
 * Comprehensive type definitions for YFF application data structures,
 * including enhanced relationships with team registrations.
 * 
 * @version 2.1.0
 * @author 26ideas Development Team
 */

export interface Individual {
  individual_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  country_code?: string;
  country_iso_code?: string;
  is_active: boolean;
  privacy_consent: boolean;
  data_processing_consent: boolean;
  typeform_registered: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface YffTeamRegistration {
  id: string;
  individual_id: string;
  application_id?: string;
  venture_name?: string;
  team_name?: string;
  number_of_team_members?: number;
  team_members?: any[];
  industry_sector?: string;
  website?: string;
  full_name: string;
  email: string;
  phone_number: string;
  country_code: string;
  linkedin_profile?: string;
  social_media_handles?: string;
  date_of_birth: string;
  gender: string;
  institution_name: string;
  course_program: string;
  current_year_of_study: string;
  expected_graduation: string;
  current_city: string;
  state: string;
  pin_code: string;
  permanent_address: string;
  referral_id?: string;
  application_status?: string;
  questionnaire_answers?: any;
  questionnaire_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface YffApplication {
  application_id: string;
  individual_id: string;
  status: string;
  evaluation_status: string;
  answers: Record<string, any>;
  cumulative_score?: number;
  overall_score?: number;
  evaluation_data?: Record<string, any>;
  reviewer_scores?: Record<string, any>;
  application_round?: string;
  evaluation_completed_at?: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
}

export interface YffApplicationWithIndividual extends YffApplication {
  individuals: Individual;
}

export interface YffApplicationWithRegistration extends YffApplication {
  individuals: Individual;
  yff_team_registrations: YffTeamRegistration;
}

export interface YffEvaluation {
  id: string;
  application_id: string;
  overall_score?: number;
  question_scores?: Record<string, any>;
  evaluation_metadata?: Record<string, any>;
  idea_summary?: string;
  evaluation_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationScoringData {
  applicationId: string;
  individualId: string;
  answers: Record<string, any>;
  currentScore?: number;
  evaluationData?: Record<string, any>;
}

// Enhanced type for comprehensive application data
export interface EnhancedYffApplication {
  application_id: string;
  individual_id: string;
  status: string;
  evaluation_status: string;
  answers: Record<string, any>;
  cumulative_score?: number;
  overall_score?: number;
  evaluation_data?: Record<string, any>;
  reviewer_scores?: Record<string, any>;
  application_round?: string;
  evaluation_completed_at?: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  // Related data
  individual: Individual;
  teamRegistration?: YffTeamRegistration;
  evaluations?: YffEvaluation[];
}
