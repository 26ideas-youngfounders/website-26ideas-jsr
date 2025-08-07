
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

interface TeamRegistrationSectionProps {
  application: any; // Keep flexible to avoid TypeScript conflicts with existing types
}

/**
 * Displays team registration information for YFF applications
 * This component is isolated to prevent any interference with existing functionality
 */
export const TeamRegistrationSection: React.FC<TeamRegistrationSectionProps> = ({ application }) => {
  // Safe extraction of registration data
  let registration = application?.yff_team_registrations;
  if (Array.isArray(registration)) {
    registration = registration[0];
  }
  
  // Handle wrapped values safely
  const registrationAsAny = registration as any;
  if (registration && typeof registration === 'object' && registrationAsAny?._type) {
    // Unwrap if needed, but fall back gracefully
    registration = registrationAsAny.value || registration;
  }
  
  if (!registration || typeof registration !== 'object') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Team Registration Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-gray-600">No registration data available for this application.</span>
        </CardContent>
      </Card>
    );
  }

  // Define the fields we want to display
  const fields = [
    { key: 'full_name', label: 'Full Name' },
    { key: 'email', label: 'Email Address' },
    { key: 'phone_number', label: 'Phone Number' },
    { key: 'date_of_birth', label: 'Date of Birth' },
    { key: 'current_city', label: 'Current City' },
    { key: 'state', label: 'State/Province' },
    { key: 'pin_code', label: 'Pin Code' },
    { key: 'permanent_address', label: 'Permanent Address' },
    { key: 'institution_name', label: 'Institution Name' },
    { key: 'course_program', label: 'Course/Program' },
    { key: 'current_year_of_study', label: 'Current Year of Study' },
    { key: 'expected_graduation', label: 'Expected Graduation' },
    { key: 'venture_name', label: 'Venture Name' },
    { key: 'team_name', label: 'Team Name' },
    { key: 'industry_sector', label: 'Industry Sector' },
    { key: 'number_of_team_members', label: 'Number of Team Members' },
    { key: 'website', label: 'Website URL' },
    { key: 'linkedin_profile', label: 'LinkedIn Profile' },
    { key: 'gender', label: 'Gender' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Team Registration Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(({ key, label }) => (
            <div key={key}>
              <strong>{label}:</strong> {registration[key] || 'Not provided'}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
