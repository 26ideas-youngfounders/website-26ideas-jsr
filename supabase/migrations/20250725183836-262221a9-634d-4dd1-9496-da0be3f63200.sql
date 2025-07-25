
-- Create table for YFF team leader registrations
CREATE TABLE public.yff_team_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  individual_id UUID NOT NULL REFERENCES public.individuals(individual_id) ON DELETE CASCADE,
  
  -- Team Leader Personal Information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  linkedin_profile TEXT,
  phone_number TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT '+91',
  date_of_birth DATE NOT NULL,
  social_media_handles TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
  
  -- Educational Information
  institution_name TEXT NOT NULL,
  course_program TEXT NOT NULL,
  current_year_of_study TEXT NOT NULL,
  expected_graduation TEXT NOT NULL,
  
  -- Location Information
  current_city TEXT NOT NULL,
  state TEXT NOT NULL,
  pin_code TEXT NOT NULL,
  permanent_address TEXT NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one registration per user
  UNIQUE(individual_id)
);

-- Enable RLS
ALTER TABLE public.yff_team_registrations ENABLE ROW LEVEL SECURITY;

-- Users can view their own registrations
CREATE POLICY "Users can view their own registrations" 
  ON public.yff_team_registrations 
  FOR SELECT 
  USING (individual_id = auth.uid());

-- Users can insert their own registration (only once due to unique constraint)
CREATE POLICY "Users can create their own registration" 
  ON public.yff_team_registrations 
  FOR INSERT 
  WITH CHECK (individual_id = auth.uid());

-- Admins can view all registrations
CREATE POLICY "Admins can view all registrations" 
  ON public.yff_team_registrations 
  FOR SELECT 
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'yff_admin'::app_role)
  );

-- Create index for better performance
CREATE INDEX idx_yff_team_registrations_individual_id 
ON public.yff_team_registrations(individual_id);

-- Add trigger for updated_at
CREATE TRIGGER update_yff_team_registrations_updated_at
  BEFORE UPDATE ON public.yff_team_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
