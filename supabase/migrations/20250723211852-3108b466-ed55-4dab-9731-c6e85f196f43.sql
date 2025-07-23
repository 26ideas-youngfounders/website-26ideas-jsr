
-- Comprehensive fix for authentication and RLS policy issues
-- This addresses the root cause: missing user_roles records and faulty RLS policies

-- Step 1: Fix YFF Applications RLS policies to use email-based authentication
-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view their own applications" ON public.yff_applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON public.yff_applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON public.yff_applications;
DROP POLICY IF EXISTS "Admins can manage all applications" ON public.yff_applications;

-- Create robust RLS policies that work with current authentication flow
-- Use email-based matching as fallback when user_roles doesn't exist
CREATE POLICY "Users can view their own applications" ON public.yff_applications
  FOR SELECT 
  TO authenticated
  USING (
    individual_id = public.get_user_individual_id() OR
    EXISTS (
      SELECT 1 FROM public.individuals i 
      WHERE i.individual_id = yff_applications.individual_id 
      AND i.email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Users can create their own applications" ON public.yff_applications
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    individual_id = public.get_user_individual_id() OR
    EXISTS (
      SELECT 1 FROM public.individuals i 
      WHERE i.individual_id = yff_applications.individual_id 
      AND i.email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Users can update their own applications" ON public.yff_applications
  FOR UPDATE 
  TO authenticated
  USING (
    individual_id = public.get_user_individual_id() OR
    EXISTS (
      SELECT 1 FROM public.individuals i 
      WHERE i.individual_id = yff_applications.individual_id 
      AND i.email = (auth.jwt() ->> 'email')
    )
  )
  WITH CHECK (
    individual_id = public.get_user_individual_id() OR
    EXISTS (
      SELECT 1 FROM public.individuals i 
      WHERE i.individual_id = yff_applications.individual_id 
      AND i.email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Admins can manage all applications" ON public.yff_applications
  FOR ALL 
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'admin', 'moderator'));

-- Step 2: Create function to automatically create user_roles records
-- This ensures get_user_individual_id() works properly for future users
CREATE OR REPLACE FUNCTION public.create_user_role_from_individual()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Create a user_roles record for the new individual if one doesn't exist
  -- This links auth.users to individuals table via user_roles
  INSERT INTO public.user_roles (user_id, individual_id, role, is_active)
  SELECT 
    auth.uid(),
    NEW.individual_id,
    'user'::public.app_role,
    true
  WHERE auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND individual_id = NEW.individual_id
  );
  
  RETURN NEW;
END;
$$;

-- Step 3: Create trigger to automatically create user_roles when individual is created
DROP TRIGGER IF EXISTS create_user_role_on_individual_insert ON public.individuals;
CREATE TRIGGER create_user_role_on_individual_insert
  AFTER INSERT ON public.individuals
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_role_from_individual();

-- Step 4: Backfill missing user_roles for existing individuals
-- This fixes the issue for users who already have individual records but no user_roles
INSERT INTO public.user_roles (user_id, individual_id, role, is_active)
SELECT 
  u.id as user_id,
  i.individual_id,
  'user'::public.app_role,
  true
FROM auth.users u
INNER JOIN public.individuals i ON i.email = u.email
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = u.id AND ur.individual_id = i.individual_id
)
AND u.email IS NOT NULL
AND i.email IS NOT NULL;

-- Step 5: Add 'user' to app_role enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'user' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'user';
  END IF;
END $$;
