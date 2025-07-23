export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ambassador_activities: {
        Row: {
          activity_date: string
          activity_id: string
          activity_type: string
          ambassador_id: string
          created_at: string | null
          impact_metrics: Json | null
          notes: string | null
          participants_count: number | null
        }
        Insert: {
          activity_date: string
          activity_id?: string
          activity_type: string
          ambassador_id: string
          created_at?: string | null
          impact_metrics?: Json | null
          notes?: string | null
          participants_count?: number | null
        }
        Update: {
          activity_date?: string
          activity_id?: string
          activity_type?: string
          ambassador_id?: string
          created_at?: string | null
          impact_metrics?: Json | null
          notes?: string | null
          participants_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_activities_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassador_assignments"
            referencedColumns: ["assignment_id"]
          },
        ]
      }
      ambassador_assignments: {
        Row: {
          assigned_at: string | null
          assignment_end_date: string | null
          assignment_id: string
          campus_name: string
          created_at: string | null
          individual_id: string
          mentor_id: string | null
          performance_data: Json | null
          region: string | null
          responsibilities: string[] | null
          status: string | null
          target_metrics: Json | null
          university_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assignment_end_date?: string | null
          assignment_id?: string
          campus_name: string
          created_at?: string | null
          individual_id: string
          mentor_id?: string | null
          performance_data?: Json | null
          region?: string | null
          responsibilities?: string[] | null
          status?: string | null
          target_metrics?: Json | null
          university_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assignment_end_date?: string | null
          assignment_id?: string
          campus_name?: string
          created_at?: string | null
          individual_id?: string
          mentor_id?: string | null
          performance_data?: Json | null
          region?: string | null
          responsibilities?: string[] | null
          status?: string | null
          target_metrics?: Json | null
          university_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_assignments_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "active_participants"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "ambassador_assignments_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "ambassador_assignments_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "active_participants"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "ambassador_assignments_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["individual_id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          analytics_id: string
          browser: string | null
          chapter_id: string | null
          course_id: string | null
          device_type: string | null
          duration_seconds: number | null
          event_action: string | null
          event_category: string | null
          event_id: string | null
          event_label: string | null
          event_type: string
          event_value: number | null
          individual_id: string | null
          ip_address: unknown | null
          occurred_at: string
          page_url: string | null
          platform: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          analytics_id?: string
          browser?: string | null
          chapter_id?: string | null
          course_id?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          event_action?: string | null
          event_category?: string | null
          event_id?: string | null
          event_label?: string | null
          event_type: string
          event_value?: number | null
          individual_id?: string | null
          ip_address?: unknown | null
          occurred_at?: string
          page_url?: string | null
          platform?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          analytics_id?: string
          browser?: string | null
          chapter_id?: string | null
          course_id?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          event_action?: string | null
          event_category?: string | null
          event_id?: string | null
          event_label?: string | null
          event_type?: string
          event_value?: number | null
          individual_id?: string | null
          ip_address?: unknown | null
          occurred_at?: string
          page_url?: string | null
          platform?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["chapter_id"]
          },
          {
            foreignKeyName: "analytics_events_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "analytics_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "analytics_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "upcoming_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "analytics_events_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "active_participants"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "analytics_events_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["individual_id"]
          },
        ]
      }
      certificates: {
        Row: {
          achievement_data: Json | null
          blockchain_hash: string | null
          category: string | null
          certificate_id: string
          course_id: string | null
          created_at: string
          description: string | null
          event_id: string | null
          expiry_date: string | null
          individual_id: string
          is_active: boolean | null
          is_public: boolean | null
          issue_date: string
          issued_by: string | null
          issuer: string
          metadata: Json | null
          name: string
          type: string | null
          verification_code: string | null
          verification_link: string | null
        }
        Insert: {
          achievement_data?: Json | null
          blockchain_hash?: string | null
          category?: string | null
          certificate_id?: string
          course_id?: string | null
          created_at?: string
          description?: string | null
          event_id?: string | null
          expiry_date?: string | null
          individual_id: string
          is_active?: boolean | null
          is_public?: boolean | null
          issue_date?: string
          issued_by?: string | null
          issuer?: string
          metadata?: Json | null
          name: string
          type?: string | null
          verification_code?: string | null
          verification_link?: string | null
        }
        Update: {
          achievement_data?: Json | null
          blockchain_hash?: string | null
          category?: string | null
          certificate_id?: string
          course_id?: string | null
          created_at?: string
          description?: string | null
          event_id?: string | null
          expiry_date?: string | null
          individual_id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          issue_date?: string
          issued_by?: string | null
          issuer?: string
          metadata?: Json | null
          name?: string
          type?: string | null
          verification_code?: string | null
          verification_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "certificates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "certificates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "upcoming_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "certificates_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "active_participants"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "certificates_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "certificates_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "active_participants"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "certificates_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["individual_id"]
          },
        ]
      }
      chapter_members: {
        Row: {
          attendance_data: Json | null
          chapter_id: string
          chapter_member_id: string
          engagement_score: number | null
          individual_id: string
          joined_at: string
          left_at: string | null
          notes: string | null
          role: string | null
          status: string | null
        }
        Insert: {
          attendance_data?: Json | null
          chapter_id: string
          chapter_member_id?: string
          engagement_score?: number | null
          individual_id: string
          joined_at?: string
          left_at?: string | null
          notes?: string | null
          role?: string | null
          status?: string | null
        }
        Update: {
          attendance_data?: Json | null
          chapter_id?: string
          chapter_member_id?: string
          engagement_score?: number | null
          individual_id?: string
          joined_at?: string
          left_at?: string | null
          notes?: string | null
          role?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapter_members_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["chapter_id"]
          },
          {
            foreignKeyName: "chapter_members_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "active_participants"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "chapter_members_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["individual_id"]
          },
        ]
      }
      chapters: {
        Row: {
          address: string | null
          chapter_id: string
          city: string | null
          contact_info: Json | null
          country: string | null
          created_at: string
          current_members_count: number | null
          description: string | null
          is_active: boolean | null
          max_capacity: number | null
          meeting_schedule: Json | null
          name: string
          social_links: Json | null
          state: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          chapter_id?: string
          city?: string | null
          contact_info?: Json | null
          country?: string | null
          created_at?: string
          current_members_count?: number | null
          description?: string | null
          is_active?: boolean | null
          max_capacity?: number | null
          meeting_schedule?: Json | null
          name: string
          social_links?: Json | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          chapter_id?: string
          city?: string | null
          contact_info?: Json | null
          country?: string | null
          created_at?: string
          current_members_count?: number | null
          description?: string | null
          is_active?: boolean | null
          max_capacity?: number | null
          meeting_schedule?: Json | null
          name?: string
          social_links?: Json | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      course_progress: {
        Row: {
          assignment_scores: Json | null
          certificate_id: string | null
          certificate_issued: boolean | null
          completed_at: string | null
          completion_percentage: number | null
          course_id: string
          engagement_level:
            | Database["public"]["Enums"]["engagement_level"]
            | null
          enrolled_at: string
          feedback: string | null
          final_score: number | null
          grade: string | null
          individual_id: string
          last_accessed: string | null
          modules_completed: Json | null
          progress_id: string
          quiz_scores: Json | null
          rating: number | null
          started_at: string | null
          status: string | null
          testimonial: string | null
          time_spent_minutes: number | null
        }
        Insert: {
          assignment_scores?: Json | null
          certificate_id?: string | null
          certificate_issued?: boolean | null
          completed_at?: string | null
          completion_percentage?: number | null
          course_id: string
          engagement_level?:
            | Database["public"]["Enums"]["engagement_level"]
            | null
          enrolled_at?: string
          feedback?: string | null
          final_score?: number | null
          grade?: string | null
          individual_id: string
          last_accessed?: string | null
          modules_completed?: Json | null
          progress_id?: string
          quiz_scores?: Json | null
          rating?: number | null
          started_at?: string | null
          status?: string | null
          testimonial?: string | null
          time_spent_minutes?: number | null
        }
        Update: {
          assignment_scores?: Json | null
          certificate_id?: string | null
          certificate_issued?: boolean | null
          completed_at?: string | null
          completion_percentage?: number | null
          course_id?: string
          engagement_level?:
            | Database["public"]["Enums"]["engagement_level"]
            | null
          enrolled_at?: string
          feedback?: string | null
          final_score?: number | null
          grade?: string | null
          individual_id?: string
          last_accessed?: string | null
          modules_completed?: Json | null
          progress_id?: string
          quiz_scores?: Json | null
          rating?: number | null
          started_at?: string | null
          status?: string | null
          testimonial?: string | null
          time_spent_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["certificate_id"]
          },
          {
            foreignKeyName: "course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_progress_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "active_participants"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "course_progress_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["individual_id"]
          },
        ]
      }
      courses: {
        Row: {
          assessment_criteria: Json | null
          certification_available: boolean | null
          course_id: string
          created_at: string
          current_enrollment: number | null
          curriculum: Json | null
          description: string | null
          difficulty_level: string | null
          duration_weeks: number | null
          end_date: string | null
          enrollment_deadline: string | null
          instructors: string[] | null
          is_active: boolean | null
          is_published: boolean | null
          is_self_paced: boolean | null
          max_enrollment: number | null
          mentors: string[] | null
          metadata: Json | null
          name: string
          objectives: string[] | null
          prerequisites: string[] | null
          resources: Json | null
          start_date: string | null
          total_modules: number | null
          updated_at: string
        }
        Insert: {
          assessment_criteria?: Json | null
          certification_available?: boolean | null
          course_id?: string
          created_at?: string
          current_enrollment?: number | null
          curriculum?: Json | null
          description?: string | null
          difficulty_level?: string | null
          duration_weeks?: number | null
          end_date?: string | null
          enrollment_deadline?: string | null
          instructors?: string[] | null
          is_active?: boolean | null
          is_published?: boolean | null
          is_self_paced?: boolean | null
          max_enrollment?: number | null
          mentors?: string[] | null
          metadata?: Json | null
          name: string
          objectives?: string[] | null
          prerequisites?: string[] | null
          resources?: Json | null
          start_date?: string | null
          total_modules?: number | null
          updated_at?: string
        }
        Update: {
          assessment_criteria?: Json | null
          certification_available?: boolean | null
          course_id?: string
          created_at?: string
          current_enrollment?: number | null
          curriculum?: Json | null
          description?: string | null
          difficulty_level?: string | null
          duration_weeks?: number | null
          end_date?: string | null
          enrollment_deadline?: string | null
          instructors?: string[] | null
          is_active?: boolean | null
          is_published?: boolean | null
          is_self_paced?: boolean | null
          max_enrollment?: number | null
          mentors?: string[] | null
          metadata?: Json | null
          name?: string
          objectives?: string[] | null
          prerequisites?: string[] | null
          resources?: Json | null
          start_date?: string | null
          total_modules?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      event_participation: {
        Row: {
          attendance_confirmed: boolean | null
          check_in_time: string | null
          check_out_time: string | null
          engagement_data: Json | null
          event_id: string
          feedback: string | null
          individual_id: string
          networking_data: Json | null
          participation_id: string
          rating: number | null
          registered_at: string
          role: string | null
          rsvp_status:
            | Database["public"]["Enums"]["participation_status"]
            | null
          session_attendance: Json | null
          testimonial: string | null
        }
        Insert: {
          attendance_confirmed?: boolean | null
          check_in_time?: string | null
          check_out_time?: string | null
          engagement_data?: Json | null
          event_id: string
          feedback?: string | null
          individual_id: string
          networking_data?: Json | null
          participation_id?: string
          rating?: number | null
          registered_at?: string
          role?: string | null
          rsvp_status?:
            | Database["public"]["Enums"]["participation_status"]
            | null
          session_attendance?: Json | null
          testimonial?: string | null
        }
        Update: {
          attendance_confirmed?: boolean | null
          check_in_time?: string | null
          check_out_time?: string | null
          engagement_data?: Json | null
          event_id?: string
          feedback?: string | null
          individual_id?: string
          networking_data?: Json | null
          participation_id?: string
          rating?: number | null
          registered_at?: string
          role?: string | null
          rsvp_status?:
            | Database["public"]["Enums"]["participation_status"]
            | null
          session_attendance?: Json | null
          testimonial?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_participation_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_participation_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "upcoming_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_participation_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "active_participants"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "event_participation_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["individual_id"]
          },
        ]
      }
      events: {
        Row: {
          agenda: Json | null
          chapter_id: string | null
          created_at: string
          created_by: string | null
          current_registrations: number | null
          description: string | null
          end_date: string
          event_id: string
          is_active: boolean | null
          is_public: boolean | null
          is_registration_open: boolean | null
          is_virtual: boolean | null
          location: string | null
          max_capacity: number | null
          meeting_link: string | null
          metadata: Json | null
          name: string
          objectives: string[] | null
          organizers: string[] | null
          registration_deadline: string | null
          requirements: Json | null
          resources: Json | null
          speakers: Json | null
          sponsors: Json | null
          start_date: string
          status: string | null
          timezone: string | null
          type: Database["public"]["Enums"]["event_type"]
          updated_at: string
          venue_details: Json | null
          virtual_platform: string | null
        }
        Insert: {
          agenda?: Json | null
          chapter_id?: string | null
          created_at?: string
          created_by?: string | null
          current_registrations?: number | null
          description?: string | null
          end_date: string
          event_id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          is_registration_open?: boolean | null
          is_virtual?: boolean | null
          location?: string | null
          max_capacity?: number | null
          meeting_link?: string | null
          metadata?: Json | null
          name: string
          objectives?: string[] | null
          organizers?: string[] | null
          registration_deadline?: string | null
          requirements?: Json | null
          resources?: Json | null
          speakers?: Json | null
          sponsors?: Json | null
          start_date: string
          status?: string | null
          timezone?: string | null
          type: Database["public"]["Enums"]["event_type"]
          updated_at?: string
          venue_details?: Json | null
          virtual_platform?: string | null
        }
        Update: {
          agenda?: Json | null
          chapter_id?: string | null
          created_at?: string
          created_by?: string | null
          current_registrations?: number | null
          description?: string | null
          end_date?: string
          event_id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          is_registration_open?: boolean | null
          is_virtual?: boolean | null
          location?: string | null
          max_capacity?: number | null
          meeting_link?: string | null
          metadata?: Json | null
          name?: string
          objectives?: string[] | null
          organizers?: string[] | null
          registration_deadline?: string | null
          requirements?: Json | null
          resources?: Json | null
          speakers?: Json | null
          sponsors?: Json | null
          start_date?: string
          status?: string | null
          timezone?: string | null
          type?: Database["public"]["Enums"]["event_type"]
          updated_at?: string
          venue_details?: Json | null
          virtual_platform?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["chapter_id"]
          },
        ]
      }
      individuals: {
        Row: {
          achievements: Json | null
          active_programs: string[] | null
          alumni_status: boolean | null
          ambassador_performance_score: number | null
          ambassador_region: string | null
          ambassador_status: boolean | null
          ambassador_university: string | null
          availability_for_mentoring: number | null
          background_check_status: string | null
          bio: string | null
          city: string | null
          collaboration_openness: boolean | null
          communication_email: boolean | null
          communication_marketing: boolean | null
          communication_notifications: boolean | null
          communication_sms: boolean | null
          country: string | null
          created_at: string
          created_by: string | null
          current_company: string | null
          data_processing_consent: boolean
          data_retention_date: string | null
          degree_level: string | null
          dob: string | null
          education: Json | null
          email: string
          email_verification_status: boolean | null
          email_verified: boolean | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          facebook: string | null
          first_name: string
          gender: string | null
          graduation_year: number | null
          identity_verification_level: number | null
          individual_id: string
          industry: string | null
          instagram: string | null
          interests: string[] | null
          is_active: boolean | null
          is_advisor: boolean | null
          is_founder: boolean | null
          is_investor: boolean | null
          is_judge: boolean | null
          is_mentor: boolean | null
          is_parent: boolean | null
          job_title: string | null
          languages: string[] | null
          last_activity_date: string | null
          last_login: string | null
          last_name: string
          linkedin: string | null
          marketing_consent: boolean | null
          meeting_preferences: string | null
          mentor_status: boolean | null
          metadata: Json | null
          mobile: string | null
          nationality: string | null
          networking_interests: string[] | null
          notification_frequency: string | null
          onboarding_completed: boolean | null
          phone_verified: boolean | null
          pinterest: string | null
          preferences: Json | null
          privacy_consent: boolean
          professional_experience: Json | null
          profile_completion: number | null
          profile_photo_url: string | null
          program_completion_rate: number | null
          pronouns: string | null
          public_profile: boolean | null
          referral_source: string | null
          secondary_email: string | null
          sectors: string[] | null
          skills: string[] | null
          spi_retraction: boolean | null
          startup_stage: string | null
          state: string | null
          tiktok: string | null
          timezone: string | null
          topics: string[] | null
          twitter: string | null
          university: string | null
          updated_at: string
          updated_by: string | null
          verticals: string[] | null
          whatsapp_number: string | null
          youtube: string | null
        }
        Insert: {
          achievements?: Json | null
          active_programs?: string[] | null
          alumni_status?: boolean | null
          ambassador_performance_score?: number | null
          ambassador_region?: string | null
          ambassador_status?: boolean | null
          ambassador_university?: string | null
          availability_for_mentoring?: number | null
          background_check_status?: string | null
          bio?: string | null
          city?: string | null
          collaboration_openness?: boolean | null
          communication_email?: boolean | null
          communication_marketing?: boolean | null
          communication_notifications?: boolean | null
          communication_sms?: boolean | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          current_company?: string | null
          data_processing_consent?: boolean
          data_retention_date?: string | null
          degree_level?: string | null
          dob?: string | null
          education?: Json | null
          email: string
          email_verification_status?: boolean | null
          email_verified?: boolean | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          facebook?: string | null
          first_name: string
          gender?: string | null
          graduation_year?: number | null
          identity_verification_level?: number | null
          individual_id?: string
          industry?: string | null
          instagram?: string | null
          interests?: string[] | null
          is_active?: boolean | null
          is_advisor?: boolean | null
          is_founder?: boolean | null
          is_investor?: boolean | null
          is_judge?: boolean | null
          is_mentor?: boolean | null
          is_parent?: boolean | null
          job_title?: string | null
          languages?: string[] | null
          last_activity_date?: string | null
          last_login?: string | null
          last_name: string
          linkedin?: string | null
          marketing_consent?: boolean | null
          meeting_preferences?: string | null
          mentor_status?: boolean | null
          metadata?: Json | null
          mobile?: string | null
          nationality?: string | null
          networking_interests?: string[] | null
          notification_frequency?: string | null
          onboarding_completed?: boolean | null
          phone_verified?: boolean | null
          pinterest?: string | null
          preferences?: Json | null
          privacy_consent?: boolean
          professional_experience?: Json | null
          profile_completion?: number | null
          profile_photo_url?: string | null
          program_completion_rate?: number | null
          pronouns?: string | null
          public_profile?: boolean | null
          referral_source?: string | null
          secondary_email?: string | null
          sectors?: string[] | null
          skills?: string[] | null
          spi_retraction?: boolean | null
          startup_stage?: string | null
          state?: string | null
          tiktok?: string | null
          timezone?: string | null
          topics?: string[] | null
          twitter?: string | null
          university?: string | null
          updated_at?: string
          updated_by?: string | null
          verticals?: string[] | null
          whatsapp_number?: string | null
          youtube?: string | null
        }
        Update: {
          achievements?: Json | null
          active_programs?: string[] | null
          alumni_status?: boolean | null
          ambassador_performance_score?: number | null
          ambassador_region?: string | null
          ambassador_status?: boolean | null
          ambassador_university?: string | null
          availability_for_mentoring?: number | null
          background_check_status?: string | null
          bio?: string | null
          city?: string | null
          collaboration_openness?: boolean | null
          communication_email?: boolean | null
          communication_marketing?: boolean | null
          communication_notifications?: boolean | null
          communication_sms?: boolean | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          current_company?: string | null
          data_processing_consent?: boolean
          data_retention_date?: string | null
          degree_level?: string | null
          dob?: string | null
          education?: Json | null
          email?: string
          email_verification_status?: boolean | null
          email_verified?: boolean | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          facebook?: string | null
          first_name?: string
          gender?: string | null
          graduation_year?: number | null
          identity_verification_level?: number | null
          individual_id?: string
          industry?: string | null
          instagram?: string | null
          interests?: string[] | null
          is_active?: boolean | null
          is_advisor?: boolean | null
          is_founder?: boolean | null
          is_investor?: boolean | null
          is_judge?: boolean | null
          is_mentor?: boolean | null
          is_parent?: boolean | null
          job_title?: string | null
          languages?: string[] | null
          last_activity_date?: string | null
          last_login?: string | null
          last_name?: string
          linkedin?: string | null
          marketing_consent?: boolean | null
          meeting_preferences?: string | null
          mentor_status?: boolean | null
          metadata?: Json | null
          mobile?: string | null
          nationality?: string | null
          networking_interests?: string[] | null
          notification_frequency?: string | null
          onboarding_completed?: boolean | null
          phone_verified?: boolean | null
          pinterest?: string | null
          preferences?: Json | null
          privacy_consent?: boolean
          professional_experience?: Json | null
          profile_completion?: number | null
          profile_photo_url?: string | null
          program_completion_rate?: number | null
          pronouns?: string | null
          public_profile?: boolean | null
          referral_source?: string | null
          secondary_email?: string | null
          sectors?: string[] | null
          skills?: string[] | null
          spi_retraction?: boolean | null
          startup_stage?: string | null
          state?: string | null
          tiktok?: string | null
          timezone?: string | null
          topics?: string[] | null
          twitter?: string | null
          university?: string | null
          updated_at?: string
          updated_by?: string | null
          verticals?: string[] | null
          whatsapp_number?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      mentorships: {
        Row: {
          duration_weeks: number | null
          ended_at: string | null
          focus_areas: string[] | null
          goals: string[] | null
          goals_achieved: string[] | null
          matching_criteria: Json | null
          matching_score: number | null
          meeting_frequency: string | null
          meetings_data: Json | null
          mentee_feedback: string | null
          mentee_id: string
          mentor_feedback: string | null
          mentor_id: string
          mentorship_id: string
          missed_meetings: number | null
          next_meeting_date: string | null
          notes: string | null
          outcomes_summary: string | null
          program_type: string | null
          progress_notes: Json | null
          requested_at: string
          satisfaction_rating: number | null
          skills_developed: string[] | null
          started_at: string | null
          status: Database["public"]["Enums"]["mentorship_status"] | null
          total_meetings: number | null
        }
        Insert: {
          duration_weeks?: number | null
          ended_at?: string | null
          focus_areas?: string[] | null
          goals?: string[] | null
          goals_achieved?: string[] | null
          matching_criteria?: Json | null
          matching_score?: number | null
          meeting_frequency?: string | null
          meetings_data?: Json | null
          mentee_feedback?: string | null
          mentee_id: string
          mentor_feedback?: string | null
          mentor_id: string
          mentorship_id?: string
          missed_meetings?: number | null
          next_meeting_date?: string | null
          notes?: string | null
          outcomes_summary?: string | null
          program_type?: string | null
          progress_notes?: Json | null
          requested_at?: string
          satisfaction_rating?: number | null
          skills_developed?: string[] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["mentorship_status"] | null
          total_meetings?: number | null
        }
        Update: {
          duration_weeks?: number | null
          ended_at?: string | null
          focus_areas?: string[] | null
          goals?: string[] | null
          goals_achieved?: string[] | null
          matching_criteria?: Json | null
          matching_score?: number | null
          meeting_frequency?: string | null
          meetings_data?: Json | null
          mentee_feedback?: string | null
          mentee_id?: string
          mentor_feedback?: string | null
          mentor_id?: string
          mentorship_id?: string
          missed_meetings?: number | null
          next_meeting_date?: string | null
          notes?: string | null
          outcomes_summary?: string | null
          program_type?: string | null
          progress_notes?: Json | null
          requested_at?: string
          satisfaction_rating?: number | null
          skills_developed?: string[] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["mentorship_status"] | null
          total_meetings?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mentorships_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "active_participants"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "mentorships_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "mentorships_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "active_participants"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "mentorships_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["individual_id"]
          },
        ]
      }
      notifications: {
        Row: {
          ab_test_variant: string | null
          audience_segment: string | null
          campaign_id: string | null
          channel: string | null
          click_data: Json | null
          content: string
          course_id: string | null
          delivered_at: string | null
          event_id: string | null
          external_message_id: string | null
          failed_at: string | null
          failure_reason: string | null
          first_click_at: string | null
          individual_id: string
          metadata: Json | null
          notification_id: string
          opened_at: string | null
          personalization_data: Json | null
          priority: string | null
          responded_at: string | null
          response_data: Json | null
          retry_count: number | null
          sent_at: string
          status: string | null
          subject: string | null
          total_clicks: number | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          ab_test_variant?: string | null
          audience_segment?: string | null
          campaign_id?: string | null
          channel?: string | null
          click_data?: Json | null
          content: string
          course_id?: string | null
          delivered_at?: string | null
          event_id?: string | null
          external_message_id?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          first_click_at?: string | null
          individual_id: string
          metadata?: Json | null
          notification_id?: string
          opened_at?: string | null
          personalization_data?: Json | null
          priority?: string | null
          responded_at?: string | null
          response_data?: Json | null
          retry_count?: number | null
          sent_at?: string
          status?: string | null
          subject?: string | null
          total_clicks?: number | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          ab_test_variant?: string | null
          audience_segment?: string | null
          campaign_id?: string | null
          channel?: string | null
          click_data?: Json | null
          content?: string
          course_id?: string | null
          delivered_at?: string | null
          event_id?: string | null
          external_message_id?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          first_click_at?: string | null
          individual_id?: string
          metadata?: Json | null
          notification_id?: string
          opened_at?: string | null
          personalization_data?: Json | null
          priority?: string | null
          responded_at?: string | null
          response_data?: Json | null
          retry_count?: number | null
          sent_at?: string
          status?: string | null
          subject?: string | null
          total_clicks?: number | null
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "upcoming_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "notifications_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "active_participants"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "notifications_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["individual_id"]
          },
        ]
      }
      parent_child: {
        Row: {
          child_id: string
          consent_provided: boolean | null
          created_at: string
          parent_id: string
          relationship_id: string
          relationship_type: string | null
        }
        Insert: {
          child_id: string
          consent_provided?: boolean | null
          created_at?: string
          parent_id: string
          relationship_id?: string
          relationship_type?: string | null
        }
        Update: {
          child_id?: string
          consent_provided?: boolean | null
          created_at?: string
          parent_id?: string
          relationship_id?: string
          relationship_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_child_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "active_participants"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "parent_child_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "parent_child_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "active_participants"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "parent_child_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["individual_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      program_enrollments: {
        Row: {
          achievements: Json | null
          completion_date: string | null
          completion_percentage: number | null
          created_at: string | null
          enrollment_date: string | null
          enrollment_id: string
          individual_id: string
          notes: string | null
          program_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          achievements?: Json | null
          completion_date?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          enrollment_date?: string | null
          enrollment_id?: string
          individual_id: string
          notes?: string | null
          program_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          achievements?: Json | null
          completion_date?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          enrollment_date?: string | null
          enrollment_id?: string
          individual_id?: string
          notes?: string | null
          program_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_enrollments_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "active_participants"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "program_enrollments_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "program_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["program_id"]
          },
        ]
      }
      programs: {
        Row: {
          age_requirements: Json | null
          created_at: string | null
          description: string | null
          duration_months: number | null
          eligibility_criteria: Json | null
          is_active: boolean | null
          name: string
          program_id: string
          program_type: string
          updated_at: string | null
        }
        Insert: {
          age_requirements?: Json | null
          created_at?: string | null
          description?: string | null
          duration_months?: number | null
          eligibility_criteria?: Json | null
          is_active?: boolean | null
          name: string
          program_id?: string
          program_type: string
          updated_at?: string | null
        }
        Update: {
          age_requirements?: Json | null
          created_at?: string | null
          description?: string | null
          duration_months?: number | null
          eligibility_criteria?: Json | null
          is_active?: boolean | null
          name?: string
          program_id?: string
          program_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sponsorships: {
        Row: {
          amount: number | null
          company_name: string
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          contract_document_url: string | null
          created_at: string
          currency: string | null
          deliverables: Json | null
          duration_data: Json | null
          end_date: string
          impact_metrics: Json | null
          invoice_data: Json | null
          legal_terms: string | null
          linked_chapter_id: string | null
          linked_course_id: string | null
          linked_event_id: string | null
          linked_program: string | null
          managed_by: string | null
          payment_terms: Json | null
          renewal_terms: string | null
          roi_data: Json | null
          sponsor_benefits: string | null
          sponsor_commitments: string | null
          sponsorship_id: string
          start_date: string
          status: string | null
          type: Database["public"]["Enums"]["sponsorship_type"]
          updated_at: string
          value_in_kind_description: string | null
        }
        Insert: {
          amount?: number | null
          company_name: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contract_document_url?: string | null
          created_at?: string
          currency?: string | null
          deliverables?: Json | null
          duration_data?: Json | null
          end_date: string
          impact_metrics?: Json | null
          invoice_data?: Json | null
          legal_terms?: string | null
          linked_chapter_id?: string | null
          linked_course_id?: string | null
          linked_event_id?: string | null
          linked_program?: string | null
          managed_by?: string | null
          payment_terms?: Json | null
          renewal_terms?: string | null
          roi_data?: Json | null
          sponsor_benefits?: string | null
          sponsor_commitments?: string | null
          sponsorship_id?: string
          start_date: string
          status?: string | null
          type: Database["public"]["Enums"]["sponsorship_type"]
          updated_at?: string
          value_in_kind_description?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contract_document_url?: string | null
          created_at?: string
          currency?: string | null
          deliverables?: Json | null
          duration_data?: Json | null
          end_date?: string
          impact_metrics?: Json | null
          invoice_data?: Json | null
          legal_terms?: string | null
          linked_chapter_id?: string | null
          linked_course_id?: string | null
          linked_event_id?: string | null
          linked_program?: string | null
          managed_by?: string | null
          payment_terms?: Json | null
          renewal_terms?: string | null
          roi_data?: Json | null
          sponsor_benefits?: string | null
          sponsor_commitments?: string | null
          sponsorship_id?: string
          start_date?: string
          status?: string | null
          type?: Database["public"]["Enums"]["sponsorship_type"]
          updated_at?: string
          value_in_kind_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsorships_linked_chapter_id_fkey"
            columns: ["linked_chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["chapter_id"]
          },
          {
            foreignKeyName: "sponsorships_linked_course_id_fkey"
            columns: ["linked_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "sponsorships_linked_event_id_fkey"
            columns: ["linked_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "sponsorships_linked_event_id_fkey"
            columns: ["linked_event_id"]
            isOneToOne: false
            referencedRelation: "upcoming_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "sponsorships_managed_by_fkey"
            columns: ["managed_by"]
            isOneToOne: false
            referencedRelation: "active_participants"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "sponsorships_managed_by_fkey"
            columns: ["managed_by"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["individual_id"]
          },
        ]
      }
      team_roles: {
        Row: {
          compensation_data: Json | null
          created_at: string
          department: string | null
          designation: string
          development_goals: string[] | null
          employment_type: string | null
          end_date: string | null
          individual_id: string
          is_active: boolean | null
          kpis: Json | null
          level: string | null
          performance_reviews: Json | null
          reporting_to: string | null
          responsibilities: string[] | null
          skills_required: string[] | null
          start_date: string
          team: string | null
          team_role_id: string
          updated_at: string
        }
        Insert: {
          compensation_data?: Json | null
          created_at?: string
          department?: string | null
          designation: string
          development_goals?: string[] | null
          employment_type?: string | null
          end_date?: string | null
          individual_id: string
          is_active?: boolean | null
          kpis?: Json | null
          level?: string | null
          performance_reviews?: Json | null
          reporting_to?: string | null
          responsibilities?: string[] | null
          skills_required?: string[] | null
          start_date?: string
          team?: string | null
          team_role_id?: string
          updated_at?: string
        }
        Update: {
          compensation_data?: Json | null
          created_at?: string
          department?: string | null
          designation?: string
          development_goals?: string[] | null
          employment_type?: string | null
          end_date?: string | null
          individual_id?: string
          is_active?: boolean | null
          kpis?: Json | null
          level?: string | null
          performance_reviews?: Json | null
          reporting_to?: string | null
          responsibilities?: string[] | null
          skills_required?: string[] | null
          start_date?: string
          team?: string | null
          team_role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_roles_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "active_participants"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "team_roles_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "team_roles_reporting_to_fkey"
            columns: ["reporting_to"]
            isOneToOne: false
            referencedRelation: "active_participants"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "team_roles_reporting_to_fkey"
            columns: ["reporting_to"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["individual_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assignment_details: Json | null
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          individual_id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          role_metadata: Json | null
          user_id: string
        }
        Insert: {
          assignment_details?: Json | null
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          individual_id: string
          is_active?: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          role_metadata?: Json | null
          user_id: string
        }
        Update: {
          assignment_details?: Json | null
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          individual_id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          role_metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "active_participants"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "user_roles_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["individual_id"]
          },
        ]
      }
      yff_applications: {
        Row: {
          acceptance_deadline: string | null
          accepted_at: string | null
          answers: Json
          application_id: string
          application_round: string | null
          assigned_reviewers: string[] | null
          cumulative_score: number | null
          decision_date: string | null
          evaluation_criteria: Json | null
          feedback_to_applicant: string | null
          individual_id: string
          max_possible_score: number | null
          onboarding_completed: boolean | null
          review_notes: string | null
          reviewed_at: string | null
          reviewer_scores: Json | null
          status: string | null
          submitted_at: string
          supporting_documents: Json | null
          video_pitch_url: string | null
        }
        Insert: {
          acceptance_deadline?: string | null
          accepted_at?: string | null
          answers?: Json
          application_id?: string
          application_round?: string | null
          assigned_reviewers?: string[] | null
          cumulative_score?: number | null
          decision_date?: string | null
          evaluation_criteria?: Json | null
          feedback_to_applicant?: string | null
          individual_id: string
          max_possible_score?: number | null
          onboarding_completed?: boolean | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_scores?: Json | null
          status?: string | null
          submitted_at?: string
          supporting_documents?: Json | null
          video_pitch_url?: string | null
        }
        Update: {
          acceptance_deadline?: string | null
          accepted_at?: string | null
          answers?: Json
          application_id?: string
          application_round?: string | null
          assigned_reviewers?: string[] | null
          cumulative_score?: number | null
          decision_date?: string | null
          evaluation_criteria?: Json | null
          feedback_to_applicant?: string | null
          individual_id?: string
          max_possible_score?: number | null
          onboarding_completed?: boolean | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_scores?: Json | null
          status?: string | null
          submitted_at?: string
          supporting_documents?: Json | null
          video_pitch_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "yff_applications_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "active_participants"
            referencedColumns: ["individual_id"]
          },
          {
            foreignKeyName: "yff_applications_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["individual_id"]
          },
        ]
      }
    }
    Views: {
      active_participants: {
        Row: {
          achievements: Json | null
          alumni_status: boolean | null
          ambassador_status: boolean | null
          city: string | null
          communication_email: boolean | null
          communication_marketing: boolean | null
          communication_notifications: boolean | null
          communication_sms: boolean | null
          country: string | null
          courses_enrolled: number | null
          created_at: string | null
          created_by: string | null
          data_processing_consent: boolean | null
          data_retention_date: string | null
          dob: string | null
          education: Json | null
          email: string | null
          events_attended: number | null
          facebook: string | null
          first_name: string | null
          individual_id: string | null
          instagram: string | null
          interests: string[] | null
          is_active: boolean | null
          is_advisor: boolean | null
          is_founder: boolean | null
          is_investor: boolean | null
          is_judge: boolean | null
          is_mentor: boolean | null
          is_parent: boolean | null
          languages: string[] | null
          last_login: string | null
          last_name: string | null
          linkedin: string | null
          marketing_consent: boolean | null
          mentor_status: boolean | null
          metadata: Json | null
          mobile: string | null
          pinterest: string | null
          preferences: Json | null
          privacy_consent: boolean | null
          professional_experience: Json | null
          profile_completion: number | null
          roles: Database["public"]["Enums"]["app_role"][] | null
          sectors: string[] | null
          skills: string[] | null
          spi_retraction: boolean | null
          state: string | null
          tiktok: string | null
          timezone: string | null
          topics: string[] | null
          twitter: string | null
          updated_at: string | null
          updated_by: string | null
          verticals: string[] | null
          youtube: string | null
        }
        Relationships: []
      }
      upcoming_events: {
        Row: {
          agenda: Json | null
          chapter_id: string | null
          chapter_name: string | null
          created_at: string | null
          created_by: string | null
          current_registrations: number | null
          description: string | null
          end_date: string | null
          event_id: string | null
          is_active: boolean | null
          is_public: boolean | null
          is_registration_open: boolean | null
          is_virtual: boolean | null
          location: string | null
          max_capacity: number | null
          meeting_link: string | null
          metadata: Json | null
          name: string | null
          objectives: string[] | null
          organizers: string[] | null
          registered_count: number | null
          registration_deadline: string | null
          requirements: Json | null
          resources: Json | null
          speakers: Json | null
          sponsors: Json | null
          start_date: string | null
          status: string | null
          timezone: string | null
          type: Database["public"]["Enums"]["event_type"] | null
          updated_at: string | null
          venue_details: Json | null
          virtual_platform: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["chapter_id"]
          },
        ]
      }
    }
    Functions: {
      get_user_individual_id: {
        Args: { user_uuid?: string }
        Returns: string
      }
      get_user_role: {
        Args: { user_uuid?: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      sync_external_data: {
        Args: {
          entity_type: string
          entity_id: string
          external_system: string
          external_data: Json
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "moderator"
        | "mentor"
        | "founder"
        | "parent"
        | "investor"
        | "judge"
        | "advisor"
        | "user"
        | "campus_ambassador"
        | "program_participant"
      engagement_level: "low" | "medium" | "high" | "very_high"
      event_type:
        | "yff"
        | "webinar"
        | "retreat"
        | "meetup"
        | "workshop"
        | "conference"
        | "networking"
      mentorship_status:
        | "requested"
        | "active"
        | "completed"
        | "cancelled"
        | "paused"
      notification_type: "email" | "sms" | "push" | "in_app" | "slack"
      participation_status:
        | "registered"
        | "confirmed"
        | "attended"
        | "no_show"
        | "cancelled"
      sponsorship_type:
        | "financial"
        | "in_kind"
        | "strategic"
        | "venue"
        | "technology"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "admin",
        "moderator",
        "mentor",
        "founder",
        "parent",
        "investor",
        "judge",
        "advisor",
        "user",
        "campus_ambassador",
        "program_participant",
      ],
      engagement_level: ["low", "medium", "high", "very_high"],
      event_type: [
        "yff",
        "webinar",
        "retreat",
        "meetup",
        "workshop",
        "conference",
        "networking",
      ],
      mentorship_status: [
        "requested",
        "active",
        "completed",
        "cancelled",
        "paused",
      ],
      notification_type: ["email", "sms", "push", "in_app", "slack"],
      participation_status: [
        "registered",
        "confirmed",
        "attended",
        "no_show",
        "cancelled",
      ],
      sponsorship_type: [
        "financial",
        "in_kind",
        "strategic",
        "venue",
        "technology",
      ],
    },
  },
} as const
