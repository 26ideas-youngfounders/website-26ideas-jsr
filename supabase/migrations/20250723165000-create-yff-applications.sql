
-- Create YFF Applications table for Young Founders Floor competition
CREATE TABLE public.yff_applications (
  application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID NOT NULL REFERENCES public.individuals(individual_id),
  status VARCHAR(50) DEFAULT 'draft' NOT NULL,
  application_round VARCHAR(50) DEFAULT 'Round 1' NOT NULL,
  answers JSONB DEFAULT '{}' NOT NULL,
  ai_feedback JSONB DEFAULT '{}',
  overall_score INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure one application per individual per round
  UNIQUE(individual_id, application_round)
);

-- Add indexes for performance
CREATE INDEX idx_yff_applications_individual ON public.yff_applications(individual_id);
CREATE INDEX idx_yff_applications_status ON public.yff_applications(status);
CREATE INDEX idx_yff_applications_round ON public.yff_applications(application_round);

-- Enable Row Level Security
ALTER TABLE public.yff_applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own applications" ON public.yff_applications
  FOR SELECT USING (individual_id = public.get_user_individual_id());

CREATE POLICY "Users can create their own applications" ON public.yff_applications
  FOR INSERT WITH CHECK (individual_id = public.get_user_individual_id());

CREATE POLICY "Users can update their own applications" ON public.yff_applications
  FOR UPDATE USING (individual_id = public.get_user_individual_id());

CREATE POLICY "Admins can manage all applications" ON public.yff_applications
  FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'moderator'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_yff_applications_updated_at
  BEFORE UPDATE ON public.yff_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
