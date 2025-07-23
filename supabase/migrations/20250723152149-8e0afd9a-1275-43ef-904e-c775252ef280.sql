-- ============================================================================
-- SECURITY FIXES FOR 26IDEAS ECOSYSTEM DATABASE
-- ============================================================================
-- Fixing security warnings identified by the Supabase linter
-- ============================================================================

-- Fix security definer functions by setting proper search path
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS public.app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.user_roles 
  WHERE user_id = user_uuid AND is_active = true 
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'moderator' THEN 3
      ELSE 4
    END
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_individual_id(user_uuid UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT individual_id FROM public.user_roles 
  WHERE user_id = user_uuid AND is_active = true 
  LIMIT 1;
$$;

-- Fix sync_external_data function search path
CREATE OR REPLACE FUNCTION public.sync_external_data(
  entity_type VARCHAR,
  entity_id UUID,
  external_system VARCHAR,
  external_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- This function can be extended to sync data with external systems
  -- like Zoho, Slack, OpenAI, Perplexity, Social Vista, Synthesia
  
  CASE entity_type
    WHEN 'individual' THEN
      UPDATE public.individuals 
      SET metadata = metadata || jsonb_build_object(external_system, external_data)
      WHERE individual_id = entity_id;
    
    WHEN 'event' THEN
      UPDATE public.events 
      SET metadata = metadata || jsonb_build_object(external_system, external_data)
      WHERE event_id = entity_id;
    
    WHEN 'course' THEN
      UPDATE public.courses 
      SET metadata = metadata || jsonb_build_object(external_system, external_data)
      WHERE course_id = entity_id;
    
    ELSE
      RETURN FALSE;
  END CASE;
  
  RETURN TRUE;
END;
$$;

-- ============================================================================
-- ADD MISSING RLS POLICIES FOR TABLES WITHOUT POLICIES
-- ============================================================================

-- Parent-child relationships policies
CREATE POLICY "Parents can view their children relationships" ON public.parent_child
  FOR SELECT USING (
    parent_id = public.get_user_individual_id() OR
    child_id = public.get_user_individual_id() OR
    public.get_user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY "Parents can manage their children relationships" ON public.parent_child
  FOR ALL USING (
    parent_id = public.get_user_individual_id() OR
    public.get_user_role() IN ('super_admin', 'admin')
  );

-- Chapters policies  
CREATE POLICY "Everyone can view active chapters" ON public.chapters
  FOR SELECT USING (is_active = true OR public.get_user_role() IS NOT NULL);

CREATE POLICY "Admins can manage chapters" ON public.chapters
  FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'moderator'));

-- Chapter members policies
CREATE POLICY "Users can view their chapter memberships" ON public.chapter_members
  FOR SELECT USING (
    individual_id = public.get_user_individual_id() OR
    public.get_user_role() IN ('super_admin', 'admin', 'moderator')
  );

CREATE POLICY "Users can manage their chapter memberships" ON public.chapter_members
  FOR ALL USING (
    individual_id = public.get_user_individual_id() OR
    public.get_user_role() IN ('super_admin', 'admin', 'moderator')
  );

-- YFF Applications policies
CREATE POLICY "Users can view their own applications" ON public.yff_applications
  FOR SELECT USING (
    individual_id = public.get_user_individual_id() OR
    public.get_user_role() IN ('super_admin', 'admin', 'moderator') OR
    public.get_user_individual_id() = ANY(assigned_reviewers)
  );

CREATE POLICY "Users can manage their own applications" ON public.yff_applications
  FOR ALL USING (
    individual_id = public.get_user_individual_id() OR
    public.get_user_role() IN ('super_admin', 'admin', 'moderator')
  );

-- Certificates policies
CREATE POLICY "Users can view their own certificates" ON public.certificates
  FOR SELECT USING (
    individual_id = public.get_user_individual_id() OR
    is_public = true OR
    public.get_user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY "Admins can manage certificates" ON public.certificates
  FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'moderator'));

-- Sponsorships policies
CREATE POLICY "Admins can view all sponsorships" ON public.sponsorships
  FOR SELECT USING (public.get_user_role() IN ('super_admin', 'admin', 'moderator'));

CREATE POLICY "Admins can manage sponsorships" ON public.sponsorships
  FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'moderator'));

-- Team roles policies
CREATE POLICY "Users can view their own team roles" ON public.team_roles
  FOR SELECT USING (
    individual_id = public.get_user_individual_id() OR
    reporting_to = public.get_user_individual_id() OR
    public.get_user_role() IN ('super_admin', 'admin', 'moderator')
  );

CREATE POLICY "Admins can manage team roles" ON public.team_roles
  FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'moderator'));

-- ============================================================================
-- RECREATE VIEWS WITHOUT SECURITY DEFINER (Security Fix)
-- ============================================================================

-- Drop existing views
DROP VIEW IF EXISTS public.active_participants;
DROP VIEW IF EXISTS public.upcoming_events;

-- Recreate views without SECURITY DEFINER property
CREATE VIEW public.active_participants AS
SELECT 
  i.*,
  array_agg(DISTINCT ur.role) FILTER (WHERE ur.is_active = true) as roles,
  count(DISTINCT ep.event_id) as events_attended,
  count(DISTINCT cp.course_id) as courses_enrolled
FROM public.individuals i
LEFT JOIN public.user_roles ur ON i.individual_id = ur.individual_id
LEFT JOIN public.event_participation ep ON i.individual_id = ep.individual_id AND ep.attendance_confirmed = true
LEFT JOIN public.course_progress cp ON i.individual_id = cp.individual_id
WHERE i.is_active = true
GROUP BY i.individual_id;

-- Enable RLS on the view
ALTER VIEW public.active_participants SET (security_barrier = true);

CREATE VIEW public.upcoming_events AS
SELECT 
  e.*,
  c.name as chapter_name,
  count(ep.individual_id) as registered_count
FROM public.events e
LEFT JOIN public.chapters c ON e.chapter_id = c.chapter_id
LEFT JOIN public.event_participation ep ON e.event_id = ep.event_id
WHERE e.start_date > now() AND e.is_active = true
GROUP BY e.event_id, c.name
ORDER BY e.start_date;

-- Enable security barrier on the view
ALTER VIEW public.upcoming_events SET (security_barrier = true);