
/**
 * @fileoverview YFF Form Section Components
 * 
 * Extracted form sections for better maintainability and reusability.
 * Each section handles specific parts of the YFF application form.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

/**
 * Form Data Interface - imported type
 */
export interface YffFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  currentLocation: string;
  currentEducation: string;
  institution: string;
  fieldOfStudy: string;
  graduationYear: string;
  hasStartupExperience: string;
  startupDetails: string;
  businessIdea: string;
  problemSolving: string;
  targetMarket: string;
  whyYFF: string;
  goals: string;
  contribution: string;
  skills: string;
  achievements: string;
  references: string;
  timeCommitment: string;
  availability: string;
  additionalInfo: string;
}

interface FormSectionProps {
  formData: YffFormData;
  handleInputChange: (field: keyof YffFormData, value: string) => void;
}

/**
 * Form sections configuration for step-by-step navigation
 */
export const formSections = [
  { id: 'personal', title: 'Personal Information', fields: 7 },
  { id: 'education', title: 'Educational Background', fields: 4 },
  { id: 'entrepreneurial', title: 'Entrepreneurial Experience', fields: 5 },
  { id: 'motivation', title: 'Motivation & Goals', fields: 3 },
  { id: 'additional', title: 'Additional Information', fields: 3 },
  { id: 'commitment', title: 'Commitment & Availability', fields: 3 },
];

/**
 * Render Entrepreneurial Experience Section
 */
export const renderEntrepreneurialSection = ({ formData, handleInputChange }: FormSectionProps) => (
  <div className="space-y-6">
    <div>
      <Label htmlFor="hasStartupExperience">Do you have any startup or entrepreneurial experience?</Label>
      <RadioGroup 
        value={formData.hasStartupExperience} 
        onValueChange={(value) => handleInputChange('hasStartupExperience', value)}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="yes" id="startup-yes" />
          <Label htmlFor="startup-yes">Yes, I have startup experience</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="some" id="startup-some" />
          <Label htmlFor="startup-some">Some experience (side projects, freelancing)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="no" id="startup-no" />
          <Label htmlFor="startup-no">No, this would be my first venture</Label>
        </div>
      </RadioGroup>
    </div>

    {formData.hasStartupExperience !== 'no' && (
      <div>
        <Label htmlFor="startupDetails">Please describe your entrepreneurial experience</Label>
        <Textarea
          id="startupDetails"
          value={formData.startupDetails}
          onChange={(e) => handleInputChange('startupDetails', e.target.value)}
          placeholder="Describe any startups, side projects, or entrepreneurial activities you've been involved in"
          rows={4}
        />
      </div>
    )}

    <div>
      <Label htmlFor="businessIdea">Describe your business idea or the problem you want to solve *</Label>
      <Textarea
        id="businessIdea"
        value={formData.businessIdea}
        onChange={(e) => handleInputChange('businessIdea', e.target.value)}
        placeholder="Provide a clear description of your business idea and the problem it addresses"
        rows={4}
        required
      />
    </div>

    <div>
      <Label htmlFor="problemSolving">How does your solution address this problem uniquely? *</Label>
      <Textarea
        id="problemSolving"
        value={formData.problemSolving}
        onChange={(e) => handleInputChange('problemSolving', e.target.value)}
        placeholder="Explain what makes your approach unique and how it solves the problem better than existing solutions"
        rows={4}
        required
      />
    </div>

    <div>
      <Label htmlFor="targetMarket">Who is your target market?</Label>
      <Textarea
        id="targetMarket"
        value={formData.targetMarket}
        onChange={(e) => handleInputChange('targetMarket', e.target.value)}
        placeholder="Describe your target customers and market size"
        rows={3}
      />
    </div>
  </div>
);

/**
 * Render Motivation and Goals Section
 */
export const renderMotivationSection = ({ formData, handleInputChange }: FormSectionProps) => (
  <div className="space-y-6">
    <div>
      <Label htmlFor="whyYFF">Why do you want to join Young Founders Floor? *</Label>
      <Textarea
        id="whyYFF"
        value={formData.whyYFF}
        onChange={(e) => handleInputChange('whyYFF', e.target.value)}
        placeholder="Explain your motivation for joining YFF and what you hope to achieve"
        rows={4}
        required
      />
    </div>

    <div>
      <Label htmlFor="goals">What are your goals for the next 12 months? *</Label>
      <Textarea
        id="goals"
        value={formData.goals}
        onChange={(e) => handleInputChange('goals', e.target.value)}
        placeholder="Describe your personal and professional goals for the coming year"
        rows={4}
        required
      />
    </div>

    <div>
      <Label htmlFor="contribution">How can you contribute to the YFF community?</Label>
      <Textarea
        id="contribution"
        value={formData.contribution}
        onChange={(e) => handleInputChange('contribution', e.target.value)}
        placeholder="Describe how you can add value to the YFF community and help other members"
        rows={4}
      />
    </div>
  </div>
);

/**
 * Render Additional Information Section
 */
export const renderAdditionalSection = ({ formData, handleInputChange }: FormSectionProps) => (
  <div className="space-y-6">
    <div>
      <Label htmlFor="skills">Key Skills and Expertise</Label>
      <Textarea
        id="skills"
        value={formData.skills}
        onChange={(e) => handleInputChange('skills', e.target.value)}
        placeholder="List your key skills, technical expertise, and areas of knowledge"
        rows={3}
      />
    </div>

    <div>
      <Label htmlFor="achievements">Notable Achievements</Label>
      <Textarea
        id="achievements"
        value={formData.achievements}
        onChange={(e) => handleInputChange('achievements', e.target.value)}
        placeholder="Describe any awards, recognitions, or significant accomplishments"
        rows={3}
      />
    </div>

    <div>
      <Label htmlFor="references">References (Optional)</Label>
      <Textarea
        id="references"
        value={formData.references}
        onChange={(e) => handleInputChange('references', e.target.value)}
        placeholder="Provide contact information for professional or academic references"
        rows={3}
      />
    </div>
  </div>
);

/**
 * Render Commitment and Availability Section
 */
export const renderCommitmentSection = ({ formData, handleInputChange }: FormSectionProps) => (
  <div className="space-y-6">
    <div>
      <Label htmlFor="timeCommitment">How much time can you commit to YFF activities weekly?</Label>
      <RadioGroup 
        value={formData.timeCommitment} 
        onValueChange={(value) => handleInputChange('timeCommitment', value)}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="2-5 hours" id="time-light" />
          <Label htmlFor="time-light">2-5 hours per week</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="5-10 hours" id="time-moderate" />
          <Label htmlFor="time-moderate">5-10 hours per week</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="10+ hours" id="time-high" />
          <Label htmlFor="time-high">10+ hours per week</Label>
        </div>
      </RadioGroup>
    </div>

    <div>
      <Label htmlFor="availability">When are you typically available for YFF activities?</Label>
      <Textarea
        id="availability"
        value={formData.availability}
        onChange={(e) => handleInputChange('availability', e.target.value)}
        placeholder="Describe your typical availability (e.g., weekends, evenings, specific days)"
        rows={3}
      />
    </div>

    <div>
      <Label htmlFor="additionalInfo">Any additional information you'd like to share?</Label>
      <Textarea
        id="additionalInfo"
        value={formData.additionalInfo}
        onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
        placeholder="Share anything else you think would be relevant for your application"
        rows={3}
      />
    </div>
  </div>
);
