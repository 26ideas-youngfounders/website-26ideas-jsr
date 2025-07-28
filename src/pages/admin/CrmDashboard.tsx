
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TypeformSubmissionsCard } from '@/components/admin/TypeformSubmissionsCard';
import { 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp, 
  Building,
  MapPin,
  RefreshCw,
  Calendar,
  FileText
} from 'lucide-react';

interface DashboardStats {
  totalApplications: number;
  completedApplications: number;
  pendingApplications: number;
  todayApplications: number;
  typeformSubmissions: number;
  todayTypeformSubmissions: number;
  topInstitutions: Array<{ name: string; count: number }>;
  topCities: Array<{ name: string; count: number }>;
  recentApplications: Array<{
    id: string;
    full_name: string;
    team_name: string;
    created_at: string;
    application_status: string;
  }>;
}

/**
 * CRM Dashboard with real-time analytics and insights
 */
export const CrmDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    completedApplications: 0,
    pendingApplications: 0,
    todayApplications: 0,
    typeformSubmissions: 0,
    todayTypeformSubmissions: 0,
    topInstitutions: [],
    topCities: [],
    recentApplications: []
  });
  const [loading, setLoading] = useState(true);

  /**
   * Fetch dashboard statistics
   */
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching dashboard statistics...');

      // Get all applications
      const { data: applications, error: appsError } = await supabase
        .from('yff_team_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (appsError) {
        console.error('❌ Error fetching applications:', appsError);
        return;
      }

      // Get Typeform submissions
      const { data: typeformSubmissions, error: typeformError } = await supabase
        .from('typeform_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (typeformError) {
        console.error('❌ Error fetching Typeform submissions:', typeformError);
      }

      console.log('✅ Applications loaded:', applications?.length || 0);
      console.log('✅ Typeform submissions loaded:', typeformSubmissions?.length || 0);

      if (!applications) {
        setStats({
          totalApplications: 0,
          completedApplications: 0,
          pendingApplications: 0,
          todayApplications: 0,
          typeformSubmissions: 0,
          todayTypeformSubmissions: 0,
          topInstitutions: [],
          topCities: [],
          recentApplications: []
        });
        return;
      }

      // Calculate basic stats
      const totalApplications = applications.length;
      const completedApplications = applications.filter(app => 
        app.application_status === 'questionnaire_completed'
      ).length;
      const pendingApplications = applications.filter(app => 
        app.application_status === 'registration_completed'
      ).length;

      // Today's applications
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayApplications = applications.filter(app => {
        const appDate = new Date(app.created_at);
        appDate.setHours(0, 0, 0, 0);
        return appDate.getTime() === today.getTime();
      }).length;

      // Typeform stats
      const totalTypeformSubmissions = typeformSubmissions?.length || 0;
      const todayTypeformSubmissions = typeformSubmissions?.filter(sub => {
        const subDate = new Date(sub.submitted_at);
        subDate.setHours(0, 0, 0, 0);
        return subDate.getTime() === today.getTime();
      }).length || 0;

      // Top institutions
      const institutionCounts = applications.reduce((acc, app) => {
        const institution = app.institution_name;
        acc[institution] = (acc[institution] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topInstitutions = Object.entries(institutionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Top cities
      const cityCounts = applications.reduce((acc, app) => {
        const city = app.current_city;
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topCities = Object.entries(cityCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Recent applications
      const recentApplications = applications.slice(0, 5).map(app => ({
        id: app.id,
        full_name: app.full_name,
        team_name: app.team_name || 'No team name',
        created_at: app.created_at,
        application_status: app.application_status
      }));

      setStats({
        totalApplications,
        completedApplications,
        pendingApplications,
        todayApplications,
        typeformSubmissions: totalTypeformSubmissions,
        todayTypeformSubmissions,
        topInstitutions,
        topCities,
        recentApplications
      });

    } catch (error) {
      console.error('❌ Unexpected error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Set up real-time subscription for dashboard updates
   */
  useEffect(() => {
    // Initial load
    fetchDashboardStats();

    // Set up real-time subscription for applications
    console.log('🔄 Setting up real-time subscription for dashboard...');
    
    const channel = supabase
      .channel('dashboard_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'yff_team_registrations'
        },
        (payload) => {
          console.log('📡 Dashboard real-time update received:', payload);
          fetchDashboardStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typeform_submissions'
        },
        (payload) => {
          console.log('📡 Typeform submission real-time update received:', payload);
          fetchDashboardStats();
        }
      )
      .subscribe((status) => {
        console.log('📡 Dashboard subscription status:', status);
      });

    return () => {
      console.log('🔚 Cleaning up dashboard subscription...');
      supabase.removeChannel(channel);
    };
  }, []);

  /**
   * Get status badge variant
   */
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'registration_completed':
        return 'default';
      case 'questionnaire_completed':
        return 'secondary';
      case 'under_review':
        return 'outline';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">CRM Dashboard</h1>
            <p className="text-gray-600">
              Real-time insights and analytics for YFF applications
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchDashboardStats}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApplications}</div>
              <p className="text-xs text-muted-foreground">
                All time registrations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedApplications}</div>
              <p className="text-xs text-muted-foreground">
                Questionnaire completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApplications}</div>
              <p className="text-xs text-muted-foreground">
                Registration only
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today Apps</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayApplications}</div>
              <p className="text-xs text-muted-foreground">
                New applications today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Typeform Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.typeformSubmissions}</div>
              <p className="text-xs text-muted-foreground">
                Total submissions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Typeform Today</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayTypeformSubmissions}</div>
              <p className="text-xs text-muted-foreground">
                Today's submissions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Typeform Submissions Card */}
        <TypeformSubmissionsCard />

        {/* Charts and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Institutions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Top Institutions
              </CardTitle>
              <CardDescription>
                Institutions with most applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topInstitutions.map((institution, index) => (
                  <div key={institution.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{institution.name}</span>
                    </div>
                    <Badge>{institution.count}</Badge>
                  </div>
                ))}
                {stats.topInstitutions.length === 0 && (
                  <p className="text-sm text-gray-500">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Cities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Top Cities
              </CardTitle>
              <CardDescription>
                Cities with most applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topCities.map((city, index) => (
                  <div key={city.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{city.name}</span>
                    </div>
                    <Badge>{city.count}</Badge>
                  </div>
                ))}
                {stats.topCities.length === 0 && (
                  <p className="text-sm text-gray-500">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Applications
            </CardTitle>
            <CardDescription>
              Latest YFF team registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentApplications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">{app.full_name}</div>
                      <div className="text-sm text-gray-500">{app.team_name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(app.application_status)}>
                      {app.application_status.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {stats.recentApplications.length === 0 && (
                <p className="text-sm text-gray-500">No recent applications</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};
