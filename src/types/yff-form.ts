
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
  phoneNumber: string;
  countryCode: string;
  dateOfBirth: string;
  nationality: string;
  gender: string;
  
  // Team & Venture Information
  ventureName: string;
  teamName: string;
  numberOfTeamMembers: number;
  teamMembers: any[];
  
  // Location & Education
  currentCity: string;
  state: string;
  pinCode: string;
  permanentAddress: string;
  institutionName: string;
  courseProgram: string;
  currentYearOfStudy: string;
  expectedGraduation: string;
  
  // Professional Details
  industrySector: string;
  website: string;
  linkedinProfile: string;
  socialMediaHandles: string;
  
  // Product & Market Information
  productStage: string;
  businessModel: string;
  targetMarket: string;
  problemSolution: string;
  marketSize: string;
  competitiveAdvantage: string;
  teamExperience: string;
  fundingNeeds: string;
  currentChallenges: string;
  whyYff: string;
  
  // Application Questions
  whyApplying: string;
  businessIdea: string;
  experience: string;
  challenges: string;
  goals: string;
  commitment: string;
  
  // Additional fields
  referralId: string;
}
