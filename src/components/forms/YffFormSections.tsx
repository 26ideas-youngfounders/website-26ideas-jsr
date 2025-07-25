
/**
 * @fileoverview YFF Form Section Components
 * 
 * Extracted form sections for better maintainability and reusability.
 * Each section handles specific parts of the YFF application form.
 * 
 * @version 1.4.0 - Fixed type consistency for required fields
 * @author 26ideas Development Team
 */

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WordCounter } from '@/components/ui/word-counter';

/**
 * Interface for questionnaire form data - ALL FIELDS ARE REQUIRED
 * WARNING: Keep this interface in sync with QuestionnaireFormData in YffQuestionnaireForm.tsx
 * If you make any field optional here, you must also update the parent form and default values.
 */
interface QuestionnaireFormData {
  whyApplying: string;
  businessIdea: string;
  experience: string;
  challenges: string;
  goals: string;
  commitment: string;
}

/**
 * Props interface for YffFormSections
 */
interface YffFormSectionsProps {
  form: UseFormReturn<QuestionnaireFormData>;
}

/**
 * Main YFF Form Sections Component
 * Handles all questionnaire form sections with proper form integration
 * NOTE: All fields are REQUIRED - form defaults must provide string values
 */
export const YffFormSections: React.FC<YffFormSectionsProps> = ({ form }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Application Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            control={form.control}
            name="whyApplying"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Why are you applying to YFF? *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Explain your motivation for joining YFF and what you hope to achieve..."
                    rows={4}
                    className="resize-none"
                  />
                </FormControl>
                <WordCounter text={field.value} maxWords={300} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="businessIdea"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Describe your business idea or the problem you want to solve *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Provide a clear description of your business idea and the problem it addresses..."
                    rows={4}
                    className="resize-none"
                  />
                </FormControl>
                <WordCounter text={field.value} maxWords={300} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="experience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Describe your relevant experience *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Share any entrepreneurial, professional, or academic experience relevant to your application..."
                    rows={4}
                    className="resize-none"
                  />
                </FormControl>
                <WordCounter text={field.value} maxWords={300} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="challenges"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What challenges do you expect to face, and how will you overcome them? *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Describe potential challenges and your strategies to address them..."
                    rows={4}
                    className="resize-none"
                  />
                </FormControl>
                <WordCounter text={field.value} maxWords={300} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="goals"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What are your goals for the next 12 months? *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Describe your personal and professional goals for the coming year..."
                    rows={4}
                    className="resize-none"
                  />
                </FormControl>
                <WordCounter text={field.value} maxWords={300} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="commitment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How will you commit to the YFF program? *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Describe your commitment level and availability for YFF activities..."
                    rows={4}
                    className="resize-none"
                  />
                </FormControl>
                <WordCounter text={field.value} maxWords={300} />
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default YffFormSections;
