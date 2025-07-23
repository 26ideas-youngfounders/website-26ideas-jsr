
-- Add unique constraint for individual_id and application_round combination
ALTER TABLE public.yff_applications 
ADD CONSTRAINT unique_individual_application_round 
UNIQUE (individual_id, application_round);

-- Add index for better performance on the constraint
CREATE INDEX IF NOT EXISTS idx_yff_applications_individual_round 
ON public.yff_applications(individual_id, application_round);
