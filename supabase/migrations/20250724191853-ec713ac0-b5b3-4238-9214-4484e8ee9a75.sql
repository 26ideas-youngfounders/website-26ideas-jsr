
-- Add missing columns to mentor_applications table to capture all form data
ALTER TABLE public.mentor_applications 
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT,
ADD COLUMN IF NOT EXISTS country_iso_code TEXT,
ADD COLUMN IF NOT EXISTS topics_of_interest JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS availability_days JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS availability_time TEXT,
ADD COLUMN IF NOT EXISTS availability_notes TEXT,
ADD COLUMN IF NOT EXISTS email_updates_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_updates_consent BOOLEAN DEFAULT false;

-- Add missing columns to yff_applications table to fix build errors
ALTER TABLE public.yff_applications 
ADD COLUMN IF NOT EXISTS application_round TEXT DEFAULT 'current';

-- Update mentor_applications RLS policies to allow users to insert with all new fields
DROP POLICY IF EXISTS "Users can insert mentor applications" ON public.mentor_applications;
CREATE POLICY "Users can insert mentor applications" 
ON public.mentor_applications 
FOR INSERT 
WITH CHECK (true);

-- Verify the new structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'mentor_applications' 
AND table_schema = 'public'
ORDER BY ordinal_position;
