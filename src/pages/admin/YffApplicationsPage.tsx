
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Users, Search, Filter, Eye, Calendar, MapPin, GraduationCap, Building } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { countWords } from '@/utils/registration-validation';

interface YffRegistration {
  id: string;
  individual_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  country_code: string;
  date_of_birth: string;
  current_city: string;
  state: string;
  pin_code: string;
  permanent_address: string;
  gender: string;
  institution_name: string;
  course_program: string;
  current_year_of_study: string;
  expected_graduation: string;
  number_of_team_members: number;
  team_members: any[];
  venture_name: string;
  industry_sector: string;
  team_name: string;
  website: string;
  linkedin_profile: string;
  social_media_handles: string;
  referral_id: string;
  application_status: string;
  questionnaire_answers: any;
  questionnaire_completed_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * YFF Applications Admin Page with complete application display
 * Shows all registration and questionnaire data with word counts
 */
const YffApplicationsPage = () => {
  const [registrations, setRegistrations] = useState<YffRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRegistration, setSelectedRegistration] = useState<YffRegistration | null>(null);

  // Fetch all registrations
  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('yff_team_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching registrations:', error);
        setError('Failed to load registrations');
        return;
      }

      setRegistrations(data || []);
      console.log('✅ Loaded registrations:', data?.length || 0);
    } catch (err) {
      console.error('Error in fetchRegistrations:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Filter registrations based on search and status
  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = reg.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.team_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.venture_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reg.application_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'registration_completed':
        return 'bg-blue-100 text-blue-800';
      case 'questionnaire_completed':
        return 'bg-green-100 text-green-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-emerald-100 text-emerald-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if answer exceeds word limit
  const isAnswerOverLimit = (answer: string, limit: number = 300): boolean => {
    return countWords(answer) > limit;
  };

  // Render word count with highlighting for over-limit answers
  const renderWordCount = (answer: string, limit: number = 300) => {
    const wordCount = countWords(answer);
    const isOverLimit = wordCount > limit;
    
    return (
      <span className={`text-sm ${isOverLimit ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
        {wordCount} / {limit} words
        {isOverLimit && <span className="ml-1 text-red-600">⚠️ Over limit</span>}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading YFF applications...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">YFF Applications</h1>
            <p className="text-gray-600 mt-1">
              Manage Young Founders Fellowship applications
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Total: {registrations.length}
            </Badge>
            <Button onClick={fetchRegistrations} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, team, or venture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="registration_completed">Registration Completed</option>
              <option value="questionnaire_completed">Questionnaire Completed</option>
              <option value="under_review">Under Review</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Applications List */}
        <div className="grid gap-4">
          {filteredRegistrations.map((registration) => (
            <Card key={registration.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{registration.full_name}</CardTitle>
                      <Badge className={getStatusBadgeColor(registration.application_status)}>
                        {registration.application_status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardDescription>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {registration.team_name || 'No team name'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {registration.venture_name || 'No venture name'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Age: {calculateAge(registration.date_of_birth)}
                        </span>
                      </div>
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRegistration(registration)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-600">Contact</p>
                    <p>{registration.email}</p>
                    <p>{registration.country_code} {registration.phone_number}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Location</p>
                    <p>{registration.current_city}, {registration.state}</p>
                    <p>{registration.pin_code}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Education</p>
                    <p>{registration.institution_name}</p>
                    <p>{registration.course_program}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRegistrations.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No applications found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Detailed View Modal */}
      {selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedRegistration.full_name}
                  </h2>
                  <p className="text-gray-600">{selectedRegistration.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getStatusBadgeColor(selectedRegistration.application_status)}>
                    {selectedRegistration.application_status.replace('_', ' ')}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRegistration(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="team">Team Info</TabsTrigger>
                  <TabsTrigger value="venture">Venture Info</TabsTrigger>
                  <TabsTrigger value="questionnaire">Questionnaire</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium text-gray-600">Full Name</p>
                          <p>{selectedRegistration.full_name}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Email</p>
                          <p>{selectedRegistration.email}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Phone</p>
                          <p>{selectedRegistration.country_code} {selectedRegistration.phone_number}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Date of Birth</p>
                          <p>{selectedRegistration.date_of_birth} (Age: {calculateAge(selectedRegistration.date_of_birth)})</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Gender</p>
                          <p>{selectedRegistration.gender}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Current City</p>
                          <p>{selectedRegistration.current_city}, {selectedRegistration.state}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Pin Code</p>
                          <p>{selectedRegistration.pin_code}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Permanent Address</p>
                          <p>{selectedRegistration.permanent_address}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Educational Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium text-gray-600">Institution Name</p>
                          <p>{selectedRegistration.institution_name}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Course/Program</p>
                          <p>{selectedRegistration.course_program}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Current Year of Study</p>
                          <p>{selectedRegistration.current_year_of_study}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Expected Graduation</p>
                          <p>{selectedRegistration.expected_graduation}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="team" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium text-gray-600">Number of Team Members</p>
                          <p>{selectedRegistration.number_of_team_members}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Team Name</p>
                          <p>{selectedRegistration.team_name || 'Not specified'}</p>
                        </div>
                      </div>

                      {selectedRegistration.team_members && selectedRegistration.team_members.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-600 mb-3">Team Members</h4>
                          <div className="space-y-4">
                            {selectedRegistration.team_members.map((member: any, index: number) => (
                              <div key={index} className="border rounded-lg p-4">
                                <h5 className="font-medium mb-2">Team Member {index + 1}</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="font-medium text-gray-600">Name</p>
                                    <p>{member.fullName}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-600">Email</p>
                                    <p>{member.email}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-600">Phone</p>
                                    <p>{member.countryCode} {member.phoneNumber}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-600">Age</p>
                                    <p>{calculateAge(member.dateOfBirth)}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-600">Institution</p>
                                    <p>{member.institutionName}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-600">Course</p>
                                    <p>{member.courseProgram}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="venture" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Venture Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium text-gray-600">Venture Name</p>
                          <p>{selectedRegistration.venture_name || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Industry Sector</p>
                          <p>{selectedRegistration.industry_sector || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Website</p>
                          <p>{selectedRegistration.website || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">LinkedIn Profile</p>
                          <p>{selectedRegistration.linkedin_profile || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Social Media</p>
                          <p>{selectedRegistration.social_media_handles || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Referral ID</p>
                          <p>{selectedRegistration.referral_id || 'Not specified'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="questionnaire" className="space-y-4">
                  {selectedRegistration.questionnaire_answers ? (
                    <div className="space-y-4">
                      {Object.entries(selectedRegistration.questionnaire_answers).map(([key, value]) => (
                        <Card key={key}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className={`p-3 rounded-md ${
                                isAnswerOverLimit(value as string) 
                                  ? 'bg-red-50 border border-red-200' 
                                  : 'bg-gray-50'
                              }`}>
                                <p className="text-sm leading-relaxed">{value as string}</p>
                              </div>
                              <div className="flex justify-between items-center">
                                {renderWordCount(value as string)}
                                {isAnswerOverLimit(value as string) && (
                                  <span className="text-red-600 text-sm font-medium">
                                    ⚠️ Exceeds word limit
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Questionnaire not completed yet</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default YffApplicationsPage;
