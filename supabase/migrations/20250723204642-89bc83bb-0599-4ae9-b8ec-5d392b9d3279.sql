
-- Drop existing problematic RLS policies
DROP POLICY IF EXISTS "Users can view their own applications" ON public.yff_applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON public.yff_applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON public.yff_applications;
DROP POLICY IF EXISTS "Admins can manage all applications" ON public.yff_applications;

-- Create new RLS policies that work with the auth system
CREATE POLICY "Users can view their own applications" ON public.yff_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.individual_id = yff_applications.individual_id
      AND ur.is_active = true
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('super_admin', 'admin', 'moderator')
      AND ur.is_active = true
    )
  );

CREATE POLICY "Users can create their own applications" ON public.yff_applications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.individual_id = yff_applications.individual_id
      AND ur.is_active = true
    )
  );

CREATE POLICY "Users can update their own applications" ON public.yff_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.individual_id = yff_applications.individual_id
      AND ur.is_active = true
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('super_admin', 'admin', 'moderator')
      AND ur.is_active = true
    )
  );

CREATE POLICY "Admins can manage all applications" ON public.yff_applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('super_admin', 'admin', 'moderator')
      AND ur.is_active = true
    )
  );
