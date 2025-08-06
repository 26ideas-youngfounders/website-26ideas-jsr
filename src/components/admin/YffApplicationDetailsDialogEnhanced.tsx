
/**
 * @fileoverview Enhanced YFF Application Details Dialog
 * 
 * Advanced dialog component for viewing detailed YFF application information
 * including team registration data and questionnaire responses with AI evaluation.
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  School, 
  GraduationCap,
  Building,
  Globe,
  Users,
  Briefcase,
  Hash
} from 'lucide-react';
import type { 
  YffApplicationWithIndividual,
  parseApplicationAnswers,
  parseEvaluationData,
  getOrderedQuestions
} from '@/types/yff-application';

interface YffApplicationDetailsDialogEnhancedProps {
  application: YffApplicationWithIndividual | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Format field value with fallback for empty/null values
 */
const formatFieldValue = (value: any): string => {
  if (value === null || value === undefined || value === '') {
    return 'Not provided';
  }
  return String(value);
};

/**
 * Team Registration Information Component
 */
const TeamRegistrationInfo: React.FC<{ registration: any }> = ({ registration }) => {
  if (!registration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Registration Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No registration data available</p>
        </CardContent>
      </Card>
    );
  }

  const registrationFields = [
    { icon: User, label: 'Full Name', value: registration.full_name, key: 'full_name' },
    { icon: Mail, label: 'Email Address', value: registration.email, key: 'email' },
    { icon: Phone, label: 'Phone Number', value: `${registration.country_code || '+91'} ${registration.phone_number || ''}`.trim(), key: 'phone_number' },
    { icon: Calendar, label: 'Date of Birth', value: registration.date_of_birth, key: 'date_of_birth' },
    { icon: MapPin, label: 'Current City', value: registration.current_city, key: 'current_city' },
    { icon: MapPin, label: 'State/Province', value: registration.state, key: 'state' },
    { icon: Hash, label: 'PIN Code', value: registration.pin_code, key: 'pin_code' },
    { icon: MapPin, label: 'Permanent Address', value: registration.permanent_address, key: 'permanent_address' },
    { icon: User, label: 'Gender', value: registration.gender, key: 'gender' },
    { icon: School, label: 'Institution Name', value: registration.institution_name, key: 'institution_name' },
    { icon: GraduationCap, label: 'Course/Program', value: registration.course_program, key: 'course_program' },
    { icon: GraduationCap, label: 'Current Year of Study', value: registration.current_year_of_study, key: 'current_year_of_study' },
    { icon: Calendar, label: 'Expected Graduation', value: registration.expected_graduation, key: 'expected_graduation' },
    { icon: Building, label: 'Venture Name', value: registration.venture_name, key: 'venture_name' },
    { icon: Users, label: 'Team Name', value: registration.team_name, key: 'team_name' },
    { icon: Users, label: 'Number of Team Members', value: registration.number_of_team_members, key: 'number_of_team_members' },
    { icon: Briefcase, label: 'Industry Sector', value: registration.industry_sector, key: 'industry_sector' },
    { icon: Globe, label: 'Website', value: registration.website, key: 'website' },
    { icon: Globe, label: 'LinkedIn Profile', value: registration.linkedin_profile, key: 'linkedin_profile' },
    { icon: Globe, label: 'Social Media Handles', value: registration.social_media_handles, key: 'social_media_handles' },
    { icon: Hash, label: 'Referral ID', value: registration.referral_id, key: 'referral_id' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Registration Information
          <Badge variant="secondary" className="ml-auto">
            Registration Complete
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {registrationFields.map(({ icon: Icon, label, value, key }) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Icon className="h-4 w-4" />
                {label}:
              </div>
              <div className={`text-sm pl-6 ${
                formatFieldValue(value) === 'Not provided' 
                  ? 'text-gray-400 italic' 
                  : 'text-gray-900'
              }`}>
                {formatFieldValue(value)}
              </div>
            </div>
          ))}
        </div>
        
        {/* Team Members Section */}
        {registration.team_members && Array.isArray(registration.team_members) && registration.team_members.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Members ({registration.team_members.length})
            </h4>
            <div className="space-y-3">
              {registration.team_members.map((member: any, index: number) => (
                <div key={index} className="border rounded-lg p-3 bg-gray-50">
                  <div className="font-medium text-sm text-gray-900">
                    {formatFieldValue(member.fullName)} 
                    {member.email && ` (${member.email})`}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {member.phoneNumber && `Phone: ${member.countryCode || '+91'} ${member.phoneNumber}`}
                    {member.institutionName && ` • ${member.institutionName}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Enhanced YFF Application Details Dialog Component
 */
export const YffApplicationDetailsDialogEnhanced: React.FC<YffApplicationDetailsDialogEnhancedProps> = ({
  application,
  open,
  onOpenChange,
}) => {
  if (!application) return null;

  // Get team registration data
  const teamRegistration = application.yff_team_registrations;

  console.log('🔍 Application data structure:', {
    applicationId: application.application_id,
    hasTeamRegistration: !!teamRegistration,
    teamRegistrationData: teamRegistration,
    answersType: typeof application.answers,
    answersData: application.answers
  });

  // Parse application answers
  const parsedAnswers = React.useMemo(() => {
    try {
      if (typeof application.answers === 'string') {
        return JSON.parse(application.answers);
      }
      return application.answers || {};
    } catch (error) {
      console.error('❌ Error parsing application answers:', error);
      return {};
    }
  }, [application.answers]);

  // Get questionnaire answers
  const questionnaireAnswers = parsedAnswers.questionnaire_answers || {};

  // Parse evaluation data
  const evaluationData = React.useMemo(() => {
    try {
      if (typeof application.evaluation_data === 'string') {
        return JSON.parse(application.evaluation_data);
      }
      return application.evaluation_data || {};
    } catch (error) {
      console.error('❌ Error parsing evaluation data:', error);
      return {};
    }
  }, [application.evaluation_data]);

  const evaluationScores = evaluationData.scores || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xl font-bold">Application Details with AI Scoring</div>
              <Badge variant={application.status === 'approved' ? 'default' : 'secondary'}>
                {application.status}
              </Badge>
            </div>
            <div className="text-sm text-gray-500">
              ID: {application.application_id?.substring(0, 8)}...
            </div>
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">
              {application.individuals?.first_name} {application.individuals?.last_name}
            </span>
            {application.individuals?.email && (
              <span>• {application.individuals.email}</span>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-2">
            {/* Team Registration Information */}
            <TeamRegistrationInfo registration={teamRegistration} />

            <Separator />

            {/* Questionnaire Answers */}
            <Card>
              <CardHeader>
                <CardTitle>Questionnaire Responses</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(questionnaireAnswers).length === 0 ? (
                  <p className="text-muted-foreground">No questionnaire responses available</p>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(questionnaireAnswers).map(([questionId, answer]) => {
                      const evaluation = evaluationScores[questionId];
                      
                      return (
                        <div key={questionId} className="border-l-4 border-blue-200 pl-4 py-2">
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900 capitalize">
                              {questionId.replace(/_/g, ' ')}
                            </h4>
                            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                              {String(answer)}
                            </div>
                            
                            {evaluation && (
                              <div className="mt-3 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    Score: {evaluation.score}/10
                                  </Badge>
                                </div>
                                
                                {evaluation.strengths && evaluation.strengths.length > 0 && (
                                  <div>
                                    <div className="text-xs font-medium text-green-700 mb-1">Strengths:</div>
                                    <ul className="text-xs text-green-600 list-disc list-inside space-y-1">
                                      {evaluation.strengths.map((strength: string, index: number) => (
                                        <li key={index}>{strength}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {evaluation.areas_for_improvement && evaluation.areas_for_improvement.length > 0 && (
                                  <div>
                                    <div className="text-xs font-medium text-amber-700 mb-1">Areas for Improvement:</div>
                                    <ul className="text-xs text-amber-600 list-disc list-inside space-y-1">
                                      {evaluation.areas_for_improvement.map((improvement: string, index: number) => (
                                        <li key={index}>{improvement}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Evaluation Summary */}
            {application.overall_score && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Evaluation Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {Number(application.overall_score).toFixed(1)}/10
                      </div>
                      <div className="text-sm text-gray-600">Overall Score</div>
                      <Badge variant={application.evaluation_status === 'completed' ? 'default' : 'secondary'}>
                        {application.evaluation_status}
                      </Badge>
                    </div>
                    
                    {evaluationData.evaluation_summary && (
                      <div>
                        <h4 className="font-medium mb-2">Summary:</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                          {evaluationData.evaluation_summary}
                        </p>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Evaluation completed: {
                        application.evaluation_completed_at 
                          ? new Date(application.evaluation_completed_at).toLocaleString()
                          : 'Not completed'
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
