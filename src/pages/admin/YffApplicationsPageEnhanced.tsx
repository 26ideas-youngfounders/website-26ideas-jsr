
/**
 * @fileoverview Enhanced YFF Applications Admin Page with Real-time Updates
 * 
 * Main admin interface with comprehensive AI evaluation integration,
 * background job monitoring, and real-time data updates.
 * 
 * @version 2.0.0
 * @author 26ideas Development Team
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { YffApplicationsTableEnhanced } from '@/components/admin/YffApplicationsTableEnhanced';
import { BackgroundJobMonitor } from '@/components/admin/BackgroundJobMonitor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, FileText, Settings } from 'lucide-react';
import type { YffApplicationWithIndividual } from '@/types/yff-application';

const YffApplicationsPageEnhanced: React.FC = () => {
  const [activeTab, setActiveTab] = useState('applications');

  // Fetch applications with individual data and real-time updates
  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ['yff-applications-enhanced'],
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
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="font-medium">Error loading applications</p>
              <p className="text-sm mt-1">{(error as Error).message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">YFF Applications Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage, evaluate, and monitor Young Founders Floor applications
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">
            {applications.length} total applications
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Background Jobs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="mt-6">
          <YffApplicationsTableEnhanced 
            applications={applications}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="monitoring" className="mt-6">
          <BackgroundJobMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default YffApplicationsPageEnhanced;
