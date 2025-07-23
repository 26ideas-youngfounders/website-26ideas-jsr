
-- First, let's fix the RLS policies for yff_applications table
-- Drop any existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Users can view their own applications" ON public.yff_applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON public.yff_applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON public.yff_applications;
DROP POLICY IF EXISTS "Admins can manage all applications" ON public.yff_applications;

-- Create new policies that properly link auth.users to individuals to yff_applications
CREATE POLICY "Users can view their own applications" ON public.yff_applications
  FOR SELECT 
  TO authenticated
  USING (
    individual_id IN (
      SELECT individual_id FROM public.individuals 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can create their own applications" ON public.yff_applications
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    individual_id IN (
      SELECT individual_id FROM public.individuals 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own applications" ON public.yff_applications
  FOR UPDATE 
  TO authenticated
  USING (
    individual_id IN (
      SELECT individual_id FROM public.individuals 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage all applications" ON public.yff_applications
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.individuals i ON ur.individual_id = i.individual_id
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('super_admin', 'admin', 'moderator')
      AND ur.is_active = true
    )
  );

-- Also ensure individuals table allows users to create their own records
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.individuals;
CREATE POLICY "Users can insert their own profile" ON public.individuals
  FOR INSERT 
  TO authenticated
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
