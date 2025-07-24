
/**
 * @fileoverview Mentor Applications Management Page
 * 
 * Allows admins to view, filter, and manage mentor applications
 * with detailed information display and status management.
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
  UserCheck,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Linkedin,
  Instagram
} from 'lucide-react';

interface MentorApplication {
  application_id: string;
  individual_id: string;
  application_status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  linkedin_url: string | null;
  instagram_handle: string | null;
  city: string | null;
  country: string | null;
  phone_number: string | null;
  country_code: string | null;
  topics_of_interest: string[] | null;
  availability_days: string[] | null;
  availability_time: string | null;
  availability_notes: string | null;
  email_updates_consent: boolean;
  sms_updates_consent: boolean;
  individuals: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

const MentorApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<MentorApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<MentorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<MentorApplication | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('mentor_applications')
        .select(`
          application_id,
          individual_id,
          application_status,
          submitted_at,
          reviewed_at,
          reviewer_notes,
          linkedin_url,
          instagram_handle,
          city,
          country,
          phone_number,
          country_code,
          topics_of_interest,
          availability_days,
          availability_time,
          availability_notes,
          email_updates_consent,
          sms_updates_consent
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
        const combinedData: MentorApplication[] = applicationsData?.map(app => ({
          ...app,
          individuals: individualsMap.get(app.individual_id) || null
        })) || [];

        setApplications(combinedData);
      } else {
        setApplications([]);
      }

    } catch (error) {
      console.error('Error loading mentor applications:', error);
      setError('Failed to load mentor applications. Please try again.');
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
          app.city?.toLowerCase().includes(term) ||
          app.country?.toLowerCase().includes(term)
        );
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.application_status === statusFilter);
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
      default:
        return 'outline';
    }
  };

  const formatTopics = (topics: string[] | null) => {
    if (!topics || !Array.isArray(topics)) return 'None';
    return topics.join(', ');
  };

  const formatAvailabilityDays = (days: string[] | null) => {
    if (!days || !Array.isArray(days)) return 'None';
    return days.join(', ');
  };

  if (loading) {
    return (
      <AdminAuth>
        <AdminLayout>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mentor Applications</h1>
                <p className="text-gray-600">Manage and review mentor applications</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Mentor Applications</h1>
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
                      placeholder="Search by name, email, city, or country..."
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
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Topics of Interest</TableHead>
                      <TableHead>Availability</TableHead>
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
                            <div className="text-sm text-gray-500">
                              {application.individuals?.email || 'No email'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {application.phone_number && (
                              <div className="flex items-center text-sm">
                                <Phone className="h-3 w-3 mr-1" />
                                {application.country_code} {application.phone_number}
                              </div>
                            )}
                            {application.linkedin_url && (
                              <div className="flex items-center text-sm">
                                <Linkedin className="h-3 w-3 mr-1" />
                                <a href={application.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  LinkedIn
                                </a>
                              </div>
                            )}
                            {application.instagram_handle && (
                              <div className="flex items-center text-sm">
                                <Instagram className="h-3 w-3 mr-1" />
                                {application.instagram_handle}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <MapPin className="h-3 w-3 mr-1" />
                            {application.city && application.country ? 
                              `${application.city}, ${application.country}` :
                              application.city || application.country || 'Not specified'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm max-w-xs truncate">
                            {formatTopics(application.topics_of_interest)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatAvailabilityDays(application.availability_days)}</div>
                            {application.availability_time && (
                              <div className="text-gray-500">{application.availability_time}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(application.application_status)}>
                            {application.application_status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(application.submitted_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedApplication(application)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No mentor applications found</h3>
                  <p className="text-gray-500">
                    {applications.length === 0 
                      ? "No mentor applications have been submitted yet."
                      : "No applications match your current filters."
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Detail Modal */}
          {selectedApplication && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold">Application Details</h2>
                    <Button variant="ghost" onClick={() => setSelectedApplication(null)}>
                      ×
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Personal Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Name</label>
                          <p className="text-sm text-gray-600">
                            {selectedApplication.individuals ? 
                              `${selectedApplication.individuals.first_name} ${selectedApplication.individuals.last_name}` :
                              'No name'
                            }
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Email</label>
                          <p className="text-sm text-gray-600">{selectedApplication.individuals?.email || 'No email'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Phone</label>
                          <p className="text-sm text-gray-600">
                            {selectedApplication.phone_number ? 
                              `${selectedApplication.country_code} ${selectedApplication.phone_number}` :
                              'Not provided'
                            }
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Location</label>
                          <p className="text-sm text-gray-600">
                            {selectedApplication.city && selectedApplication.country ? 
                              `${selectedApplication.city}, ${selectedApplication.country}` :
                              'Not specified'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Professional Information</h3>
                      <div className="space-y-2">
                        <div>
                          <label className="text-sm font-medium">Topics of Interest</label>
                          <p className="text-sm text-gray-600">{formatTopics(selectedApplication.topics_of_interest)}</p>
                        </div>
                        {selectedApplication.linkedin_url && (
                          <div>
                            <label className="text-sm font-medium">LinkedIn</label>
                            <p className="text-sm text-gray-600">
                              <a href={selectedApplication.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {selectedApplication.linkedin_url}
                              </a>
                            </p>
                          </div>
                        )}
                        {selectedApplication.instagram_handle && (
                          <div>
                            <label className="text-sm font-medium">Instagram</label>
                            <p className="text-sm text-gray-600">{selectedApplication.instagram_handle}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Availability</h3>
                      <div className="space-y-2">
                        <div>
                          <label className="text-sm font-medium">Preferred Days</label>
                          <p className="text-sm text-gray-600">{formatAvailabilityDays(selectedApplication.availability_days)}</p>
                        </div>
                        {selectedApplication.availability_time && (
                          <div>
                            <label className="text-sm font-medium">Preferred Time</label>
                            <p className="text-sm text-gray-600">{selectedApplication.availability_time}</p>
                          </div>
                        )}
                        {selectedApplication.availability_notes && (
                          <div>
                            <label className="text-sm font-medium">Additional Notes</label>
                            <p className="text-sm text-gray-600">{selectedApplication.availability_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Consent & Preferences</h3>
                      <div className="space-y-2">
                        <div>
                          <label className="text-sm font-medium">Email Updates</label>
                          <p className="text-sm text-gray-600">{selectedApplication.email_updates_consent ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">SMS Updates</label>
                          <p className="text-sm text-gray-600">{selectedApplication.sms_updates_consent ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminAuth>
  );
};

export default MentorApplicationsPage;
