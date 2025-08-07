
-- Add application_id foreign key constraint to yff_team_registrations if it doesn't exist
ALTER TABLE public.yff_team_registrations 
ADD CONSTRAINT IF NOT EXISTS yff_team_registrations_application_id_fkey 
FOREIGN KEY (application_id) 
REFERENCES public.yff_applications(application_id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_yff_team_registrations_application_id 
ON public.yff_team_registrations(application_id);
