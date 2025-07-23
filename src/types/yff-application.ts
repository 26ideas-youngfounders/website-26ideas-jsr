
/**
 * @fileoverview Extended YFF Application Types
 * 
 * Extends the auto-generated Supabase types to include columns that exist
 * in the database but may not be reflected in the generated types.
 * This resolves TypeScript errors when working with timestamp columns.
 */

import { Database } from '@/integrations/supabase/types';

// Base type from Supabase
export type BaseYffApplication = Database['public']['Tables']['yff_applications']['Row'];
export type BaseYffApplicationInsert = Database['public']['Tables']['yff_applications']['Insert'];
export type BaseYffApplicationUpdate = Database['public']['Tables']['yff_applications']['Update'];

// Extended types that include the missing timestamp columns
export interface ExtendedYffApplication extends BaseYffApplication {
  created_at: string;
  updated_at: string;
}

export interface ExtendedYffApplicationInsert extends BaseYffApplicationInsert {
  created_at?: string;
  updated_at?: string;
}

export interface ExtendedYffApplicationUpdate extends BaseYffApplicationUpdate {
  created_at?: string;
  updated_at?: string;
}

// Form data interface for type safety
export interface YffFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  
  // Application Questions
  whyApplying: string;
  businessIdea: string;
  experience: string;
  challenges: string;
  goals: string;
  commitment: string;
  
  // Additional fields
  [key: string]: string | number | boolean;
}

/**
 * Converts form data to JSON format compatible with Supabase
 * @param formData - The form data to convert
 * @returns JSON object compatible with Supabase Json type
 */
export const convertFormDataToJson = (formData: YffFormData): Record<string, any> => {
  return Object.fromEntries(
    Object.entries(formData).map(([key, value]) => [key, value])
  );
};
