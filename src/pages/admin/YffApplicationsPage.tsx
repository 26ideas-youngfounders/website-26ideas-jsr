
/**
 * @fileoverview YFF Applications Admin Page
 * 
 * Comprehensive admin interface for viewing, reviewing, and scoring
 * Young Founders Floor competition applications.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, Star, Calendar, User } from 'lucide-react';
import ApplicationScoringDialog from '@/components/admin/ApplicationScoringDialog';
import { format } from 'date-fns';

interface YffApplication {
  application_id: string;
  individual_id: string;
  status: string;
  application_round: string;
  answers: Record<string, any>;
  cumulative_score: number;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  individuals: {
    first_name: string;
    last_name: string;
    email: string;
    mobile: string;
  };
}

const YffApplicationsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<YffApplication | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch YFF applications with individual details
  const { data: applications, isLoading } = useQuery({
    queryKey: ['yff-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yff_applications')
        .select(`
          *,
          individuals (
            first_name,
            last_name,
            email,
            mobile
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching YFF applications:', error);
        throw error;
      }
      return data || [];
    },
  });

  // Update application status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string; status: string }) => {
      const { error } = await supabase
        .from('yff_applications')
        .update({ status })
        .eq('application_id', applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yff-applications'] });
      toast({
        title: "Success",
        description: "Application status updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating application status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    },
  });

  // Filter applications based on search and status
  const filteredApplications = applications?.filter((app) => {
    const searchMatch = !searchTerm || 
      `${app.individuals.first_name} ${app.individuals.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.individuals.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const statusMatch = statusFilter === 'all' || app.status === statusFilter;
    
    return searchMatch && statusMatch;
  }) || [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'default';
      case 'under_review':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleStatusChange = (applicationId: string, newStatus: string) => {
    updateStatusMutation.mutate({ applicationId, status: newStatus });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">YFF Applications</h1>
          <p className="text-muted-foreground">
            Review and score Young Founders Floor competition applications
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submitted</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications?.filter(app => app.status === 'submitted').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Under Review</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications?.filter(app => app.status === 'under_review').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications?.length ? 
                  (applications.reduce((sum, app) => sum + (app.cumulative_score || 0), 0) / applications.length).toFixed(1) : 
                  '0.0'
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Applications ({filteredApplications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Round</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading applications...
                    </TableCell>
                  </TableRow>
                ) : filteredApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications.map((application) => (
                    <TableRow key={application.application_id}>
                      <TableCell className="font-medium">
                        {application.individuals.first_name} {application.individuals.last_name}
                      </TableCell>
                      <TableCell>{application.individuals.email}</TableCell>
                      <TableCell>{application.application_round}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(application.status)}>
                          {application.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          {application.cumulative_score || 0}/10
                        </div>
                      </TableCell>
                      <TableCell>
                        {application.submitted_at ? 
                          format(new Date(application.submitted_at), 'MMM dd, yyyy') : 
                          'Not submitted'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedApplication(application)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  Application Details - {application.individuals.first_name} {application.individuals.last_name}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                {/* Personal Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Personal Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <div><strong>Name:</strong> {application.individuals.first_name} {application.individuals.last_name}</div>
                                      <div><strong>Email:</strong> {application.individuals.email}</div>
                                      <div><strong>Phone:</strong> {application.individuals.mobile}</div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold mb-2">Application Info</h4>
                                    <div className="space-y-2 text-sm">
                                      <div><strong>Round:</strong> {application.application_round}</div>
                                      <div><strong>Status:</strong> {application.status}</div>
                                      <div><strong>Score:</strong> {application.cumulative_score || 0}/10</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Application Answers */}
                                <div className="space-y-4">
                                  <h4 className="font-semibold">Application Answers</h4>
                                  {application.answers && Object.entries(application.answers).map(([key, value]) => (
                                    <div key={key} className="border rounded-lg p-4">
                                      <h5 className="font-medium capitalize mb-2">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                      </h5>
                                      <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                                        {Array.isArray(value) ? value.join(', ') : String(value)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <ApplicationScoringDialog 
                            application={{
                              application_id: application.application_id,
                              answers: application.answers,
                              cumulative_score: application.cumulative_score,
                              individuals: {
                                first_name: application.individuals.first_name,
                                last_name: application.individuals.last_name
                              }
                            }}
                          />
                          
                          <Select 
                            value={application.status} 
                            onValueChange={(value) => handleStatusChange(application.application_id, value)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="under_review">Under Review</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default YffApplicationsPage;
