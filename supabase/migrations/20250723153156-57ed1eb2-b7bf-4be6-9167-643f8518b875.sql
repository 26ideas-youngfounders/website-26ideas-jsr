-- ============================================================================
-- ENHANCE INDIVIDUALS TABLE WITH MISSING ATTRIBUTES
-- ============================================================================
-- Adding comprehensive attributes for the Young Founders Ecosystem
-- ============================================================================

-- Identity & Demographics
ALTER TABLE public.individuals 
ADD COLUMN gender VARCHAR(50),
ADD COLUMN nationality VARCHAR(100),
ADD COLUMN pronouns VARCHAR(50),
ADD COLUMN profile_photo_url TEXT,
ADD COLUMN bio TEXT;

-- Professional & Academic
ALTER TABLE public.individuals 
ADD COLUMN current_company VARCHAR(200),
ADD COLUMN job_title VARCHAR(200),
ADD COLUMN industry VARCHAR(100),
ADD COLUMN university VARCHAR(200),
ADD COLUMN graduation_year INTEGER,
ADD COLUMN degree_level VARCHAR(50),
ADD COLUMN startup_stage VARCHAR(50);

-- Networking & Engagement
ALTER TABLE public.individuals 
ADD COLUMN availability_for_mentoring INTEGER DEFAULT 0, -- hours per month
ADD COLUMN meeting_preferences VARCHAR(50) DEFAULT 'hybrid',
ADD COLUMN networking_interests TEXT[],
ADD COLUMN collaboration_openness BOOLEAN DEFAULT true,
ADD COLUMN public_profile BOOLEAN DEFAULT true;

-- Platform Engagement
ALTER TABLE public.individuals 
ADD COLUMN referral_source VARCHAR(100),
ADD COLUMN onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN last_activity_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN notification_frequency VARCHAR(20) DEFAULT 'weekly',
ADD COLUMN email_verification_status BOOLEAN DEFAULT false;

-- Contact & Emergency
ALTER TABLE public.individuals 
ADD COLUMN secondary_email VARCHAR(255),
ADD COLUMN emergency_contact_name VARCHAR(200),
ADD COLUMN emergency_contact_phone VARCHAR(20),
ADD COLUMN whatsapp_number VARCHAR(20);

-- Verification & Trust
ALTER TABLE public.individuals 
ADD COLUMN email_verified BOOLEAN DEFAULT false,
ADD COLUMN phone_verified BOOLEAN DEFAULT false,
ADD COLUMN background_check_status VARCHAR(50) DEFAULT 'not_required',
ADD COLUMN identity_verification_level INTEGER DEFAULT 0;

-- Add constraints for data integrity
ALTER TABLE public.individuals 
ADD CONSTRAINT check_graduation_year CHECK (graduation_year IS NULL OR (graduation_year >= 1950 AND graduation_year <= 2050)),
ADD CONSTRAINT check_availability_mentoring CHECK (availability_for_mentoring >= 0),
ADD CONSTRAINT check_identity_verification_level CHECK (identity_verification_level >= 0 AND identity_verification_level <= 3);

-- Create indexes for performance on commonly queried fields
CREATE INDEX idx_individuals_industry ON public.individuals(industry);
CREATE INDEX idx_individuals_startup_stage ON public.individuals(startup_stage);
CREATE INDEX idx_individuals_university ON public.individuals(university);
CREATE INDEX idx_individuals_graduation_year ON public.individuals(graduation_year);
CREATE INDEX idx_individuals_public_profile ON public.individuals(public_profile);
CREATE INDEX idx_individuals_collaboration_openness ON public.individuals(collaboration_openness);
CREATE INDEX idx_individuals_email_verified ON public.individuals(email_verified);
CREATE INDEX idx_individuals_last_activity_date ON public.individuals(last_activity_date);

-- Update the trigger to handle the new updated_at timestamp
-- (The existing trigger will automatically handle new columns)