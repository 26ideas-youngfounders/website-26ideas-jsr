
# Idea Stage Question Mapping Documentation

## Overview
This document defines the exact mapping between Idea Stage application questions and AI scoring prompts. This mapping is critical for analytics, fairness, and explainability in the evaluation process.

## Question-to-Prompt Mapping

### Complete Mapping Table

| Original Question ID | Question Text | AI Scoring Prompt Key | System Prompt |
|---------------------|---------------|---------------------|---------------|
| `ideaDescription` | Tell us about your idea | `tell_us_about_idea` | Comprehensive idea articulation evaluation |
| `problemSolved` | What problem does your idea solve? | `problem_statement` | Problem specificity and significance assessment |
| `targetAudience` | Whose problem does your idea solve for? | `whose_problem` | Customer understanding and market validation |
| `solutionApproach` | How does your idea solve this problem? | `how_solve_problem` | Solution effectiveness and clarity evaluation |
| `monetizationStrategy` | How does your idea plan to make money by solving this problem? | `how_make_money` | Revenue model viability assessment |
| `customerAcquisition` | How do you plan to acquire first paying customers? | `acquire_customers` | Customer acquisition strategy evaluation |
| `competitors` | List 3 potential competitors in the similar space | `competitors` | Competitive analysis and differentiation |
| `developmentApproach` | How are you developing the product: in-house, with contractors, etc? | `product_development` | Product development strategy assessment |
| `teamInfo` | Who is on your team, and what are their roles? | `team_roles` | Founder-market fit and team capabilities |
| `timeline` | When do you plan to proceed with the idea? | `when_proceed` | Execution readiness and commitment evaluation |

## Implementation Details

### Data Flow
1. **Application Submission**: User submits Idea Stage application with answers
2. **Question Mapping**: Each question ID is mapped to corresponding AI prompt key
3. **AI Evaluation**: Each answer is scored using the mapped system prompt
4. **Result Storage**: Scores and feedback stored with proper question association
5. **Admin Display**: Results displayed with correct question text and user answers

### Code Locations
- **Mapping Logic**: `src/services/ai-comprehensive-scoring-service.ts`
- **Type Definitions**: `src/types/yff-application.ts`
- **Admin Display**: `src/components/admin/YffApplicationEvaluationDialog.tsx`

### Quality Assurance
- All mappings are validated during application evaluation
- Fallback mechanisms exist for edge cases
- Logging tracks mapping accuracy for monitoring
- Re-evaluation preserves mapping consistency

## Scoring Guidelines

Each question is scored on a 1-10 scale with specific criteria:
- **9-10**: Exceptional quality with comprehensive details
- **7-8**: Good quality with solid understanding
- **5-6**: Basic quality with some clarity
- **2-4**: Poor quality with significant gaps
- **1**: Inadequate or missing response

## Version Control

This mapping is version-controlled and any changes require:
1. Documentation update in this file
2. Code update in mapping constants
3. Testing of all affected evaluations
4. Version increment in evaluation metadata

## Testing Checklist

For any mapping changes:
- [ ] Test application submission for all question types
- [ ] Verify correct prompt selection for each question
- [ ] Confirm proper display in admin panel
- [ ] Validate score calculation accuracy
- [ ] Check evaluation data consistency

## Contact

For questions about this mapping system, contact the development team.

---
Last Updated: 2025-01-06
Version: 2.2
