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
      country_codes: {
        Row: {
          country_code: string
          country_flag_emoji: string | null
          country_id: string
          country_name: string
          created_at: string
          is_active: boolean
          iso_code: string
          updated_at: string
        }
        Insert: {
          country_code: string
          country_flag_emoji?: string | null
          country_id?: string
          country_name: string
          created_at?: string
          is_active?: boolean
          iso_code: string
          updated_at?: string
        }
        Update: {
          country_code?: string
          country_flag_emoji?: string | null
          country_id?: string
          country_name?: string
          created_at?: string
          is_active?: boolean
          iso_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      individuals: {
        Row: {
          country_code: string | null
          country_iso_code: string | null
          created_at: string
          data_processing_consent: boolean
          email: string
          email_verified: boolean
          first_name: string
          individual_id: string
          is_active: boolean
          last_name: string
          privacy_consent: boolean
          updated_at: string
        }
        Insert: {
          country_code?: string | null
          country_iso_code?: string | null
          created_at?: string
          data_processing_consent?: boolean
          email: string
          email_verified?: boolean
          first_name: string
          individual_id?: string
          is_active?: boolean
          last_name: string
          privacy_consent?: boolean
          updated_at?: string
        }
        Update: {
          country_code?: string | null
          country_iso_code?: string | null
          created_at?: string
          data_processing_consent?: boolean
          email?: string
          email_verified?: boolean
          first_name?: string
          individual_id?: string
          is_active?: boolean
          last_name?: string
          privacy_consent?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      mentor_applications: {
        Row: {
          application_id: string
          application_status: string
          availability_days: Json | null
          availability_notes: string | null
          availability_time: string | null
          city: string | null
          country: string | null
          country_code: string | null
          country_iso_code: string | null
          created_at: string
          email_updates_consent: boolean | null
          individual_id: string
          instagram_handle: string | null
          linkedin_url: string | null
          phone_number: string | null
          reviewed_at: string | null
          reviewer_notes: string | null
          sms_updates_consent: boolean | null
          submitted_at: string
          topics_of_interest: Json | null
          updated_at: string
        }
        Insert: {
          application_id?: string
          application_status?: string
          availability_days?: Json | null
          availability_notes?: string | null
          availability_time?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          country_iso_code?: string | null
          created_at?: string
          email_updates_consent?: boolean | null
          individual_id: string
          instagram_handle?: string | null
          linkedin_url?: string | null
          phone_number?: string | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          sms_updates_consent?: boolean | null
          submitted_at?: string
          topics_of_interest?: Json | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          application_status?: string
          availability_days?: Json | null
          availability_notes?: string | null
          availability_time?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          country_iso_code?: string | null
          created_at?: string
          email_updates_consent?: boolean | null
          individual_id?: string
          instagram_handle?: string | null
          linkedin_url?: string | null
          phone_number?: string | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          sms_updates_consent?: boolean | null
          submitted_at?: string
          topics_of_interest?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_mentor_applications_individual_id"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["individual_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          individual_id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          individual_id: string
          is_active?: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          individual_id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
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
          answers: Json
          application_id: string
          application_round: string | null
          created_at: string
          cumulative_score: number | null
          individual_id: string
          reviewer_scores: Json | null
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          answers?: Json
          application_id?: string
          application_round?: string | null
          created_at?: string
          cumulative_score?: number | null
          individual_id: string
          reviewer_scores?: Json | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          answers?: Json
          application_id?: string
          application_round?: string | null
          created_at?: string
          cumulative_score?: number | null
          individual_id?: string
          reviewer_scores?: Json | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "yff_applications_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["individual_id"]
          },
        ]
      }
      yff_team_registration_autosave: {
        Row: {
          created_at: string | null
          form_data: Json
          id: string
          individual_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          form_data?: Json
          id?: string
          individual_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          form_data?: Json
          id?: string
          individual_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      yff_team_registrations: {
        Row: {
          application_status: string | null
          country_code: string
          course_program: string
          created_at: string
          current_city: string
          current_year_of_study: string
          date_of_birth: string
          email: string
          expected_graduation: string
          full_name: string
          gender: string
          id: string
          individual_id: string
          industry_sector: string | null
          institution_name: string
          linkedin_profile: string | null
          number_of_team_members: number | null
          permanent_address: string
          phone_number: string
          pin_code: string
          questionnaire_answers: Json | null
          questionnaire_completed_at: string | null
          referral_id: string | null
          social_media_handles: string | null
          state: string
          team_members: Json | null
          team_name: string | null
          updated_at: string
          venture_name: string | null
          website: string | null
        }
        Insert: {
          application_status?: string | null
          country_code?: string
          course_program: string
          created_at?: string
          current_city: string
          current_year_of_study: string
          date_of_birth: string
          email: string
          expected_graduation: string
          full_name: string
          gender: string
          id?: string
          individual_id: string
          industry_sector?: string | null
          institution_name: string
          linkedin_profile?: string | null
          number_of_team_members?: number | null
          permanent_address: string
          phone_number: string
          pin_code: string
          questionnaire_answers?: Json | null
          questionnaire_completed_at?: string | null
          referral_id?: string | null
          social_media_handles?: string | null
          state: string
          team_members?: Json | null
          team_name?: string | null
          updated_at?: string
          venture_name?: string | null
          website?: string | null
        }
        Update: {
          application_status?: string | null
          country_code?: string
          course_program?: string
          created_at?: string
          current_city?: string
          current_year_of_study?: string
          date_of_birth?: string
          email?: string
          expected_graduation?: string
          full_name?: string
          gender?: string
          id?: string
          individual_id?: string
          industry_sector?: string | null
          institution_name?: string
          linkedin_profile?: string | null
          number_of_team_members?: number | null
          permanent_address?: string
          phone_number?: string
          pin_code?: string
          questionnaire_answers?: Json | null
          questionnaire_completed_at?: string | null
          referral_id?: string | null
          social_media_handles?: string | null
          state?: string
          team_members?: Json | null
          team_name?: string | null
          updated_at?: string
          venture_name?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "yff_team_registrations_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: true
            referencedRelation: "individuals"
            referencedColumns: ["individual_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_or_update_mentor_profile: {
        Args: { p_email: string; p_first_name?: string; p_last_name?: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "super_admin" | "yff_admin" | "mentor_admin" | "user"
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
      app_role: ["admin", "super_admin", "yff_admin", "mentor_admin", "user"],
    },
  },
} as const
