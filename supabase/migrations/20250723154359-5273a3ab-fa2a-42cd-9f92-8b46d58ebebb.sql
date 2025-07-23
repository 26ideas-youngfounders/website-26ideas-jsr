-- ============================================================================
-- COMPLETE MULTI-ROLE YOUNG FOUNDER SCHEMA IMPLEMENTATION
-- ============================================================================
-- Supporting simultaneous participation in courses, ambassador roles, competitions, and chapters
-- ============================================================================

-- 1. Enhance app_role enum with new roles
ALTER TYPE public.app_role ADD VALUE 'campus_ambassador';
ALTER TYPE public.app_role ADD VALUE 'program_participant';

-- 2. Enhance user_roles table with role-specific metadata
ALTER TABLE public.user_roles 
ADD COLUMN role_metadata JSONB DEFAULT '{}',
ADD COLUMN assignment_details JSONB DEFAULT '{}';

-- 3. Create programs table (MEDIUM PRIORITY)
CREATE TABLE public.programs (
  program_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  program_type VARCHAR(50) NOT NULL, -- 'course', 'competition', 'ambassador', 'mentorship'
  description TEXT,
  age_requirements JSONB DEFAULT '{"min_age": 18, "max_age": 27}',
  eligibility_criteria JSONB DEFAULT '{}',
  duration_months INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Create ambassador_assignments table (HIGH PRIORITY)
CREATE TABLE public.ambassador_assignments (
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID NOT NULL REFERENCES public.individuals(individual_id),
  campus_name VARCHAR(200) NOT NULL,
  university_id UUID, -- Optional link to university/institution
  region VARCHAR(100),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assignment_end_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
  responsibilities TEXT[],
  target_metrics JSONB DEFAULT '{}',
  performance_data JSONB DEFAULT '{}',
  mentor_id UUID REFERENCES public.individuals(individual_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Create program_enrollments table (MEDIUM PRIORITY)
CREATE TABLE public.program_enrollments (
  enrollment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID NOT NULL REFERENCES public.individuals(individual_id),
  program_id UUID NOT NULL REFERENCES public.programs(program_id),
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status VARCHAR(50) DEFAULT 'enrolled', -- enrolled, active, completed, dropped
  completion_date TIMESTAMP WITH TIME ZONE,
  completion_percentage INTEGER DEFAULT 0,
  achievements JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Create ambassador_activities table (LOW PRIORITY)
CREATE TABLE public.ambassador_activities (
  activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES public.ambassador_assignments(assignment_id),
  activity_type VARCHAR(100) NOT NULL, -- 'event_organized', 'student_recruited', 'workshop_conducted'
  activity_date DATE NOT NULL,
  participants_count INTEGER DEFAULT 0,
  impact_metrics JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Add constraints for data integrity
ALTER TABLE public.programs 
ADD CONSTRAINT check_duration_months CHECK (duration_months > 0);

ALTER TABLE public.program_enrollments 
ADD CONSTRAINT check_completion_percentage CHECK (completion_percentage >= 0 AND completion_percentage <= 100);

ALTER TABLE public.ambassador_activities 
ADD CONSTRAINT check_participants_count CHECK (participants_count >= 0);

-- Add Young Founder age validation constraint
ALTER TABLE public.individuals 
ADD CONSTRAINT check_young_founder_age 
CHECK (
  dob IS NULL OR 
  (EXTRACT(YEAR FROM AGE(dob)) >= 18 AND EXTRACT(YEAR FROM AGE(dob)) <= 27) OR
  is_founder = false
);

-- 8. Create indexes for performance
CREATE INDEX idx_programs_type ON public.programs(program_type);
CREATE INDEX idx_programs_active ON public.programs(is_active);
CREATE INDEX idx_ambassador_assignments_individual ON public.ambassador_assignments(individual_id);
CREATE INDEX idx_ambassador_assignments_status ON public.ambassador_assignments(status);
CREATE INDEX idx_ambassador_assignments_region ON public.ambassador_assignments(region);
CREATE INDEX idx_program_enrollments_individual ON public.program_enrollments(individual_id);
CREATE INDEX idx_program_enrollments_program ON public.program_enrollments(program_id);
CREATE INDEX idx_program_enrollments_status ON public.program_enrollments(status);
CREATE INDEX idx_ambassador_activities_ambassador ON public.ambassador_activities(ambassador_id);
CREATE INDEX idx_ambassador_activities_type ON public.ambassador_activities(activity_type);
CREATE INDEX idx_ambassador_activities_date ON public.ambassador_activities(activity_date);

-- 9. Enable Row Level Security on new tables
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassador_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassador_activities ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies for programs table
CREATE POLICY "Everyone can view active programs" ON public.programs
  FOR SELECT USING (is_active = true OR public.get_user_role() IS NOT NULL);

CREATE POLICY "Admins can manage programs" ON public.programs
  FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'moderator'));

-- 11. Create RLS policies for ambassador_assignments table
CREATE POLICY "Users can view their own ambassador assignments" ON public.ambassador_assignments
  FOR SELECT USING (
    individual_id = public.get_user_individual_id() OR
    mentor_id = public.get_user_individual_id() OR
    public.get_user_role() IN ('super_admin', 'admin', 'moderator')
  );

CREATE POLICY "Admins can manage ambassador assignments" ON public.ambassador_assignments
  FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'moderator'));

CREATE POLICY "Users can update their own ambassador assignments" ON public.ambassador_assignments
  FOR UPDATE USING (individual_id = public.get_user_individual_id());

-- 12. Create RLS policies for program_enrollments table
CREATE POLICY "Users can view their own program enrollments" ON public.program_enrollments
  FOR SELECT USING (
    individual_id = public.get_user_individual_id() OR
    public.get_user_role() IN ('super_admin', 'admin', 'moderator')
  );

CREATE POLICY "Users can manage their own program enrollments" ON public.program_enrollments
  FOR ALL USING (
    individual_id = public.get_user_individual_id() OR
    public.get_user_role() IN ('super_admin', 'admin', 'moderator')
  );

-- 13. Create RLS policies for ambassador_activities table
CREATE POLICY "Ambassadors can view their own activities" ON public.ambassador_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ambassador_assignments aa 
      WHERE aa.assignment_id = ambassador_activities.ambassador_id 
      AND aa.individual_id = public.get_user_individual_id()
    ) OR
    public.get_user_role() IN ('super_admin', 'admin', 'moderator')
  );

CREATE POLICY "Ambassadors can manage their own activities" ON public.ambassador_activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ambassador_assignments aa 
      WHERE aa.assignment_id = ambassador_activities.ambassador_id 
      AND aa.individual_id = public.get_user_individual_id()
    ) OR
    public.get_user_role() IN ('super_admin', 'admin', 'moderator')
  );

-- 14. Create triggers for automatic timestamp updates
CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ambassador_assignments_updated_at
  BEFORE UPDATE ON public.ambassador_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_program_enrollments_updated_at
  BEFORE UPDATE ON public.program_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();