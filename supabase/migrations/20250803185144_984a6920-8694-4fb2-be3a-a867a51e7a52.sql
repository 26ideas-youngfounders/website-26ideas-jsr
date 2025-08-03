
-- Add evaluation columns to existing yff_applications table
ALTER TABLE yff_applications ADD COLUMN IF NOT EXISTS evaluation_data JSONB DEFAULT '{}';
ALTER TABLE yff_applications ADD COLUMN IF NOT EXISTS overall_score DECIMAL(3,1) DEFAULT 0.0;
ALTER TABLE yff_applications ADD COLUMN IF NOT EXISTS evaluation_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE yff_applications ADD COLUMN IF NOT EXISTS evaluation_completed_at TIMESTAMP;

-- Create separate yff_evaluations table for detailed evaluation storage
CREATE TABLE IF NOT EXISTS yff_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES yff_applications(application_id),
  question_scores JSONB DEFAULT '{}',
  overall_score DECIMAL(3,1) DEFAULT 0.0,
  idea_summary TEXT,
  evaluation_metadata JSONB DEFAULT '{}',
  evaluation_completed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_yff_evaluations_application_id ON yff_evaluations(application_id);
CREATE INDEX IF NOT EXISTS idx_yff_applications_evaluation_status ON yff_applications(evaluation_status);
CREATE INDEX IF NOT EXISTS idx_yff_applications_overall_score ON yff_applications(overall_score);

-- Add RLS policies for evaluations (admin only access)
ALTER TABLE yff_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all evaluations" ON yff_evaluations
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'yff_admin'::app_role)
  );

CREATE POLICY "Admins can insert evaluations" ON yff_evaluations
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'yff_admin'::app_role)
  );

CREATE POLICY "Admins can update evaluations" ON yff_evaluations
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'yff_admin'::app_role)
  );
