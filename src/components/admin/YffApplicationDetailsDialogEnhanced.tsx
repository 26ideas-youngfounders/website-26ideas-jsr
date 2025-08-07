

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Building, 
  Users, 
  Briefcase,
  Star,
  MessageSquare,
  FileText,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { YffApplicationWithIndividual } from '@/types/yff-application';
import { TeamRegistrationSection } from './TeamRegistrationSection';

interface IndividualDetailsProps {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  countryCode: string | null;
  countryIsoCode: string | null;
}

const IndividualDetails: React.FC<IndividualDetailsProps> = ({
  firstName,
  lastName,
  email,
  phoneNumber,
  countryCode,
  countryIsoCode,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Individual Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <strong>First Name:</strong> {firstName || 'Not provided'}
          </div>
          <div>
            <strong>Last Name:</strong> {lastName || 'Not provided'}
          </div>
          <div>
            <strong>Email:</strong> {email || 'Not provided'}
          </div>
          <div>
            <strong>Phone Number:</strong> {phoneNumber || 'Not provided'}
          </div>
          <div>
            <strong>Country Code:</strong> {countryCode || 'Not provided'}
          </div>
          <div>
            <strong>Country ISO Code:</strong> {countryIsoCode || 'Not provided'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface YffApplicationDetailsDialogEnhancedProps {
  application: YffApplicationWithIndividual;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STAGE_QUESTIONS = {
  idea: {
    'idea-description': 'Idea Description',
    'problem-statement': 'Problem Statement',
    'target-audience': 'Target Audience',
    'unique-value-proposition': 'Unique Value Proposition',
    'market-research': 'Market Research',
    'competitive-landscape': 'Competitive Landscape',
    'business-model': 'Business Model',
    'revenue-streams': 'Revenue Streams',
    'go-to-market-strategy': 'Go-to-Market Strategy',
    'team-composition': 'Team Composition',
    'skills-expertise': 'Skills & Expertise',
    'funding-requirements': 'Funding Requirements',
    'milestones-timeline': 'Milestones & Timeline',
    'risks-challenges': 'Risks & Challenges',
    'success-metrics': 'Success Metrics'
  }
};

const TEAM_REGISTRATION_QUESTIONS = {
  full_name: 'Full Name',
  email: 'Email Address',
  phone_number: 'Phone Number',
  date_of_birth: 'Date of Birth',
  current_city: 'Current City',
  state: 'State/Province',
  pin_code: 'Pin Code',
  permanent_address: 'Permanent Address',
  institution_name: 'Institution Name',
  course_program: 'Course/Program',
  current_year_of_study: 'Current Year of Study',
  expected_graduation: 'Expected Graduation',
  venture_name: 'Venture Name',
  team_name: 'Team Name',
  industry_sector: 'Industry Sector',
  number_of_team_members: 'Number of Team Members',
  website: 'Website URL',
  linkedin_profile: 'LinkedIn Profile',
  gender: 'Gender'
};

const safeUnwrapValue = (value: any): any => {
  if (value && typeof value === 'object' && value._type === 'undefined') {
    return undefined;
  }
  if (value && typeof value === 'object' && value.value !== undefined) {
    return value.value;
  }
  return value;
};

export const YffApplicationDetailsDialogEnhanced: React.FC<YffApplicationDetailsDialogEnhancedProps> = ({
  application,
  open,
  onOpenChange,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const parsedAnswers = useMemo(() => {
    console.log("=== PARSING APPLICATION ANSWERS ===");
    
    let questionnaire_answers = {};
    let stage = 'idea';
    
    try {
      const rawAnswers = application.answers;
      console.log("Raw answers:", rawAnswers);
      
      if (rawAnswers && typeof rawAnswers === 'object') {
        if ('questionnaire_answers' in rawAnswers && rawAnswers.questionnaire_answers) {
          questionnaire_answers = rawAnswers.questionnaire_answers as Record<string, any>;
        }
        
        if ('stage' in rawAnswers && rawAnswers.stage) {
          stage = rawAnswers.stage as string;
        }
      }
    } catch (error) {
      console.error("Error parsing answers:", error);
    }
    
    const fallback = {
      questionnaire_answers,
      stage: stage || 'idea'
    };
    
    console.log("Final parsed answers:", fallback);
    return fallback;
  }, [application.yff_team_registrations, application.answers, application.application_id]);

  const formatAnswerValue = (value: any): string => {
    if (value === null || value === undefined) return 'Not provided';
    if (typeof value === 'string') return value;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getStageQuestions = (stage: string) => {
    return STAGE_QUESTIONS[stage as keyof typeof STAGE_QUESTIONS] || STAGE_QUESTIONS.idea;
  };

  const renderQuestionnaireAnswers = () => {
    const stageQuestions = getStageQuestions(parsedAnswers.stage);
    const answers = parsedAnswers.questionnaire_answers;
    
    if (!answers || Object.keys(answers).length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No questionnaire answers available for this application.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {Object.entries(stageQuestions).map(([key, label]) => {
          const answer = answers[key];
          if (!answer) return null;
          
          return (
            <div key={key} className="space-y-2">
              <h4 className="font-semibold text-gray-900">{label}</h4>
              <div className="p-3 bg-gray-50 rounded-lg">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                  {formatAnswerValue(answer)}
                </pre>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { variant: 'default' as const, icon: Clock, label: 'Submitted' },
      under_review: { variant: 'secondary' as const, icon: AlertCircle, label: 'Under Review' },
      accepted: { variant: 'default' as const, icon: CheckCircle, label: 'Accepted' },
      rejected: { variant: 'destructive' as const, icon: XCircle, label: 'Rejected' },
      waitlisted: { variant: 'outline' as const, icon: Clock, label: 'Waitlisted' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted;
    const Icon = config.icon;
    
    return (
      <Badge 
        variant={config.variant} 
        className={status === 'accepted' ? 'bg-green-100 text-green-800 border-green-200' : ''}
      >
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getEvaluationStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'outline' as const, icon: Clock, label: 'Pending' },
      in_progress: { variant: 'secondary' as const, icon: TrendingUp, label: 'In Progress' },
      completed: { variant: 'default' as const, icon: CheckCircle, label: 'Completed' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge 
        variant={config.variant} 
        className={status === 'completed' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
      >
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-semibold">
            Application Details - {application.application_id}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-6 mt-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="questionnaire">Questionnaire</TabsTrigger>
              <TabsTrigger value="evaluation">AI Evaluation</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-hidden px-6 pb-6">
              <TabsContent value="overview" className="h-full mt-4">
                <ScrollArea className="h-full">
                  <div className="space-y-6 pr-4">
                    {/* Application Status Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Application Status
                          </span>
                          <div className="flex gap-2">
                            {getStatusBadge(application.status)}
                            {getEvaluationStatusBadge(application.evaluation_status)}
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <strong>Submitted:</strong> {new Date(application.created_at).toLocaleDateString()}
                          </div>
                          <div>
                            <strong>Last Updated:</strong> {new Date(application.updated_at).toLocaleDateString()}
                          </div>
                          <div>
                            <strong>Stage:</strong> {parsedAnswers.stage || 'Not specified'}
                          </div>
                          <div>
                            <strong>Application ID:</strong> {application.application_id}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Team Registration Information Section */}
                    <TeamRegistrationSection application={application} />

                    {/* Quick Summary of Questionnaire */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Questionnaire Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-gray-600">
                          {Object.keys(parsedAnswers.questionnaire_answers).length > 0 ? (
                            <>
                              <p><strong>Questions Answered:</strong> {Object.keys(parsedAnswers.questionnaire_answers).length}</p>
                              <p><strong>Stage:</strong> {parsedAnswers.stage}</p>
                              <p className="mt-2">View the "Questionnaire" tab for detailed answers.</p>
                            </>
                          ) : (
                            <p>No questionnaire data available.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="questionnaire" className="h-full mt-4">
                <ScrollArea className="h-full">
                  <div className="space-y-6 pr-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Questionnaire Responses</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {renderQuestionnaireAnswers()}
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="evaluation" className="h-full mt-4">
                <ScrollArea className="h-full">
                  <div className="space-y-6 pr-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Star className="h-5 w-5" />
                          AI Evaluation & Feedback
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8 text-gray-500">
                          <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>AI evaluation functionality is being developed.</p>
                          <p className="text-sm mt-2">
                            Application ID: {application.application_id}<br/>
                            Stage: {parsedAnswers.stage}<br/>
                            Status: {application.evaluation_status}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
