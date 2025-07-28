
/**
 * Interface for Google Sheets feedback data
 */
export interface FeedbackData {
  teamName: string;
  idea: string;
  averageScore: string;
  feedback: string;
}

/**
 * Interface for matched feedback data
 */
export interface MatchedFeedback {
  score: number | null;
  feedback: string | null;
  idea: string | null;
  hasMatch: boolean;
}

/**
 * Normalize team name for matching (remove extra spaces, convert to lowercase)
 */
const normalizeTeamName = (name: string | null | undefined): string => {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
};

/**
 * Match feedback data with team submissions based on team name
 */
export const matchFeedbackData = (
  teamName: string | null | undefined,
  feedbackData: FeedbackData[]
): MatchedFeedback => {
  if (!teamName || feedbackData.length === 0) {
    return {
      score: null,
      feedback: null,
      idea: null,
      hasMatch: false
    };
  }

  const normalizedSubmissionTeamName = normalizeTeamName(teamName);
  
  // Find matching feedback entry
  const match = feedbackData.find(entry => {
    const normalizedFeedbackTeamName = normalizeTeamName(entry.teamName);
    return normalizedFeedbackTeamName === normalizedSubmissionTeamName;
  });

  if (!match) {
    return {
      score: null,
      feedback: null,
      idea: null,
      hasMatch: false
    };
  }

  // Parse score safely
  const score = parseFloat(match.averageScore);
  
  return {
    score: isNaN(score) ? null : score,
    feedback: match.feedback || null,
    idea: match.idea || null,
    hasMatch: true
  };
};
