
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, User, Users, Building, FileText, Calendar, Phone, Mail, MapPin, GraduationCap, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { YffRegistration, parseRegistrationData, YffTeamMember } from '@/types/yff-registration';
import { validateAge, countWords } from '@/utils/registration-validation';

/**
 * YFF Applications Admin Page
 * 
 * Displays all YFF team registrations with detailed information
 * and proper type safety for all data operations.
 */
const YffApplicationsPage = () => {
  const [applications, setApplications] = useState<YffRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<YffRegistration | null>(null);

  // Load applications with type safety
  useEffect(() => {
    const loadApplications = async () => {
      try {
        console.log('🔍 Loading YFF applications...');
        
        const { data, error } = await supabase
          .from('yff_team_registrations')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Error loading applications:', error);
          toast.error('Failed to load applications');
          return;
        }

        // Parse all registration data with type safety
        const parsedApplications = data.map(parseRegistrationData);
        console.log('✅ Applications loaded and parsed:', parsedApplications);
        setApplications(parsedApplications);
        
      } catch (error) {
        console.error('❌ Error in loadApplications:', error);
        toast.error('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  /**
   * Render application status badge
   */
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      'registration_completed': { label: 'Registration Complete', variant: 'default' as const },
      'questionnaire_completed': { label: 'Application Complete', variant: 'success' as const },
      'under_review': { label: 'Under Review', variant: 'secondary' as const },
      'approved': { label: 'Approved', variant: 'success' as const },
      'rejected': { label: 'Rejected', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'default' as const };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  /**
   * Render age validation indicator
   */
  const renderAgeValidation = (dateOfBirth: string) => {
    const ageValidation = validateAge(dateOfBirth);
    
    if (ageValidation.isValid) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else {
      return (
        <div className="flex items-center gap-1 text-red-500">
          <XCircle className="w-4 h-4" />
          <span className="text-xs">{ageValidation.error}</span>
        </div>
      );
    }
  };

  /**
   * Render word count indicator
   */
  const renderWordCount = (text: string) => {
    const wordCount = countWords(text);
    const isOverLimit = wordCount > 300;
    
    return (
      <span className={`text-xs ${isOverLimit ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
        {wordCount} / 300 words
        {isOverLimit && ' (OVER LIMIT)'}
      </span>
    );
  };

  /**
   * Render detailed application view
   */
  const renderApplicationDetails = (application: YffRegistration) => {
    const questionnaire = application.questionnaire_answers || {};
    
    return (
      <div className="space-y-6">
        {/* Team Leader Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Team Leader Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="text-sm">{application.full_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-sm">{application.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-sm">{application.country_code} {application.phone_number}</p>
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                  <p className="text-sm">{application.date_of_birth}</p>
                </div>
                {renderAgeValidation(application.date_of_birth)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Gender</p>
                <p className="text-sm">{application.gender}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="text-sm">{application.current_city}, {application.state} - {application.pin_code}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Permanent Address</p>
              <p className="text-sm">{application.permanent_address}</p>
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Academic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Institution</p>
                <p className="text-sm">{application.institution_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Course/Program</p>
                <p className="text-sm">{application.course_program}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Current Year</p>
                <p className="text-sm">{application.current_year_of_study}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Expected Graduation</p>
                <p className="text-sm">{application.expected_graduation}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        {application.team_members && application.team_members.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members ({application.team_members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {application.team_members.map((member: YffTeamMember, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Team Member {index + 1}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-500">Name</p>
                        <p>{member.fullName}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-500">Email</p>
                        <p>{member.email}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-500">Phone</p>
                        <p>{member.countryCode} {member.phoneNumber}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium text-gray-500">Date of Birth</p>
                          <p>{member.dateOfBirth}</p>
                        </div>
                        {renderAgeValidation(member.dateOfBirth)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-500">Institution</p>
                        <p>{member.institutionName}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-500">Course</p>
                        <p>{member.courseProgram}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Venture Information */}
        {(application.venture_name || application.team_name || application.industry_sector) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Venture Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {application.venture_name && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Venture Name</p>
                    <p className="text-sm">{application.venture_name}</p>
                  </div>
                )}
                {application.team_name && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Team Name</p>
                    <p className="text-sm">{application.team_name}</p>
                  </div>
                )}
                {application.industry_sector && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Industry Sector</p>
                    <p className="text-sm">{application.industry_sector}</p>
                  </div>
                )}
                {application.website && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Website</p>
                    <p className="text-sm">{application.website}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questionnaire Answers */}
        {Object.keys(questionnaire).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Questionnaire Answers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(questionnaire).map(([key, value]) => (
                <div key={key} className="border-b pb-4">
                  <p className="font-medium text-gray-700 mb-2">{key}</p>
                  <p className="text-sm text-gray-600 mb-1">{value as string}</p>
                  {renderWordCount(value as string)}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">YFF Applications</h1>
        <p className="text-gray-600">Manage and review Young Founders Floor applications</p>
      </div>

      {selectedApplication ? (
        <div>
          <div className="mb-4">
            <Button 
              variant="outline" 
              onClick={() => setSelectedApplication(null)}
            >
              ← Back to Applications
            </Button>
          </div>
          {renderApplicationDetails(selectedApplication)}
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{application.full_name}</h3>
                      {renderStatusBadge(application.application_status || 'registration_completed')}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {application.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {application.country_code} {application.phone_number}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {application.current_city}, {application.state}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {application.number_of_team_members} member{application.number_of_team_members !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(application.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedApplication(application)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default YffApplicationsPage;
