-- ============================================================================
-- MENTOR SIGNUP ENHANCEMENTS AND ROBUST DUPLICATE PREVENTION (FIXED)
-- ============================================================================
-- Creating mentor-specific functionality and improving duplicate handling
-- ============================================================================

-- 1. Create a dedicated mentors_applications table for tracking mentor applications
CREATE TABLE public.mentor_applications (
  application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID NOT NULL REFERENCES public.individuals(individual_id),
  application_status VARCHAR(50) DEFAULT 'submitted', -- submitted, under_review, approved, rejected
  topics_of_interest TEXT[] NOT NULL,
  availability_days TEXT[] NOT NULL,
  availability_time VARCHAR(100) NOT NULL,
  availability_notes TEXT,
  linkedin_url TEXT,
  instagram_handle VARCHAR(100),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.individuals(individual_id),
  reviewer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Enable RLS on mentor_applications table
ALTER TABLE public.mentor_applications ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for mentor_applications
CREATE POLICY "Users can view their own mentor applications" ON public.mentor_applications
  FOR SELECT USING (
    individual_id = public.get_user_individual_id() OR
    public.get_user_role() IN ('super_admin', 'admin', 'moderator')
  );

CREATE POLICY "Users can insert their own mentor applications" ON public.mentor_applications
  FOR INSERT WITH CHECK (individual_id = public.get_user_individual_id());

CREATE POLICY "Admins can manage all mentor applications" ON public.mentor_applications
  FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'moderator'));

-- 4. Create indexes for performance
CREATE INDEX idx_mentor_applications_individual ON public.mentor_applications(individual_id);
CREATE INDEX idx_mentor_applications_status ON public.mentor_applications(application_status);
CREATE INDEX idx_mentor_applications_submitted_at ON public.mentor_applications(submitted_at);
CREATE INDEX idx_mentor_applications_topics ON public.mentor_applications USING GIN(topics_of_interest);

-- 5. Create trigger for automatic timestamp updates
CREATE TRIGGER update_mentor_applications_updated_at
  BEFORE UPDATE ON public.mentor_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Create a function to safely create or update mentor profiles
CREATE OR REPLACE FUNCTION public.create_or_update_mentor_profile(
  p_email VARCHAR,
  p_mobile VARCHAR,
  p_first_name VARCHAR,
  p_last_name VARCHAR,
  p_city VARCHAR,
  p_country VARCHAR,
  p_linkedin VARCHAR DEFAULT NULL,
  p_instagram VARCHAR DEFAULT NULL,
  p_topics_of_interest TEXT[] DEFAULT '{}',
  p_availability_days TEXT[] DEFAULT '{}',
  p_availability_time VARCHAR DEFAULT NULL,
  p_availability_notes TEXT DEFAULT NULL,
  p_privacy_consent BOOLEAN DEFAULT false,
  p_communication_email BOOLEAN DEFAULT false,
  p_communication_sms BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_individual_id UUID;
  v_existing_record RECORD;
  v_result JSONB;
  v_application_id UUID;
BEGIN
  -- First, check if a record exists with this email or mobile
  SELECT individual_id, email, mobile, is_mentor, mentor_status
  INTO v_existing_record
  FROM public.individuals 
  WHERE email = p_email OR mobile = p_mobile
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
      first_name, last_name, email, mobile, city, country,
      linkedin, instagram, is_mentor, mentor_status, interests,
      preferences, privacy_consent, data_processing_consent,
      communication_email, communication_sms, metadata
    ) VALUES (
      p_first_name, p_last_name, p_email, p_mobile, p_city, p_country,
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
    availability_time, availability_notes, linkedin_url, instagram_handle
  ) VALUES (
    v_individual_id, p_topics_of_interest, p_availability_days,
    p_availability_time, p_availability_notes, p_linkedin, p_instagram
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
$$;

-- 7. Create a view for mentor statistics (fixed aggregate function)
CREATE VIEW public.mentor_stats AS
WITH mentor_topics AS (
  SELECT DISTINCT unnest(interests) as topic
  FROM public.individuals 
  WHERE is_mentor = true AND is_active = true AND interests IS NOT NULL
)
SELECT 
  COUNT(*) as total_mentors,
  COUNT(CASE WHEN mentor_status = true THEN 1 END) as active_mentors,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_mentors_last_30_days,
  (SELECT array_agg(topic) FROM mentor_topics) as all_topics_covered,
  COUNT(DISTINCT country) as countries_represented,
  COUNT(DISTINCT city) as cities_represented
FROM public.individuals 
WHERE is_mentor = true AND is_active = true;

-- Enable security barrier on the view
ALTER VIEW public.mentor_stats SET (security_barrier = true);

-- 8. Add constraints to ensure data integrity
ALTER TABLE public.mentor_applications 
ADD CONSTRAINT check_availability_days_not_empty CHECK (array_length(availability_days, 1) > 0),
ADD CONSTRAINT check_topics_not_empty CHECK (array_length(topics_of_interest, 1) > 0);

-- 9. Create function to check mentor availability
CREATE OR REPLACE FUNCTION public.check_mentor_availability(mentor_id UUID, requested_day VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  mentor_preferences JSONB;
  available_days TEXT[];
BEGIN
  SELECT preferences INTO mentor_preferences
  FROM public.individuals 
  WHERE individual_id = mentor_id AND is_mentor = true;
  
  IF mentor_preferences IS NULL THEN
    RETURN false;
  END IF;
  
  available_days := ARRAY(SELECT jsonb_array_elements_text(mentor_preferences->'availability_days'));
  
  RETURN requested_day = ANY(available_days);
END;
$$;