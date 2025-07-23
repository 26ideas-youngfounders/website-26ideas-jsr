-- ============================================================================
-- 26IDEAS YOUNG FOUNDERS ECOSYSTEM DATABASE SCHEMA (FIXED)
-- ============================================================================
-- Comprehensive, secure, and extensible database schema for managing
-- individuals, events, courses, chapters, mentorships, sponsorships,
-- analytics, and communication tracking with GDPR compliance and RBAC.
-- ============================================================================

-- Create custom types for better data integrity
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'moderator', 'mentor', 'founder', 'parent', 'investor', 'judge', 'advisor', 'user');
CREATE TYPE public.event_type AS ENUM ('yff', 'webinar', 'retreat', 'meetup', 'workshop', 'conference', 'networking');
CREATE TYPE public.participation_status AS ENUM ('registered', 'confirmed', 'attended', 'no_show', 'cancelled');
CREATE TYPE public.mentorship_status AS ENUM ('requested', 'active', 'completed', 'cancelled', 'paused');
CREATE TYPE public.notification_type AS ENUM ('email', 'sms', 'push', 'in_app', 'slack');
CREATE TYPE public.sponsorship_type AS ENUM ('financial', 'in_kind', 'strategic', 'venue', 'technology');
CREATE TYPE public.engagement_level AS ENUM ('low', 'medium', 'high', 'very_high');

-- ============================================================================
-- CORE INDIVIDUALS TABLE
-- ============================================================================
CREATE TABLE public.individuals (
  individual_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  dob DATE,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile VARCHAR(20) UNIQUE,
  
  -- Location
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Social Media
  instagram VARCHAR(100),
  linkedin VARCHAR(255),
  pinterest VARCHAR(100),
  facebook VARCHAR(100),
  twitter VARCHAR(100),
  youtube VARCHAR(100),
  tiktok VARCHAR(100),
  
  -- Role Flags
  is_founder BOOLEAN DEFAULT FALSE,
  is_mentor BOOLEAN DEFAULT FALSE,
  is_advisor BOOLEAN DEFAULT FALSE,
  is_judge BOOLEAN DEFAULT FALSE,
  is_investor BOOLEAN DEFAULT FALSE,
  is_parent BOOLEAN DEFAULT FALSE,
  
  -- Status Flags
  alumni_status BOOLEAN DEFAULT FALSE,
  ambassador_status BOOLEAN DEFAULT FALSE,
  mentor_status BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Profile Management
  profile_completion INTEGER DEFAULT 0 CHECK (profile_completion >= 0 AND profile_completion <= 100),
  last_login TIMESTAMP WITH TIME ZONE,
  
  -- Communication Preferences (GDPR Compliant)
  communication_email BOOLEAN DEFAULT TRUE,
  communication_sms BOOLEAN DEFAULT FALSE,
  communication_notifications BOOLEAN DEFAULT TRUE,
  communication_marketing BOOLEAN DEFAULT FALSE,
  
  -- Professional Information
  sectors TEXT[],
  topics TEXT[],
  verticals TEXT[],
  interests TEXT[],
  skills TEXT[],
  languages TEXT[],
  
  -- Flexible Data Storage
  education JSONB DEFAULT '[]'::jsonb, -- Array of education records
  professional_experience JSONB DEFAULT '[]'::jsonb, -- Array of work experience
  achievements JSONB DEFAULT '[]'::jsonb, -- Array of achievements/awards
  preferences JSONB DEFAULT '{}'::jsonb, -- User preferences and settings
  metadata JSONB DEFAULT '{}'::jsonb, -- Extensible metadata for third-party integrations
  
  -- Privacy and Compliance (GDPR/Data Protection)
  privacy_consent BOOLEAN DEFAULT FALSE NOT NULL,
  data_processing_consent BOOLEAN DEFAULT FALSE NOT NULL,
  marketing_consent BOOLEAN DEFAULT FALSE,
  spi_retraction BOOLEAN DEFAULT FALSE,
  data_retention_date DATE,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add comments for extensibility
COMMENT ON TABLE public.individuals IS 'Core individuals table storing all ecosystem participants with GDPR compliance and extensible JSONB fields for third-party integrations';
COMMENT ON COLUMN public.individuals.metadata IS 'Extensible JSONB field for storing third-party service data (Zoho, Slack, etc.)';
COMMENT ON COLUMN public.individuals.spi_retraction IS 'GDPR compliance flag for data subject deletion requests';

-- ============================================================================
-- USER ROLES TABLE (RBAC)
-- ============================================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  individual_id UUID NOT NULL REFERENCES public.individuals(individual_id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE (user_id, role)
);

COMMENT ON TABLE public.user_roles IS 'Role-based access control (RBAC) for user permissions management';

-- ============================================================================
-- PARENT-CHILD RELATIONSHIPS (FIXED)
-- ============================================================================
CREATE TABLE public.parent_child (
  relationship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.individuals(individual_id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.individuals(individual_id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) DEFAULT 'parent' CHECK (relationship_type IN ('parent', 'guardian', 'legal_guardian')),
  consent_provided BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (parent_id, child_id)
);

COMMENT ON TABLE public.parent_child IS 'Parent-child relationships with consent tracking for minors';

-- ============================================================================
-- CHAPTERS
-- ============================================================================
CREATE TABLE public.chapters (
  chapter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'UTC',
  meeting_schedule JSONB DEFAULT '{}'::jsonb, -- Flexible meeting scheduling
  contact_info JSONB DEFAULT '{}'::jsonb, -- Contact details
  social_links JSONB DEFAULT '{}'::jsonb, -- Social media links
  is_active BOOLEAN DEFAULT TRUE,
  max_capacity INTEGER,
  current_members_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.chapters IS 'Geographic chapters for organizing local ecosystem activities';

-- ============================================================================
-- CHAPTER MEMBERS
-- ============================================================================
CREATE TABLE public.chapter_members (
  chapter_member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(chapter_id) ON DELETE CASCADE,
  individual_id UUID NOT NULL REFERENCES public.individuals(individual_id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  role VARCHAR(50) DEFAULT 'member',
  joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
  left_at DATE,
  attendance_data JSONB DEFAULT '{}'::jsonb, -- Meeting attendance tracking
  engagement_score INTEGER DEFAULT 0,
  notes TEXT,
  UNIQUE (chapter_id, individual_id)
);

COMMENT ON TABLE public.chapter_members IS 'Chapter membership tracking with attendance and engagement metrics';

-- ============================================================================
-- EVENTS
-- ============================================================================
CREATE TABLE public.events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(300) NOT NULL,
  type public.event_type NOT NULL,
  description TEXT,
  objectives TEXT[],
  agenda JSONB DEFAULT '[]'::jsonb,
  
  -- Event Details
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC',
  location VARCHAR(300),
  venue_details JSONB DEFAULT '{}'::jsonb,
  is_virtual BOOLEAN DEFAULT FALSE,
  virtual_platform VARCHAR(100),
  meeting_link VARCHAR(500),
  
  -- Capacity and Registration
  max_capacity INTEGER,
  current_registrations INTEGER DEFAULT 0,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  is_registration_open BOOLEAN DEFAULT TRUE,
  
  -- Event Management
  chapter_id UUID REFERENCES public.chapters(chapter_id),
  organizers UUID[] DEFAULT '{}', -- Array of individual_ids
  speakers JSONB DEFAULT '[]'::jsonb,
  sponsors JSONB DEFAULT '[]'::jsonb,
  
  -- Status and Visibility
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'confirmed', 'ongoing', 'completed', 'cancelled', 'postponed')),
  
  -- Extensible Fields
  requirements JSONB DEFAULT '{}'::jsonb,
  resources JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE public.events IS 'Comprehensive events management with flexible scheduling and participant tracking';

-- ============================================================================
-- EVENT PARTICIPATION
-- ============================================================================
CREATE TABLE public.event_participation (
  participation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE,
  individual_id UUID NOT NULL REFERENCES public.individuals(individual_id) ON DELETE CASCADE,
  
  -- Registration and Status
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  rsvp_status public.participation_status DEFAULT 'registered',
  attendance_confirmed BOOLEAN DEFAULT FALSE,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  
  -- Feedback and Engagement
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  testimonial TEXT,
  engagement_data JSONB DEFAULT '{}'::jsonb, -- Q&A, polls, etc.
  
  -- Participation Details
  role VARCHAR(50) DEFAULT 'participant', -- participant, speaker, organizer, volunteer
  session_attendance JSONB DEFAULT '{}'::jsonb, -- Track attendance to specific sessions
  networking_data JSONB DEFAULT '{}'::jsonb, -- Networking connections made
  
  UNIQUE (event_id, individual_id)
);

COMMENT ON TABLE public.event_participation IS 'Detailed event participation tracking with engagement metrics';

-- ============================================================================
-- YFF APPLICATIONS
-- ============================================================================
CREATE TABLE public.yff_applications (
  application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID NOT NULL REFERENCES public.individuals(individual_id) ON DELETE CASCADE,
  
  -- Application Details
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  application_round VARCHAR(50),
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'waitlisted')),
  
  -- Scoring
  cumulative_score INTEGER DEFAULT 0,
  max_possible_score INTEGER,
  evaluation_criteria JSONB DEFAULT '{}'::jsonb,
  reviewer_scores JSONB DEFAULT '[]'::jsonb, -- Array of reviewer evaluations
  
  -- Application Content
  answers JSONB NOT NULL DEFAULT '{}'::jsonb, -- {question_id: {answer, individual_score}}
  supporting_documents JSONB DEFAULT '[]'::jsonb, -- Array of document references
  video_pitch_url VARCHAR(500),
  
  -- Review Process
  assigned_reviewers UUID[] DEFAULT '{}',
  review_notes TEXT,
  feedback_to_applicant TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  decision_date TIMESTAMP WITH TIME ZONE,
  
  -- Follow-up
  acceptance_deadline TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  onboarding_completed BOOLEAN DEFAULT FALSE
);

COMMENT ON TABLE public.yff_applications IS 'Young Founders Floor application management with comprehensive scoring and review process';

-- ============================================================================
-- COURSES
-- ============================================================================
CREATE TABLE public.courses (
  course_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(300) NOT NULL,
  description TEXT,
  objectives TEXT[],
  prerequisites TEXT[],
  
  -- Course Structure
  duration_weeks INTEGER,
  total_modules INTEGER DEFAULT 0,
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  
  -- Content and Resources
  curriculum JSONB DEFAULT '[]'::jsonb, -- Module structure
  resources JSONB DEFAULT '[]'::jsonb, -- Learning materials
  assessment_criteria JSONB DEFAULT '{}'::jsonb,
  
  -- Enrollment and Capacity
  max_enrollment INTEGER,
  current_enrollment INTEGER DEFAULT 0,
  enrollment_deadline TIMESTAMP WITH TIME ZONE,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  
  -- Course Management
  instructors UUID[] DEFAULT '{}', -- Array of individual_ids
  mentors UUID[] DEFAULT '{}',
  is_self_paced BOOLEAN DEFAULT FALSE,
  certification_available BOOLEAN DEFAULT TRUE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_published BOOLEAN DEFAULT FALSE,
  
  -- Extensible Fields
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.courses IS 'Comprehensive course management with flexible curriculum and assessment tracking';

-- ============================================================================
-- CERTIFICATES, BADGES, AND AWARDS (CREATE FIRST)
-- ============================================================================
CREATE TABLE public.certificates (
  certificate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID NOT NULL REFERENCES public.individuals(individual_id) ON DELETE CASCADE,
  
  -- Certificate Details
  name VARCHAR(300) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'certificate' CHECK (type IN ('certificate', 'badge', 'award', 'recognition')),
  category VARCHAR(100), -- course, event, achievement, etc.
  
  -- Issuance
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  issuer VARCHAR(200) NOT NULL DEFAULT '26ideas',
  issued_by UUID REFERENCES public.individuals(individual_id),
  
  -- Verification
  verification_code VARCHAR(100) UNIQUE,
  verification_link VARCHAR(500),
  blockchain_hash VARCHAR(128), -- For blockchain-based certificates
  
  -- Related Entities
  event_id UUID REFERENCES public.events(event_id),
  course_id UUID REFERENCES public.courses(course_id),
  
  -- Certificate Data
  achievement_data JSONB DEFAULT '{}'::jsonb, -- Skills, competencies achieved
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional certificate information
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.certificates IS 'Certificates, badges, and awards with blockchain verification support';

-- ============================================================================
-- COURSE PROGRESS
-- ============================================================================
CREATE TABLE public.course_progress (
  progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(course_id) ON DELETE CASCADE,
  individual_id UUID NOT NULL REFERENCES public.individuals(individual_id) ON DELETE CASCADE,
  
  -- Enrollment
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Progress Tracking
  modules_completed JSONB DEFAULT '[]'::jsonb, -- Array of completed module IDs
  quiz_scores JSONB DEFAULT '{}'::jsonb, -- {module_id: score}
  assignment_scores JSONB DEFAULT '{}'::jsonb,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- Engagement
  time_spent_minutes INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE,
  engagement_level public.engagement_level DEFAULT 'medium',
  
  -- Assessment and Certification
  final_score INTEGER,
  grade VARCHAR(5),
  certificate_issued BOOLEAN DEFAULT FALSE,
  certificate_id UUID REFERENCES public.certificates(certificate_id),
  
  -- Feedback
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  testimonial TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'active', 'completed', 'dropped', 'suspended')),
  
  UNIQUE (course_id, individual_id)
);

COMMENT ON TABLE public.course_progress IS 'Detailed course progress tracking with engagement analytics and certification management';

-- ============================================================================
-- SPONSORSHIPS
-- ============================================================================
CREATE TABLE public.sponsorships (
  sponsorship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Sponsor Information
  company_name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(200),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  
  -- Sponsorship Details
  type public.sponsorship_type NOT NULL,
  amount DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'USD',
  value_in_kind_description TEXT,
  
  -- Duration and Terms
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_data JSONB DEFAULT '{}'::jsonb, -- Flexible duration tracking
  renewal_terms TEXT,
  
  -- Commitments and Benefits
  sponsor_commitments TEXT,
  sponsor_benefits TEXT,
  deliverables JSONB DEFAULT '[]'::jsonb,
  
  -- Linked Entities
  linked_event_id UUID REFERENCES public.events(event_id),
  linked_course_id UUID REFERENCES public.courses(course_id),
  linked_chapter_id UUID REFERENCES public.chapters(chapter_id),
  linked_program VARCHAR(100),
  
  -- Contract and Legal
  contract_document_url VARCHAR(500),
  legal_terms TEXT,
  payment_terms JSONB DEFAULT '{}'::jsonb,
  invoice_data JSONB DEFAULT '[]'::jsonb,
  
  -- Status and Management
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('proposed', 'negotiating', 'active', 'completed', 'cancelled', 'expired')),
  managed_by UUID REFERENCES public.individuals(individual_id),
  
  -- Performance Tracking
  impact_metrics JSONB DEFAULT '{}'::jsonb,
  roi_data JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.sponsorships IS 'Comprehensive sponsorship management with ROI tracking and flexible terms';

-- ============================================================================
-- MENTORSHIP RELATIONSHIPS
-- ============================================================================
CREATE TABLE public.mentorships (
  mentorship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES public.individuals(individual_id) ON DELETE CASCADE,
  mentee_id UUID NOT NULL REFERENCES public.individuals(individual_id) ON DELETE CASCADE,
  
  -- Relationship Setup
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  status public.mentorship_status DEFAULT 'requested',
  
  -- Mentorship Program
  program_type VARCHAR(100), -- formal, informal, group, peer
  duration_weeks INTEGER,
  meeting_frequency VARCHAR(50), -- weekly, biweekly, monthly
  goals TEXT[],
  focus_areas TEXT[],
  
  -- Meeting Management
  meetings_data JSONB DEFAULT '[]'::jsonb, -- Array of meeting records
  total_meetings INTEGER DEFAULT 0,
  missed_meetings INTEGER DEFAULT 0,
  next_meeting_date TIMESTAMP WITH TIME ZONE,
  
  -- Documentation
  notes TEXT,
  mentor_feedback TEXT,
  mentee_feedback TEXT,
  progress_notes JSONB DEFAULT '[]'::jsonb,
  
  -- Outcomes and Assessment
  goals_achieved TEXT[],
  skills_developed TEXT[],
  outcomes_summary TEXT,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  
  -- Matching Algorithm Data
  matching_score INTEGER, -- Algorithm-based compatibility score
  matching_criteria JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE (mentor_id, mentee_id, started_at)
);

COMMENT ON TABLE public.mentorships IS 'Comprehensive mentorship relationship management with outcome tracking';

-- ============================================================================
-- TEAM ROLES & RESPONSIBILITIES
-- ============================================================================
CREATE TABLE public.team_roles (
  team_role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID NOT NULL REFERENCES public.individuals(individual_id) ON DELETE CASCADE,
  
  -- Role Details
  designation VARCHAR(200) NOT NULL,
  department VARCHAR(100),
  team VARCHAR(100),
  level VARCHAR(50), -- intern, junior, senior, lead, manager, director
  
  -- Responsibilities
  responsibilities TEXT[],
  skills_required TEXT[],
  reporting_to UUID REFERENCES public.individuals(individual_id),
  
  -- Employment Details
  employment_type VARCHAR(50) CHECK (employment_type IN ('full_time', 'part_time', 'volunteer', 'intern', 'consultant', 'advisor')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  
  -- Performance and Development
  kpis JSONB DEFAULT '[]'::jsonb, -- Key Performance Indicators
  performance_reviews JSONB DEFAULT '[]'::jsonb,
  development_goals TEXT[],
  
  -- Compensation (if applicable)
  compensation_data JSONB DEFAULT '{}'::jsonb, -- Encrypted/sensitive data
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.team_roles IS 'Team roles and responsibilities management with performance tracking';

-- ============================================================================
-- NOTIFICATIONS & COMMUNICATION TRACKING
-- ============================================================================
CREATE TABLE public.notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID NOT NULL REFERENCES public.individuals(individual_id) ON DELETE CASCADE,
  
  -- Notification Details
  type public.notification_type NOT NULL,
  channel VARCHAR(50), -- email_provider, sms_provider, slack_channel, etc.
  subject VARCHAR(300),
  content TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Targeting and Personalization
  audience_segment VARCHAR(100),
  personalization_data JSONB DEFAULT '{}'::jsonb,
  ab_test_variant VARCHAR(50),
  
  -- Delivery Tracking
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Engagement Tracking
  opened_at TIMESTAMP WITH TIME ZONE,
  first_click_at TIMESTAMP WITH TIME ZONE,
  total_clicks INTEGER DEFAULT 0,
  click_data JSONB DEFAULT '[]'::jsonb, -- Track individual clicks
  responded_at TIMESTAMP WITH TIME ZONE,
  response_data JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'delivered', 'opened', 'clicked', 'responded', 'failed', 'bounced')),
  
  -- Related Entities
  event_id UUID REFERENCES public.events(event_id),
  course_id UUID REFERENCES public.courses(course_id),
  campaign_id UUID, -- For marketing campaigns
  
  -- Third-party Integration IDs
  external_message_id VARCHAR(200),
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.notifications IS 'Comprehensive notification and communication tracking with engagement analytics';

-- ============================================================================
-- ANALYTICS AND ENGAGEMENT METRICS
-- ============================================================================
CREATE TABLE public.analytics_events (
  analytics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID REFERENCES public.individuals(individual_id) ON DELETE CASCADE,
  session_id UUID,
  
  -- Event Details
  event_type VARCHAR(100) NOT NULL, -- page_view, button_click, form_submit, etc.
  event_category VARCHAR(100),
  event_action VARCHAR(100),
  event_label VARCHAR(200),
  event_value INTEGER,
  
  -- Context
  page_url VARCHAR(500),
  referrer VARCHAR(500),
  user_agent TEXT,
  ip_address INET,
  device_type VARCHAR(50),
  browser VARCHAR(50),
  platform VARCHAR(50),
  
  -- Timing
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_seconds INTEGER,
  
  -- Custom Properties
  properties JSONB DEFAULT '{}'::jsonb,
  
  -- Related Entities
  event_id UUID REFERENCES public.events(event_id),
  course_id UUID REFERENCES public.courses(course_id),
  chapter_id UUID REFERENCES public.chapters(chapter_id)
);

COMMENT ON TABLE public.analytics_events IS 'Comprehensive analytics event tracking for user behavior analysis';

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Individuals table indexes
CREATE INDEX idx_individuals_email ON public.individuals(email);
CREATE INDEX idx_individuals_mobile ON public.individuals(mobile);
CREATE INDEX idx_individuals_roles ON public.individuals(is_founder, is_mentor, is_advisor, is_judge, is_investor, is_parent);
CREATE INDEX idx_individuals_location ON public.individuals(city, state, country);
CREATE INDEX idx_individuals_active ON public.individuals(is_active);
CREATE INDEX idx_individuals_privacy ON public.individuals(privacy_consent, spi_retraction);
CREATE INDEX idx_individuals_profile_completion ON public.individuals(profile_completion);

-- User roles indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_individual_id ON public.user_roles(individual_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_user_roles_active ON public.user_roles(is_active);

-- Events indexes
CREATE INDEX idx_events_type ON public.events(type);
CREATE INDEX idx_events_dates ON public.events(start_date, end_date);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_chapter ON public.events(chapter_id);
CREATE INDEX idx_events_public ON public.events(is_public);

-- Event participation indexes
CREATE INDEX idx_event_participation_event ON public.event_participation(event_id);
CREATE INDEX idx_event_participation_individual ON public.event_participation(individual_id);
CREATE INDEX idx_event_participation_status ON public.event_participation(rsvp_status);

-- Chapters indexes
CREATE INDEX idx_chapters_location ON public.chapters(city, state, country);
CREATE INDEX idx_chapters_active ON public.chapters(is_active);

-- Chapter members indexes
CREATE INDEX idx_chapter_members_chapter ON public.chapter_members(chapter_id);
CREATE INDEX idx_chapter_members_individual ON public.chapter_members(individual_id);
CREATE INDEX idx_chapter_members_status ON public.chapter_members(status);

-- Courses indexes
CREATE INDEX idx_courses_active ON public.courses(is_active, is_published);
CREATE INDEX idx_courses_dates ON public.courses(start_date, end_date);
CREATE INDEX idx_courses_difficulty ON public.courses(difficulty_level);

-- Course progress indexes
CREATE INDEX idx_course_progress_course ON public.course_progress(course_id);
CREATE INDEX idx_course_progress_individual ON public.course_progress(individual_id);
CREATE INDEX idx_course_progress_status ON public.course_progress(status);
CREATE INDEX idx_course_progress_completion ON public.course_progress(completion_percentage);

-- Mentorships indexes
CREATE INDEX idx_mentorships_mentor ON public.mentorships(mentor_id);
CREATE INDEX idx_mentorships_mentee ON public.mentorships(mentee_id);
CREATE INDEX idx_mentorships_status ON public.mentorships(status);

-- Notifications indexes
CREATE INDEX idx_notifications_individual ON public.notifications(individual_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_sent_at ON public.notifications(sent_at);
CREATE INDEX idx_notifications_status ON public.notifications(status);

-- Analytics indexes
CREATE INDEX idx_analytics_individual ON public.analytics_events(individual_id);
CREATE INDEX idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_occurred_at ON public.analytics_events(occurred_at);
CREATE INDEX idx_analytics_session ON public.analytics_events(session_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.individuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_child ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yff_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS public.app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_roles 
  WHERE user_id = user_uuid AND is_active = true 
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'moderator' THEN 3
      ELSE 4
    END
  LIMIT 1;
$$;

-- Create function to get user's individual_id
CREATE OR REPLACE FUNCTION public.get_user_individual_id(user_uuid UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT individual_id FROM public.user_roles 
  WHERE user_id = user_uuid AND is_active = true 
  LIMIT 1;
$$;

-- Individuals RLS Policies
CREATE POLICY "Users can view their own profile" ON public.individuals
  FOR SELECT USING (individual_id = public.get_user_individual_id());

CREATE POLICY "Admins can view all profiles" ON public.individuals
  FOR SELECT USING (public.get_user_role() IN ('super_admin', 'admin'));

CREATE POLICY "Users can update their own profile" ON public.individuals
  FOR UPDATE USING (individual_id = public.get_user_individual_id());

CREATE POLICY "Admins can update all profiles" ON public.individuals
  FOR UPDATE USING (public.get_user_role() IN ('super_admin', 'admin'));

CREATE POLICY "Admins can insert profiles" ON public.individuals
  FOR INSERT WITH CHECK (public.get_user_role() IN ('super_admin', 'admin'));

-- User Roles RLS Policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin'));

-- Events RLS Policies
CREATE POLICY "Everyone can view public events" ON public.events
  FOR SELECT USING (is_public = true OR public.get_user_role() IS NOT NULL);

CREATE POLICY "Organizers can manage events" ON public.events
  FOR ALL USING (
    public.get_user_role() IN ('super_admin', 'admin', 'moderator') OR
    public.get_user_individual_id() = ANY(organizers)
  );

-- Event Participation RLS Policies
CREATE POLICY "Users can view their own participation" ON public.event_participation
  FOR SELECT USING (individual_id = public.get_user_individual_id());

CREATE POLICY "Users can manage their own participation" ON public.event_participation
  FOR ALL USING (individual_id = public.get_user_individual_id());

CREATE POLICY "Event organizers can view all participation" ON public.event_participation
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.event_id = event_participation.event_id 
      AND public.get_user_individual_id() = ANY(e.organizers)
    ) OR public.get_user_role() IN ('super_admin', 'admin')
  );

-- Courses RLS Policies
CREATE POLICY "Everyone can view published courses" ON public.courses
  FOR SELECT USING (is_published = true OR public.get_user_role() IS NOT NULL);

CREATE POLICY "Instructors can manage their courses" ON public.courses
  FOR ALL USING (
    public.get_user_role() IN ('super_admin', 'admin') OR
    public.get_user_individual_id() = ANY(instructors)
  );

-- Course Progress RLS Policies
CREATE POLICY "Users can view their own progress" ON public.course_progress
  FOR SELECT USING (individual_id = public.get_user_individual_id());

CREATE POLICY "Users can manage their own progress" ON public.course_progress
  FOR ALL USING (individual_id = public.get_user_individual_id());

-- Mentorships RLS Policies
CREATE POLICY "Users can view their mentorships" ON public.mentorships
  FOR SELECT USING (
    mentor_id = public.get_user_individual_id() OR 
    mentee_id = public.get_user_individual_id() OR
    public.get_user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY "Users can manage their mentorships" ON public.mentorships
  FOR ALL USING (
    mentor_id = public.get_user_individual_id() OR 
    mentee_id = public.get_user_individual_id() OR
    public.get_user_role() IN ('super_admin', 'admin')
  );

-- Notifications RLS Policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (individual_id = public.get_user_individual_id());

CREATE POLICY "Admins can manage all notifications" ON public.notifications
  FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'moderator'));

-- Analytics RLS Policies
CREATE POLICY "Users can view their own analytics" ON public.analytics_events
  FOR SELECT USING (individual_id = public.get_user_individual_id());

CREATE POLICY "Admins can view all analytics" ON public.analytics_events
  FOR SELECT USING (public.get_user_role() IN ('super_admin', 'admin'));

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Create trigger for automatic timestamp updates on individuals
CREATE TRIGGER update_individuals_updated_at
  BEFORE UPDATE ON public.individuals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on chapters
CREATE TRIGGER update_chapters_updated_at
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on events
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on courses
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on sponsorships
CREATE TRIGGER update_sponsorships_updated_at
  BEFORE UPDATE ON public.sponsorships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on team_roles
CREATE TRIGGER update_team_roles_updated_at
  BEFORE UPDATE ON public.team_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- DATA INTEGRITY CONSTRAINTS
-- ============================================================================

-- Ensure event end date is after start date
ALTER TABLE public.events ADD CONSTRAINT check_event_dates 
  CHECK (end_date >= start_date);

-- Ensure course end date is after start date
ALTER TABLE public.courses ADD CONSTRAINT check_course_dates 
  CHECK (end_date >= start_date OR end_date IS NULL);

-- Ensure mentorship end date is after start date
ALTER TABLE public.mentorships ADD CONSTRAINT check_mentorship_dates 
  CHECK (ended_at >= started_at OR ended_at IS NULL);

-- Ensure sponsorship end date is after start date
ALTER TABLE public.sponsorships ADD CONSTRAINT check_sponsorship_dates 
  CHECK (end_date >= start_date);

-- Ensure certificate expiry is after issue date
ALTER TABLE public.certificates ADD CONSTRAINT check_certificate_dates 
  CHECK (expiry_date >= issue_date OR expiry_date IS NULL);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for active ecosystem participants
CREATE VIEW public.active_participants AS
SELECT 
  i.*,
  array_agg(DISTINCT ur.role) FILTER (WHERE ur.is_active = true) as roles,
  count(DISTINCT ep.event_id) as events_attended,
  count(DISTINCT cp.course_id) as courses_enrolled
FROM public.individuals i
LEFT JOIN public.user_roles ur ON i.individual_id = ur.individual_id
LEFT JOIN public.event_participation ep ON i.individual_id = ep.individual_id AND ep.attendance_confirmed = true
LEFT JOIN public.course_progress cp ON i.individual_id = cp.individual_id
WHERE i.is_active = true
GROUP BY i.individual_id;

-- View for upcoming events
CREATE VIEW public.upcoming_events AS
SELECT 
  e.*,
  c.name as chapter_name,
  count(ep.individual_id) as registered_count
FROM public.events e
LEFT JOIN public.chapters c ON e.chapter_id = c.chapter_id
LEFT JOIN public.event_participation ep ON e.event_id = ep.event_id
WHERE e.start_date > now() AND e.is_active = true
GROUP BY e.event_id, c.name
ORDER BY e.start_date;

-- ============================================================================
-- EXTENSIBILITY HOOKS
-- ============================================================================

-- Create a function for third-party integrations
CREATE OR REPLACE FUNCTION public.sync_external_data(
  entity_type VARCHAR,
  entity_id UUID,
  external_system VARCHAR,
  external_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function can be extended to sync data with external systems
  -- like Zoho, Slack, OpenAI, Perplexity, Social Vista, Synthesia
  
  CASE entity_type
    WHEN 'individual' THEN
      UPDATE public.individuals 
      SET metadata = metadata || jsonb_build_object(external_system, external_data)
      WHERE individual_id = entity_id;
    
    WHEN 'event' THEN
      UPDATE public.events 
      SET metadata = metadata || jsonb_build_object(external_system, external_data)
      WHERE event_id = entity_id;
    
    WHEN 'course' THEN
      UPDATE public.courses 
      SET metadata = metadata || jsonb_build_object(external_system, external_data)
      WHERE course_id = entity_id;
    
    ELSE
      RETURN FALSE;
  END CASE;
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.sync_external_data IS 'Extensible function for syncing data with third-party services (Zoho, Slack, OpenAI, etc.)';