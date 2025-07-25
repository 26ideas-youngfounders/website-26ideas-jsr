
/**
 * @fileoverview YFF Applications Admin Page
 * 
 * Administrative interface for reviewing YFF team registrations
 * with comprehensive application details, age validation, and word count tracking.
 * 
 * @version 2.0.0 - Enhanced with proper type safety and validation
 * @author 26ideas Development Team
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Clock, Users, Calendar, MapPin, School, Award } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { YffRegistration, parseRegistrationData } from '@/types/yff-registration';
import { validateAge, countWords } from '@/utils/registration-validation';

/**
 * YFF Applications Admin Page Component
 * 
 * Provides comprehensive admin interface for reviewing YFF applications
 * with proper type safety and validation display.
 */
const YffApplicationsPage = () => {
  const [applications, setApplications] = useState<YffRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<YffRegistration | null>(null);

  // Load applications on component mount
  useEffect(() => {
    loadApplications();
  }, []);

  /**
   * Load all YFF applications from the database
   */
  const loadApplications = async () => {
    try {
      console.log('📋 Loading YFF applications...');
      
      const { data, error } = await supabase
        .from('yff_team_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading applications:', error);
        setError('Failed to load applications. Please try again.');
        return;
      }

      // Parse and validate all registration data
      const parsedApplications = data.map(app => parseRegistrationData(app));
      console.log('✅ Loaded applications:', parsedApplications.length);
      
      setApplications(parsedApplications);
    } catch (error) {
      console.error('❌ Error in loadApplications:', error);
      setError('An unexpected error occurred while loading applications.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get status badge variant based on application status
   */
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'questionnaire_completed':
        return 'default'; // Use default instead of success
      case 'registration_completed':
        return 'secondary';
      case 'draft':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  /**
   * Get age validation status for display
   */
  const getAgeValidationStatus = (dateOfBirth: string) => {
    const validation = validateAge(dateOfBirth);
    return {
      isValid: validation.isValid,
      age: validation.age,
      error: validation.error
    };
  };

  /**
   * Render application status badge
   */
  const renderStatusBadge = (status: string) => {
    const variant = getStatusBadgeVariant(status);
    const displayStatus = status.replace('_', ' ').toUpperCase();
    
    return (
      <Badge variant={variant} className="ml-2">
        {displayStatus}
      </Badge>
    );
  };

  /**
   * Render detailed application view
   */
  const renderApplicationDetails = (application: YffRegistration) => {
    const leaderAgeStatus = getAgeValidationStatus(application.date_of_birth);
    
    return (
      <div className="space-y-6">
        {/* Application Header */}
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold">{application.full_name}</h2>
          <p className="text-gray-600">{application.email}</p>
          {renderStatusBadge(application.application_status || 'draft')}
        </div>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="team">Team Details</TabsTrigger>
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
                    <h4 className="font-semibold">Contact Information</h4>
                    <p><strong>Email:</strong> {application.email}</p>
                    <p><strong>Phone:</strong> {application.country_code} {application.phone_number}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Age Information
                    </h4>
                    <p><strong>Date of Birth:</strong> {application.date_of_birth}</p>
                    <div className="flex items-center gap-2">
                      <strong>Age Status:</strong>
                      {leaderAgeStatus.isValid ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          {leaderAgeStatus.age} years (Valid)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          {leaderAgeStatus.error}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </h4>
                    <p><strong>Current City:</strong> {application.current_city}</p>
                    <p><strong>State:</strong> {application.state}</p>
                    <p><strong>Pin Code:</strong> {application.pin_code}</p>
                    <p><strong>Permanent Address:</strong> {application.permanent_address}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      <School className="h-4 w-4" />
                      Education
                    </h4>
                    <p><strong>Institution:</strong> {application.institution_name}</p>
                    <p><strong>Course:</strong> {application.course_program}</p>
                    <p><strong>Year:</strong> {application.current_year_of_study}</p>
                    <p><strong>Graduation:</strong> {application.expected_graduation}</p>
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
                  Team Information ({application.number_of_team_members} members)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {application.team_members.length > 0 ? (
                  <div className="space-y-4">
                    {application.team_members.map((member: any, index: number) => {
                      const memberAgeStatus = getAgeValidationStatus(member.dateOfBirth);
                      
                      return (
                        <div key={index} className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-2">Team Member {index + 1}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p><strong>Name:</strong> {member.fullName}</p>
                              <p><strong>Email:</strong> {member.email}</p>
                              <p><strong>Phone:</strong> {member.countryCode} {member.phoneNumber}</p>
                              <p><strong>Gender:</strong> {member.gender}</p>
                            </div>
                            <div>
                              <p><strong>Date of Birth:</strong> {member.dateOfBirth}</p>
                              <div className="flex items-center gap-2">
                                <strong>Age Status:</strong>
                                {memberAgeStatus.isValid ? (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    {memberAgeStatus.age} years (Valid)
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    {memberAgeStatus.error}
                                  </span>
                                )}
                              </div>
                              <p><strong>City:</strong> {member.currentCity}, {member.state}</p>
                              <p><strong>Institution:</strong> {member.institutionName}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">No additional team members</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="venture" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Venture Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Venture Name:</strong> {application.venture_name || 'Not specified'}</p>
                    <p><strong>Industry Sector:</strong> {application.industry_sector || 'Not specified'}</p>
                    <p><strong>Team Name:</strong> {application.team_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p><strong>Website:</strong> {application.website || 'Not specified'}</p>
                    <p><strong>LinkedIn:</strong> {application.linkedin_profile || 'Not specified'}</p>
                    <p><strong>Social Media:</strong> {application.social_media_handles || 'Not specified'}</p>
                  </div>
                </div>
                {application.referral_id && (
                  <div>
                    <p><strong>Referral ID:</strong> {application.referral_id}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questionnaire" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Questionnaire Responses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {application.questionnaire_answers ? (
                  <div className="space-y-6">
                    {Object.entries(application.questionnaire_answers).map(([key, value]) => {
                      const wordCount = countWords(value as string);
                      const isOverLimit = wordCount > 300;
                      
                      return (
                        <div key={key} className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-2 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </h4>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-sm ${isOverLimit ? 'text-red-600' : 'text-gray-600'}`}>
                              Word Count: {wordCount} / 300
                            </span>
                            {isOverLimit && (
                              <Badge variant="destructive">Over Limit</Badge>
                            )}
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{value as string}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Questionnaire not yet completed by the applicant.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Main render
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">YFF Applications</h1>
        <p className="text-gray-600">Review and manage Young Founders Floor applications</p>
      </div>

      {selectedApplication ? (
        <div>
          <Button 
            onClick={() => setSelectedApplication(null)}
            variant="outline"
            className="mb-4"
          >
            ← Back to Applications
          </Button>
          {renderApplicationDetails(selectedApplication)}
        </div>
      ) : (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No applications found.</p>
              </CardContent>
            </Card>
          ) : (
            applications.map((app) => (
              <Card key={app.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{app.full_name}</h3>
                        {renderStatusBadge(app.application_status || 'draft')}
                      </div>
                      <p className="text-gray-600 mb-2">{app.email}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Team Size:</span> {app.number_of_team_members}
                        </div>
                        <div>
                          <span className="font-medium">Institution:</span> {app.institution_name}
                        </div>
                        <div>
                          <span className="font-medium">Applied:</span> {new Date(app.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => setSelectedApplication(app)}
                      variant="outline"
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default YffApplicationsPage;
