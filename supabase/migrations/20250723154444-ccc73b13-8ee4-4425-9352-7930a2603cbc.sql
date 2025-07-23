-- ============================================================================
-- CREATE CROSS-PROGRAM ANALYTICS VIEW FOR MULTI-ROLE TRACKING
-- ============================================================================
-- Final piece to complete the multi-role Young Founder schema
-- ============================================================================

-- Create comprehensive multi-role participants view
CREATE VIEW public.multi_role_participants AS
SELECT 
  i.individual_id,
  i.first_name,
  i.last_name,
  i.email,
  i.dob,
  i.ambassador_region,
  i.ambassador_university,
  i.ambassador_performance_score,
  i.active_programs,
  i.program_completion_rate,
  
  -- Course participation
  CASE WHEN EXISTS(
    SELECT 1 FROM public.course_progress cp 
    WHERE cp.individual_id = i.individual_id
  ) THEN true ELSE false END as is_course_participant,
  
  -- Ambassador status
  CASE WHEN EXISTS(
    SELECT 1 FROM public.ambassador_assignments aa 
    WHERE aa.individual_id = i.individual_id AND aa.status = 'active'
  ) THEN true ELSE false END as is_active_ambassador,
  
  -- YFF competition participation
  CASE WHEN EXISTS(
    SELECT 1 FROM public.yff_applications ya 
    WHERE ya.individual_id = i.individual_id
  ) THEN true ELSE false END as is_yff_applicant,
  
  -- Chapter membership
  CASE WHEN EXISTS(
    SELECT 1 FROM public.chapter_members cm 
    WHERE cm.individual_id = i.individual_id AND cm.status = 'active'
  ) THEN true ELSE false END as is_active_chapter_member,
  
  -- Program enrollments
  CASE WHEN EXISTS(
    SELECT 1 FROM public.program_enrollments pe 
    WHERE pe.individual_id = i.individual_id AND pe.status IN ('enrolled', 'active')
  ) THEN true ELSE false END as has_active_program_enrollments,
  
  -- Multi-role count
  (
    CASE WHEN EXISTS(SELECT 1 FROM public.course_progress cp WHERE cp.individual_id = i.individual_id) THEN 1 ELSE 0 END +
    CASE WHEN EXISTS(SELECT 1 FROM public.ambassador_assignments aa WHERE aa.individual_id = i.individual_id AND aa.status = 'active') THEN 1 ELSE 0 END +
    CASE WHEN EXISTS(SELECT 1 FROM public.yff_applications ya WHERE ya.individual_id = i.individual_id) THEN 1 ELSE 0 END +
    CASE WHEN EXISTS(SELECT 1 FROM public.chapter_members cm WHERE cm.individual_id = i.individual_id AND cm.status = 'active') THEN 1 ELSE 0 END +
    CASE WHEN EXISTS(SELECT 1 FROM public.program_enrollments pe WHERE pe.individual_id = i.individual_id AND pe.status IN ('enrolled', 'active')) THEN 1 ELSE 0 END
  ) as total_active_roles,
  
  -- Age calculation for Young Founder validation
  CASE 
    WHEN i.dob IS NOT NULL THEN EXTRACT(YEAR FROM AGE(i.dob))
    ELSE NULL 
  END as current_age,
  
  -- Young Founder eligibility
  CASE 
    WHEN i.dob IS NOT NULL AND 
         EXTRACT(YEAR FROM AGE(i.dob)) BETWEEN 18 AND 27 AND 
         i.is_founder = true 
    THEN true 
    ELSE false 
  END as is_eligible_young_founder,
  
  i.created_at,
  i.last_login,
  i.is_active

FROM public.individuals i
WHERE i.is_active = true;

-- Enable security barrier on the view (security best practice)
ALTER VIEW public.multi_role_participants SET (security_barrier = true);

-- Create an additional summary view for dashboard analytics
CREATE VIEW public.role_participation_summary AS
SELECT 
  COUNT(*) as total_active_individuals,
  COUNT(CASE WHEN is_course_participant THEN 1 END) as course_participants,
  COUNT(CASE WHEN is_active_ambassador THEN 1 END) as active_ambassadors,
  COUNT(CASE WHEN is_yff_applicant THEN 1 END) as yff_applicants,
  COUNT(CASE WHEN is_active_chapter_member THEN 1 END) as active_chapter_members,
  COUNT(CASE WHEN has_active_program_enrollments THEN 1 END) as program_enrollees,
  COUNT(CASE WHEN total_active_roles >= 2 THEN 1 END) as multi_role_participants,
  COUNT(CASE WHEN total_active_roles >= 3 THEN 1 END) as highly_engaged_participants,
  COUNT(CASE WHEN is_eligible_young_founder THEN 1 END) as eligible_young_founders,
  ROUND(AVG(CASE WHEN current_age IS NOT NULL THEN current_age END), 1) as average_age
FROM public.multi_role_participants;

-- Enable security barrier on the summary view
ALTER VIEW public.role_participation_summary SET (security_barrier = true);