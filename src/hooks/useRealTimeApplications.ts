
/**
 * @fileoverview Enhanced Real-time Applications Hook
 * 
 * Manages real-time YFF applications data with comprehensive error handling,
 * connection management, and optimized queries using the new foreign key relationship.
 * 
 * @version 3.0.0
 * @author 26ideas Development Team
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeSubscriptionManager } from '@/utils/realtime-subscription-manager';
import type { YffApplicationWithRegistration, EnhancedYffApplication } from '@/types/yff-application';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface UseRealTimeApplicationsReturn {
  applications: EnhancedYffApplication[];
  isLoading: boolean;
  error: Error | null;
  isConnected: boolean;
  retryCount: number;
  lastUpdate: Date | null;
  refetch: () => Promise<void>;
}

export const useRealTimeApplications = (): UseRealTimeApplicationsReturn => {
  const [applications, setApplications] = useState<EnhancedYffApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const subscriptionManagerRef = useRef<RealtimeSubscriptionManager | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Fetch applications with enhanced query using the new foreign key relationship
   */
  const fetchApplications = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 Fetching applications with enhanced relationships...');
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
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
          yff_team_registrations!application_id (
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
          yff_evaluations:application_id (
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

      if (fetchError) {
        throw new Error(`Failed to fetch applications: ${fetchError.message}`);
      }

      // Transform the data to match our enhanced interface
      const enhancedApplications: EnhancedYffApplication[] = (data || []).map(app => ({
        application_id: app.application_id,
        individual_id: app.individual_id,
        status: app.status,
        evaluation_status: app.evaluation_status || 'pending',
        answers: app.answers || {},
        cumulative_score: app.cumulative_score,
        overall_score: app.overall_score,
        evaluation_data: app.evaluation_data || {},
        reviewer_scores: app.reviewer_scores || {},
        application_round: app.application_round || 'current',
        evaluation_completed_at: app.evaluation_completed_at,
        created_at: app.created_at,
        updated_at: app.updated_at,
        submitted_at: app.submitted_at,
        // Transform related data
        individual: Array.isArray(app.individuals) ? app.individuals[0] : app.individuals,
        teamRegistration: Array.isArray(app.yff_team_registrations) 
          ? app.yff_team_registrations[0] 
          : app.yff_team_registrations,
        evaluations: Array.isArray(app.yff_evaluations) ? app.yff_evaluations : []
      }));

      if (isMountedRef.current) {
        setApplications(enhancedApplications);
        setLastUpdate(new Date());
        setRetryCount(0);
        console.log(`✅ Successfully fetched ${enhancedApplications.length} applications`);
      }

    } catch (err) {
      console.error('❌ Error fetching applications:', err);
      if (isMountedRef.current) {
        setError(err as Error);
        setRetryCount(prev => prev + 1);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Handle real-time application changes
   */
  const handleApplicationChange = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    console.log('📨 Real-time application change:', {
      eventType: payload.eventType,
      table: payload.table,
      applicationId: payload.new?.application_id || payload.old?.application_id
    });

    if (!isMountedRef.current) return;

    // For now, refetch all data when changes occur
    // In a production app, you might want to handle individual updates more efficiently
    fetchApplications();
    setLastUpdate(new Date());
  }, [fetchApplications]);

  /**
   * Handle real-time team registration changes
   */
  const handleRegistrationChange = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    console.log('📨 Real-time registration change:', {
      eventType: payload.eventType,
      table: payload.table,
      registrationId: payload.new?.id || payload.old?.id
    });

    if (!isMountedRef.current) return;

    // Refetch when registrations change as they affect applications
    fetchApplications();
    setLastUpdate(new Date());
  }, [fetchApplications]);

  /**
   * Initialize real-time subscriptions
   */
  const setupRealTimeSubscriptions = useCallback(async () => {
    try {
      console.log('🔄 Setting up real-time subscriptions...');
      
      subscriptionManagerRef.current = new RealtimeSubscriptionManager();

      // Listen to subscription state changes
      subscriptionManagerRef.current.addListener((state) => {
        setIsConnected(state.isActive);
        if (state.lastError) {
          console.warn('⚠️ Subscription error:', state.lastError);
        }
      });

      // Start the subscription manager
      const started = await subscriptionManagerRef.current.start();
      if (!started) {
        throw new Error('Failed to start subscription manager');
      }

      // Subscribe to applications changes
      subscriptionManagerRef.current.subscribe(
        'yff_applications',
        {
          table: 'yff_applications',
          event: '*',
        },
        handleApplicationChange
      );

      // Subscribe to team registrations changes
      subscriptionManagerRef.current.subscribe(
        'yff_team_registrations',
        {
          table: 'yff_team_registrations',
          event: '*',
        },
        handleRegistrationChange
      );

      console.log('✅ Real-time subscriptions set up successfully');

    } catch (err) {
      console.error('❌ Error setting up real-time subscriptions:', err);
      setError(err as Error);
    }
  }, [handleApplicationChange, handleRegistrationChange]);

  /**
   * Cleanup subscriptions
   */
  const cleanupSubscriptions = useCallback(() => {
    if (subscriptionManagerRef.current) {
      console.log('🧹 Cleaning up real-time subscriptions...');
      subscriptionManagerRef.current.stop();
      subscriptionManagerRef.current = null;
    }
  }, []);

  // Initial setup
  useEffect(() => {
    isMountedRef.current = true;
    
    const initialize = async () => {
      await fetchApplications();
      await setupRealTimeSubscriptions();
    };

    initialize();

    return () => {
      isMountedRef.current = false;
      cleanupSubscriptions();
    };
  }, [fetchApplications, setupRealTimeSubscriptions, cleanupSubscriptions]);

  // Refetch function for manual refresh
  const refetch = useCallback(async () => {
    await fetchApplications();
  }, [fetchApplications]);

  return {
    applications,
    isLoading,
    error,
    isConnected,
    retryCount,
    lastUpdate,
    refetch,
  };
};
