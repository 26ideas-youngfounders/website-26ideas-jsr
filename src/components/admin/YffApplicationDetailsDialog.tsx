
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, Mail, Phone, MapPin, Users, BookOpen, Clock, Lightbulb, DollarSign, BarChart2, Zap, GitPullRequest, LayoutList, Calendar, Copy, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface YffApplication {
  application_id: string;
  individual_id: string;
  status: string;
  application_round: string;
  answers: any;
  cumulative_score: number;
  submitted_at: string;
  individuals: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    country_code?: string;
    country_iso_code?: string;
  } | null;
}

interface YffApplicationDetailsDialogProps {
  application: YffApplication;
}

export const YffApplicationDetailsDialog: React.FC<YffApplicationDetailsDialogProps> = ({ application }) => {
  const { toast } = useToast();
  const answers = application.answers || {};
  const teamAnswers = answers.team || {};
  const questionnaireAnswers = answers.questionnaire_answers || {};

  /**
   * Copy all application data to clipboard
   */
  const copyApplicationData = () => {
    const applicationText = `
APPLICATION DETAILS
==================

Basic Information:
- Application ID: ${application.application_id}
- Team Leader: ${teamAnswers.fullName || 'N/A'}
- Email: ${teamAnswers.email || 'N/A'}
- Phone: ${teamAnswers.countryCode || ''} ${teamAnswers.phoneNumber || 'N/A'}
- Date of Birth: ${teamAnswers.dateOfBirth || 'N/A'}
- Gender: ${teamAnswers.gender || 'N/A'}
- Current City: ${teamAnswers.currentCity || 'N/A'}
- State: ${teamAnswers.state || 'N/A'}
- Pin Code: ${teamAnswers.pinCode || 'N/A'}
- Permanent Address: ${teamAnswers.permanentAddress || 'N/A'}

Education:
- Institution: ${teamAnswers.institutionName || 'N/A'}
- Course/Program: ${teamAnswers.courseProgram || 'N/A'}
- Year of Study: ${teamAnswers.currentYearOfStudy || 'N/A'}
- Expected Graduation: ${teamAnswers.expectedGraduation || 'N/A'}

Team Information:
- Team Name: ${teamAnswers.teamName || 'N/A'}
- Number of Members: ${teamAnswers.numberOfMembers || 1}
- Venture Name: ${teamAnswers.ventureName || 'N/A'}
- Industry Sector: ${teamAnswers.industrySector || 'N/A'}
- Website: ${teamAnswers.website || 'N/A'}
- Social Media: ${teamAnswers.socialMediaHandles || 'N/A'}
- LinkedIn: ${teamAnswers.linkedinProfile || 'N/A'}
- Referral ID: ${teamAnswers.referralId || 'N/A'}

Questionnaire Answers:
- Product Stage: ${questionnaireAnswers.productStage || 'N/A'}
- Idea Description: ${questionnaireAnswers.ideaDescription || 'N/A'}
- Problem Solved: ${questionnaireAnswers.problemSolved || 'N/A'}
- Target Audience: ${questionnaireAnswers.targetAudience || 'N/A'}
- Solution Approach: ${questionnaireAnswers.solutionApproach || 'N/A'}
- Monetization Strategy: ${questionnaireAnswers.monetizationStrategy || 'N/A'}
- Customer Acquisition: ${questionnaireAnswers.customerAcquisition || 'N/A'}
- Competitors: ${questionnaireAnswers.competitors || 'N/A'}
- Development Approach: ${questionnaireAnswers.developmentApproach || 'N/A'}
- Team Info: ${questionnaireAnswers.teamInfo || 'N/A'}
- Timeline: ${questionnaireAnswers.timeline || 'N/A'}

${questionnaireAnswers.productStage === 'Early Revenue' ? `
Early Revenue Specific:
- Paying Customers: ${questionnaireAnswers.payingCustomers || 'N/A'}
- Working Duration: ${questionnaireAnswers.workingDuration || 'N/A'}
` : ''}

Team Members:
${Array.isArray(teamAnswers.teamMembers) && teamAnswers.teamMembers.length > 0 ? 
  teamAnswers.teamMembers.map((member: any, index: number) => `
Member ${index + 2}:
- Name: ${member.fullName || 'N/A'}
- Email: ${member.email || 'N/A'}
- Phone: ${member.countryCode || ''} ${member.phoneNumber || 'N/A'}
- Date of Birth: ${member.dateOfBirth || 'N/A'}
- Gender: ${member.gender || 'N/A'}
- City: ${member.currentCity || 'N/A'}
- State: ${member.state || 'N/A'}
- Pin Code: ${member.pinCode || 'N/A'}
- Address: ${member.permanentAddress || 'N/A'}
- Institution: ${member.institutionName || 'N/A'}
- Course: ${member.courseProgram || 'N/A'}
- Year: ${member.currentYearOfStudy || 'N/A'}
- Graduation: ${member.expectedGraduation || 'N/A'}
- LinkedIn: ${member.linkedinProfile || 'N/A'}
`).join('\n') : 'No additional team members'}

Application Status: ${application.status}
Submitted: ${application.submitted_at ? format(new Date(application.submitted_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
    `.trim();

    navigator.clipboard.writeText(applicationText).then(() => {
      toast({
        title: 'Copied to Clipboard',
        description: 'Application details have been copied to your clipboard.',
        duration: 3000,
      });
    }).catch(() => {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy application details. Please try again.',
        variant: 'destructive',
        duration: 3000,
      });
    });
  };

  /**
   * Helper to render an answer block with proper handling of missing data
   */
  const renderAnswerBlock = (label: string, value: string | string[] | number | boolean | undefined | null, defaultValue = 'No answer provided', type: 'text' | 'list' = 'text') => {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      return (
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-600">{label}:</p>
          <p className="text-sm text-gray-400 italic">{defaultValue}</p>
        </div>
      );
    }
    
    if (type === 'list' && Array.isArray(value)) {
      return (
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-600">{label}:</p>
          <div className="flex flex-wrap gap-1">
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
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-600">{label}:</p>
        <p className="text-sm text-gray-800 break-words whitespace-pre-wrap leading-relaxed">{String(value)}</p>
      </div>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Eye className="h-3 w-3 mr-1" />
          Review
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Complete Application Review
          </DialogTitle>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {teamAnswers.fullName || 'Unknown Applicant'} &bull;{" "}
              {teamAnswers.email || 'No email'} &bull; ID: {application.application_id.slice(0, 8)}...
            </div>
            <Button variant="outline" size="sm" onClick={copyApplicationData}>
              <Copy className="h-4 w-4 mr-1" />
              Copy All Data
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Application Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LayoutList className="h-5 w-5" />
                Application Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderAnswerBlock('Application Status', application.status)}
              {renderAnswerBlock('Application Round', application.application_round)}
              {renderAnswerBlock('Submitted At', application.submitted_at ? format(new Date(application.submitted_at), 'MMM dd, yyyy HH:mm') : null)}
              {renderAnswerBlock('Cumulative Score', application.cumulative_score || 0)}
            </CardContent>
          </Card>

          {/* Team Leader Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Leader Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderAnswerBlock('Full Name', teamAnswers.fullName)}
              {renderAnswerBlock('Email', teamAnswers.email)}
              {renderAnswerBlock('Phone Number', teamAnswers.phoneNumber ? `${teamAnswers.countryCode || ''} ${teamAnswers.phoneNumber}` : null)}
              {renderAnswerBlock('Date of Birth', teamAnswers.dateOfBirth)}
              {renderAnswerBlock('Gender', teamAnswers.gender)}
              {renderAnswerBlock('Current City', teamAnswers.currentCity)}
              {renderAnswerBlock('State', teamAnswers.state)}
              {renderAnswerBlock('Pin Code', teamAnswers.pinCode)}
              {renderAnswerBlock('Permanent Address', teamAnswers.permanentAddress)}
              {renderAnswerBlock('LinkedIn Profile', teamAnswers.linkedinProfile)}
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderAnswerBlock('Institution Name', teamAnswers.institutionName)}
              {renderAnswerBlock('Course/Program', teamAnswers.courseProgram)}
              {renderAnswerBlock('Current Year of Study', teamAnswers.currentYearOfStudy)}
              {renderAnswerBlock('Expected Graduation', teamAnswers.expectedGraduation)}
            </CardContent>
          </Card>

          {/* Team & Venture Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Team & Venture Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderAnswerBlock('Team Name', teamAnswers.teamName)}
              {renderAnswerBlock('Venture Name', teamAnswers.ventureName)}
              {renderAnswerBlock('Industry Sector', teamAnswers.industrySector)}
              {renderAnswerBlock('Number of Team Members', teamAnswers.numberOfMembers)}
              {renderAnswerBlock('Website', teamAnswers.website)}
              {renderAnswerBlock('Social Media Handles', teamAnswers.socialMediaHandles)}
              {renderAnswerBlock('Referral ID', teamAnswers.referralId)}
            </CardContent>
          </Card>

          {/* Team Members Details */}
          {Array.isArray(teamAnswers.teamMembers) && teamAnswers.teamMembers.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members ({teamAnswers.teamMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamAnswers.teamMembers.map((member: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-semibold text-sm mb-3 text-gray-700">Team Member {index + 2}</h4>
                      <div className="space-y-2">
                        {renderAnswerBlock('Name', member.fullName)}
                        {renderAnswerBlock('Email', member.email)}
                        {renderAnswerBlock('Phone', member.phoneNumber ? `${member.countryCode || ''} ${member.phoneNumber}` : null)}
                        {renderAnswerBlock('Date of Birth', member.dateOfBirth)}
                        {renderAnswerBlock('Gender', member.gender)}
                        {renderAnswerBlock('City', member.currentCity)}
                        {renderAnswerBlock('State', member.state)}
                        {renderAnswerBlock('Institution', member.institutionName)}
                        {renderAnswerBlock('Course', member.courseProgram)}
                        {renderAnswerBlock('Year', member.currentYearOfStudy)}
                        {renderAnswerBlock('Graduation', member.expectedGraduation)}
                        {renderAnswerBlock('LinkedIn', member.linkedinProfile)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Questionnaire Answers */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Questionnaire Answers
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  Product Stage: {questionnaireAnswers.productStage || 'Not specified'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {renderAnswerBlock('Tell us about your idea', questionnaireAnswers.ideaDescription)}
                  {renderAnswerBlock('What problem does your idea solve?', questionnaireAnswers.problemSolved)}
                  {renderAnswerBlock('Whose problem does your idea solve for?', questionnaireAnswers.targetAudience)}
                  {renderAnswerBlock('How does your idea solve this problem?', questionnaireAnswers.solutionApproach)}
                  {renderAnswerBlock('Monetization Strategy', questionnaireAnswers.monetizationStrategy)}
                  {renderAnswerBlock('Customer Acquisition Plan', questionnaireAnswers.customerAcquisition)}
                </div>
                
                <div className="space-y-4">
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consent & Verification */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GitPullRequest className="h-5 w-5" />
                Consent & Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderAnswerBlock('Privacy Policy', teamAnswers.privacyPolicy ? '✅ Agreed' : '❌ Not Agreed')}
                {renderAnswerBlock('Terms & Conditions', teamAnswers.termsConditions ? '✅ Agreed' : '❌ Not Agreed')}
                {renderAnswerBlock('Age Verification (18-27)', teamAnswers.ageVerification ? '✅ Verified' : '❌ Not Verified')}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 
