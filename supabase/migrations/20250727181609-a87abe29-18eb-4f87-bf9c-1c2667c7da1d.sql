
-- Add missing fields to individuals table
ALTER TABLE public.individuals 
ADD COLUMN phone_number text,
ADD COLUMN date_of_birth date;

-- Enable real-time for yff_team_registrations table
ALTER TABLE public.yff_team_registrations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.yff_team_registrations;

-- Enable real-time for yff_applications table  
ALTER TABLE public.yff_applications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.yff_applications;

-- Create indexes for better performance on admin queries
CREATE INDEX IF NOT EXISTS idx_yff_team_registrations_status ON public.yff_team_registrations(application_status);
CREATE INDEX IF NOT EXISTS idx_yff_team_registrations_created_at ON public.yff_team_registrations(created_at);
CREATE INDEX IF NOT EXISTS idx_yff_applications_status ON public.yff_applications(status);
CREATE INDEX IF NOT EXISTS idx_yff_applications_submitted_at ON public.yff_applications(submitted_at);
