
-- Drop the incorrect RLS policies that reference user_roles table
DROP POLICY IF EXISTS "Users can view their own applications" ON public.yff_applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON public.yff_applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON public.yff_applications;
DROP POLICY IF EXISTS "Admins can manage all applications" ON public.yff_applications;

-- Create correct RLS policies using the existing authentication system
CREATE POLICY "Users can view their own applications" ON public.yff_applications
  FOR SELECT USING (individual_id = public.get_user_individual_id());

CREATE POLICY "Users can create their own applications" ON public.yff_applications
  FOR INSERT WITH CHECK (individual_id = public.get_user_individual_id());

CREATE POLICY "Users can update their own applications" ON public.yff_applications
  FOR UPDATE USING (individual_id = public.get_user_individual_id());

CREATE POLICY "Admins can manage all applications" ON public.yff_applications
  FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'moderator'));
