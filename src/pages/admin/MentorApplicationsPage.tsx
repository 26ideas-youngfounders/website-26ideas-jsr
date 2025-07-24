
/**
 * @fileoverview Mentor Applications Management Page
 * 
 * Admin page for viewing and managing all mentor applications.
 * Displays applications in a table format with search and filter capabilities.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Eye, Edit, Calendar, MapPin, Phone, Mail, Linkedin, Instagram } from 'lucide-react';
import { format } from 'date-fns';
import { MentorApplication } from '@/types/mentor-application';

const MentorApplicationsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch mentor applications with individual data
  const { data: applications, isLoading, error, refetch } = useQuery({
    queryKey: ['mentor-applications'],
    queryFn: async () => {
      console.log('Fetching mentor applications...');
      
      const { data, error } = await supabase
        .from('mentor_applications')
        .select(`
          *,
          individuals (
            first_name,
            last_name,
            email
          )
        `)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching mentor applications:', error);
        throw error;
      }

      console.log('Fetched mentor applications:', data);
      
      // Transform the data to match our type interface
      const transformedData: MentorApplication[] = data?.map(app => ({
        ...app,
        topics_of_interest: Array.isArray(app.topics_of_interest) 
          ? app.topics_of_interest 
          : app.topics_of_interest 
            ? [app.topics_of_interest as string] 
            : [],
        availability_days: Array.isArray(app.availability_days) 
          ? app.availability_days 
          : app.availability_days 
            ? [app.availability_days as string] 
            : [],
      })) || [];

      return transformedData;
    },
  });

  // Filter applications based on search and status
  const filteredApplications = applications?.filter(app => {
    const matchesSearch = !searchTerm || 
      app.individuals?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.individuals?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.individuals?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.application_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Update application status
  const updateApplicationStatus = async (applicationId: string, newStatus: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('mentor_applications')
        .update({
          application_status: newStatus,
          reviewer_notes: notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('application_id', applicationId);

      if (error) throw error;
      
      refetch();
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'under_review': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading mentor applications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading applications: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Mentor Applications</h1>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {applications?.length || 0} Total Applications
        </Badge>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
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

      {/* Applications Table */}
      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500 text-lg">No mentor applications found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Applications ({filteredApplications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Topics</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow key={app.application_id}>
                    <TableCell className="font-medium">
                      {app.individuals?.first_name} {app.individuals?.last_name}
                    </TableCell>
                    <TableCell>{app.individuals?.email}</TableCell>
                    <TableCell>
                      {app.city && app.country ? `${app.city}, ${app.country}` : app.city || app.country || 'Not specified'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {app.topics_of_interest?.slice(0, 2).map((topic, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {(app.topics_of_interest?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{(app.topics_of_interest?.length || 0) - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(app.application_status)}>
                        {app.application_status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(app.submitted_at), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ApplicationDetailDialog application={app} onStatusUpdate={updateApplicationStatus} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Application Detail Dialog Component
interface ApplicationDetailDialogProps {
  application: MentorApplication;
  onStatusUpdate: (id: string, status: string, notes?: string) => void;
}

const ApplicationDetailDialog: React.FC<ApplicationDetailDialogProps> = ({ 
  application, 
  onStatusUpdate 
}) => {
  const [newStatus, setNewStatus] = useState(application.application_status);
  const [reviewerNotes, setReviewerNotes] = useState(application.reviewer_notes || '');

  const handleStatusUpdate = () => {
    onStatusUpdate(application.application_id, newStatus, reviewerNotes);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {application.individuals?.first_name} {application.individuals?.last_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Personal Information</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Email:</span>
                <span>{application.individuals?.email}</span>
              </div>
              
              {application.phone_number && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Phone:</span>
                  <span>{application.country_code} {application.phone_number}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Location:</span>
                <span>{application.city && application.country ? `${application.city}, ${application.country}` : 'Not specified'}</span>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="space-y-2">
              {application.linkedin_url && (
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-gray-500" />
                  <a href={application.linkedin_url} target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:underline text-sm">
                    LinkedIn Profile
                  </a>
                </div>
              )}
              
              {application.instagram_handle && (
                <div className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Instagram: @{application.instagram_handle}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Mentor Preferences */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Mentor Preferences</h3>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600 block mb-1">Topics of Interest:</span>
                <div className="flex flex-wrap gap-1">
                  {application.topics_of_interest?.map((topic, index) => (
                    <Badge key={index} variant="secondary">{topic}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-600 block mb-1">Preferred Days:</span>
                <div className="flex flex-wrap gap-1">
                  {application.availability_days?.map((day, index) => (
                    <Badge key={index} variant="outline">{day}</Badge>
                  ))}
                </div>
              </div>
              
              {application.availability_time && (
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Preferred Time:</span>
                  <span>{application.availability_time}</span>
                </div>
              )}
              
              {application.availability_notes && (
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Additional Notes:</span>
                  <p className="text-sm bg-gray-50 p-2 rounded">{application.availability_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Review Section */}
        <div className="mt-6 pt-4 border-t space-y-4">
          <h3 className="font-semibold text-lg">Review & Status</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Status:</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
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
            
            <div className="text-sm text-gray-600">
              <p>Submitted: {format(new Date(application.submitted_at), 'PPp')}</p>
              {application.reviewed_at && (
                <p>Last Reviewed: {format(new Date(application.reviewed_at), 'PPp')}</p>
              )}
            </div>
          </div>
          
          <div>
            <label className="text-sm text-gray-600 block mb-1">Reviewer Notes:</label>
            <Textarea
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              placeholder="Add notes about this application..."
              rows={3}
            />
          </div>
          
          <Button onClick={handleStatusUpdate} className="w-full">
            <Edit className="h-4 w-4 mr-2" />
            Update Application
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MentorApplicationsPage;
