
-- Fix the YFF Applications RLS policies that are causing "permission denied for table users" error
-- Drop the existing problematic policies
DROP POLICY IF EXISTS "Users can view their own applications" ON public.yff_applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON public.yff_applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON public.yff_applications;
DROP POLICY IF EXISTS "Admins can manage all applications" ON public.yff_applications;

-- Create new RLS policies that use safe authentication methods
CREATE POLICY "Users can view their own applications" ON public.yff_applications
  FOR SELECT 
  TO authenticated
  USING (individual_id = public.get_user_individual_id());

CREATE POLICY "Users can create their own applications" ON public.yff_applications
  FOR INSERT 
  TO authenticated
  WITH CHECK (individual_id = public.get_user_individual_id());

CREATE POLICY "Users can update their own applications" ON public.yff_applications
  FOR UPDATE 
  TO authenticated
  USING (individual_id = public.get_user_individual_id())
  WITH CHECK (individual_id = public.get_user_individual_id());

CREATE POLICY "Admins can manage all applications" ON public.yff_applications
  FOR ALL 
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'admin', 'moderator'));
