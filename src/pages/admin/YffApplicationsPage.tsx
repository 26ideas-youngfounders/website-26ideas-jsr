
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
  // Fetch applications with individual data
  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ['yff-applications'],
    queryFn: async (): Promise<YffApplicationWithIndividual[]> => {
      const { data, error } = await supabase
        .from('yff_applications')
        .select(`
          *,
          individuals(
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
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
