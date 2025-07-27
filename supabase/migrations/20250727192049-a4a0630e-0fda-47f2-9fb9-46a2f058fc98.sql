
-- Add typeform_registered column to individuals table to track per-user registration state
ALTER TABLE public.individuals 
ADD COLUMN typeform_registered boolean NOT NULL DEFAULT false;

-- Add updated_at trigger for individuals table if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_individuals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at when typeform_registered changes
DROP TRIGGER IF EXISTS update_individuals_updated_at_trigger ON public.individuals;
CREATE TRIGGER update_individuals_updated_at_trigger
    BEFORE UPDATE ON public.individuals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_individuals_updated_at();
