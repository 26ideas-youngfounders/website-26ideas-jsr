
/**
 * @fileoverview YFF Applications Admin Page
 * 
 * Main admin interface for viewing and managing YFF applications.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { YffApplicationsTable } from '@/components/admin/YffApplicationsTable';
import type { YffApplicationWithIndividual } from '@/types/yff-application';

const YffApplicationsPage: React.FC = () => {
  // Fetch applications with individual data and team registration data
  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ['yff-applications'],
    queryFn: async (): Promise<YffApplicationWithIndividual[]> => {
      console.log('🔍 Fetching YFF applications with team registration data...');
      
      const { data, error } = await supabase
        .from('yff_applications')
        .select(`
          *,
          individuals(
            first_name,
            last_name,
            email
          ),
          yff_team_registrations!inner(
            id,
            individual_id,
            full_name,
            email,
            phone_number,
            country_code,
            date_of_birth,
            linkedin_profile,
            social_media_handles,
            gender,
            institution_name,
            course_program,
            current_year_of_study,
            expected_graduation,
            current_city,
            state,
            pin_code,
            permanent_address,
            team_name,
            venture_name,
            number_of_team_members,
            team_members,
            industry_sector,
            website,
            referral_id,
            questionnaire_answers,
            application_status,
            questionnaire_completed_at,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching applications:', error);
        throw error;
      }

      console.log('✅ Fetched applications with team registration data:', data?.length);
      console.log('📋 Sample application data:', data?.[0]);
      
      return data as YffApplicationWithIndividual[];
    },
  });

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center text-red-600">
          Error loading applications: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">YFF Applications</h1>
          <p className="text-gray-600 mt-1">
            Manage and evaluate Young Founders Floor applications
          </p>
        </div>
      </div>

      <YffApplicationsTable 
        applications={applications}
        isLoading={isLoading}
      />
    </div>
  );
};

export default YffApplicationsPage;
