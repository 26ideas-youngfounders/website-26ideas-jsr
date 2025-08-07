
/**
 * @fileoverview Application Scoring Dialog Component
 * 
 * Provides interface for scoring YFF applications with 1-10 scale
 * across 5 key criteria with automatic average calculation.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Star, Save } from 'lucide-react';

interface ApplicationScoringDialogProps {
  application: {
    application_id: string;
    answers: Record<string, any>;
    cumulative_score: number;
    individuals: {
      first_name: string;
      last_name: string;
    };
  };
}

interface ScoringCriteria {
  key: string;
  label: string;
  description: string;
  answerKey: string;
}

const scoringCriteria: ScoringCriteria[] = [
  {
    key: 'motivation',
    label: 'Motivation & Alignment',
    description: 'Clarity of purpose and alignment with YFF goals',
    answerKey: 'whyApplying'
  },
  {
    key: 'businessIdea',
    label: 'Business Idea',
    description: 'Innovation, feasibility, and market potential',
    answerKey: 'businessIdea'
  },
  {
    key: 'experience',
    label: 'Experience & Skills',
    description: 'Relevant background and capabilities',
    answerKey: 'experience'
  },
  {
    key: 'problemSolving',
    label: 'Problem-Solving',
    description: 'Realistic assessment and solution approach',
    answerKey: 'challenges'
  },
  {
    key: 'goals',
    label: 'Goals & Vision',
    description: 'Clear vision and actionable objectives',
    answerKey: 'goals'
  }
];

const ApplicationScoringDialog: React.FC<ApplicationScoringDialogProps> = ({ application }) => {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize scores from existing data
  useEffect(() => {
    // Initialize with existing scores or default to 5
    const initialScores: Record<string, number> = {};
    scoringCriteria.forEach(criteria => {
      initialScores[criteria.key] = 5; // Default score
    });
    setScores(initialScores);
  }, [application]);

  // Calculate average score
  const averageScore = Object.values(scores).length > 0 
    ? Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.values(scores).length
    : 0;

  // Save scores mutation
  const saveScoresMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('yff_applications')
        .update({
          reviewer_scores: scores,
          cumulative_score: Math.round(averageScore),
          status: 'under_review' // Update status when scores are added
        })
        .eq('application_id', application.application_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yff-applications'] });
      toast({
        title: "Success",
        description: "Application scores saved successfully",
      });
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save scores",
        variant: "destructive",
      });
      console.error('Error saving scores:', error);
    },
  });

  const handleScoreChange = (criteriaKey: string, value: number[]) => {
    setScores(prev => ({
      ...prev,
      [criteriaKey]: value[0]
    }));
  };

  const handleSave = () => {
    saveScoresMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Star className="h-4 w-4 mr-1" />
          Score
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Score Application - {application.individuals.first_name} {application.individuals.last_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Average Score */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Current Average Score</h3>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">{averageScore.toFixed(1)}/10</span>
              </div>
            </div>
          </div>

          {/* Scoring Criteria */}
          <div className="space-y-6">
            {scoringCriteria.map((criteria) => (
              <div key={criteria.key} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Scoring Section */}
                  <div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-base font-semibold">{criteria.label}</Label>
                        <p className="text-sm text-muted-foreground">{criteria.description}</p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Score (1-10)</Label>
                          <span className="text-lg font-bold">{scores[criteria.key] || 5}</span>
                        </div>
                        
                        <Slider
                          value={[scores[criteria.key] || 5]}
                          onValueChange={(value) => handleScoreChange(criteria.key, value)}
                          max={10}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>1 - Poor</span>
                          <span>5 - Average</span>
                          <span>10 - Excellent</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Answer Display */}
                  <div>
                    <Label className="text-sm font-medium">Applicant's Answer:</Label>
                    <div className="mt-2 p-3 bg-gray-50 rounded text-sm max-h-32 overflow-y-auto">
                      {application.answers[criteria.answerKey] || 'No answer provided'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reviewer Notes */}
          <div>
            <Label htmlFor="reviewerNotes" className="text-base font-semibold">
              Reviewer Notes (Optional)
            </Label>
            <Textarea
              id="reviewerNotes"
              placeholder="Add any additional comments about this application..."
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveScoresMutation.isPending}
            >
              <Save className="h-4 w-4 mr-1" />
              {saveScoresMutation.isPending ? 'Saving...' : 'Save Scores'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationScoringDialog;
export { ApplicationScoringDialog };
