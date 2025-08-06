
/**
 * @fileoverview YFF Application Types and Conversion Utilities
 * 
 * Handles conversion between form data formats and database storage
 */

import { YffFormData } from './yff-form';

/**
 * Interface for YFF Application stored in database
 */
export interface YffApplication {
  application_id: string;
  individual_id: string;
  answers: Record<string, any>;
  status: 'draft' | 'submitted' | 'reviewed' | 'accepted' | 'rejected';
  evaluation_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Convert YffFormData to JSON format for database storage
 */
export const convertFormDataToJson = (formData: YffFormData): Record<string, any> => {
  console.log('🔄 Converting form data to JSON:', {
    hasFormData: Boolean(formData),
    hasAnswers: Boolean(formData?.answers),
    formDataKeys: formData ? Object.keys(formData) : 'none'
  });

  if (!formData) {
    console.warn('⚠️ No form data provided to convertFormDataToJson');
    return {};
  }

  if (!formData.answers) {
    console.warn('⚠️ No answers in form data');
    return {};
  }

  const answers = formData.answers;
  console.log('📋 Processing answers:', {
    answerKeys: Object.keys(answers),
    answerCount: Object.keys(answers).length
  });

  const result: Record<string, any> = {};

  // Convert each answer, handling different data types
  for (const [key, value] of Object.entries(answers)) {
    console.log(`📝 Processing answer [${key}]:`, {
      type: typeof value,
      value: value,
      isNull: value === null,
      isUndefined: value === undefined,
      isEmpty: value === ''
    });

    if (value === null || value === undefined) {
      console.log(`⚠️ Skipping null/undefined value for key: ${key}`);
      continue;
    }

    // Handle different value types
    if (typeof value === 'string') {
      if (value.trim() === '') {
        console.log(`⚠️ Skipping empty string for key: ${key}`);
        continue;
      }
      result[key] = value.trim();
    } else if (typeof value === 'object') {
      // Handle arrays and objects
      if (Array.isArray(value)) {
        if (value.length > 0) {
          result[key] = value;
        } else {
          console.log(`⚠️ Skipping empty array for key: ${key}`);
        }
      } else {
        // Handle objects (like team member data)
        const cleanedObject = cleanObject(value);
        if (Object.keys(cleanedObject).length > 0) {
          result[key] = cleanedObject;
        } else {
          console.log(`⚠️ Skipping empty object for key: ${key}`);
        }
      }
    } else {
      // Handle other types (numbers, booleans, etc.)
      result[key] = value;
    }
  }

  console.log('✅ Conversion complete:', {
    originalKeys: Object.keys(answers),
    resultKeys: Object.keys(result),
    resultCount: Object.keys(result).length
  });

  return result;
};

/**
 * Clean an object by removing null, undefined, and empty string values
 */
const cleanObject = (obj: any): Record<string, any> => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }

  const cleaned: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      const cleanedNested = cleanObject(value);
      if (Object.keys(cleanedNested).length > 0) {
        cleaned[key] = cleanedNested;
      }
    } else if (Array.isArray(value) && value.length > 0) {
      cleaned[key] = value;
    } else if (typeof value === 'string' && value.trim() !== '') {
      cleaned[key] = value.trim();
    } else if (typeof value !== 'string') {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
};

/**
 * Convert database JSON back to form data format
 */
export const convertJsonToFormData = (jsonData: Record<string, any>): Partial<YffFormData> => {
  console.log('🔄 Converting JSON to form data:', jsonData);
  
  return {
    answers: jsonData
  };
};
