// Supabase-generated-compatible shape synchronized with the repository
// migrations. Regenerate from the live public schema after every deployed
// change with the command documented in supabase/README.md.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          home_city: string | null;
          onboarding_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          home_city?: string | null;
          onboarding_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          home_city?: string | null;
          onboarding_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          user_id: string;
          interests: string[];
          dietary_preferences: string[];
          default_budget: string | null;
          default_distance_km: number | null;
          default_social_context: string | null;
          default_spontaneity_mode: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          interests?: string[];
          dietary_preferences?: string[];
          default_budget?: string | null;
          default_distance_km?: number | null;
          default_social_context?: string | null;
          default_spontaneity_mode?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          interests?: string[];
          dietary_preferences?: string[];
          default_budget?: string | null;
          default_distance_km?: number | null;
          default_social_context?: string | null;
          default_spontaneity_mode?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recommendation_sessions: {
        Row: {
          id: string;
          user_id: string;
          latitude: number | null;
          longitude: number | null;
          mood: string | null;
          social_context: string | null;
          budget: string | null;
          available_minutes: number | null;
          radius_km: number | null;
          spontaneity_mode: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          latitude?: number | null;
          longitude?: number | null;
          mood?: string | null;
          social_context?: string | null;
          budget?: string | null;
          available_minutes?: number | null;
          radius_km?: number | null;
          spontaneity_mode?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          latitude?: number | null;
          longitude?: number | null;
          mood?: string | null;
          social_context?: string | null;
          budget?: string | null;
          available_minutes?: number | null;
          radius_km?: number | null;
          spontaneity_mode?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      recommendations: {
        Row: {
          id: string;
          session_id: string | null;
          user_id: string;
          external_place_id: string | null;
          source: string | null;
          place_name: string;
          category: string | null;
          latitude: number | null;
          longitude: number | null;
          estimated_distance_km: number | null;
          estimated_duration_minutes: number | null;
          price_level: number | null;
          score: number | null;
          recommendation_reason: string | null;
          rank_position: number | null;
          accepted: boolean;
          rejected: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          user_id: string;
          external_place_id?: string | null;
          source?: string | null;
          place_name: string;
          category?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          estimated_distance_km?: number | null;
          estimated_duration_minutes?: number | null;
          price_level?: number | null;
          score?: number | null;
          recommendation_reason?: string | null;
          rank_position?: number | null;
          accepted?: boolean;
          rejected?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          user_id?: string;
          external_place_id?: string | null;
          source?: string | null;
          place_name?: string;
          category?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          estimated_distance_km?: number | null;
          estimated_duration_minutes?: number | null;
          price_level?: number | null;
          score?: number | null;
          recommendation_reason?: string | null;
          rank_position?: number | null;
          accepted?: boolean;
          rejected?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recommendations_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'recommendation_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      recommendation_feedback: {
        Row: {
          id: string;
          recommendation_id: string;
          user_id: string;
          positive: boolean;
          reason: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recommendation_id: string;
          user_id: string;
          positive: boolean;
          reason?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recommendation_id?: string;
          user_id?: string;
          positive?: boolean;
          reason?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recommendation_feedback_recommendation_id_fkey';
            columns: ['recommendation_id'];
            isOneToOne: false;
            referencedRelation: 'recommendations';
            referencedColumns: ['id'];
          },
        ];
      };
      favourites: {
        Row: {
          id: string;
          user_id: string;
          external_place_id: string;
          place_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          external_place_id: string;
          place_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          external_place_id?: string;
          place_name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type DefaultSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer Row;
    }
    ? Row
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer Row;
      }
      ? Row
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer Insert;
    }
    ? Insert
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends { Insert: infer Insert }
      ? Insert
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer Update;
    }
    ? Update
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends { Update: infer Update }
      ? Update
      : never
    : never;
