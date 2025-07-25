
/**
 * Registration validation utilities for YFF applications
 * Handles age validation and word count enforcement
 */

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Validate age is between 18 and 27
 */
export const validateAge = (dateOfBirth: string): { isValid: boolean; error?: string } => {
  if (!dateOfBirth) {
    return { isValid: false, error: 'Date of birth is required' };
  }
  
  const age = calculateAge(dateOfBirth);
  
  if (age < 18) {
    return { isValid: false, error: 'You must be at least 18 years old to register' };
  }
  
  if (age > 27) {
    return { isValid: false, error: 'You must be 27 years old or younger to register' };
  }
  
  return { isValid: true };
};

/**
 * Count words in a text string
 */
export const countWords = (text: string): number => {
  if (!text || typeof text !== 'string') return 0;
  
  // Remove extra whitespace and split by whitespace
  const words = text.trim().split(/\s+/);
  
  // If the text is empty after trim, return 0
  if (words.length === 1 && words[0] === '') return 0;
  
  return words.length;
};

/**
 * Validate word count limit
 */
export const validateWordLimit = (text: string, limit: number = 300): { isValid: boolean; wordCount: number; error?: string } => {
  const wordCount = countWords(text);
  
  if (wordCount > limit) {
    return {
      isValid: false,
      wordCount,
      error: `Please limit your answer to ${limit} words. Current: ${wordCount} words.`
    };
  }
  
  return { isValid: true, wordCount };
};

/**
 * Validate all team members' ages
 */
export const validateTeamAges = (teamMembers: any[], leaderDateOfBirth: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validate leader age
  const leaderAgeValidation = validateAge(leaderDateOfBirth);
  if (!leaderAgeValidation.isValid) {
    errors.push(`Team leader: ${leaderAgeValidation.error}`);
  }
  
  // Validate team members' ages
  teamMembers.forEach((member, index) => {
    if (member.dateOfBirth) {
      const memberAgeValidation = validateAge(member.dateOfBirth);
      if (!memberAgeValidation.isValid) {
        errors.push(`Team member ${index + 1}: ${memberAgeValidation.error}`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate all essay/paragraph answers for word limits
 */
export const validateEssayAnswers = (answers: any, wordLimit: number = 300): { isValid: boolean; errors: string[]; wordCounts: { [key: string]: number } } => {
  const errors: string[] = [];
  const wordCounts: { [key: string]: number } = {};
  
  // Define which fields are essay/paragraph fields that need word count validation
  const essayFields = [
    'whyApplying',
    'businessIdea', 
    'experience',
    'challenges',
    'goals',
    'commitment',
    'ventureDescription',
    'targetMarket',
    'competitiveAdvantage',
    'businessModel',
    'fundingNeeds',
    'teamStrengths',
    'mentorshipNeeds',
    'longTermVision'
  ];
  
  essayFields.forEach(field => {
    if (answers[field]) {
      const validation = validateWordLimit(answers[field], wordLimit);
      wordCounts[field] = validation.wordCount;
      
      if (!validation.isValid) {
        errors.push(`${field}: ${validation.error}`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    wordCounts
  };
};
