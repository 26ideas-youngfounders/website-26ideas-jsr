
/**
 * @fileoverview CRM Dashboard - Main Admin Overview Page
 * 
 * Provides comprehensive overview of both YFF and mentor applications
 * with key metrics, recent activity, and quick action cards.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminAuth from '@/components/admin/AdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  UserCheck,
  Clock,
  TrendingUp,
  Eye,
  Download,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  yffApplications: {
    total: number;
    draft: number;
    submitted: number;
    under_review: number;
    approved: number;
    rejected: number;
    waitlisted: number;
  };
  mentorApplications: {
    total: number;
    submitted: number;
    under_review: number;
    approved: number;
    rejected: number;
  };
  recent: {
    yffCount: number;
    mentorCount: number;
  };
  pending: {
    yffReviews: number;
    mentorReviews: number;
  };
}

interface RecentApplication {
  id: string;
  type: 'yff' | 'mentor';
  applicantName: string;
  email: string;
  submittedAt: string;
  status: string;
}

interface ChartData {
  name: string;
  yff: number;
  mentor: number;
}

const CrmDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get YFF application stats
      const { data: yffData, error: yffError } = await supabase
        .from('yff_applications')
        .select('status, submitted_at');

      if (yffError) throw yffError;

      // Get mentor application stats
      const { data: mentorData, error: mentorError } = await supabase
        .from('mentor_applications')
        .select('application_status, submitted_at');

      if (mentorError) throw mentorError;

      // Calculate YFF stats
      const yffStats = {
        total: yffData?.length || 0,
        draft: yffData?.filter(app => app.status === 'draft').length || 0,
        submitted: yffData?.filter(app => app.status === 'submitted').length || 0,
        under_review: yffData?.filter(app => app.status === 'under_review').length || 0,
        approved: yffData?.filter(app => app.status === 'approved').length || 0,
        rejected: yffData?.filter(app => app.status === 'rejected').length || 0,
        waitlisted: yffData?.filter(app => app.status === 'waitlisted').length || 0,
      };

      // Calculate mentor stats
      const mentorStats = {
        total: mentorData?.length || 0,
        submitted: mentorData?.filter(app => app.application_status === 'submitted').length || 0,
        under_review: mentorData?.filter(app => app.application_status === 'under_review').length || 0,
        approved: mentorData?.filter(app => app.application_status === 'approved').length || 0,
        rejected: mentorData?.filter(app => app.application_status === 'rejected').length || 0,
      };

      // Calculate recent applications (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentYff = yffData?.filter(app => 
        app.submitted_at && new Date(app.submitted_at) > sevenDaysAgo
      ).length || 0;

      const recentMentor = mentorData?.filter(app => 
        app.submitted_at && new Date(app.submitted_at) > sevenDaysAgo
      ).length || 0;

      // Generate chart data for the last 7 days
      const chartData: ChartData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const yffCount = yffData?.filter(app => {
          if (!app.submitted_at) return false;
          const appDate = new Date(app.submitted_at);
          return appDate.toDateString() === date.toDateString();
        }).length || 0;

        const mentorCount = mentorData?.filter(app => {
          if (!app.submitted_at) return false;
          const appDate = new Date(app.submitted_at);
          return appDate.toDateString() === date.toDateString();
        }).length || 0;

        chartData.push({
          name: dateStr,
          yff: yffCount,
          mentor: mentorCount,
        });
      }

      // Set stats
      setStats({
        yffApplications: yffStats,
        mentorApplications: mentorStats,
        recent: {
          yffCount: recentYff,
          mentorCount: recentMentor,
        },
        pending: {
          yffReviews: yffStats.submitted,
          mentorReviews: mentorStats.submitted,
        },
      });

      setChartData(chartData);

      // Load recent applications with applicant details
      await loadRecentApplications();

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentApplications = async () => {
    try {
      // Get recent YFF applications with individual details
      const { data: recentYff, error: yffError } = await supabase
        .from('yff_applications')
        .select(`
          application_id,
          status,
          submitted_at,
          individual_id
        `)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false })
        .limit(5);

      if (yffError) {
        console.error('YFF error:', yffError);
      }

      // Get recent mentor applications with individual details
      const { data: recentMentor, error: mentorError } = await supabase
        .from('mentor_applications')
        .select(`
          application_id,
          application_status,
          submitted_at,
          individual_id
        `)
        .order('submitted_at', { ascending: false })
        .limit(5);

      if (mentorError) {
        console.error('Mentor error:', mentorError);
      }

      // Get individual details for the applications
      const allIndividualIds = [
        ...(recentYff || []).map(app => app.individual_id),
        ...(recentMentor || []).map(app => app.individual_id)
      ];

      const { data: individuals, error: individualsError } = await supabase
        .from('individuals')
        .select('individual_id, first_name, last_name, email')
        .in('individual_id', allIndividualIds);

      if (individualsError) {
        console.error('Individuals error:', individualsError);
      }

      // Create a map of individual data
      const individualsMap = new Map();
      individuals?.forEach(individual => {
        individualsMap.set(individual.individual_id, individual);
      });

      // Combine and format recent applications
      const combined: RecentApplication[] = [
        ...(recentYff || []).map(app => {
          const individual = individualsMap.get(app.individual_id);
          return {
            id: app.application_id,
            type: 'yff' as const,
            applicantName: individual ? 
              `${individual.first_name} ${individual.last_name}`.trim() || 'No name' : 
              'No name',
            email: individual?.email || 'No email',
            submittedAt: app.submitted_at,
            status: app.status,
          };
        }),
        ...(recentMentor || []).map(app => {
          const individual = individualsMap.get(app.individual_id);
          return {
            id: app.application_id,
            type: 'mentor' as const,
            applicantName: individual ? 
              `${individual.first_name} ${individual.last_name}`.trim() || 'No name' : 
              'No name',
            email: individual?.email || 'No email',
            submittedAt: app.submitted_at,
            status: app.application_status,
          };
        }),
      ].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
       .slice(0, 10);

      setRecentApplications(combined);
    } catch (error) {
      console.error('Error loading recent applications:', error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default'; // Green
      case 'rejected':
        return 'destructive'; // Red
      case 'under_review':
        return 'secondary'; // Blue
      case 'submitted':
        return 'outline'; // Yellow
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <AdminAuth>
        <AdminLayout>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </AdminLayout>
      </AdminAuth>
    );
  }

  if (error) {
    return (
      <AdminAuth>
        <AdminLayout>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </AdminLayout>
      </AdminAuth>
    );
  }

  return (
    <AdminAuth>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CRM Dashboard</h1>
            <p className="text-gray-600">Overview of applications and recent activity</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  YFF Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats?.yffApplications.total || 0}</div>
                <div className="text-xs text-gray-500 space-y-1 mt-2">
                  <div>Submitted: {stats?.yffApplications.submitted || 0}</div>
                  <div>Under Review: {stats?.yffApplications.under_review || 0}</div>
                  <div>Approved: {stats?.yffApplications.approved || 0}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Mentor Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats?.mentorApplications.total || 0}</div>
                <div className="text-xs text-gray-500 space-y-1 mt-2">
                  <div>Submitted: {stats?.mentorApplications.submitted || 0}</div>
                  <div>Under Review: {stats?.mentorApplications.under_review || 0}</div>
                  <div>Approved: {stats?.mentorApplications.approved || 0}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {(stats?.recent.yffCount || 0) + (stats?.recent.mentorCount || 0)}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Last 7 days: {stats?.recent.yffCount || 0} YFF, {stats?.recent.mentorCount || 0} Mentor
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Pending Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {(stats?.pending.yffReviews || 0) + (stats?.pending.mentorReviews || 0)}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {stats?.pending.yffReviews || 0} YFF, {stats?.pending.mentorReviews || 0} Mentor
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Application Trends (Last 7 Days)</CardTitle>
              <CardDescription>
                Daily application submissions for YFF and Mentor programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="yff" fill="#3b82f6" name="YFF Applications" />
                  <Bar dataKey="mentor" fill="#10b981" name="Mentor Applications" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link to="/admin/yff-applications">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Review YFF Applications</CardTitle>
                  <CardDescription>
                    {stats?.pending.yffReviews || 0} applications waiting for review
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View Applications
                  </Button>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link to="/admin/mentor-applications">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Review Mentor Applications</CardTitle>
                  <CardDescription>
                    {stats?.pending.mentorReviews || 0} applications waiting for review
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View Applications
                  </Button>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Export Data</CardTitle>
                <CardDescription>
                  Download application data and reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Options
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link to="/admin/analytics">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Application Statistics</CardTitle>
                  <CardDescription>
                    Detailed analytics and trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" variant="outline" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </CardContent>
              </Link>
            </Card>
          </div>

          {/* Recent Applications Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>
                Latest applications from both YFF and mentor programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentApplications.length > 0 ? (
                <div className="space-y-4">
                  {recentApplications.map((app) => (
                    <div 
                      key={`${app.type}-${app.id}`}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {app.type === 'yff' ? (
                            <Users className="h-5 w-5 text-blue-500" />
                          ) : (
                            <UserCheck className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{app.applicantName}</div>
                          <div className="text-sm text-gray-500">{app.email}</div>
                          <div className="text-xs text-gray-400">
                            {app.type === 'yff' ? 'YFF Application' : 'Mentor Application'} • 
                            {new Date(app.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={getStatusBadgeVariant(app.status)}>
                          {app.status.replace('_', ' ')}
                        </Badge>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/admin/${app.type}-application/${app.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No recent applications found
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminAuth>
  );
};

export default CrmDashboard;
