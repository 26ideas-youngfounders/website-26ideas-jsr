
/**
 * @fileoverview Mentor Applications Admin Page
 * 
 * Admin interface for viewing and managing mentor applications
 * with detailed review capabilities and status management.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, Users, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface MentorApplication {
  application_id: string;
  individual_id: string;
  application_status: string;
  topics_of_interest: string[];
  availability_days: string[];
  availability_time: string;
  availability_notes?: string;
  linkedin_url?: string;
  instagram_handle?: string;
  reviewer_notes?: string;
  submitted_at: string;
  reviewed_at?: string;
  country_code: string;
  country_iso_code: string;
  created_at: string;
  updated_at: string;
  individuals?: {
    first_name: string;
    last_name: string;
    email: string;
    mobile?: string;
    city?: string;
    country?: string;
  } | null;
}

const MentorApplicationsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<MentorApplication | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch mentor applications with individual details using left join
  const { data: applications, isLoading, error } = useQuery({
    queryKey: ['mentor-applications'],
    queryFn: async () => {
      console.log('Fetching mentor applications with left join...');
      
      const { data, error } = await supabase
        .from('mentor_applications')
        .select(`
          application_id,
          individual_id,
          application_status,
          topics_of_interest,
          availability_days,
          availability_time,
          availability_notes,
          linkedin_url,
          instagram_handle,
          reviewer_notes,
          submitted_at,
          reviewed_at,
          country_code,
          country_iso_code,
          created_at,
          updated_at,
          individuals (
            first_name,
            last_name,
            email,
            mobile,
            city,
            country
          )
        `)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching mentor applications:', error);
        throw error;
      }

      console.log('Fetched mentor applications:', data);
      return (data || []) as MentorApplication[];
    },
  });

  // Update application status mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, status, notes }: { 
      applicationId: string; 
      status: string; 
      notes?: string;
    }) => {
      const updateData: any = { 
        application_status: status,
        reviewed_at: new Date().toISOString()
      };
      
      if (notes !== undefined) {
        updateData.reviewer_notes = notes;
      }

      const { error } = await supabase
        .from('mentor_applications')
        .update(updateData)
        .eq('application_id', applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-applications'] });
      toast({
        title: "Success",
        description: "Application updated successfully",
      });
      setSelectedApplication(null);
      setReviewerNotes('');
    },
    onError: (error) => {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application",
        variant: "destructive",
      });
    },
  });

  // Filter applications
  const filteredApplications = applications?.filter((app) => {
    const individual = app.individuals;
    const searchMatch = !searchTerm || 
      (individual ? 
        `${individual.first_name} ${individual.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        individual.email.toLowerCase().includes(searchTerm.toLowerCase()) :
        false
      ) ||
      app.topics_of_interest.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const statusMatch = statusFilter === 'all' || app.application_status === statusFilter;
    
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
    updateApplicationMutation.mutate({ 
      applicationId, 
      status: newStatus,
      notes: reviewerNotes 
    });
  };

  // Show error state if there's an error
  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Mentor Applications</h1>
            <p className="text-muted-foreground">
              Review and manage mentor applications for the 26ideas platform
            </p>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                <p className="text-lg font-semibold">Error loading applications</p>
                <p className="text-sm mt-2">{error.message}</p>
                <Button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['mentor-applications'] })}
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Mentor Applications</h1>
          <p className="text-muted-foreground">
            Review and manage mentor applications for the 26ideas platform
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications?.filter(app => app.application_status === 'submitted').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications?.filter(app => app.application_status === 'approved').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications?.filter(app => app.application_status === 'rejected').length || 0}
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
                    placeholder="Search by name, email, or topics..."
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
                  <TableHead>Mentor</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Topics</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
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
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {application.individuals ? 
                              `${application.individuals.first_name} ${application.individuals.last_name}` :
                              'Unknown User'
                            }
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {application.individuals?.email || 'No email'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {application.individuals ? 
                          `${application.individuals.city || 'Unknown City'}, ${application.individuals.country || 'Unknown Country'}` :
                          'Unknown Location'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {application.topics_of_interest.slice(0, 2).map((topic, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                          {application.topics_of_interest.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{application.topics_of_interest.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{application.availability_days.join(', ')}</div>
                          <div className="text-muted-foreground">{application.availability_time}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(application.application_status)}>
                          {application.application_status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(application.submitted_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedApplication(application);
                                  setReviewerNotes(application.reviewer_notes || '');
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  Mentor Application Review - {application.individuals ? 
                                    `${application.individuals.first_name} ${application.individuals.last_name}` :
                                    'Unknown User'
                                  }
                                </DialogTitle>
                              </DialogHeader>
                              {selectedApplication && (
                                <div className="space-y-6">
                                  {/* Personal Information */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold mb-2">Personal Information</h4>
                                      <div className="space-y-2 text-sm">
                                        <div><strong>Name:</strong> {selectedApplication.individuals ? 
                                          `${selectedApplication.individuals.first_name} ${selectedApplication.individuals.last_name}` :
                                          'Unknown User'
                                        }</div>
                                        <div><strong>Email:</strong> {selectedApplication.individuals?.email || 'No email'}</div>
                                        <div><strong>Phone:</strong> {selectedApplication.individuals?.mobile || 'No phone'}</div>
                                        <div><strong>Location:</strong> {selectedApplication.individuals ? 
                                          `${selectedApplication.individuals.city || 'Unknown City'}, ${selectedApplication.individuals.country || 'Unknown Country'}` :
                                          'Unknown Location'
                                        }</div>
                                        <div><strong>Country Code:</strong> {selectedApplication.country_code} ({selectedApplication.country_iso_code})</div>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-2">Social Links</h4>
                                      <div className="space-y-2 text-sm">
                                        {selectedApplication.linkedin_url && (
                                          <div><strong>LinkedIn:</strong> <a href={selectedApplication.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedApplication.linkedin_url}</a></div>
                                        )}
                                        {selectedApplication.instagram_handle && (
                                          <div><strong>Instagram:</strong> @{selectedApplication.instagram_handle}</div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Topics and Availability */}
                                  <div>
                                    <h4 className="font-semibold mb-2">Topics of Interest</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedApplication.topics_of_interest.map((topic, index) => (
                                        <Badge key={index} variant="outline">{topic}</Badge>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold mb-2">Availability</h4>
                                    <div className="space-y-2 text-sm">
                                      <div><strong>Days:</strong> {selectedApplication.availability_days.join(', ')}</div>
                                      <div><strong>Time:</strong> {selectedApplication.availability_time}</div>
                                      {selectedApplication.availability_notes && (
                                        <div><strong>Notes:</strong> {selectedApplication.availability_notes}</div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Reviewer Notes */}
                                  <div>
                                    <h4 className="font-semibold mb-2">Reviewer Notes</h4>
                                    <Textarea
                                      placeholder="Add your review notes..."
                                      value={reviewerNotes}
                                      onChange={(e) => setReviewerNotes(e.target.value)}
                                      rows={4}
                                    />
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button 
                                      variant="destructive"
                                      onClick={() => handleStatusChange(selectedApplication.application_id, 'rejected')}
                                      disabled={updateApplicationMutation.isPending}
                                    >
                                      Reject
                                    </Button>
                                    <Button 
                                      variant="outline"
                                      onClick={() => handleStatusChange(selectedApplication.application_id, 'under_review')}
                                      disabled={updateApplicationMutation.isPending}
                                    >
                                      Mark Under Review
                                    </Button>
                                    <Button 
                                      onClick={() => handleStatusChange(selectedApplication.application_id, 'approved')}
                                      disabled={updateApplicationMutation.isPending}
                                    >
                                      Approve
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
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

export default MentorApplicationsPage;
