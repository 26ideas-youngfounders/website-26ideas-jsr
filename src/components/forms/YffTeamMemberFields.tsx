
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

// TeamMember interface with optional fields to match form schema for autosave support
export interface TeamMember {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  countryCode?: string;
  dateOfBirth?: string;
  currentCity?: string;
  state?: string;
  pinCode?: string;
  permanentAddress?: string;
  gender?: string;
  institutionName?: string;
  courseProgram?: string;
  currentYearOfStudy?: string;
  expectedGraduation?: string;
  linkedinProfile?: string;
}

// FormValues interface with optional fields to match the actual form schema
export interface FormValues {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  countryCode?: string;
  dateOfBirth?: string;
  currentCity?: string;
  state?: string;
  pinCode?: string;
  permanentAddress?: string;
  gender?: string;
  institutionName?: string;
  courseProgram?: string;
  currentYearOfStudy?: string;
  expectedGraduation?: string;
  numberOfTeamMembers?: number;
  teamMembers?: TeamMember[];
  ventureName?: string;
  industrySector?: string;
  teamName?: string;
  website?: string;
  linkedinProfile?: string;
  socialMediaHandles?: string;
  referralId?: string;
}

interface YffTeamMemberFieldsProps {
  form: UseFormReturn<FormValues>;
  memberIndex: number;
}

/**
 * Component for rendering team member form fields
 * Handles individual team member information collection
 */
export const YffTeamMemberFields: React.FC<YffTeamMemberFieldsProps> = ({
  form,
  memberIndex,
}) => {
  const memberNumber = memberIndex + 1;

  return (
    <div className="space-y-6 p-6 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold text-gray-900">
        Team Member {memberNumber}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name={`teamMembers.${memberIndex}.fullName`}
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
          name={`teamMembers.${memberIndex}.email`}
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
          name={`teamMembers.${memberIndex}.phoneNumber`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number *</FormLabel>
              <FormControl>
                <PhoneInput
                  value={field.value || ''}
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
          name={`teamMembers.${memberIndex}.dateOfBirth`}
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
          name={`teamMembers.${memberIndex}.currentCity`}
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
          name={`teamMembers.${memberIndex}.state`}
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
          name={`teamMembers.${memberIndex}.pinCode`}
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
          name={`teamMembers.${memberIndex}.permanentAddress`}
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
          name={`teamMembers.${memberIndex}.gender`}
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

        <FormField
          control={form.control}
          name={`teamMembers.${memberIndex}.institutionName`}
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
          name={`teamMembers.${memberIndex}.courseProgram`}
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
          name={`teamMembers.${memberIndex}.currentYearOfStudy`}
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
          name={`teamMembers.${memberIndex}.expectedGraduation`}
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

        <FormField
          control={form.control}
          name={`teamMembers.${memberIndex}.linkedinProfile`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>LinkedIn Profile (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter LinkedIn profile URL" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
