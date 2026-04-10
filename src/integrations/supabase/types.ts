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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: string[]
          user_id?: string
        }
        Relationships: []
      }
      daily_win_tracking: {
        Row: {
          created_at: string
          full_win_count: number
          id: string
          user_id: string
          win_date: string
          win_window_hour: number
        }
        Insert: {
          created_at?: string
          full_win_count?: number
          id?: string
          user_id: string
          win_date?: string
          win_window_hour?: number
        }
        Update: {
          created_at?: string
          full_win_count?: number
          id?: string
          user_id?: string
          win_date?: string
          win_window_hour?: number
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_reference: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_reference?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_reference?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      faq_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_helpful: boolean
          question_id: string
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_helpful: boolean
          question_id: string
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_helpful?: boolean
          question_id?: string
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      game_results: {
        Row: {
          bet_amount: number
          created_at: string
          game_type: string
          id: string
          result: Json
          user_id: string
          win_amount: number
        }
        Insert: {
          bet_amount?: number
          created_at?: string
          game_type: string
          id?: string
          result?: Json
          user_id: string
          win_amount?: number
        }
        Update: {
          bet_amount?: number
          created_at?: string
          game_type?: string
          id?: string
          result?: Json
          user_id?: string
          win_amount?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          used: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          used?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      raffle_entries: {
        Row: {
          created_at: string
          id: string
          is_winner: boolean
          prize_amount: number
          raffle_id: string
          ticket_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_winner?: boolean
          prize_amount?: number
          raffle_id: string
          ticket_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_winner?: boolean
          prize_amount?: number
          raffle_id?: string
          ticket_count?: number
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_amount: number
          created_at: string
          id: string
          referral_code: string
          referred_id: string | null
          referrer_id: string
          status: string
        }
        Insert: {
          bonus_amount?: number
          created_at?: string
          id?: string
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          status?: string
        }
        Update: {
          bonus_amount?: number
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      renewal_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          is_used: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          is_used?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      signup_tokens: {
        Row: {
          created_at: string
          id: string
          token: string
          used: boolean
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          token: string
          used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          token?: string
          used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      user_2fa_settings: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          is_activated: boolean
          last_weekly_bonus_at: string | null
          points: number
          total_deposited: number
          total_referral_bonus: number
          total_won: number
          updated_at: string
          user_id: string
          xp_last_refill_at: string
          xp_lives: number
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          is_activated?: boolean
          last_weekly_bonus_at?: string | null
          points?: number
          total_deposited?: number
          total_referral_bonus?: number
          total_won?: number
          updated_at?: string
          user_id: string
          xp_last_refill_at?: string
          xp_lives?: number
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          is_activated?: boolean
          last_weekly_bonus_at?: string | null
          points?: number
          total_deposited?: number
          total_referral_bonus?: number
          total_won?: number
          updated_at?: string
          user_id?: string
          xp_last_refill_at?: string
          xp_lives?: number
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          account_name: string
          account_number: string
          admin_note: string | null
          amount: number
          bank_name: string
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          admin_note?: string | null
          amount: number
          bank_name: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          admin_note?: string | null
          amount?: number
          bank_name?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_signup_token: {
        Args: { token_value: string; user_id: string }
        Returns: boolean
      }
      verify_user_token: {
        Args: { token_value: string; user_email: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
