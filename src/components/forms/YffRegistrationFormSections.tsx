
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhoneInput } from '@/components/ui/phone-input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { YffTeamMemberFields } from './YffTeamMemberFields';
import { FormValues } from './YffTeamRegistrationForm';

interface YffRegistrationFormSectionsProps {
  form: UseFormReturn<FormValues>;
}

/**
 * Component for rendering all sections of the YFF registration form
 * Handles personal information, team details, and venture information
 */
export const YffRegistrationFormSections: React.FC<YffRegistrationFormSectionsProps> = ({ form }) => {
  const numberOfTeamMembers = form.watch('numberOfTeamMembers');

  /**
   * Handles adding a new team member
   */
  const handleAddTeamMember = () => {
    const currentMembers = form.getValues('teamMembers') || [];
    const newMemberCount = numberOfTeamMembers + 1;
    
    if (newMemberCount <= 5) {
      // Add new empty member
      const newMember = {
        fullName: '',
        email: '',
        phoneNumber: '',
        countryCode: '+91',
        dateOfBirth: '',
        currentCity: '',
        state: '',
        pinCode: '',
        permanentAddress: '',
        gender: '',
        institutionName: '',
        courseProgram: '',
        currentYearOfStudy: '',
        expectedGraduation: '',
        linkedinProfile: '',
      };
      
      form.setValue('teamMembers', [...currentMembers, newMember]);
      form.setValue('numberOfTeamMembers', newMemberCount);
    }
  };

  /**
   * Handles removing a team member
   */
  const handleRemoveTeamMember = () => {
    const currentMembers = form.getValues('teamMembers') || [];
    const newMemberCount = numberOfTeamMembers - 1;
    
    if (newMemberCount >= 1) {
      // Remove last member
      const updatedMembers = currentMembers.slice(0, -1);
      form.setValue('teamMembers', updatedMembers);
      form.setValue('numberOfTeamMembers', newMemberCount);
    }
  };

  return (
    <div className="space-y-8">
      {/* Personal Information Section */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number *</FormLabel>
                <FormControl>
                  <PhoneInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter phone number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currentCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current City *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter current city" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter state" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pinCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pin Code *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter pin code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="permanentAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Permanent Address *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter permanent address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Academic Information Section */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">Academic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="institutionName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Institution Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter institution name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="courseProgram"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course/Program *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter course or program" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currentYearOfStudy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Year of Study *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter current year" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expectedGraduation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Graduation *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter expected graduation" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Team Information Section */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Team Information</h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveTeamMember}
              disabled={numberOfTeamMembers <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600">
              {numberOfTeamMembers} member{numberOfTeamMembers !== 1 ? 's' : ''}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTeamMember}
              disabled={numberOfTeamMembers >= 5}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Team Members */}
        <div className="space-y-6">
          {Array.from({ length: numberOfTeamMembers - 1 }, (_, index) => (
            <YffTeamMemberFields
              key={index}
              form={form}
              memberIndex={index}
            />
          ))}
        </div>
      </div>

      {/* Venture Information Section (Optional) */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">Venture Information (Optional)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="ventureName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venture Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter venture name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industrySector"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry Sector</FormLabel>
                <FormControl>
                  <Input placeholder="Enter industry sector" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="teamName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter team name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="Enter website URL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="linkedinProfile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LinkedIn Profile</FormLabel>
                <FormControl>
                  <Input placeholder="Enter LinkedIn profile URL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="socialMediaHandles"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Social Media Handles</FormLabel>
                <FormControl>
                  <Input placeholder="Enter social media handles" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-6">
          <FormField
            control={form.control}
            name="referralId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referral ID</FormLabel>
                <FormControl>
                  <Input placeholder="Enter referral ID if you have one" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};
