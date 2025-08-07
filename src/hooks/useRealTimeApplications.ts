
/**
 * @fileoverview Real-time YFF Applications Hook with Enhanced Data Fetching
 * 
 * Custom React hook for real-time application data with Supabase subscriptions,
 * including comprehensive individual and team registration data relationships.
 * 
 * @version 2.2.0
 * @author 26ideas Development Team
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  EnhancedYffApplication,
  parseApplicationAnswers,
  parseEvaluationData
} from '@/types/yff-application';

interface UseRealTimeApplicationsReturn {
  applications: EnhancedYffApplication[];
  isLoading: boolean;
  error: Error | null;
  isConnected: boolean;
  retryCount: number;
  lastUpdate: Date | null;
}

const QUERY_KEY = ['yff-applications-enhanced'];
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

/**
 * Custom hook for real-time YFF application data with enhanced relationships
 */
export const useRealTimeApplications = (): UseRealTimeApplicationsReturn => {
  const [isConnected, setIsConnected] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const queryClient = useQueryClient();

  /**
   * Fetch enhanced application data with joins
   */
  const fetchEnhancedApplications = useCallback(async (): Promise<EnhancedYffApplication[]> => {
    const { data: applications, error } = await supabase
      .from('yff_applications')
      .select(`
        *,
        individuals:individual_id (
          individual_id,
          first_name,
          last_name,
          email,
          phone_number,
          country_code,
          country_iso_code,
          is_active,
          privacy_consent,
          data_processing_consent,
          typeform_registered,
          email_verified,
          created_at,
          updated_at
        ),
        yff_team_registrations:yff_team_registrations!application_id (
          id,
          individual_id,
          application_id,
          venture_name,
          team_name,
          number_of_team_members,
          team_members,
          industry_sector,
          website,
          full_name,
          email,
          phone_number,
          country_code,
          linkedin_profile,
          social_media_handles,
          date_of_birth,
          gender,
          institution_name,
          course_program,
          current_year_of_study,
          expected_graduation,
          current_city,
          state,
          pin_code,
          permanent_address,
          referral_id,
          application_status,
          questionnaire_answers,
          questionnaire_completed_at,
          created_at,
          updated_at
        ),
        yff_evaluations:yff_evaluations!application_id (
          id,
          application_id,
          overall_score,
          question_scores,
          evaluation_metadata,
          idea_summary,
          evaluation_completed_at,
          created_at,
          updated_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch applications: ${error.message}`);
    }

    // Transform the data to match our enhanced type structure
    const enhancedApplications: EnhancedYffApplication[] = (applications || []).map(app => {
      // Parse JSON fields safely
      const parsedAnswers = typeof app.answers === 'string' 
        ? (() => { try { return JSON.parse(app.answers); } catch { return {}; } })()
        : (app.answers as Record<string, any>) || {};

      const parsedEvaluationData = typeof app.evaluation_data === 'string'
        ? (() => { try { return JSON.parse(app.evaluation_data); } catch { return {}; } })()
        : (app.evaluation_data as Record<string, any>) || {};

      const parsedReviewerScores = typeof app.reviewer_scores === 'string'
        ? (() => { try { return JSON.parse(app.reviewer_scores); } catch { return {}; } })()
        : (app.reviewer_scores as Record<string, any>) || {};

      return {
        application_id: app.application_id,
        individual_id: app.individual_id,
        status: app.status,
        evaluation_status: app.evaluation_status,
        answers: parsedAnswers,
        cumulative_score: app.cumulative_score,
        overall_score: app.overall_score,
        evaluation_data: parsedEvaluationData,
        reviewer_scores: parsedReviewerScores,
        application_round: app.application_round,
        evaluation_completed_at: app.evaluation_completed_at,
        created_at: app.created_at,
        updated_at: app.updated_at,
        submitted_at: app.submitted_at,
        // Related data
        individual: Array.isArray(app.individuals) ? app.individuals[0] : app.individuals,
        teamRegistration: Array.isArray(app.yff_team_registrations) 
          ? app.yff_team_registrations[0] 
          : app.yff_team_registrations,
        evaluations: Array.isArray(app.yff_evaluations) ? app.yff_evaluations : []
      };
    });

    return enhancedApplications;
  }, []);

  // Main query for applications data
  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchEnhancedApplications,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
    retry: (failureCount, error) => {
      console.error('Query failed:', error);
      return failureCount < MAX_RETRIES;
    },
  });

  /**
   * Set up real-time subscriptions
   */
  useEffect(() => {
    const setupRealtimeSubscriptions = () => {
      // Subscribe to applications table changes
      const applicationsSubscription = supabase
        .channel('yff_applications_changes')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'yff_applications' 
          },
          (payload) => {
            console.log('Applications change detected:', payload);
            setLastUpdate(new Date());
            
            // Invalidate and refetch the query
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            
            // Handle specific change types if needed
            if (payload.eventType === 'UPDATE' && payload.new?.application_id) {
              const applicationId = payload.new.application_id;
              console.log(`Application ${applicationId} updated`);
            }
          }
        )
        .subscribe((status) => {
          console.log('Applications subscription status:', status);
          setIsConnected(status === 'SUBSCRIBED');
          
          if (status === 'SUBSCRIBED') {
            setRetryCount(0);
          }
        });

      // Subscribe to team registrations changes
      const teamRegistrationsSubscription = supabase
        .channel('yff_team_registrations_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'yff_team_registrations'
          },
          (payload) => {
            console.log('Team registration change detected:', payload);
            setLastUpdate(new Date());
            
            // Invalidate and refetch when team data changes
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            
            if (payload.eventType === 'UPDATE' && payload.new?.id) {
              const registrationId = payload.new.id;
              console.log(`Team registration ${registrationId} updated`);
            }
          }
        )
        .subscribe((status) => {
          console.log('Team registrations subscription status:', status);
        });

      // Subscribe to evaluations changes
      const evaluationsSubscription = supabase
        .channel('yff_evaluations_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'yff_evaluations'
          },
          (payload) => {
            console.log('Evaluation change detected:', payload);
            setLastUpdate(new Date());
            
            // Invalidate and refetch when evaluation data changes
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            
            if (payload.eventType === 'INSERT' && payload.new?.id) {
              const evaluationId = payload.new.id;
              console.log(`New evaluation ${evaluationId} created`);
            }
          }
        )
        .subscribe((status) => {
          console.log('Evaluations subscription status:', status);
        });

      return [applicationsSubscription, teamRegistrationsSubscription, evaluationsSubscription];
    };

    const subscriptions = setupRealtimeSubscriptions();
    
    // Cleanup function
    return () => {
      subscriptions.forEach(subscription => {
        supabase.removeChannel(subscription);
      });
    };
  }, [queryClient]);

  /**
   * Handle connection retry logic
   */
  useEffect(() => {
    if (!isConnected && retryCount < MAX_RETRIES) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        console.log(`Retrying connection... (${retryCount + 1}/${MAX_RETRIES})`);
        
        // Force refetch on retry
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }, RETRY_DELAY);

      return () => clearTimeout(timer);
    }
  }, [isConnected, retryCount, queryClient]);

  return {
    applications,
    isLoading,
    error: error as Error | null,
    isConnected,
    retryCount,
    lastUpdate,
  };
};
