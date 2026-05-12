export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      memorial_content: {
        Row: {
          content_id: number
          created_at: string
          image_url: string | null
          text: string
        }
        Insert: {
          content_id?: number
          created_at?: string
          image_url?: string | null
          text: string
        }
        Update: {
          content_id?: number
          created_at?: string
          image_url?: string | null
          text?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          contact_email: string | null
          contact_first_name: string | null
          contact_id: string | null
          contact_last_name: string | null
          contact_phone: string | null
          contact_pref_channel: string | null
          created_at: string
          effective_date: string
          group_display_name: string
          group_user_name: string
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          contact_first_name?: string | null
          contact_id?: string | null
          contact_last_name?: string | null
          contact_phone?: string | null
          contact_pref_channel?: string | null
          created_at?: string
          effective_date?: string
          group_display_name: string
          group_user_name: string
          user_id: string
        }
        Update: {
          contact_email?: string | null
          contact_first_name?: string | null
          contact_id?: string | null
          contact_last_name?: string | null
          contact_phone?: string | null
          contact_pref_channel?: string | null
          created_at?: string
          effective_date?: string
          group_display_name?: string
          group_user_name?: string
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          answers: string
          correct_answer: string
          question_num: number
          question_text: string
          quiz_id: number
        }
        Insert: {
          answers: string
          correct_answer: string
          question_num: number
          question_text: string
          quiz_id: number
        }
        Update: {
          answers?: string
          correct_answer?: string
          question_num?: number
          question_text?: string
          quiz_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz"
            referencedColumns: ["quiz_id"]
          },
        ]
      }
      quiz: {
        Row: {
          created_at: string
          effective_date: string
          expiration_date: string
          quiz_id: number
          session_id: number | null
          subject: string
        }
        Insert: {
          created_at?: string
          effective_date: string
          expiration_date: string
          quiz_id?: number
          session_id?: number | null
          subject: string
        }
        Update: {
          created_at?: string
          effective_date?: string
          expiration_date?: string
          quiz_id?: number
          session_id?: number | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quiz_session"
            referencedColumns: ["session_id"]
          },
        ]
      }
      quiz_attempt: {
        Row: {
          completed_at: string
          quiz_id: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          quiz_id: number
          user_id: string
        }
        Update: {
          completed_at?: string
          quiz_id?: number
          user_id?: string
        }
        Relationships: []
      }
      quiz_session: {
        Row: {
          created_at: string
          description: string | null
          effective_date: string
          expiration_date: string | null
          session_id: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          effective_date?: string
          expiration_date?: string | null
          session_id?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          effective_date?: string
          expiration_date?: string | null
          session_id?: number
        }
        Relationships: []
      }
      score: {
        Row: {
          last_update_date: string
          score: number
          session_id: number
          user_id: string
        }
        Insert: {
          last_update_date?: string
          score?: number
          session_id: number
          user_id: string
        }
        Update: {
          last_update_date?: string
          score?: number
          session_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "score_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quiz_session"
            referencedColumns: ["session_id"]
          },
        ]
      }
      system_definitions: {
        Row: {
          id: number
          question_timeout: number
        }
        Insert: {
          id?: number
          question_timeout?: number
        }
        Update: {
          id?: number
          question_timeout?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      email_for_username: { Args: { _username: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
