
-- Add ai_feedback column to existing yff_applications table
ALTER TABLE public.yff_applications 
ADD COLUMN IF NOT EXISTS ai_feedback JSONB DEFAULT '{}';

-- Update the table comment to reflect the new column
COMMENT ON COLUMN public.yff_applications.ai_feedback IS 'Stores AI feedback for each questionnaire answer';
