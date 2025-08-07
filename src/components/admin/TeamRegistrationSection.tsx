
/**
 * @fileoverview Team Registration Information Display Component
 * 
 * Displays comprehensive team registration details for YFF applications
 * with robust error handling for missing or malformed data.
 * 
 * @version 1.1.0
 * @author 26ideas Development Team
 */

import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Building, 
  Users, 
  Globe,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface TeamRegistrationSectionProps {
  application: any;
}

/**
 * Get team registration data from the application
 */
const getTeamRegistrationData = (application: any) => {
  console.log('🔍 DEBUG – YFF_TEAM_REGISTRATIONS:', application.yff_team_registrations);
  console.log('🔍 YFF_TEAM_REGISTRATIONS TYPE:', typeof application.yff_team_registrations);
  
  let registration = application.yff_team_registrations;
  
  // Handle array case (from SQL joins)
  if (Array.isArray(registration)) {
    console.log('🔍 YFF_TEAM_REGISTRATIONS ARRAY LENGTH:', registration.length);
    registration = registration.length > 0 ? registration[0] : null;
  }
  
  // Log final registration data
  console.log('🔍 FINAL REGISTRATION DATA:', registration);
  
  return registration;
};

/**
 * Team registration field definitions with icons and grouping
 */
const FIELD_GROUPS = [
  {
    title: 'Personal Information',
    icon: User,
    fields: [
      { key: 'full_name', label: 'Full Name', icon: User },
      { key: 'email', label: 'Email Address', icon: Mail },
      { key: 'phone_number', label: 'Phone Number', icon: Phone },
      { key: 'date_of_birth', label: 'Date of Birth', icon: Calendar },
      { key: 'gender', label: 'Gender', icon: User },
    ]
  },
  {
    title: 'Location Information',
    icon: MapPin,
    fields: [
      { key: 'current_city', label: 'Current City', icon: MapPin },
      { key: 'state', label: 'State/Province', icon: MapPin },
      { key: 'pin_code', label: 'Pin Code', icon: MapPin },
      { key: 'permanent_address', label: 'Permanent Address', icon: MapPin },
      { key: 'country_code', label: 'Country Code', icon: Globe },
    ]
  },
  {
    title: 'Education Information',
    icon: Building,
    fields: [
      { key: 'institution_name', label: 'Institution Name', icon: Building },
      { key: 'course_program', label: 'Course/Program', icon: Building },
      { key: 'current_year_of_study', label: 'Current Year of Study', icon: Building },
      { key: 'expected_graduation', label: 'Expected Graduation', icon: Calendar },
    ]
  },
  {
    title: 'Team & Venture Information',
    icon: Users,
    fields: [
      { key: 'team_name', label: 'Team Name', icon: Users },
      { key: 'venture_name', label: 'Venture Name', icon: Building },
      { key: 'number_of_team_members', label: 'Number of Team Members', icon: Users },
      { key: 'industry_sector', label: 'Industry Sector', icon: Building },
      { key: 'website', label: 'Website URL', icon: Globe },
    ]
  },
  {
    title: 'Social & Other Information',
    icon: Globe,
    fields: [
      { key: 'linkedin_profile', label: 'LinkedIn Profile', icon: Globe },
      { key: 'social_media_handles', label: 'Social Media Handles', icon: Globe },
      { key: 'referral_id', label: 'Referral ID', icon: User },
    ]
  }
];

/**
 * Format field value for display
 */
const formatFieldValue = (value: any): { displayValue: string; hasValue: boolean } => {
  if (value === null || value === undefined || value === '') {
    return { displayValue: 'Not provided', hasValue: false };
  }
  
  if (typeof value === 'object') {
    try {
      return { displayValue: JSON.stringify(value), hasValue: true };
    } catch {
      return { displayValue: 'Invalid data', hasValue: false };
    }
  }
  
  const stringValue = String(value).trim();
  return { 
    displayValue: stringValue || 'Not provided', 
    hasValue: stringValue !== '' && stringValue !== 'null' && stringValue !== 'undefined'
  };
};

export const TeamRegistrationSection: React.FC<TeamRegistrationSectionProps> = ({ application }) => {
  const registrationData = getTeamRegistrationData(application);
  
  // Calculate completion statistics
  const allFields = FIELD_GROUPS.flatMap(group => group.fields);
  const completedFields = allFields.filter(field => {
    const { hasValue } = formatFieldValue(registrationData?.[field.key]);
    return hasValue;
  });
  
  const completionPercentage = Math.round((completedFields.length / allFields.length) * 100);
  
  if (!registrationData) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <AlertCircle className="h-5 w-5" />
            Team Registration Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-orange-700">No registration data available for this application.</p>
            <details className="bg-white rounded p-4 border">
              <summary className="cursor-pointer text-sm font-medium">Debug Information</summary>
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify({
                  yff_team_registrations: application.yff_team_registrations,
                  team_registration: application.team_registration,
                  registration_data: application.registration_data
                }, null, 2)}
              </pre>
            </details>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Team Registration Information
          </CardTitle>
          <Badge variant={completionPercentage >= 80 ? "default" : completionPercentage >= 50 ? "secondary" : "outline"}>
            {completedFields.length}/{allFields.length} fields completed ({completionPercentage}%)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {FIELD_GROUPS.map((group, groupIndex) => {
          const GroupIcon = group.icon;
          const groupCompletedFields = group.fields.filter(field => {
            const { hasValue } = formatFieldValue(registrationData[field.key]);
            return hasValue;
          });
          
          return (
            <div key={group.title}>
              {groupIndex > 0 && <Separator className="mb-6" />}
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <GroupIcon className="h-5 w-5 text-blue-600" />
                    {group.title}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {groupCompletedFields.length}/{group.fields.length}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.fields.map((field) => {
                    const { displayValue, hasValue } = formatFieldValue(registrationData[field.key]);
                    const FieldIcon = field.icon;
                    
                    return (
                      <div 
                        key={field.key} 
                        className={`p-3 rounded-lg border ${hasValue ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <div className="flex items-start gap-3">
                          <FieldIcon className={`h-4 w-4 mt-0.5 ${hasValue ? 'text-green-600' : 'text-gray-400'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-700">{field.label}</span>
                              {hasValue ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <AlertCircle className="h-3 w-3 text-gray-400" />
                              )}
                            </div>
                            <p className={`text-sm break-words ${hasValue ? 'text-gray-900' : 'text-gray-500 italic'}`}>
                              {displayValue}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Raw data debug section for development */}
        <details className="bg-gray-50 rounded p-4 border">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">
            Raw Registration Data (Debug)
          </summary>
          <pre className="mt-2 text-xs overflow-auto bg-white p-2 rounded border">
            {JSON.stringify(registrationData, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
};
