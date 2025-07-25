
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';

interface TeamMember {
  fullName: string;
  email: string;
  linkedinProfile?: string;
  socialMediaHandles?: string;
  idCardFile?: File | null;
}

interface YffTeamMemberFieldsProps {
  members: TeamMember[];
  onMemberChange: (index: number, field: keyof TeamMember, value: any) => void;
  onRemoveMember: (index: number) => void;
  errors: Record<string, any>;
  onInputChange: () => void;
}

/**
 * Team member fields component for YFF registration
 * Handles individual team member information collection
 */
export const YffTeamMemberFields: React.FC<YffTeamMemberFieldsProps> = ({
  members,
  onMemberChange,
  onRemoveMember,
  errors,
  onInputChange,
}) => {
  const handleFileUpload = (memberIndex: number, file: File | null) => {
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid file (JPG, PNG, or PDF)');
        return;
      }

      if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        return;
      }
    }

    onMemberChange(memberIndex, 'idCardFile', file);
    onInputChange();
  };

  return (
    <div className="space-y-6">
      {members.map((member, index) => (
        <Card key={index} className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800">
                {index === 0 ? 'Team Leader' : `Team Member ${index + 1}`}
              </h4>
              {index > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveMember(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>

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
                  className={`h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg ${
                    errors[`member-${index}-name`] ? 'border-red-500' : ''
                  }`}
                  readOnly={index === 0}
                />
                {errors[`member-${index}-name`] && (
                  <p className="text-red-500 text-sm mt-1">{errors[`member-${index}-name`]}</p>
                )}
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
                  className={`h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg ${
                    errors[`member-${index}-email`] ? 'border-red-500' : ''
                  }`}
                  readOnly={index === 0}
                />
                {errors[`member-${index}-email`] && (
                  <p className="text-red-500 text-sm mt-1">{errors[`member-${index}-email`]}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor={`member-${index}-linkedin`} className="text-sm font-semibold text-gray-700 mb-2 block">
                LinkedIn Profile (Recommended)
              </Label>
              <Input
                id={`member-${index}-linkedin`}
                value={member.linkedinProfile || ''}
                onChange={(e) => {
                  onMemberChange(index, 'linkedinProfile', e.target.value);
                  onInputChange();
                }}
                placeholder="https://linkedin.com/in/username"
                className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
              />
            </div>

            <div className="mt-4">
              <Label htmlFor={`member-${index}-social`} className="text-sm font-semibold text-gray-700 mb-2 block">
                Social Media Handles (Optional)
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
              />
            </div>

            <div className="mt-4">
              <Label htmlFor={`member-${index}-id-card`} className="text-sm font-semibold text-gray-700 mb-2 block">
                ID Card Upload * (PDF, JPG, PNG - Max 5MB)
              </Label>
              <div className="flex items-center gap-4">
                <input
                  id={`member-${index}-id-card`}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(index, e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById(`member-${index}-id-card`)?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {member.idCardFile ? 'Change File' : 'Upload ID Card'}
                </Button>
                {member.idCardFile && (
                  <span className="text-sm text-gray-600">
                    {member.idCardFile.name} ({(member.idCardFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                )}
              </div>
              {errors[`member-${index}-id-card`] && (
                <p className="text-red-500 text-sm mt-1">{errors[`member-${index}-id-card`]}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
