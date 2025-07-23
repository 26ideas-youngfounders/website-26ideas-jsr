
/**
 * @fileoverview YFF Form Data Types
 * 
 * Centralized type definitions for YFF application form data
 * to avoid circular dependencies and ensure type consistency.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

/**
 * Form Data Interface for YFF Application
 * Contains all form fields with proper typing
 */
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
}
