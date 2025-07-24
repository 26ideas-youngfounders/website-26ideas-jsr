
/**
 * @fileoverview Mentor Application Type Definitions
 * 
 * Defines the structure for mentor application data used throughout
 * the admin dashboard and application management system.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

export interface MentorApplication {
  application_id: string;
  individual_id: string;
  application_status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  linkedin_url: string | null;
  instagram_handle: string | null;
  city: string | null;
  country: string | null;
  phone_number: string | null;
  country_code: string | null;
  country_iso_code: string | null;
  topics_of_interest: string[] | null;
  availability_days: string[] | null;
  availability_time: string | null;
  availability_notes: string | null;
  email_updates_consent: boolean;
  sms_updates_consent: boolean;
  created_at: string;
  updated_at: string;
  individuals?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}
