
/**
 * @fileoverview Stage Questionnaire Mapper
 * 
 * Defines authoritative question mappings for each application stage
 * with strict ID-based matching and zero cross-contamination.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { CanonicalStage } from './application-stage-detector';

export interface StageQuestion {
  id: string;
  label: string;
  order: number;
}

/**
 * Authoritative question mappings for each stage
 */
export const STAGE_QUESTION_MAPS: Record<CanonicalStage, StageQuestion[]> = {
  idea_stage: [
    { id: "ideaDescription", label: "Tell us about your idea", order: 1 },
    { id: "problemSolved", label: "What problem does your idea solve?", order: 2 },
    { id: "targetAudience", label: "Whose problem does your idea solve for?", order: 3 },
    { id: "solutionApproach", label: "How does your idea solve this problem?", order: 4 },
    { id: "monetizationStrategy", label: "How does your idea make money?", order: 5 },
    { id: "customerAcquisition", label: "How will you acquire your first customers?", order: 6 },
    { id: "competitors", label: "List 3 potential competitors", order: 7 },
    { id: "developmentApproach", label: "How will you develop the product?", order: 8 },
    { id: "teamInfo", label: "Who is on your team?", order: 9 },
    { id: "timeline", label: "When do you plan to proceed?", order: 10 },
    { id: "productStage", label: "What stage is your product currently in?", order: 11 }
  ],
  early_revenue: [
    { id: "tell_us_about_idea", label: "Tell us about your idea", order: 1 },
    { id: "early_revenue_problem", label: "What problem does your idea solve?", order: 2 },
    { id: "early_revenue_target", label: "Whose problem does your idea solve for?", order: 3 },
    { id: "early_revenue_how_solve", label: "How does your idea solve this problem?", order: 4 },
    { id: "early_revenue_monetization", label: "How do you plan to make money from this idea?", order: 5 },
    { id: "early_revenue_customers", label: "How do you plan to acquire first paying customers?", order: 6 },
    { id: "early_revenue_competitors", label: "List 3 potential competitors for your idea", order: 7 },
    { id: "early_revenue_development", label: "What is your approach to product development?", order: 8 },
    { id: "early_revenue_team", label: "Who is on your team, and what are their roles?", order: 9 },
    { id: "early_revenue_timeline", label: "When do you plan to proceed with the idea?", order: 10 },
    { id: "early_revenue_stage", label: "What stage is your product currently in?", order: 11 }
  ],
  mvp_stage: [
    { id: "tell_us_about_idea", label: "Tell us about your idea", order: 1 },
    { id: "mvp_description", label: "Describe your MVP", order: 2 },
    { id: "user_feedback", label: "What feedback have you received from users?", order: 3 },
    { id: "traction_metrics", label: "What traction have you achieved?", order: 4 },
    { id: "revenue_model", label: "What is your revenue model?", order: 5 },
    { id: "growth_strategy", label: "What is your growth strategy?", order: 6 },
    { id: "competitive_advantage", label: "What is your competitive advantage?", order: 7 },
    { id: "team_expansion", label: "How do you plan to expand your team?", order: 8 },
    { id: "funding_requirements", label: "What are your funding requirements?", order: 9 },
    { id: "milestones", label: "What are your key milestones?", order: 10 }
  ]
};

/**
 * Get questions for a specific stage
 */
export const getQuestionsForStage = (stage: CanonicalStage): StageQuestion[] => {
  return STAGE_QUESTION_MAPS[stage] || [];
};

/**
 * Get stage display name
 */
export const getStageDisplayName = (stage: CanonicalStage): string => {
  const displayNames: Record<CanonicalStage, string> = {
    idea_stage: 'Idea Stage',
    early_revenue: 'Early Revenue',
    mvp_stage: 'MVP Stage'
  };
  return displayNames[stage];
};

/**
 * Get stage color for UI display
 */
export const getStageColor = (stage: CanonicalStage): string => {
  const colors: Record<CanonicalStage, string> = {
    idea_stage: 'bg-purple-100 text-purple-700 border-purple-200',
    early_revenue: 'bg-blue-100 text-blue-700 border-blue-200',
    mvp_stage: 'bg-green-100 text-green-700 border-green-200'
  };
  return colors[stage];
};
