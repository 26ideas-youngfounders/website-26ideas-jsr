
-- Add foreign key constraint between mentor_applications and individuals tables
ALTER TABLE public.mentor_applications 
ADD CONSTRAINT fk_mentor_applications_individual_id 
FOREIGN KEY (individual_id) REFERENCES public.individuals(individual_id) 
ON DELETE CASCADE;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_mentor_applications_individual_id 
ON public.mentor_applications(individual_id);
