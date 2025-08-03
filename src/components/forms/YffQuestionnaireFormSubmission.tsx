
/**
 * @fileoverview YFF Questionnaire Form Submission Handler
 * 
 * Handles form submission with automatic AI evaluation trigger
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { submitApplicationWithAutoEvaluation } from '@/services/yff-auto-evaluation-service';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface YffQuestionnaireFormSubmissionProps {
  formData: Record<string, any>;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  onSubmissionSuccess: () => void;
}

export const YffQuestionnaireFormSubmission: React.FC<YffQuestionnaireFormSubmissionProps> = ({
  formData,
  isSubmitting,
  setIsSubmitting,
  onSubmissionSuccess
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit your application",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🚀 Starting application submission with auto-evaluation...');
      
      const result = await submitApplicationWithAutoEvaluation(user.id, formData);

      if (result.success) {
        toast({
          title: "Application Submitted Successfully!",
          description: "Your application has been submitted and is being automatically evaluated. You will receive updates via email.",
        });

        console.log(`✅ Application submitted successfully: ${result.applicationId}`);
        onSubmissionSuccess();
      } else {
        throw new Error(result.error || 'Submission failed');
      }
      
    } catch (error) {
      console.error('❌ Application submission error:', error);
      
      toast({
        title: "Submission Failed",
        description: (error as Error).message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      onClick={handleSubmit}
      disabled={isSubmitting}
      className="w-full py-3 text-lg font-semibold"
      size="lg"
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Submitting & AI Evaluating...
        </>
      ) : (
        "Submit Application"
      )}
    </Button>
  );
};
