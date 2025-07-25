
-- Add questionnaire fields to the existing yff_team_registrations table
ALTER TABLE yff_team_registrations 
ADD COLUMN questionnaire_answers jsonb DEFAULT '{}'::jsonb,
ADD COLUMN application_status text DEFAULT 'registration_completed',
ADD COLUMN questionnaire_completed_at timestamp with time zone;

-- Create an index on application_status for better query performance
CREATE INDEX IF NOT EXISTS idx_yff_team_registrations_status ON yff_team_registrations(application_status);

-- Update RLS policies to allow users to update their own questionnaire answers
DROP POLICY IF EXISTS "Users can update their own questionnaire answers" ON yff_team_registrations;
CREATE POLICY "Users can update their own questionnaire answers" 
  ON yff_team_registrations 
  FOR UPDATE 
  USING (individual_id = auth.uid());
