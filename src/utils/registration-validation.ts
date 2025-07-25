
/**
 * @fileoverview Registration Validation Utilities
 * 
 * Comprehensive validation functions for YFF registration data
 * including age validation and word count enforcement.
 */

/**
 * Age validation result interface
 */
interface AgeValidationResult {
  isValid: boolean;
  age?: number;
  error?: string;
}

/**
 * Validate age based on date of birth
 * Must be between 18 and 27 years old
 */
export const validateAge = (dateOfBirth: string): AgeValidationResult => {
  if (!dateOfBirth) {
    return {
      isValid: false,
      error: 'Date of birth is required'
    };
  }

  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  // Check if date is valid
  if (isNaN(birthDate.getTime())) {
    return {
      isValid: false,
      error: 'Invalid date format'
    };
  }

  // Calculate age
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Check if date is in the future
  if (birthDate > today) {
    return {
      isValid: false,
      error: 'Date of birth cannot be in the future'
    };
  }

  // Check age limits
  if (age < 18) {
    return {
      isValid: false,
      age,
      error: 'You must be at least 18 years old to register'
    };
  }

  if (age > 27) {
    return {
      isValid: false,
      age,
      error: 'You must be 27 years old or younger to register'
    };
  }

  return {
    isValid: true,
    age
  };
};

/**
 * Count words in a text string
 */
export const countWords = (text: string): number => {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;
};

/**
 * Validate word count does not exceed maximum limit
 */
export const validateWordCount = (text: string, maxWords: number = 300): boolean => {
  const wordCount = countWords(text);
  return wordCount <= maxWords;
};

/**
 * Get word count validation result with detailed information
 */
export const getWordCountValidation = (text: string, maxWords: number = 300) => {
  const wordCount = countWords(text);
  const isValid = wordCount <= maxWords;
  
  return {
    isValid,
    wordCount,
    maxWords,
    remaining: maxWords - wordCount,
    error: isValid ? null : `Text exceeds maximum of ${maxWords} words (${wordCount} words)`
  };
};

/**
 * Validate all team members' ages
 */
export const validateTeamMembersAges = (teamMembers: any[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  teamMembers.forEach((member, index) => {
    if (member.dateOfBirth) {
      const validation = validateAge(member.dateOfBirth);
      if (!validation.isValid) {
        errors.push(`Team Member ${index + 1}: ${validation.error}`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate all questionnaire answers for word count
 */
export const validateQuestionnaireWordCounts = (answers: Record<string, any>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  Object.entries(answers).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const validation = getWordCountValidation(value, 300);
      if (!validation.isValid) {
        errors.push(`${key}: ${validation.error}`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
