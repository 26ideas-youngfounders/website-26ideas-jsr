
/**
 * @fileoverview YFF Applications Management Page
 * 
 * Allows admins to view, filter, and manage YFF applications
 * with detailed information display and scoring capabilities.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminAuth from '@/components/admin/AdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  AlertCircle,
  Users,
  Calendar,
  Mail,
  Star
} from 'lucide-react';

interface YffApplication {
  application_id: string;
  individual_id: string;
  status: string;
  application_round: string;
  answers: any;
  cumulative_score: number;
  submitted_at: string;
  individuals: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

const YffApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<YffApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<YffApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roundFilter, setRoundFilter] = useState('all');

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter, roundFilter]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('yff_applications')
        .select(`
          application_id,
          individual_id,
          status,
          application_round,
          answers,
          cumulative_score,
          submitted_at
        `)
        .order('submitted_at', { ascending: false });

      if (applicationsError) {
        throw applicationsError;
      }

      // Get individual details
      const individualIds = applicationsData?.map(app => app.individual_id) || [];
      
      if (individualIds.length > 0) {
        const { data: individualsData, error: individualsError } = await supabase
          .from('individuals')
          .select('individual_id, first_name, last_name, email')
          .in('individual_id', individualIds);

        if (individualsError) {
          throw individualsError;
        }

        // Create a map of individuals by ID
        const individualsMap = new Map();
        individualsData?.forEach(individual => {
          individualsMap.set(individual.individual_id, individual);
        });

        // Combine application and individual data
        const combinedData: YffApplication[] = applicationsData?.map(app => ({
          ...app,
          individuals: individualsMap.get(app.individual_id) || null
        })) || [];

        setApplications(combinedData);
      } else {
        setApplications([]);
      }

    } catch (error) {
      console.error('Error loading YFF applications:', error);
      setError('Failed to load YFF applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app => {
        const individual = app.individuals;
        return (
          individual?.first_name?.toLowerCase().includes(term) ||
          individual?.last_name?.toLowerCase().includes(term) ||
          individual?.email?.toLowerCase().includes(term) ||
          app.application_id.toLowerCase().includes(term)
        );
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Filter by round
    if (roundFilter !== 'all') {
      filtered = filtered.filter(app => app.application_round === roundFilter);
    }

    setFilteredApplications(filtered);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'under_review':
        return 'secondary';
      case 'submitted':
        return 'outline';
      case 'waitlisted':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <AdminAuth>
        <AdminLayout>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">YFF Applications</h1>
                <p className="text-gray-600">Manage and review Young Founders Floor applications</p>
              </div>
            </div>
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">YFF Applications</h1>
              <p className="text-gray-600">
                {applications.length} total applications • {filteredApplications.length} displayed
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, email, or application ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="waitlisted">Waitlisted</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roundFilter} onValueChange={setRoundFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by round" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rounds</SelectItem>
                    <SelectItem value="current">Current Round</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Applications Table */}
          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
              <CardDescription>
                {filteredApplications.length} applications found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredApplications.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Application ID</TableHead>
                      <TableHead>Round</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((application) => (
                      <TableRow key={application.application_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {application.individuals ? 
                                `${application.individuals.first_name} ${application.individuals.last_name}` :
                                'No name'
                              }
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {application.individuals?.email || 'No email'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {application.application_id.slice(0, 8)}...
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {application.application_round || 'current'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 mr-1 text-yellow-500" />
                            {application.cumulative_score || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(application.status)}>
                            {application.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {application.submitted_at ? 
                              new Date(application.submitted_at).toLocaleDateString() :
                              'Not submitted'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No YFF applications found</h3>
                  <p className="text-gray-500">
                    {applications.length === 0 
                      ? "No YFF applications have been submitted yet."
                      : "No applications match your current filters."
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminAuth>
  );
};

export default YffApplicationsPage;
