
/**
 * Enhanced AI Evaluation Service with bulletproof early revenue support
 */

import { supabase } from '@/integrations/supabase/client';
import type { ExtendedYffApplication, QuestionScoringResult, AIEvaluationResult } from '@/types/yff-application';
import { normalizeQuestionId, getAIFeedbackStage } from '@/utils/ai-question-prompts';

/**
 * Comprehensive question extraction for both idea and early revenue stages
 */
const extractQuestionAnswers = (application: ExtendedYffApplication): Array<{
  questionId: string;
  questionText: string;
  userAnswer: string;
  stage: 'idea' | 'early_revenue';
}> => {
  const questions: Array<{
    questionId: string;
    questionText: string;
    userAnswer: string;
    stage: 'idea' | 'early_revenue';
  }> = [];

  try {
    const answers = typeof application.answers === 'string' 
      ? JSON.parse(application.answers)
      : application.answers;

    console.log('📋 Extracting questions from application:', application.application_id);
    console.log('📋 Raw answers data:', answers);

    // Determine stage from application data
    const stage = getAIFeedbackStage(answers);
    console.log('🔍 Determined application stage:', stage);

    // Extract questionnaire answers
    const questionnaireAnswers = answers.questionnaire_answers || {};
    console.log('📋 Questionnaire answers found:', Object.keys(questionnaireAnswers));

    // Enhanced question mapping for both stages
    const questionMappings = [
      // Universal questions
      { id: 'tell_us_about_idea', text: 'Tell us about your idea' },
      
      // Stage-specific problem questions
      { 
        id: stage === 'early_revenue' ? 'early_revenue_problem' : 'problem_statement',
        text: 'What problem does your idea solve?'
      },
      
      // Stage-specific target audience questions
      { 
        id: stage === 'early_revenue' ? 'early_revenue_whose_problem' : 'whose_problem',
        text: stage === 'early_revenue' ? 'Who are your target customers?' : 'Whose problem are you solving?'
      },
      
      // Stage-specific solution questions
      { 
        id: stage === 'early_revenue' ? 'early_revenue_how_solve' : 'how_solve_problem',
        text: stage === 'early_revenue' ? 'How does your solution address the problem?' : 'How does your idea solve this problem?'
      },
      
      // Stage-specific monetization questions
      { 
        id: stage === 'early_revenue' ? 'early_revenue_making_money' : 'how_make_money',
        text: stage === 'early_revenue' ? 'How are you making money?' : 'How will you make money?'
      },
      
      // Stage-specific customer acquisition questions
      { 
        id: stage === 'early_revenue' ? 'early_revenue_acquiring_customers' : 'acquire_customers',
        text: stage === 'early_revenue' ? 'How are you acquiring paying customers?' : 'How will you acquire your first customers?'
      },
      
      // Early revenue specific questions
      ...(stage === 'early_revenue' ? [
        { id: 'early_revenue_working_duration', text: 'Since when have you been working on this?' },
      ] : []),
      
      // Stage-specific team questions
      { 
        id: stage === 'early_revenue' ? 'early_revenue_team' : 'team_roles',
        text: stage === 'early_revenue' ? 'Tell us about your team composition' : 'Tell us about your team'
      },
      
      // Stage-specific competitor questions
      { 
        id: stage === 'early_revenue' ? 'early_revenue_competitors' : 'competitors',
        text: stage === 'early_revenue' ? 'Who are your main competitors?' : 'Who are your competitors?'
      },
      
      // Stage-specific product development questions
      { 
        id: stage === 'early_revenue' ? 'early_revenue_product_development' : 'product_development',
        text: stage === 'early_revenue' ? 'How are you developing your product?' : 'How will you develop your product?'
      },
      
      // Idea stage specific questions
      ...(stage === 'idea' ? [
        { id: 'when_proceed', text: 'When do you want to proceed?' }
      ] : [])
    ];

    // Extract answers for each mapped question
    for (const mapping of questionMappings) {
      const possibleKeys = [
        mapping.id,
        mapping.id.replace('early_revenue_', ''),
        mapping.text.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
      ];

      let answer = '';
      let foundKey = '';

      // Try to find the answer with various key formats
      for (const key of possibleKeys) {
        if (questionnaireAnswers[key] && typeof questionnaireAnswers[key] === 'string' && questionnaireAnswers[key].trim()) {
          answer = questionnaireAnswers[key].trim();
          foundKey = key;
          break;
        }
      }

      // Special handling for specific question patterns
      if (!answer) {
        // Handle paying customers / customer acquisition
        if (mapping.id.includes('acquiring_customers')) {
          const payingCustomersKeys = ['payingCustomers', 'paying_customers', 'first_paying_customers', 'customerAcquisition'];
          for (const key of payingCustomersKeys) {
            if (questionnaireAnswers[key] && typeof questionnaireAnswers[key] === 'string' && questionnaireAnswers[key].trim()) {
              answer = questionnaireAnswers[key].trim();
              foundKey = key;
              break;
            }
          }
        }

        // Handle working duration
        if (mapping.id === 'early_revenue_working_duration') {
          const durationKeys = ['workingDuration', 'working_duration', 'since_when', 'duration_working'];
          for (const key of durationKeys) {
            if (questionnaireAnswers[key] && typeof questionnaireAnswers[key] === 'string' && questionnaireAnswers[key].trim()) {
              answer = questionnaireAnswers[key].trim();
              foundKey = key;
              break;
            }
          }
        }
      }

      if (answer && answer.length >= 10) { // Minimum answer length
        questions.push({
          questionId: mapping.id,
          questionText: mapping.text,
          userAnswer: answer,
          stage
        });
        
        console.log(`✅ Found answer for ${mapping.id} (key: ${foundKey}):`, answer.substring(0, 100));
      } else {
        console.log(`⚠️ No valid answer found for ${mapping.id}, tried keys:`, possibleKeys);
      }
    }

    console.log(`📋 Total questions extracted: ${questions.length}`);
    return questions;

  } catch (error) {
    console.error('❌ Error extracting questions:', error);
    return [];
  }
};

/**
 * Evaluate a single application using AI
 */
export const evaluateApplication = async (applicationId: string): Promise<AIEvaluationResult> => {
  try {
    console.log(`🤖 Starting AI evaluation for application: ${applicationId}`);

    // Update status to processing
    await supabase
      .from('yff_applications')
      .update({ 
        evaluation_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId);

    // Fetch application with related data
    const { data: application, error: fetchError } = await supabase
      .from('yff_applications')
      .select(`
        *,
        individuals(first_name, last_name, email),
        yff_team_registrations(*)
      `)
      .eq('application_id', applicationId)
      .single();

    if (fetchError || !application) {
      throw new Error(`Failed to fetch application: ${fetchError?.message || 'Application not found'}`);
    }

    console.log('📋 Application data loaded:', {
      id: application.application_id,
      hasTeamData: !!application.yff_team_registrations,
      answersType: typeof application.answers
    });

    // Extract questions for evaluation
    const questions = extractQuestionAnswers(application as ExtendedYffApplication);

    if (questions.length === 0) {
      throw new Error('No valid questions found for evaluation');
    }

    console.log(`📋 Found ${questions.length} questions to evaluate`);

    // Call comprehensive evaluation edge function
    const { data: evaluationResult, error: evalError } = await supabase.functions.invoke('comprehensive-evaluation', {
      body: {
        applicationId,
        questions: questions.map(q => ({
          questionId: q.questionId,
          questionText: q.questionText,
          userAnswer: q.userAnswer,
          stage: q.stage
        }))
      }
    });

    if (evalError) {
      throw new Error(`Evaluation failed: ${evalError.message}`);
    }

    if (!evaluationResult || !evaluationResult.success) {
      throw new Error(`Evaluation failed: ${evaluationResult?.error || 'Unknown error'}`);
    }

    const result = evaluationResult.data;
    console.log(`✅ AI evaluation completed with score: ${result.overall_score}`);

    return {
      overall_score: result.overall_score,
      question_scores: result.question_scores || {},
      idea_summary: result.idea_summary || '',
      evaluation_completed_at: new Date().toISOString(),
      evaluation_status: 'completed'
    };

  } catch (error) {
    console.error(`❌ AI evaluation failed for ${applicationId}:`, error);

    // Update status to failed
    await supabase
      .from('yff_applications')
      .update({ 
        evaluation_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId);

    throw error;
  }
};

/**
 * Re-evaluate an existing application
 */
export const reEvaluateApplication = async (applicationId: string): Promise<AIEvaluationResult> => {
  console.log(`🔄 Re-evaluating application: ${applicationId}`);
  
  // Clear existing evaluation data
  await supabase
    .from('yff_applications')
    .update({
      evaluation_status: 'pending',
      overall_score: 0,
      evaluation_data: {},
      evaluation_completed_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('application_id', applicationId);

  // Run fresh evaluation
  return evaluateApplication(applicationId);
};

/**
 * Trigger AI evaluation when application is submitted
 */
export const triggerEvaluationOnSubmission = async (applicationId: string): Promise<void> => {
  try {
    console.log(`🚀 Triggering AI evaluation for submitted application: ${applicationId}`);
    
    // Call the main evaluation function
    const result = await evaluateApplication(applicationId);
    
    // Convert question_scores to JSON-compatible format
    const evaluationDataForDb = Object.fromEntries(
      Object.entries(result.question_scores).map(([key, evaluation]) => [
        key,
        {
          score: evaluation.score,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
          questionText: evaluation.questionText,
          userAnswer: evaluation.userAnswer,
          raw_feedback: evaluation.raw_feedback
        }
      ])
    );
    
    // Update the application with the evaluation results
    await supabase
      .from('yff_applications')
      .update({
        evaluation_status: 'completed',
        overall_score: result.overall_score,
        evaluation_data: evaluationDataForDb,
        evaluation_completed_at: result.evaluation_completed_at,
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId);
    
    console.log(`✅ AI evaluation completed for application: ${applicationId} with score: ${result.overall_score}`);
    
  } catch (error) {
    console.error(`❌ Failed to trigger AI evaluation for ${applicationId}:`, error);
    
    // Update status to failed
    await supabase
      .from('yff_applications')
      .update({ 
        evaluation_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId);
    
    throw error;
  }
};
