
-- Fix the RLS policies that are causing "permission denied for table users" error
-- Drop the problematic policy that tries to access auth.users directly
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.individuals;

-- Create a new policy that uses auth.jwt() instead of accessing auth.users table
CREATE POLICY "Users can insert their own profile" ON public.individuals
  FOR INSERT 
  TO authenticated
  WITH CHECK (email = (auth.jwt() ->> 'email'));

-- Also ensure the select policy uses a safe approach
DROP POLICY IF EXISTS "Users can view their own profile" ON public.individuals;
CREATE POLICY "Users can view their own profile" ON public.individuals
  FOR SELECT 
  TO authenticated
  USING (email = (auth.jwt() ->> 'email') OR individual_id = public.get_user_individual_id());

-- Ensure the update policy is also safe
DROP POLICY IF EXISTS "Users can update their own profile" ON public.individuals;
CREATE POLICY "Users can update their own profile" ON public.individuals
  FOR UPDATE 
  TO authenticated
  USING (email = (auth.jwt() ->> 'email') OR individual_id = public.get_user_individual_id())
  WITH CHECK (email = (auth.jwt() ->> 'email') OR individual_id = public.get_user_individual_id());
