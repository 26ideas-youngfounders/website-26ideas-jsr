
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search,
  RefreshCw,
  Users,
  Calendar,
  Mail,
  Phone,
  Building,
  Eye,
  ChevronUp,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';
import { YffApplicationDetailsDialog } from './YffApplicationDetailsDialog';
import { format } from 'date-fns';

interface YffRegistration {
  id: string;
  individual_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  team_name: string | null;
  venture_name: string | null;
  application_status: string;
  created_at: string;
  updated_at: string;
  questionnaire_completed_at: string | null;
  number_of_team_members: number;
  institution_name: string;
  current_city: string;
  state: string;
  industry_sector: string | null;
  country_code: string;
  gender: string;
  course_program: string;
  current_year_of_study: string;
  expected_graduation: string;
  date_of_birth: string;
  pin_code: string;
  permanent_address: string;
  linkedin_profile: string | null;
  website: string | null;
  social_media_handles: string | null;
  referral_id: string | null;
  team_members: any[];
  questionnaire_answers: any;
}

type SortField = 'created_at' | 'full_name' | 'team_name' | 'application_status' | 'venture_name';
type SortDirection = 'asc' | 'desc';

/**
 * Real-time YFF Applications Table with comprehensive admin features
 */
export const YffApplicationsTable = () => {
  const [applications, setApplications] = useState<YffRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedApplication, setSelectedApplication] = useState<YffRegistration | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { toast } = useToast();

  /**
   * Parse and normalize team members data
   */
  const parseTeamMembers = (teamMembers: any): any[] => {
    if (!teamMembers) return [];
    if (Array.isArray(teamMembers)) return teamMembers;
    if (typeof teamMembers === 'string') {
      try {
        return JSON.parse(teamMembers);
      } catch {
        return [];
      }
    }
    return [];
  };

  /**
   * Fetch all applications from the database
   */
  const fetchApplications = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching YFF team registrations...');
      
      const { data, error } = await supabase
        .from('yff_team_registrations')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) {
        console.error('❌ Error fetching applications:', error);
        toast({
          title: 'Error',
          description: 'Failed to load applications. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ Applications loaded:', data?.length || 0);
      
      // Parse and normalize the data
      const normalizedData = (data || []).map(app => ({
        ...app,
        team_members: parseTeamMembers(app.team_members),
        questionnaire_answers: app.questionnaire_answers || {}
      }));
      
      setApplications(normalizedData);
    } catch (error) {
      console.error('❌ Unexpected error fetching applications:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while loading applications.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Set up real-time subscription for applications
   */
  useEffect(() => {
    // Initial load
    fetchApplications();

    // Set up real-time subscription
    console.log('🔄 Setting up real-time subscription for yff_team_registrations...');
    
    const channel = supabase
      .channel('yff_team_registrations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'yff_team_registrations'
        },
        (payload) => {
          console.log('📡 Real-time update received:', payload);
          
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          setApplications(prevApps => {
            switch (eventType) {
              case 'INSERT':
                console.log('➕ New application added:', newRecord);
                toast({
                  title: 'New Application',
                  description: `New application from ${newRecord.full_name}`,
                  duration: 5000,
                });
                const normalizedNew = {
                  ...newRecord,
                  team_members: parseTeamMembers(newRecord.team_members),
                  questionnaire_answers: newRecord.questionnaire_answers || {}
                } as YffRegistration;
                return [...prevApps, normalizedNew];
              
              case 'UPDATE':
                console.log('✏️ Application updated:', newRecord);
                toast({
                  title: 'Application Updated',
                  description: `${newRecord.full_name}'s application was updated`,
                  duration: 3000,
                });
                const normalizedUpdate = {
                  ...newRecord,
                  team_members: parseTeamMembers(newRecord.team_members),
                  questionnaire_answers: newRecord.questionnaire_answers || {}
                } as YffRegistration;
                return prevApps.map(app => 
                  app.id === newRecord.id ? normalizedUpdate : app
                );
              
              case 'DELETE':
                console.log('🗑️ Application deleted:', oldRecord);
                toast({
                  title: 'Application Deleted',
                  description: 'An application was removed',
                  duration: 3000,
                });
                return prevApps.filter(app => app.id !== oldRecord.id);
              
              default:
                return prevApps;
            }
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔚 Cleaning up real-time subscription...');
      supabase.removeChannel(channel);
    };
  }, [sortField, sortDirection, toast]);

  /**
   * Handle sorting
   */
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  /**
   * Get sort icon for column headers
   */
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  /**
   * Filter applications based on search term
   */
  const filteredApplications = applications.filter(app => {
    const searchLower = searchTerm.toLowerCase();
    return (
      app.full_name.toLowerCase().includes(searchLower) ||
      app.email.toLowerCase().includes(searchLower) ||
      app.team_name?.toLowerCase().includes(searchLower) ||
      app.venture_name?.toLowerCase().includes(searchLower) ||
      app.application_status.toLowerCase().includes(searchLower) ||
      app.institution_name.toLowerCase().includes(searchLower) ||
      app.current_city.toLowerCase().includes(searchLower) ||
      app.industry_sector?.toLowerCase().includes(searchLower)
    );
  });

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

  /**
   * Handle application details view
   */
  const handleViewDetails = (application: YffRegistration) => {
    setSelectedApplication(application);
    setShowDetailsDialog(true);
  };

  /**
   * Manual refresh
   */
  const handleRefresh = () => {
    fetchApplications();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading applications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">YFF Team Registrations</h2>
          <Badge variant="outline">{applications.length} total</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort('full_name')}>
                <div className="flex items-center gap-2">
                  Team Leader
                  {getSortIcon('full_name')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('team_name')}>
                <div className="flex items-center gap-2">
                  Team & Venture
                  {getSortIcon('team_name')}
                </div>
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Education</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('application_status')}>
                <div className="flex items-center gap-2">
                  Status
                  {getSortIcon('application_status')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>
                <div className="flex items-center gap-2">
                  Submitted
                  {getSortIcon('created_at')}
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No applications match your search.' : 'No applications found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredApplications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{application.full_name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {application.number_of_team_members} member{application.number_of_team_members !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{application.team_name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{application.venture_name || 'N/A'}</div>
                      {application.industry_sector && (
                        <div className="text-xs text-gray-400">{application.industry_sector}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3" />
                        {application.email}
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {application.country_code} {application.phone_number}
                      </div>
                      <div className="text-xs text-gray-500">
                        {application.current_city}, {application.state}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Building className="h-3 w-3" />
                        {application.institution_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {application.course_program}
                      </div>
                      <div className="text-xs text-gray-500">
                        {application.current_year_of_study} • Grad: {application.expected_graduation}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant={getStatusBadgeVariant(application.application_status)}>
                        {application.application_status.replace('_', ' ')}
                      </Badge>
                      {application.questionnaire_completed_at && (
                        <div className="text-xs text-green-600">
                          Questionnaire completed
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(application.created_at), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(application.created_at), 'HH:mm')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewDetails(application)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Details Dialog */}
      {selectedApplication && (
        <YffApplicationDetailsDialog
          application={selectedApplication}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        />
      )}
    </div>
  );
};
