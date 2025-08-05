import { z } from "zod";

// Define Zod schema for personal information
const personalSchema = z.object({
  fullName: z.string().min(3, { message: "Full Name must be at least 3 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phoneNumber: z.string().optional(),
  countryCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  currentCity: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
  permanentAddress: z.string().optional(),
  linkedinProfile: z.string().optional(),
});

// Define Zod schema for team information
const teamSchema = z.object({
  teamName: z.string().min(3, { message: "Team Name must be at least 3 characters" }),
  ventureName: z.string().optional(),
  industrySector: z.string().optional(),
  numberOfMembers: z.number().min(1, { message: "Number of Members must be at least 1" }).default(1),
  website: z.string().optional(),
  socialMediaHandles: z.string().optional(),
  referralId: z.string().optional(),
  privacyPolicy: z.boolean().default(false),
  termsConditions: z.boolean().default(false),
  ageVerification: z.boolean().default(false),
  teamMembers: z.array(personalSchema).optional(),
});

// Define Zod schema for questionnaire answers
const questionnaireSchema = z.object({
  productStage: z.enum(["Idea", "Early Revenue"]).default("Idea"),
  ideaDescription: z.string().min(10, { message: "Idea Description must be at least 10 characters" }),
  problemSolved: z.string().min(10, { message: "Problem Statement must be at least 10 characters" }),
  targetAudience: z.string().min(10, { message: "Target Audience must be at least 10 characters" }),
  solutionApproach: z.string().min(10, { message: "Solution Approach must be at least 10 characters" }),
  monetizationStrategy: z.string().min(10, { message: "Monetization Strategy must be at least 10 characters" }),
  customerAcquisition: z.string().min(10, { message: "Customer Acquisition must be at least 10 characters" }),
  competitors: z.string().min(10, { message: "Competitive Analysis must be at least 10 characters" }),
  developmentApproach: z.string().min(10, { message: "Product Development must be at least 10 characters" }),
  teamInfo: z.string().min(10, { message: "Team Information must be at least 10 characters" }),
  timeline: z.string().min(10, { message: "Timeline & Milestones must be at least 10 characters" }),
  payingCustomers: z.string().optional(),
  workingDuration: z.string().optional(),
});

// Define the overall form schema
export const yffFormSchema = z.object({
  personal: personalSchema.optional(),
  team: teamSchema.optional(),
  questionnaire: questionnaireSchema.optional(),
});

// Define the form data type
export type YffFormData = z.infer<typeof yffFormSchema>;

/**
 * Enhanced form data conversion with better Early Revenue handling
 */
export const convertFormDataToJson = (formData: YffFormData): any => {
  try {
    console.log('🔄 Converting form data to JSON:', formData);
    
    // Build the questionnaire answers object
    const questionnaireAnswers: any = {};
    
    if (formData.questionnaire) {
      // Handle all questionnaire fields
      Object.entries(formData.questionnaire).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          questionnaireAnswers[key] = value;
        }
      });
    }
    
    console.log('📋 Questionnaire answers processed:', questionnaireAnswers);
    
    // Build team information
    const teamData: any = {};
    if (formData.team) {
      Object.entries(formData.team).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          teamData[key] = value;
        }
      });
    }
    
    console.log('👥 Team data processed:', teamData);
    
    // Build personal information if available
    const personalData: any = {};
    if (formData.personal) {
      Object.entries(formData.personal).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          personalData[key] = value;
        }
      });
    }
    
    // Construct the final JSON structure
    const result = {
      questionnaire_answers: questionnaireAnswers,
      team: teamData,
      personal: personalData,
      submission_metadata: {
        product_stage: formData.questionnaire?.productStage || 'Idea',
        submitted_at: new Date().toISOString(),
        form_version: '2.0'
      }
    };
    
    console.log('✅ Final converted JSON:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error converting form data to JSON:', error);
    throw new Error(`Form data conversion failed: ${error.message}`);
  }
};

/**
 * Enhanced application answers parsing with better Early Revenue support
 */
export const parseApplicationAnswers = (answers: any): any => {
  try {
    console.log('🔍 Parsing application answers:', answers);
    
    if (!answers) {
      console.log('⚠️ No answers provided');
      return {
        questionnaire_answers: {},
        team: {},
        personal: {},
        submission_metadata: {}
      };
    }
    
    // If answers is a string, try to parse it as JSON
    let parsedAnswers = answers;
    if (typeof answers === 'string') {
      try {
        parsedAnswers = JSON.parse(answers);
      } catch (parseError) {
        console.error('❌ Failed to parse answers JSON string:', parseError);
        return {
          questionnaire_answers: {},
          team: {},
          personal: {},
          submission_metadata: {}
        };
      }
    }
    
    console.log('📊 Parsed answers object:', parsedAnswers);
    
    // Extract sections with fallbacks
    const result = {
      questionnaire_answers: parsedAnswers.questionnaire_answers || {},
      team: parsedAnswers.team || {},
      personal: parsedAnswers.personal || {},
      submission_metadata: parsedAnswers.submission_metadata || {}
    };
    
    console.log('✅ Final parsed result:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error parsing application answers:', error);
    return {
      questionnaire_answers: {},
      team: {},
      personal: {},
      submission_metadata: {}
    };
  }
};
