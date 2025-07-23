-- Create country_codes table with flag support
CREATE TABLE IF NOT EXISTS public.country_codes (
  country_id SERIAL PRIMARY KEY,
  country_name VARCHAR(100) NOT NULL UNIQUE,
  country_code VARCHAR(10) NOT NULL,
  iso_code VARCHAR(2) NOT NULL UNIQUE,      -- e.g., "IN"  
  country_flag_emoji VARCHAR(10) NOT NULL,  -- Unicode flag emoji
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_country_code_iso UNIQUE (country_code, iso_code)
);

-- Insert common country codes with flag emojis only if table is empty
INSERT INTO public.country_codes (country_name, country_code, iso_code, country_flag_emoji) 
SELECT * FROM (VALUES
  ('India', '+91', 'IN', '🇮🇳'),
  ('United States', '+1', 'US', '🇺🇸'),
  ('Canada', '+1', 'CA', '🇨🇦'),
  ('United Kingdom', '+44', 'GB', '🇬🇧'),
  ('Australia', '+61', 'AU', '🇦🇺'),
  ('Germany', '+49', 'DE', '🇩🇪'),
  ('France', '+33', 'FR', '🇫🇷'),
  ('Japan', '+81', 'JP', '🇯🇵'),
  ('South Korea', '+82', 'KR', '🇰🇷'),
  ('Singapore', '+65', 'SG', '🇸🇬'),
  ('United Arab Emirates', '+971', 'AE', '🇦🇪'),
  ('Brazil', '+55', 'BR', '🇧🇷'),
  ('Mexico', '+52', 'MX', '🇲🇽'),
  ('China', '+86', 'CN', '🇨🇳'),
  ('Netherlands', '+31', 'NL', '🇳🇱'),
  ('Sweden', '+46', 'SE', '🇸🇪'),
  ('Norway', '+47', 'NO', '🇳🇴'),
  ('Switzerland', '+41', 'CH', '🇨🇭'),
  ('Italy', '+39', 'IT', '🇮🇹'),
  ('Spain', '+34', 'ES', '🇪🇸'),
  ('South Africa', '+27', 'ZA', '🇿🇦'),
  ('Nigeria', '+234', 'NG', '🇳🇬'),
  ('Kenya', '+254', 'KE', '🇰🇪'),
  ('Pakistan', '+92', 'PK', '🇵🇰'),
  ('Bangladesh', '+880', 'BD', '🇧🇩'),
  ('Sri Lanka', '+94', 'LK', '🇱🇰'),
  ('Thailand', '+66', 'TH', '🇹🇭'),
  ('Malaysia', '+60', 'MY', '🇲🇾'),
  ('Indonesia', '+62', 'ID', '🇮🇩'),
  ('Philippines', '+63', 'PH', '🇵🇭'),
  ('Vietnam', '+84', 'VN', '🇻🇳'),
  ('Israel', '+972', 'IL', '🇮🇱'),
  ('Turkey', '+90', 'TR', '🇹🇷'),
  ('Russia', '+7', 'RU', '🇷🇺'),
  ('Egypt', '+20', 'EG', '🇪🇬'),
  ('Morocco', '+212', 'MA', '🇲🇦'),
  ('Chile', '+56', 'CL', '🇨🇱'),
  ('Argentina', '+54', 'AR', '🇦🇷'),
  ('Colombia', '+57', 'CO', '🇨🇴'),
  ('Peru', '+51', 'PE', '🇵🇪')
) AS v(country_name, country_code, iso_code, country_flag_emoji)
WHERE NOT EXISTS (SELECT 1 FROM public.country_codes LIMIT 1);

-- Add country_code column to individuals table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'individuals' AND column_name = 'country_code') THEN
    ALTER TABLE public.individuals ADD COLUMN country_code VARCHAR(10) DEFAULT '+91';
  END IF;
END $$;

-- Add country_iso_code column to individuals table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'individuals' AND column_name = 'country_iso_code') THEN
    ALTER TABLE public.individuals ADD COLUMN country_iso_code VARCHAR(2) DEFAULT 'IN';
  END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_individuals_country_code') THEN
    ALTER TABLE public.individuals 
    ADD CONSTRAINT fk_individuals_country_code 
    FOREIGN KEY (country_code, country_iso_code) 
    REFERENCES public.country_codes(country_code, iso_code);
  END IF;
END $$;

-- Update column comments
COMMENT ON COLUMN public.individuals.mobile IS 'Mobile number without country code';
COMMENT ON COLUMN public.individuals.country_code IS 'Country code including + prefix (e.g., +91)';
COMMENT ON COLUMN public.individuals.country_iso_code IS 'ISO country code (e.g., IN)';

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_country_codes_iso_code ON public.country_codes(iso_code);
CREATE INDEX IF NOT EXISTS idx_country_codes_country_code ON public.country_codes(country_code);
CREATE INDEX IF NOT EXISTS idx_individuals_country_code ON public.individuals(country_code, country_iso_code);

-- Enable RLS on country_codes table
ALTER TABLE public.country_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for country_codes table
DROP POLICY IF EXISTS "Everyone can view active country codes" ON public.country_codes;
CREATE POLICY "Everyone can view active country codes" 
ON public.country_codes 
FOR SELECT 
USING (is_active = true);

-- Add country_code columns to mentor_applications table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mentor_applications' AND column_name = 'country_code') THEN
    ALTER TABLE public.mentor_applications ADD COLUMN country_code VARCHAR(10) DEFAULT '+91';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mentor_applications' AND column_name = 'country_iso_code') THEN
    ALTER TABLE public.mentor_applications ADD COLUMN country_iso_code VARCHAR(2) DEFAULT 'IN';
  END IF;
END $$;

-- Add foreign key constraint for mentor_applications if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_mentor_applications_country_code') THEN
    ALTER TABLE public.mentor_applications 
    ADD CONSTRAINT fk_mentor_applications_country_code 
    FOREIGN KEY (country_code, country_iso_code) 
    REFERENCES public.country_codes(country_code, iso_code);
  END IF;
END $$;

-- Update the create_or_update_mentor_profile function with proper parameter ordering
CREATE OR REPLACE FUNCTION public.create_or_update_mentor_profile(
  p_email character varying,
  p_mobile character varying,
  p_first_name character varying,
  p_last_name character varying,
  p_city character varying,
  p_country character varying,
  p_country_code character varying DEFAULT '+91'::character varying,
  p_country_iso_code character varying DEFAULT 'IN'::character varying,
  p_linkedin character varying DEFAULT NULL::character varying,
  p_instagram character varying DEFAULT NULL::character varying,
  p_topics_of_interest text[] DEFAULT '{}'::text[],
  p_availability_days text[] DEFAULT '{}'::text[],
  p_availability_time character varying DEFAULT NULL::character varying,
  p_availability_notes text DEFAULT NULL::text,
  p_privacy_consent boolean DEFAULT false,
  p_communication_email boolean DEFAULT false,
  p_communication_sms boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_individual_id UUID;
  v_existing_record RECORD;
  v_result JSONB;
  v_application_id UUID;
BEGIN
  -- Validate country code and ISO combination exists
  IF NOT EXISTS (
    SELECT 1 FROM public.country_codes 
    WHERE country_code = p_country_code 
    AND iso_code = p_country_iso_code 
    AND is_active = true
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_country_code',
      'message', 'Invalid country code and ISO combination provided'
    );
  END IF;

  -- First, check if a record exists with this email or mobile+country_code combination
  SELECT individual_id, email, mobile, country_code, country_iso_code, is_mentor, mentor_status
  INTO v_existing_record
  FROM public.individuals 
  WHERE email = p_email OR (mobile = p_mobile AND country_code = p_country_code AND country_iso_code = p_country_iso_code)
  LIMIT 1;

  IF v_existing_record IS NOT NULL THEN
    -- Record exists, check if already a mentor
    IF v_existing_record.is_mentor = true THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'duplicate_mentor',
        'message', 'A mentor profile already exists with this email or phone number'
      );
    ELSE
      -- Update existing record to mentor status
      UPDATE public.individuals 
      SET 
        first_name = p_first_name,
        last_name = p_last_name,
        city = p_city,
        country = p_country,
        country_code = p_country_code,
        country_iso_code = p_country_iso_code,
        linkedin = p_linkedin,
        instagram = p_instagram,
        is_mentor = true,
        mentor_status = true,
        interests = p_topics_of_interest,
        preferences = jsonb_build_object(
          'availability_days', p_availability_days,
          'availability_time', p_availability_time,
          'availability_notes', p_availability_notes
        ),
        privacy_consent = p_privacy_consent,
        data_processing_consent = p_privacy_consent,
        communication_email = p_communication_email,
        communication_sms = p_communication_sms,
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
          'mentor_signup', jsonb_build_object(
            'source', 'mentor_signup_form',
            'submitted_at', now()
          )
        ),
        updated_at = now()
      WHERE individual_id = v_existing_record.individual_id
      RETURNING individual_id INTO v_individual_id;
    END IF;
  ELSE
    -- Create new record
    INSERT INTO public.individuals (
      first_name, last_name, email, mobile, country_code, country_iso_code, city, country,
      linkedin, instagram, is_mentor, mentor_status, interests,
      preferences, privacy_consent, data_processing_consent,
      communication_email, communication_sms, metadata
    ) VALUES (
      p_first_name, p_last_name, p_email, p_mobile, p_country_code, p_country_iso_code, p_city, p_country,
      p_linkedin, p_instagram, true, true, p_topics_of_interest,
      jsonb_build_object(
        'availability_days', p_availability_days,
        'availability_time', p_availability_time,
        'availability_notes', p_availability_notes
      ),
      p_privacy_consent, p_privacy_consent,
      p_communication_email, p_communication_sms,
      jsonb_build_object(
        'source', 'mentor_signup_form',
        'submitted_at', now()
      )
    ) RETURNING individual_id INTO v_individual_id;
  END IF;

  -- Create mentor application record
  INSERT INTO public.mentor_applications (
    individual_id, topics_of_interest, availability_days,
    availability_time, availability_notes, linkedin_url, instagram_handle, 
    country_code, country_iso_code
  ) VALUES (
    v_individual_id, p_topics_of_interest, p_availability_days,
    p_availability_time, p_availability_notes, p_linkedin, p_instagram, 
    p_country_code, p_country_iso_code
  ) RETURNING application_id INTO v_application_id;

  RETURN jsonb_build_object(
    'success', true,
    'individual_id', v_individual_id,
    'application_id', v_application_id,
    'message', 'Mentor profile created successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'database_error',
    'message', SQLERRM
  );
END;
$function$;