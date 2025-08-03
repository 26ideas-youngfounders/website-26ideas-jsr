
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { YffApplicationsTableEnhanced } from '@/components/admin/YffApplicationsTableEnhanced';
import { useApplicationEvaluationMonitor } from '@/hooks/useApplicationEvaluationMonitor';
import { batchEvaluateApplications } from '@/services/yff-auto-evaluation-service';
import type { YffApplicationWithIndividual } from '@/types/yff-application';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const YffApplicationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
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
      
      // Debug log for troubleshooting
      if (data && data.length > 0) {
        console.log('📊 Application sample:', {
          totalCount: data.length,
          firstApplication: {
            id: data[0].application_id,
            status: data[0].status,
            evaluationStatus: data[0].evaluation_status,
            overallScore: data[0].overall_score,
            createdAt: data[0].created_at
          }
        });
      }
      
      return data as YffApplicationWithIndividual[];
    },
    // Shorter stale time for more frequent updates
    staleTime: 10000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
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

  // Manual batch evaluation trigger
  const handleBatchEvaluation = async () => {
    const unevaluatedApps = applications.filter(app => 
      app.evaluation_status === 'pending' || 
      app.evaluation_status === 'failed'
    );

    if (unevaluatedApps.length === 0) {
      toast({
        title: "No Applications to Evaluate",
        description: "All applications have already been evaluated.",
      });
      return;
    }

    try {
      toast({
        title: "Starting Batch Evaluation",
        description: `Processing ${unevaluatedApps.length} applications...`,
      });

      await batchEvaluateApplications(unevaluatedApps.map(app => app.application_id));
      
      toast({
        title: "Batch Evaluation Complete",
        description: "Applications have been queued for evaluation.",
      });

      // Refresh data
      refetch();
    } catch (error) {
      toast({
        title: "Batch Evaluation Failed",
        description: "Failed to start batch evaluation. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-semibold mb-2">Error Loading Applications</h2>
          <p className="mb-4">Failed to load applications: {(error as Error).message}</p>
          <Button 
            onClick={() => refetch()}
            className="mr-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Full Page Refresh
          </Button>
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
        <div className="flex items-center gap-4">
          {pendingCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-orange-600">
                <AlertCircle className="h-4 w-4" />
                {pendingCount} pending evaluation{pendingCount !== 1 ? 's' : ''}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBatchEvaluation}
              >
                Evaluate All
              </Button>
            </div>
          )}
          <div className="text-sm text-gray-500">
            Auto-refresh every 10 seconds
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {applications.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Applications Found
          </h3>
          <p className="text-gray-600 mb-4">
            No YFF applications have been submitted yet, or there may be a data fetching issue.
          </p>
          <div className="space-x-2">
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                console.log('🔍 Debug info:', {
                  userAgent: navigator.userAgent,
                  timestamp: new Date().toISOString(),
                  queryState: { isLoading, error: error?.message }
                });
              }}
            >
              Debug Info
            </Button>
          </div>
        </div>
      )}

      <YffApplicationsTableEnhanced 
        applications={applications}
        isLoading={isLoading}
      />
    </div>
  );
};

export default YffApplicationsPage;
