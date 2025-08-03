
/**
 * @fileoverview YFF Applications Admin Page with Real-time Updates
 * 
 * Main admin interface for viewing and managing YFF applications with
 * automatic refresh and real-time evaluation status updates.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { YffApplicationsTableEnhanced } from '@/components/admin/YffApplicationsTableEnhanced';
import { useApplicationEvaluationMonitor } from '@/hooks/useApplicationEvaluationMonitor';
import type { YffApplicationWithIndividual } from '@/types/yff-application';
import { AlertCircle } from 'lucide-react';

const YffApplicationsPage: React.FC = () => {
  // Monitor for applications needing evaluation
  const { pendingCount } = useApplicationEvaluationMonitor();

  // Fetch applications with individual data - shorter stale time for real-time feel
  const { data: applications = [], isLoading, error, refetch } = useQuery({
    queryKey: ['yff-applications'],
    queryFn: async (): Promise<YffApplicationWithIndividual[]> => {
      console.log('🔄 Fetching latest YFF applications from database...');
      
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
        .order('created_at', { ascending: false }); // Always show newest first

      if (error) {
        console.error('❌ Failed to fetch applications:', error);
        throw error;
      }

      console.log(`✅ Fetched ${data?.length || 0} applications successfully`);
      return data as YffApplicationWithIndividual[];
    },
    // Shorter stale time for more frequent updates
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    // Refetch on window focus to catch new applications
    refetchOnWindowFocus: true,
    // Refetch when coming back from background
    refetchOnReconnect: true,
  });

  // Set up real-time subscription for new applications
  useEffect(() => {
    console.log('🔗 Setting up real-time subscription for YFF applications...');
    
    const channel = supabase
      .channel('yff-applications-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'yff_applications'
        },
        (payload) => {
          console.log('📡 Real-time application update received:', payload);
          
          // Refetch data when any application changes
          refetch();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up real-time subscription...');
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-semibold mb-2">Error Loading Applications</h2>
          <p className="mb-4">Failed to load applications: {(error as Error).message}</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
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
            {applications.length > 0 && (
              <span className="ml-2 text-sm">
                ({applications.length} total applications)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1 text-orange-600">
              <AlertCircle className="h-4 w-4" />
              {pendingCount} pending evaluation{pendingCount !== 1 ? 's' : ''}
            </div>
          )}
          <div>Auto-refresh every 15 seconds</div>
        </div>
      </div>

      <YffApplicationsTableEnhanced 
        applications={applications}
        isLoading={isLoading}
      />
    </div>
  );
};

export default YffApplicationsPage;
