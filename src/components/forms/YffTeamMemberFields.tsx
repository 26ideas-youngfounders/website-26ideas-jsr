
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, User, Crown } from 'lucide-react';

interface TeamMember {
  fullName: string;
  email: string;
  linkedinProfile?: string;
  socialMediaHandles?: string;
}

interface YffTeamMemberFieldsProps {
  members: TeamMember[];
  onMemberChange: (index: number, field: keyof TeamMember, value: any) => void;
  onRemoveMember: (index: number) => void;
  errors: any;
  onInputChange: () => void;
}

/**
 * Team member fields component for YFF registration
 * Handles input fields for team members (removed ID card functionality)
 */
export const YffTeamMemberFields: React.FC<YffTeamMemberFieldsProps> = ({
  members,
  onMemberChange,
  onRemoveMember,
  errors,
  onInputChange,
}) => {
  return (
    <div className="space-y-6">
      {members.map((member, index) => (
        <Card key={index} className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index === 0 ? 'bg-yellow-100' : 'bg-blue-100'
                }`}>
                  {index === 0 ? (
                    <Crown className={`w-5 h-5 ${index === 0 ? 'text-yellow-600' : 'text-blue-600'}`} />
                  ) : (
                    <User className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  {index === 0 ? 'Team Leader' : `Team Member ${index + 1}`}
                </CardTitle>
              </div>
              
              {index > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveMember(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`member-${index}-name`} className="text-sm font-semibold text-gray-700 mb-2 block">
                  Full Name *
                </Label>
                <Input
                  id={`member-${index}-name`}
                  value={member.fullName}
                  onChange={(e) => {
                    onMemberChange(index, 'fullName', e.target.value);
                    onInputChange();
                  }}
                  placeholder="Enter full name"
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  disabled={index === 0}
                />
              </div>

              <div>
                <Label htmlFor={`member-${index}-email`} className="text-sm font-semibold text-gray-700 mb-2 block">
                  Email Address *
                </Label>
                <Input
                  id={`member-${index}-email`}
                  type="email"
                  value={member.email}
                  onChange={(e) => {
                    onMemberChange(index, 'email', e.target.value);
                    onInputChange();
                  }}
                  placeholder="Enter email address"
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  disabled={index === 0}
                />
              </div>
            </div>

            <div>
              <Label htmlFor={`member-${index}-linkedin`} className="text-sm font-semibold text-gray-700 mb-2 block">
                LinkedIn Profile
              </Label>
              <Input
                id={`member-${index}-linkedin`}
                value={member.linkedinProfile || ''}
                onChange={(e) => {
                  onMemberChange(index, 'linkedinProfile', e.target.value);
                  onInputChange();
                }}
                placeholder="https://linkedin.com/in/profile"
                className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                disabled={index === 0}
              />
            </div>

            <div>
              <Label htmlFor={`member-${index}-social`} className="text-sm font-semibold text-gray-700 mb-2 block">
                Social Media Handles
              </Label>
              <Input
                id={`member-${index}-social`}
                value={member.socialMediaHandles || ''}
                onChange={(e) => {
                  onMemberChange(index, 'socialMediaHandles', e.target.value);
                  onInputChange();
                }}
                placeholder="@username, @handle2 (comma-separated)"
                className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                disabled={index === 0}
              />
            </div>

            {index === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Team Leader:</strong> Your information is automatically populated from your personal details above.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
