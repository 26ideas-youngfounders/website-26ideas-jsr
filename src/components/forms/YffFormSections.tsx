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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { YffFormData } from '@/types/yff-form';

interface FormSectionProps {
  formData: YffFormData;
  onFieldChange: (field: keyof YffFormData, value: string) => void;
}

/**
 * Personal Information Section (Step 1)
 */
const PersonalInfoSection: React.FC<FormSectionProps> = ({ formData, onFieldChange }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="firstName">First Name *</Label>
        <Input
          id="firstName"
          value={formData.firstName}
          onChange={(e) => onFieldChange('firstName', e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="lastName">Last Name *</Label>
        <Input
          id="lastName"
          value={formData.lastName}
          onChange={(e) => onFieldChange('lastName', e.target.value)}
          required
        />
      </div>
    </div>

    <div>
      <Label htmlFor="email">Email Address *</Label>
      <Input
        id="email"
        type="email"
        value={formData.email}
        onChange={(e) => onFieldChange('email', e.target.value)}
        required
      />
    </div>

    <div>
      <Label htmlFor="phone">Phone Number *</Label>
      <Input
        id="phone"
        value={formData.phone}
        onChange={(e) => onFieldChange('phone', e.target.value)}
        required
      />
    </div>

    <div>
      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
      <Input
        id="dateOfBirth"
        type="date"
        value={formData.dateOfBirth}
        onChange={(e) => onFieldChange('dateOfBirth', e.target.value)}
        required
      />
    </div>

    <div>
      <Label htmlFor="nationality">Nationality *</Label>
      <Input
        id="nationality"
        value={formData.nationality}
        onChange={(e) => onFieldChange('nationality', e.target.value)}
        required
      />
    </div>
  </div>
);

/**
 * Application Questions Section (Step 2)
 */
const ApplicationQuestionsSection: React.FC<FormSectionProps> = ({ formData, onFieldChange }) => (
  <div className="space-y-6">
    <div>
      <Label htmlFor="whyApplying">Why do you want to join Young Founders Floor? *</Label>
      <Textarea
        id="whyApplying"
        value={formData.whyApplying}
        onChange={(e) => onFieldChange('whyApplying', e.target.value)}
        placeholder="Explain your motivation for joining YFF and what you hope to achieve"
        rows={4}
        required
      />
    </div>

    <div>
      <Label htmlFor="businessIdea">Describe your business idea or the problem you want to solve *</Label>
      <Textarea
        id="businessIdea"
        value={formData.businessIdea}
        onChange={(e) => onFieldChange('businessIdea', e.target.value)}
        placeholder="Provide a clear description of your business idea and the problem it addresses"
        rows={4}
        required
      />
    </div>

    <div>
      <Label htmlFor="experience">Describe your relevant experience *</Label>
      <Textarea
        id="experience"
        value={formData.experience}
        onChange={(e) => onFieldChange('experience', e.target.value)}
        placeholder="Share any entrepreneurial, professional, or academic experience relevant to your application"
        rows={4}
        required
      />
    </div>
  </div>
);

/**
 * Goals and Commitment Section (Step 3)
 */
const GoalsCommitmentSection: React.FC<FormSectionProps> = ({ formData, onFieldChange }) => (
  <div className="space-y-6">
    <div>
      <Label htmlFor="challenges">What challenges do you expect to face, and how will you overcome them? *</Label>
      <Textarea
        id="challenges"
        value={formData.challenges}
        onChange={(e) => onFieldChange('challenges', e.target.value)}
        placeholder="Describe potential challenges and your strategies to address them"
        rows={4}
        required
      />
    </div>

    <div>
      <Label htmlFor="goals">What are your goals for the next 12 months? *</Label>
      <Textarea
        id="goals"
        value={formData.goals}
        onChange={(e) => onFieldChange('goals', e.target.value)}
        placeholder="Describe your personal and professional goals for the coming year"
        rows={4}
        required
      />
    </div>

    <div>
      <Label htmlFor="commitment">How much time can you commit to YFF activities weekly? *</Label>
      <RadioGroup 
        value={formData.commitment} 
        onValueChange={(value) => onFieldChange('commitment', value)}
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
  </div>
);

/**
 * Main YFF Form Sections Component
 */
interface YffFormSectionsProps {
  currentStep: number;
  formData: YffFormData;
  onFieldChange: (field: keyof YffFormData, value: string) => void;
}

export const YffFormSections: React.FC<YffFormSectionsProps> = ({
  currentStep,
  formData,
  onFieldChange,
}) => {
  const renderCurrentSection = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoSection formData={formData} onFieldChange={onFieldChange} />;
      case 2:
        return <ApplicationQuestionsSection formData={formData} onFieldChange={onFieldChange} />;
      case 3:
        return <GoalsCommitmentSection formData={formData} onFieldChange={onFieldChange} />;
      default:
        return <PersonalInfoSection formData={formData} onFieldChange={onFieldChange} />;
    }
  };

  const getSectionTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Personal Information';
      case 2:
        return 'Application Questions';
      case 3:
        return 'Goals & Commitment';
      default:
        return 'Personal Information';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getSectionTitle()}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderCurrentSection()}
      </CardContent>
    </Card>
  );
};

export default YffFormSections;
