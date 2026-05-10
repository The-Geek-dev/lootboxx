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
      ad_settings: {
        Row: {
          adsterra_enabled: boolean
          id: number
          route_overrides: Json
          slot_order: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          adsterra_enabled?: boolean
          id?: number
          route_overrides?: Json
          slot_order?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          adsterra_enabled?: boolean
          id?: number
          route_overrides?: Json
          slot_order?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
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
      chat_conversations: {
        Row: {
          admin_unread_count: number
          ai_paused: boolean
          created_at: string
          guest_email: string | null
          guest_name: string | null
          guest_token: string | null
          id: string
          last_message_at: string
          last_message_preview: string | null
          status: string
          updated_at: string
          user_id: string | null
          user_unread_count: number
        }
        Insert: {
          admin_unread_count?: number
          ai_paused?: boolean
          created_at?: string
          guest_email?: string | null
          guest_name?: string | null
          guest_token?: string | null
          id?: string
          last_message_at?: string
          last_message_preview?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          user_unread_count?: number
        }
        Update: {
          admin_unread_count?: number
          ai_paused?: boolean
          created_at?: string
          guest_email?: string | null
          guest_name?: string | null
          guest_token?: string | null
          id?: string
          last_message_at?: string
          last_message_preview?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          user_unread_count?: number
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string | null
          sender_role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
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
      deposit_receipts: {
        Row: {
          ai_notes: string | null
          amount: number
          bonus: number
          created_at: string
          deposit_type: string
          extracted_account: string | null
          extracted_amount: number | null
          extracted_recipient: string | null
          id: string
          points_reward: number
          receipt_url: string
          rejection_reason: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_notes?: string | null
          amount: number
          bonus?: number
          created_at?: string
          deposit_type: string
          extracted_account?: string | null
          extracted_amount?: number | null
          extracted_recipient?: string | null
          id?: string
          points_reward?: number
          receipt_url: string
          rejection_reason?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_notes?: string | null
          amount?: number
          bonus?: number
          created_at?: string
          deposit_type?: string
          extracted_account?: string | null
          extracted_amount?: number | null
          extracted_recipient?: string | null
          id?: string
          points_reward?: number
          receipt_url?: string
          rejection_reason?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
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
      email_preferences: {
        Row: {
          created_at: string
          nudge_emails_enabled: boolean
          unsubscribe_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          nudge_emails_enabled?: boolean
          unsubscribe_token?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          nudge_emails_enabled?: boolean
          unsubscribe_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
      global_game_settings: {
        Row: {
          id: number
          is_active: boolean
          max_full_wins_per_day: number
          payout_modifier: number
          updated_at: string
          updated_by: string | null
          win_rate_modifier: number
          win_window_radius_hours: number
        }
        Insert: {
          id?: number
          is_active?: boolean
          max_full_wins_per_day?: number
          payout_modifier?: number
          updated_at?: string
          updated_by?: string | null
          win_rate_modifier?: number
          win_window_radius_hours?: number
        }
        Update: {
          id?: number
          is_active?: boolean
          max_full_wins_per_day?: number
          payout_modifier?: number
          updated_at?: string
          updated_by?: string | null
          win_rate_modifier?: number
          win_window_radius_hours?: number
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
      payment_attempts: {
        Row: {
          amount: number
          created_at: string
          deposit_type: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          provider: string
          reference: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          deposit_type?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          provider: string
          reference: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          deposit_type?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          reference?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payout_overrides: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      prediction_markets: {
        Row: {
          category: string | null
          created_at: string
          currency: Database["public"]["Enums"]["prediction_currency"]
          deadline: string
          description: string | null
          id: string
          no_pool: number
          outcome: Database["public"]["Enums"]["prediction_outcome"] | null
          question: string
          region: Database["public"]["Enums"]["prediction_region"]
          resolution_notes: string | null
          resolved: boolean
          resolved_at: string | null
          source_urls: Json
          tier: Database["public"]["Enums"]["prediction_tier"]
          total_stakers: number
          yes_pool: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency: Database["public"]["Enums"]["prediction_currency"]
          deadline: string
          description?: string | null
          id?: string
          no_pool?: number
          outcome?: Database["public"]["Enums"]["prediction_outcome"] | null
          question: string
          region: Database["public"]["Enums"]["prediction_region"]
          resolution_notes?: string | null
          resolved?: boolean
          resolved_at?: string | null
          source_urls?: Json
          tier: Database["public"]["Enums"]["prediction_tier"]
          total_stakers?: number
          yes_pool?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["prediction_currency"]
          deadline?: string
          description?: string | null
          id?: string
          no_pool?: number
          outcome?: Database["public"]["Enums"]["prediction_outcome"] | null
          question?: string
          region?: Database["public"]["Enums"]["prediction_region"]
          resolution_notes?: string | null
          resolved?: boolean
          resolved_at?: string | null
          source_urls?: Json
          tier?: Database["public"]["Enums"]["prediction_tier"]
          total_stakers?: number
          yes_pool?: number
        }
        Relationships: []
      }
      prediction_stakes: {
        Row: {
          amount: number
          created_at: string
          currency: Database["public"]["Enums"]["prediction_currency"]
          id: string
          market_id: string
          payout: number
          settled: boolean
          side: Database["public"]["Enums"]["prediction_side"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: Database["public"]["Enums"]["prediction_currency"]
          id?: string
          market_id: string
          payout?: number
          settled?: boolean
          side: Database["public"]["Enums"]["prediction_side"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["prediction_currency"]
          id?: string
          market_id?: string
          payout?: number
          settled?: boolean
          side?: Database["public"]["Enums"]["prediction_side"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prediction_stakes_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "prediction_markets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_id: string | null
          created_at: string
          custom_avatar_url: string | null
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_id?: string | null
          created_at?: string
          custom_avatar_url?: string | null
          full_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_id?: string | null
          created_at?: string
          custom_avatar_url?: string | null
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progressive_jackpot: {
        Row: {
          created_at: string
          current_amount: number
          id: string
          last_won_amount: number
          last_won_at: string | null
          last_won_by: string | null
          total_contributions: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          id?: string
          last_won_amount?: number
          last_won_at?: string | null
          last_won_by?: string | null
          total_contributions?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          id?: string
          last_won_amount?: number
          last_won_at?: string | null
          last_won_by?: string | null
          total_contributions?: number
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
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
          activation_bonus_awarded: boolean
          bonus_amount: number
          created_at: string
          id: string
          referral_code: string
          referred_id: string | null
          referrer_id: string
          status: string
        }
        Insert: {
          activation_bonus_awarded?: boolean
          bonus_amount?: number
          created_at?: string
          id?: string
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          status?: string
        }
        Update: {
          activation_bonus_awarded?: boolean
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      user_game_settings: {
        Row: {
          admin_note: string | null
          created_at: string
          difficulty_level: number
          id: string
          is_active: boolean
          payout_modifier: number
          updated_at: string
          user_id: string
          win_rate_modifier: number
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          difficulty_level?: number
          id?: string
          is_active?: boolean
          payout_modifier?: number
          updated_at?: string
          user_id: string
          win_rate_modifier?: number
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          difficulty_level?: number
          id?: string
          is_active?: boolean
          payout_modifier?: number
          updated_at?: string
          user_id?: string
          win_rate_modifier?: number
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
      user_testimonials: {
        Row: {
          content: string
          created_at: string
          display_name: string
          id: string
          location: string | null
          rating: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          display_name: string
          id?: string
          location?: string | null
          rating?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          display_name?: string
          id?: string
          location?: string | null
          rating?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          balance: number
          coupon_expires_at: string | null
          created_at: string
          current_streak: number
          daily_bonus_date: string | null
          daily_bonus_points: number
          id: string
          is_activated: boolean
          last_ad_reward_at: string | null
          last_play_date: string | null
          last_weekly_bonus_at: string | null
          locked_account_name: string | null
          locked_account_number: string | null
          locked_bank_name: string | null
          longest_streak: number
          points: number
          total_deposited: number
          total_referral_bonus: number
          total_won: number
          updated_at: string
          user_id: string
          withdrawal_eligibility_notified_at: string | null
          xp_last_refill_at: string
          xp_lives: number
        }
        Insert: {
          balance?: number
          coupon_expires_at?: string | null
          created_at?: string
          current_streak?: number
          daily_bonus_date?: string | null
          daily_bonus_points?: number
          id?: string
          is_activated?: boolean
          last_ad_reward_at?: string | null
          last_play_date?: string | null
          last_weekly_bonus_at?: string | null
          locked_account_name?: string | null
          locked_account_number?: string | null
          locked_bank_name?: string | null
          longest_streak?: number
          points?: number
          total_deposited?: number
          total_referral_bonus?: number
          total_won?: number
          updated_at?: string
          user_id: string
          withdrawal_eligibility_notified_at?: string | null
          xp_last_refill_at?: string
          xp_lives?: number
        }
        Update: {
          balance?: number
          coupon_expires_at?: string | null
          created_at?: string
          current_streak?: number
          daily_bonus_date?: string | null
          daily_bonus_points?: number
          id?: string
          is_activated?: boolean
          last_ad_reward_at?: string | null
          last_play_date?: string | null
          last_weekly_bonus_at?: string | null
          locked_account_name?: string | null
          locked_account_number?: string | null
          locked_bank_name?: string | null
          longest_streak?: number
          points?: number
          total_deposited?: number
          total_referral_bonus?: number
          total_won?: number
          updated_at?: string
          user_id?: string
          withdrawal_eligibility_notified_at?: string | null
          xp_last_refill_at?: string
          xp_lives?: number
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          city: string
          created_at: string
          email: string
          full_name: string
          id: string
          referral_code: string | null
        }
        Insert: {
          city?: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          referral_code?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          referral_code?: string | null
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
      apply_game_result: {
        Args: {
          p_game_type: string
          p_point_cost: number
          p_result?: Json
          p_win_amount: number
        }
        Returns: Json
      }
      award_referral_activation_bonus: {
        Args: { p_user_id: string }
        Returns: Json
      }
      buy_xp_refill: { Args: never; Returns: boolean }
      claim_ad_reward: { Args: never; Returns: Json }
      claim_daily_bonus: { Args: never; Returns: Json }
      contribute_to_jackpot:
        | { Args: { contribution: number }; Returns: Json }
        | { Args: { contribution: number; player_id: string }; Returns: Json }
      convert_points_to_cash: { Args: never; Returns: Json }
      credit_verified_deposit: {
        Args: {
          p_amount: number
          p_bonus: number
          p_deposit_type: string
          p_points: number
          p_user_id: string
        }
        Returns: Json
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_effective_game_settings: {
        Args: never
        Returns: {
          difficulty_level: number
          is_active: boolean
          max_full_wins_per_day: number
          payout_modifier: number
          source: string
          win_rate_modifier: number
          win_window_radius_hours: number
        }[]
      }
      get_leaderboard: {
        Args: { limit_count?: number }
        Returns: {
          games_played: number
          player_name: string
          rank: number
          total_winnings: number
          wins: number
        }[]
      }
      get_my_game_settings: {
        Args: never
        Returns: {
          difficulty_level: number
          is_active: boolean
          payout_modifier: number
          win_rate_modifier: number
        }[]
      }
      get_winnings_balance: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      place_prediction_stake: {
        Args: {
          p_amount: number
          p_market_id: string
          p_side: Database["public"]["Enums"]["prediction_side"]
        }
        Returns: Json
      }
      process_referral_signup: {
        Args: { p_referral_code: string }
        Returns: Json
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      record_play_streak: { Args: never; Returns: Json }
      request_withdrawal: {
        Args: {
          p_account_name: string
          p_account_number: string
          p_amount: number
          p_bank_name: string
        }
        Returns: Json
      }
      resolve_prediction_market: {
        Args: {
          p_market_id: string
          p_notes?: string
          p_outcome: Database["public"]["Enums"]["prediction_outcome"]
        }
        Returns: Json
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
      prediction_currency: "points" | "cash"
      prediction_outcome: "yes" | "no" | "void"
      prediction_region: "nigeria" | "global"
      prediction_side: "yes" | "no"
      prediction_tier: "regular" | "vip"
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
      prediction_currency: ["points", "cash"],
      prediction_outcome: ["yes", "no", "void"],
      prediction_region: ["nigeria", "global"],
      prediction_side: ["yes", "no"],
      prediction_tier: ["regular", "vip"],
    },
  },
} as const
