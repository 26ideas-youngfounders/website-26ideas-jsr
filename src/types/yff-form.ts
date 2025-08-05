
/**
 * @fileoverview YFF Form Data Types
 * 
 * Centralized type definitions for YFF application form data
 * to avoid circular dependencies and ensure type consistency.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import type { Json } from '@supabase/supabase-js';

/**
 * Form Data Interface for YFF Application
 * Contains all form fields with proper typing and index signature for JSON compatibility
 */
export interface YffFormData {
  // Add index signature for JSON compatibility
  [key: string]: Json;
  
  // Personal Information
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  
  // Application Questions - New comprehensive set
  tell_us_about_idea?: string;
  problem_statement?: string;
  whose_problem?: string;
  how_solve_problem?: string;
  how_make_money?: string;
  acquire_customers?: string;
  team_roles?: string;
  
  // Legacy Application Questions
  whyApplying?: string;
  businessIdea?: string;
  experience?: string;
  challenges?: string;
  goals?: string;
  commitment?: string;
}
