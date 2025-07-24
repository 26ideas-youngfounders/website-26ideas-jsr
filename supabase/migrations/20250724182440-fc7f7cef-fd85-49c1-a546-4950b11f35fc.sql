-- Create missing tables and functions for existing code compatibility

-- 1. Create country_codes table for phone input component
CREATE TABLE public.country_codes (
  country_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_name text NOT NULL,
  iso_code text NOT NULL UNIQUE,
  country_code text NOT NULL,
  country_flag_emoji text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on country_codes
ALTER TABLE public.country_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to country codes
CREATE POLICY "Anyone can view active country codes" 
ON public.country_codes 
FOR SELECT 
USING (is_active = true);

-- 2. Create mentor_applications table
CREATE TABLE public.mentor_applications (
  application_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  individual_id uuid NOT NULL,
  application_status text NOT NULL DEFAULT 'submitted',
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewer_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on mentor_applications
ALTER TABLE public.mentor_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for mentor applications
CREATE POLICY "Admins can view all mentor applications" 
ON public.mentor_applications 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can insert mentor applications" 
ON public.mentor_applications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can update mentor applications" 
ON public.mentor_applications 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 3. Create the create_or_update_mentor_profile function (placeholder)
CREATE OR REPLACE FUNCTION public.create_or_update_mentor_profile(
  p_email text,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- This is a placeholder function - implement mentor profile logic as needed
  result := jsonb_build_object('success', true, 'message', 'Mentor profile function placeholder');
  RETURN result;
END;
$$;

-- 4. Add missing columns to yff_applications table
ALTER TABLE public.yff_applications 
ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone DEFAULT now();

-- 5. Add timestamp triggers for new tables
CREATE TRIGGER update_country_codes_updated_at
BEFORE UPDATE ON public.country_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentor_applications_updated_at
BEFORE UPDATE ON public.mentor_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Insert some sample country codes for testing
INSERT INTO public.country_codes (country_name, iso_code, country_code, country_flag_emoji) VALUES
('United States', 'US', '+1', '🇺🇸'),
('United Kingdom', 'GB', '+44', '🇬🇧'),
('Canada', 'CA', '+1', '🇨🇦'),
('Australia', 'AU', '+61', '🇦🇺'),
('Germany', 'DE', '+49', '🇩🇪'),
('France', 'FR', '+33', '🇫🇷'),
('Japan', 'JP', '+81', '🇯🇵'),
('India', 'IN', '+91', '🇮🇳'),
('Brazil', 'BR', '+55', '🇧🇷'),
('China', 'CN', '+86', '🇨🇳')
ON CONFLICT (iso_code) DO NOTHING;