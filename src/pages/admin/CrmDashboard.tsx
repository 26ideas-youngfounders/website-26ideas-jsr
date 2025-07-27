
import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp, 
  Building,
  GraduationCap,
  RefreshCw,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalApplications: number;
  completedApplications: number;
  pendingApplications: number;
  todayApplications: number;
  topInstitutions: Array<{ name: string; count: number }>;
  topCities: Array<{ name: string; count: number }>;
  applicationsByStatus: Array<{ status: string; count: number }>;
}

/**
 * CRM Dashboard with real-time YFF applications overview
 */
export const CrmDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    completedApplications: 0,
    pendingApplications: 0,
    todayApplications: 0,
    topInstitutions: [],
    topCities: [],
    applicationsByStatus: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  /**
   * Fetch dashboard statistics
   */
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching dashboard statistics...');
      
      // Get all applications
      const { data: applications, error } = await supabase
        .from('yff_team_registrations')
        .select('*');

      if (error) {
        console.error('❌ Error fetching applications:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data.',
          variant: 'destructive',
        });
        return;
      }

      // Calculate statistics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const totalApplications = applications.length;
      const completedApplications = applications.filter(app => 
        app.questionnaire_completed_at !== null
      ).length;
      const pendingApplications = applications.filter(app => 
        app.questionnaire_completed_at === null
      ).length;
      const todayApplications = applications.filter(app => 
        new Date(app.created_at) >= today
      ).length;

      // Top institutions
      const institutionCounts = applications.reduce((acc, app) => {
        acc[app.institution_name] = (acc[app.institution_name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topInstitutions = Object.entries(institutionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Top cities
      const cityCounts = applications.reduce((acc, app) => {
        const cityState = `${app.current_city}, ${app.state}`;
        acc[cityState] = (acc[cityState] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topCities = Object.entries(cityCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Applications by status
      const statusCounts = applications.reduce((acc, app) => {
        acc[app.application_status] = (acc[app.application_status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const applicationsByStatus = Object.entries(statusCounts)
        .map(([status, count]) => ({ status, count }));

      setStats({
        totalApplications,
        completedApplications,
        pendingApplications,
        todayApplications,
        topInstitutions,
        topCities,
        applicationsByStatus
      });

      console.log('✅ Dashboard statistics loaded:', {
        totalApplications,
        completedApplications,
        pendingApplications,
        todayApplications
      });
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard statistics.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Set up real-time updates
   */
  useEffect(() => {
    // Initial load
    fetchDashboardStats();

    // Set up real-time subscription
    console.log('🔄 Setting up real-time subscription for dashboard...');
    
    const channel = supabase
      .channel('crm_dashboard_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'yff_team_registrations'
        },
        () => {
          console.log('📡 Dashboard update received, refreshing stats...');
          fetchDashboardStats();
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading dashboard...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">CRM Dashboard</h1>
            <p className="text-gray-600">
              YFF Applications overview and analytics
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchDashboardStats}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              onClick={() => navigate('/admin/yff-applications')}
              size="sm"
            >
              <Eye className="h-4 w-4 mr-1" />
              View All Applications
            </Button>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                Awaiting questionnaire
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayApplications}</div>
              <p className="text-xs text-muted-foreground">
                New applications today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Applications by Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.applicationsByStatus.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <Badge variant="outline">
                      {item.status.replace('_', ' ')}
                    </Badge>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Institutions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5" />
                Top Institutions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.topInstitutions.map((institution, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="text-sm font-medium truncate flex-1">
                      {institution.name}
                    </div>
                    <Badge variant="secondary">{institution.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Cities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Top Cities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.topCities.map((city, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="text-sm font-medium truncate flex-1">
                      {city.name}
                    </div>
                    <Badge variant="secondary">{city.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};
