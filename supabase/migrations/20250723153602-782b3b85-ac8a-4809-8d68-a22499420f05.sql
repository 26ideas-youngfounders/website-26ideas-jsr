-- ============================================================================
-- ADD AMBASSADOR AND PROGRAM TRACKING ATTRIBUTES TO INDIVIDUALS TABLE
-- ============================================================================
-- Supporting multi-role Young Founder participation scenarios
-- ============================================================================

-- Ambassador-specific fields
ALTER TABLE public.individuals 
ADD COLUMN ambassador_region VARCHAR(100),
ADD COLUMN ambassador_university VARCHAR(200),
ADD COLUMN ambassador_performance_score INTEGER DEFAULT 0;

-- Program participation summary
ALTER TABLE public.individuals 
ADD COLUMN active_programs TEXT[] DEFAULT '{}',
ADD COLUMN program_completion_rate INTEGER DEFAULT 0;

-- Add constraints for data integrity
ALTER TABLE public.individuals 
ADD CONSTRAINT check_ambassador_performance_score CHECK (ambassador_performance_score >= 0 AND ambassador_performance_score <= 100),
ADD CONSTRAINT check_program_completion_rate CHECK (program_completion_rate >= 0 AND program_completion_rate <= 100);

-- Create indexes for performance on ambassador and program fields
CREATE INDEX idx_individuals_ambassador_region ON public.individuals(ambassador_region);
CREATE INDEX idx_individuals_ambassador_university ON public.individuals(ambassador_university);
CREATE INDEX idx_individuals_ambassador_performance_score ON public.individuals(ambassador_performance_score);
CREATE INDEX idx_individuals_active_programs ON public.individuals USING GIN(active_programs);
CREATE INDEX idx_individuals_program_completion_rate ON public.individuals(program_completion_rate);