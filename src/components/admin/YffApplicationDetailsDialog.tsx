import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, Mail, Phone, MapPin, Users, BookOpen, Clock, Lightbulb, DollarSign, BarChart2, Zap, GitPullRequest, LayoutList, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface YffApplication {
  application_id: string;
  individual_id: string;
  status: string;
  application_round: string;
  answers: any; // This will contain all questionnaire answers
  cumulative_score: number;
  submitted_at: string;
  individuals: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string; // Assuming phone_number might be here from individuals table
    country_code?: string;
    country_iso_code?: string;
  } | null;
}

interface YffApplicationDetailsDialogProps {
  application: YffApplication;
}

export const YffApplicationDetailsDialog: React.FC<YffApplicationDetailsDialogProps> = ({ application }) => {
  const answers = application.answers || {}; // Ensure answers is an object
  const teamAnswers = answers.team || {}; // Assuming team information is nested under 'team' key
  const questionnaireAnswers = answers.questionnaire_answers || {}; // Assuming questionnaire answers are nested

  // Helper to render an answer block
  const renderAnswerBlock = (label: string, value: string | string[] | number | boolean | undefined | null, defaultValue = 'Not provided', type: 'text' | 'list' = 'text') => {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      return (
        <div>
          <p className="text-sm font-medium text-gray-600">{label}:</p>
          <p className="text-sm text-gray-400 italic">{defaultValue}</p>
        </div>
      );
    }
    
    if (type === 'list' && Array.isArray(value)) {
      return (
        <div>
          <p className="text-sm font-medium text-gray-600">{label}:</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {value.length > 0 ? (
              value.map((item, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{String(item)}</Badge>
              ))
            ) : (
              <p className="text-sm text-gray-400 italic">{defaultValue}</p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div>
        <p className="text-sm font-medium text-gray-600">{label}:</p>
        <p className="text-base text-gray-800 break-words whitespace-pre-wrap">{String(value)}</p>
      </div>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Eye className="h-3 w-3 mr-1" />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Application Details
          </DialogTitle>
          <div className="text-sm text-gray-500">
            {application.individuals?.first_name} {application.individuals?.last_name} &bull;{" "}
            {application.individuals?.email} &bull; Application ID: {application.application_id.slice(0, 8)}...
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* General Application Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderAnswerBlock('Status', application.status, '', 'text')}
              {renderAnswerBlock('Round', application.application_round, '', 'text')}
              {renderAnswerBlock('Submitted At', application.submitted_at ? format(new Date(application.submitted_at), 'MMM dd, yyyy HH:mm') : null, 'N/A', 'text')}
              {renderAnswerBlock('Cumulative Score', application.cumulative_score, 'Not scored', 'text')}
            </CardContent>
          </Card>

          {/* Team Leader Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Leader Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderAnswerBlock('Full Name', teamAnswers.fullName)}
              {renderAnswerBlock('Email', teamAnswers.email)}
              {renderAnswerBlock('Phone Number', teamAnswers.phoneNumber ? `${teamAnswers.countryCode || ''} ${teamAnswers.phoneNumber}` : null)}
              {renderAnswerBlock('Date of Birth', teamAnswers.dateOfBirth)}
              {renderAnswerBlock('Gender', teamAnswers.gender)}
              {renderAnswerBlock('LinkedIn Profile', teamAnswers.linkedinProfile)}
              {renderAnswerBlock('Current City', teamAnswers.currentCity)}
              {renderAnswerBlock('State', teamAnswers.state)}
              {renderAnswerBlock('Pin Code', teamAnswers.pinCode)}
              {renderAnswerBlock('Permanent Address', teamAnswers.permanentAddress)}
            </CardContent>
          </Card>

          {/* Team Leader Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Academic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderAnswerBlock('Institution Name', teamAnswers.institutionName)}
              {renderAnswerBlock('Course/Program', teamAnswers.courseProgram)}
              {renderAnswerBlock('Current Year of Study', teamAnswers.currentYearOfStudy)}
              {renderAnswerBlock('Expected Graduation', teamAnswers.expectedGraduation)}
            </CardContent>
          </Card>

          {/* Team Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderAnswerBlock('Team Name', teamAnswers.teamName)}
              {renderAnswerBlock('Number of Team Members', teamAnswers.numberOfMembers)}
              {teamAnswers.numberOfMembers > 1 && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Team Members:</p>
                  <div className="space-y-3">
                    {Array.isArray(teamAnswers.teamMembers) && teamAnswers.teamMembers.map((member: any, index: number) => (
                      <div key={index} className="border p-3 rounded-md bg-gray-50">
                        <p className="font-semibold text-sm">Member {index + 2}:</p>
                        {renderAnswerBlock('Full Name', member.fullName, undefined, 'text')}
                        {renderAnswerBlock('Email', member.email, undefined, 'text')}
                        {renderAnswerBlock('Phone Number', member.phoneNumber ? `${member.countryCode || ''} ${member.phoneNumber}` : null, undefined, 'text')}
                        {renderAnswerBlock('Date of Birth', member.dateOfBirth, undefined, 'text')}
                        {renderAnswerBlock('Current City', member.currentCity, undefined, 'text')}
                        {renderAnswerBlock('State', member.state, undefined, 'text')}
                        {renderAnswerBlock('Pin Code', member.pinCode, undefined, 'text')}
                        {renderAnswerBlock('Permanent Address', member.permanentAddress, undefined, 'text')}
                        {renderAnswerBlock('Gender', member.gender, undefined, 'text')}
                        {renderAnswerBlock('Institution Name', member.institutionName, undefined, 'text')}
                        {renderAnswerBlock('Course/Program', member.courseProgram, undefined, 'text')}
                        {renderAnswerBlock('Current Year of Study', member.currentYearOfStudy, undefined, 'text')}
                        {renderAnswerBlock('Expected Graduation', member.expectedGraduation, undefined, 'text')}
                        {renderAnswerBlock('LinkedIn Profile', member.linkedinProfile, undefined, 'text')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Venture Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Venture Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderAnswerBlock('Venture Name', teamAnswers.ventureName)}
              {renderAnswerBlock('Industry Sector', teamAnswers.industrySector)}
              {renderAnswerBlock('Website', teamAnswers.website)}
              {renderAnswerBlock('Social Media Handles', teamAnswers.socialMediaHandles)}
              {renderAnswerBlock('Referral ID', teamAnswers.referralId)}
              {renderAnswerBlock('Team Leader LinkedIn', teamAnswers.linkedinProfile)} {/* Already present in personal info, but good to keep if schema varies */}
            </CardContent>
          </Card>

          {/* Questionnaire Answers */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Questionnaire Answers</CardTitle>
              <p className="text-sm text-gray-500">Product Stage: {questionnaireAnswers.productStage || 'Not selected'}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderAnswerBlock('Tell us about your idea', questionnaireAnswers.ideaDescription)}
              {renderAnswerBlock('What problem does your idea solve?', questionnaireAnswers.problemSolved)}
              {renderAnswerBlock('Whose problem does your idea solve for?', questionnaireAnswers.targetAudience)}
              {renderAnswerBlock('How does your idea solve this problem?', questionnaireAnswers.solutionApproach)}
              {renderAnswerBlock('Monetization Strategy', questionnaireAnswers.monetizationStrategy)}
              {renderAnswerBlock('Customer Acquisition Plan', questionnaireAnswers.customerAcquisition)}
              
              {questionnaireAnswers.productStage === 'Early Revenue' && (
                <>
                  {renderAnswerBlock('How many paying customers does your idea already have?', questionnaireAnswers.payingCustomers)}
                  {renderAnswerBlock('How long have you been working on the idea?', questionnaireAnswers.workingDuration)}
                </>
              )}

              {renderAnswerBlock('List 3 potential competitors', questionnaireAnswers.competitors)}
              {renderAnswerBlock('Development Approach', questionnaireAnswers.developmentApproach)}
              {renderAnswerBlock('Who is on your team, and what are their roles?', questionnaireAnswers.teamInfo)}
              {renderAnswerBlock('When do you plan to proceed with the idea?', questionnaireAnswers.timeline)}
            </CardContent>
          </Card>

          {/* Consent & Terms */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Consent & Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderAnswerBlock('Privacy Policy Agreement', teamAnswers.privacyPolicy ? 'Agreed' : 'Not Agreed', 'Not Agreed')}
              {renderAnswerBlock('Terms & Conditions Agreement', teamAnswers.termsConditions ? 'Agreed' : 'Not Agreed', 'Not Agreed')}
              {renderAnswerBlock('Age Verification (18-27)', teamAnswers.ageVerification ? 'Verified' : 'Not Verified', 'Not Verified')}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 
