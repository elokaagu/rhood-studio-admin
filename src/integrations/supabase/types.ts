export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  public: {
    Tables: {
      ai_insights_sessions: {
        Row: {
          created_at: string | null;
          estimated_cost: number | null;
          id: string;
          input_data: Json;
          input_tokens: number | null;
          insight_type: string;
          insights: Json;
          model: string;
          output_tokens: number | null;
          processing_time_ms: number | null;
          provider: string;
          status: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          estimated_cost?: number | null;
          id?: string;
          input_data: Json;
          input_tokens?: number | null;
          insight_type: string;
          insights: Json;
          model: string;
          output_tokens?: number | null;
          processing_time_ms?: number | null;
          provider: string;
          status?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          estimated_cost?: number | null;
          id?: string;
          input_data?: Json;
          input_tokens?: number | null;
          insight_type?: string;
          insights?: Json;
          model?: string;
          output_tokens?: number | null;
          processing_time_ms?: number | null;
          provider?: string;
          status?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_insights_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_matching_feedback: {
        Row: {
          created_at: string | null;
          feedback_text: string | null;
          feedback_type: string;
          id: string;
          rating: number;
          result_id: string | null;
          user_id: string | null;
          was_applied: boolean | null;
          was_successful: boolean | null;
        };
        Insert: {
          created_at?: string | null;
          feedback_text?: string | null;
          feedback_type: string;
          id?: string;
          rating: number;
          result_id?: string | null;
          user_id?: string | null;
          was_applied?: boolean | null;
          was_successful?: boolean | null;
        };
        Update: {
          created_at?: string | null;
          feedback_text?: string | null;
          feedback_type?: string;
          id?: string;
          rating?: number;
          result_id?: string | null;
          user_id?: string | null;
          was_applied?: boolean | null;
          was_successful?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_matching_feedback_result_id_fkey";
            columns: ["result_id"];
            isOneToOne: false;
            referencedRelation: "ai_matching_results";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_matching_feedback_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_matching_results: {
        Row: {
          ai_metadata: Json | null;
          compatibility_score: number;
          confidence: number;
          confidence_breakdown: Json | null;
          considerations: Json | null;
          created_at: string | null;
          detailed_reasons: Json | null;
          id: string;
          match_type: string;
          opportunity_id: string | null;
          ranking: number;
          reasoning: string;
          session_id: string | null;
          strengths: Json | null;
          user_id: string | null;
        };
        Insert: {
          ai_metadata?: Json | null;
          compatibility_score: number;
          confidence: number;
          confidence_breakdown?: Json | null;
          considerations?: Json | null;
          created_at?: string | null;
          detailed_reasons?: Json | null;
          id?: string;
          match_type: string;
          opportunity_id?: string | null;
          ranking: number;
          reasoning: string;
          session_id?: string | null;
          strengths?: Json | null;
          user_id?: string | null;
        };
        Update: {
          ai_metadata?: Json | null;
          compatibility_score?: number;
          confidence?: number;
          confidence_breakdown?: Json | null;
          considerations?: Json | null;
          created_at?: string | null;
          detailed_reasons?: Json | null;
          id?: string;
          match_type?: string;
          opportunity_id?: string | null;
          ranking?: number;
          reasoning?: string;
          session_id?: string | null;
          strengths?: Json | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_matching_results_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_matching_results_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "ai_matching_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_matching_results_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_matching_sessions: {
        Row: {
          completed_at: string | null;
          configuration: Json;
          created_at: string | null;
          error_message: string | null;
          estimated_cost: number | null;
          id: string;
          input_tokens: number | null;
          model: string;
          output_tokens: number | null;
          processing_time_ms: number | null;
          provider: string;
          scenario: string;
          session_name: string | null;
          status: string | null;
          user_id: string | null;
        };
        Insert: {
          completed_at?: string | null;
          configuration: Json;
          created_at?: string | null;
          error_message?: string | null;
          estimated_cost?: number | null;
          id?: string;
          input_tokens?: number | null;
          model: string;
          output_tokens?: number | null;
          processing_time_ms?: number | null;
          provider: string;
          scenario: string;
          session_name?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
        Update: {
          completed_at?: string | null;
          configuration?: Json;
          created_at?: string | null;
          error_message?: string | null;
          estimated_cost?: number | null;
          id?: string;
          input_tokens?: number | null;
          model?: string;
          output_tokens?: number | null;
          processing_time_ms?: number | null;
          provider?: string;
          scenario?: string;
          session_name?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_matching_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_model_performance: {
        Row: {
          average_cost_per_request: number | null;
          average_response_time_ms: number | null;
          average_tokens_per_request: number | null;
          created_at: string | null;
          date: string;
          id: string;
          match_quality_score: number | null;
          model: string;
          provider: string;
          scenario: string;
          successful_requests: number | null;
          total_requests: number | null;
          user_satisfaction_score: number | null;
        };
        Insert: {
          average_cost_per_request?: number | null;
          average_response_time_ms?: number | null;
          average_tokens_per_request?: number | null;
          created_at?: string | null;
          date: string;
          id?: string;
          match_quality_score?: number | null;
          model: string;
          provider: string;
          scenario: string;
          successful_requests?: number | null;
          total_requests?: number | null;
          user_satisfaction_score?: number | null;
        };
        Update: {
          average_cost_per_request?: number | null;
          average_response_time_ms?: number | null;
          average_tokens_per_request?: number | null;
          created_at?: string | null;
          date?: string;
          id?: string;
          match_quality_score?: number | null;
          model?: string;
          provider?: string;
          scenario?: string;
          successful_requests?: number | null;
          total_requests?: number | null;
          user_satisfaction_score?: number | null;
        };
        Relationships: [];
      };
      ai_usage_analytics: {
        Row: {
          average_processing_time_ms: number | null;
          created_at: string | null;
          date: string;
          id: string;
          model: string;
          provider: string;
          request_count: number | null;
          session_type: string;
          success_rate: number | null;
          total_cost: number | null;
          total_tokens: number | null;
          user_id: string | null;
        };
        Insert: {
          average_processing_time_ms?: number | null;
          created_at?: string | null;
          date: string;
          id?: string;
          model: string;
          provider: string;
          request_count?: number | null;
          session_type: string;
          success_rate?: number | null;
          total_cost?: number | null;
          total_tokens?: number | null;
          user_id?: string | null;
        };
        Update: {
          average_processing_time_ms?: number | null;
          created_at?: string | null;
          date?: string;
          id?: string;
          model?: string;
          provider?: string;
          request_count?: number | null;
          session_type?: string;
          success_rate?: number | null;
          total_cost?: number | null;
          total_tokens?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_usage_analytics_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      applications: {
        Row: {
          created_at: string | null;
          id: string;
          message: string | null;
          opportunity_id: string | null;
          status: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          message?: string | null;
          opportunity_id?: string | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          message?: string | null;
          opportunity_id?: string | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "applications_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      communities: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          location: string;
          member_count: number | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          location?: string;
          member_count?: number | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          location?: string;
          member_count?: number | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "communities_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      community_members: {
        Row: {
          community_id: string | null;
          id: string;
          joined_at: string | null;
          role: string | null;
          user_id: string | null;
        };
        Insert: {
          community_id?: string | null;
          id?: string;
          joined_at?: string | null;
          role?: string | null;
          user_id?: string | null;
        };
        Update: {
          community_id?: string | null;
          id?: string;
          joined_at?: string | null;
          role?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey";
            columns: ["community_id"];
            isOneToOne: false;
            referencedRelation: "communities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      community_posts: {
        Row: {
          author_id: string | null;
          community_id: string | null;
          content: string;
          created_at: string | null;
          id: string;
          is_pinned: boolean | null;
          media_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          author_id?: string | null;
          community_id?: string | null;
          content: string;
          created_at?: string | null;
          id?: string;
          is_pinned?: boolean | null;
          media_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          author_id?: string | null;
          community_id?: string | null;
          content?: string;
          created_at?: string | null;
          id?: string;
          is_pinned?: boolean | null;
          media_url?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "community_posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_posts_community_id_fkey";
            columns: ["community_id"];
            isOneToOne: false;
            referencedRelation: "communities";
            referencedColumns: ["id"];
          }
        ];
      };
      messages: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          is_read: boolean | null;
          receiver_id: string | null;
          sender_id: string | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          receiver_id?: string | null;
          sender_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          receiver_id?: string | null;
          sender_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey";
            columns: ["receiver_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          created_at: string | null;
          id: string;
          is_read: boolean | null;
          message: string;
          related_id: string | null;
          title: string;
          type: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message: string;
          related_id?: string | null;
          title: string;
          type: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message?: string;
          related_id?: string | null;
          title?: string;
          type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      opportunities: {
        Row: {
          created_at: string | null;
          description: string;
          event_date: string | null;
          event_end_time: string | null;
          genre: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          is_archived: boolean | null;
          location: string;
          organizer_id: string | null;
          organizer_name: string;
          payment: number | null;
          skill_level: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description: string;
          event_date?: string | null;
          event_end_time?: string | null;
          genre?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_archived?: boolean | null;
          location: string;
          organizer_id?: string | null;
          organizer_name: string;
          payment?: number | null;
          skill_level?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string;
          event_date?: string | null;
          event_end_time?: string | null;
          genre?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_archived?: boolean | null;
          location?: string;
          organizer_id?: string | null;
          organizer_name?: string;
          payment?: number | null;
          skill_level?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "opportunities_organizer_id_fkey";
            columns: ["organizer_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      mixes: {
        Row: {
          id: string;
          title: string;
          artist: string;
          genre: string;
          description: string | null;
          applied_for: string | null;
          status: string;
          file_url: string;
          file_name: string;
          file_size: number;
          image_url: string | null;
          duration: string | null;
          plays: number | null;
          rating: number | null;
          uploaded_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          artist: string;
          genre: string;
          description?: string | null;
          applied_for?: string | null;
          status?: string;
          file_url: string;
          file_name: string;
          file_size: number;
          image_url?: string | null;
          duration?: string | null;
          plays?: number | null;
          rating?: number | null;
          uploaded_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          artist?: string;
          genre?: string;
          description?: string | null;
          applied_for?: string | null;
          status?: string;
          file_url?: string;
          file_name?: string;
          file_size?: number;
          image_url?: string | null;
          duration?: string | null;
          plays?: number | null;
          rating?: number | null;
          uploaded_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mixes_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      user_profiles: {
        Row: {
          bio: string | null;
          brand_name: string | null;
          city: string;
          created_at: string | null;
          dj_name: string;
          email: string;
          first_name: string;
          genres: string[] | null;
          id: string;
          instagram: string | null;
          last_name: string;
          profile_image_url: string | null;
          role: string | null;
          soundcloud: string | null;
          updated_at: string | null;
        };
        Insert: {
          bio?: string | null;
          brand_name?: string | null;
          city: string;
          created_at?: string | null;
          dj_name: string;
          email: string;
          first_name: string;
          genres?: string[] | null;
          id?: string;
          instagram?: string | null;
          last_name: string;
          profile_image_url?: string | null;
          role?: string | null;
          soundcloud?: string | null;
          updated_at?: string | null;
        };
        Update: {
          bio?: string | null;
          brand_name?: string | null;
          city?: string;
          created_at?: string | null;
          dj_name?: string;
          email?: string;
          first_name?: string;
          genres?: string[] | null;
          id?: string;
          instagram?: string | null;
          last_name?: string;
          profile_image_url?: string | null;
          role?: string | null;
          soundcloud?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      application_forms: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          opportunity_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          opportunity_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          opportunity_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "application_forms_opportunity_id_fkey";
            columns: ["opportunity_id"];
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          }
        ];
      };
      application_form_fields: {
        Row: {
          id: string;
          form_id: string;
          field_type: string;
          field_name: string;
          field_label: string;
          field_placeholder: string | null;
          field_options: Json | null;
          is_required: boolean;
          field_order: number;
          validation_rules: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          form_id: string;
          field_type: string;
          field_name: string;
          field_label: string;
          field_placeholder?: string | null;
          field_options?: Json | null;
          is_required?: boolean;
          field_order: number;
          validation_rules?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          form_id?: string;
          field_type?: string;
          field_name?: string;
          field_label?: string;
          field_placeholder?: string | null;
          field_options?: Json | null;
          is_required?: boolean;
          field_order?: number;
          validation_rules?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "application_form_fields_form_id_fkey";
            columns: ["form_id"];
            referencedRelation: "application_forms";
            referencedColumns: ["id"];
          }
        ];
      };
      application_form_responses: {
        Row: {
          id: string;
          form_id: string;
          user_id: string;
          opportunity_id: string | null;
          response_data: Json;
          status: string;
          submitted_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          review_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          form_id: string;
          user_id: string;
          opportunity_id?: string | null;
          response_data: Json;
          status?: string;
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          form_id?: string;
          user_id?: string;
          opportunity_id?: string | null;
          response_data?: Json;
          status?: string;
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "application_form_responses_form_id_fkey";
            columns: ["form_id"];
            referencedRelation: "application_forms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "application_form_responses_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "application_form_responses_opportunity_id_fkey";
            columns: ["opportunity_id"];
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          }
        ];
      };
      invite_codes: {
        Row: {
          id: string;
          code: string;
          brand_name: string;
          created_by: string | null;
          used_by: string | null;
          used_at: string | null;
          expires_at: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          brand_name: string;
          created_by?: string | null;
          used_by?: string | null;
          used_at?: string | null;
          expires_at?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          brand_name?: string;
          created_by?: string | null;
          used_by?: string | null;
          used_at?: string | null;
          expires_at?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invite_codes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invite_codes_used_by_fkey";
            columns: ["used_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      booking_requests: {
        Row: {
          id: string;
          brand_id: string;
          dj_id: string;
          event_title: string;
          event_description: string | null;
          event_date: string;
          event_end_time: string | null;
          location: string;
          location_place_id: string | null;
          payment_amount: number | null;
          payment_currency: string | null;
          genre: string | null;
          additional_requirements: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          status: string;
          dj_response_at: string | null;
          dj_response_notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          brand_id: string;
          dj_id: string;
          event_title: string;
          event_description?: string | null;
          event_date: string;
          event_end_time?: string | null;
          location: string;
          location_place_id?: string | null;
          payment_amount?: number | null;
          payment_currency?: string | null;
          genre?: string | null;
          additional_requirements?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          status?: string;
          dj_response_at?: string | null;
          dj_response_notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          brand_id?: string;
          dj_id?: string;
          event_title?: string;
          event_description?: string | null;
          event_date?: string;
          event_end_time?: string | null;
          location?: string;
          location_place_id?: string | null;
          payment_amount?: number | null;
          payment_currency?: string | null;
          genre?: string | null;
          additional_requirements?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          status?: string;
          dj_response_at?: string | null;
          dj_response_notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "booking_requests_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_requests_dj_id_fkey";
            columns: ["dj_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      ai_feedback_analysis: {
        Row: {
          applications: number | null;
          avg_rating: number | null;
          feedback_count: number | null;
          match_type: string | null;
          opportunity_id: string | null;
          successful_applications: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_matching_results_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_matching_summary: {
        Row: {
          avg_compatibility_score: number | null;
          avg_confidence: number | null;
          matches_generated: number | null;
          model: string | null;
          provider: string | null;
          scenario: string | null;
          session_date: string | null;
          total_cost: number | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_matching_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Functions: {
      get_ai_matching_stats: {
        Args: { p_user_id: string };
        Returns: {
          average_confidence: number;
          average_score: number;
          favorite_scenario: string;
          most_used_provider: string;
          total_cost: number;
          total_matches: number;
          total_sessions: number;
        }[];
      };
      get_ai_model_performance: {
        Args: { p_days?: number; p_provider?: string };
        Returns: {
          average_cost_per_request: number;
          average_response_time_ms: number;
          model: string;
          provider: string;
          scenario: string;
          success_rate: number;
          total_requests: number;
          user_satisfaction_score: number;
        }[];
      };
      track_ai_usage: {
        Args: {
          p_cost: number;
          p_model: string;
          p_processing_time_ms: number;
          p_provider: string;
          p_session_type: string;
          p_success: boolean;
          p_tokens: number;
          p_user_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
