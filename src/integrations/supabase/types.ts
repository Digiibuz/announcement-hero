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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          additional_medias: string[] | null
          ai_instructions: string | null
          create_facebook_post: boolean | null
          create_instagram_post: boolean | null
          created_at: string
          description: string | null
          facebook_content: string | null
          facebook_error_message: string | null
          facebook_hashtags: string[] | null
          facebook_images: string[] | null
          facebook_post_id: string | null
          facebook_publication_status: string | null
          facebook_published_at: string | null
          facebook_url: string | null
          id: string
          images: string[] | null
          instagram_content: string | null
          instagram_error_message: string | null
          instagram_hashtags: string[] | null
          instagram_images: string[] | null
          instagram_post_id: string | null
          instagram_publication_status: string | null
          instagram_published_at: string | null
          instagram_url: string | null
          is_divipixel: boolean | null
          publish_date: string | null
          seo_description: string | null
          seo_slug: string | null
          seo_title: string | null
          social_content: string | null
          social_hashtags: string[] | null
          status: Database["public"]["Enums"]["announcement_status"]
          title: string
          updated_at: string
          user_id: string
          wordpress_category_id: string | null
          wordpress_post_id: number | null
          wordpress_url: string | null
        }
        Insert: {
          additional_medias?: string[] | null
          ai_instructions?: string | null
          create_facebook_post?: boolean | null
          create_instagram_post?: boolean | null
          created_at?: string
          description?: string | null
          facebook_content?: string | null
          facebook_error_message?: string | null
          facebook_hashtags?: string[] | null
          facebook_images?: string[] | null
          facebook_post_id?: string | null
          facebook_publication_status?: string | null
          facebook_published_at?: string | null
          facebook_url?: string | null
          id?: string
          images?: string[] | null
          instagram_content?: string | null
          instagram_error_message?: string | null
          instagram_hashtags?: string[] | null
          instagram_images?: string[] | null
          instagram_post_id?: string | null
          instagram_publication_status?: string | null
          instagram_published_at?: string | null
          instagram_url?: string | null
          is_divipixel?: boolean | null
          publish_date?: string | null
          seo_description?: string | null
          seo_slug?: string | null
          seo_title?: string | null
          social_content?: string | null
          social_hashtags?: string[] | null
          status?: Database["public"]["Enums"]["announcement_status"]
          title: string
          updated_at?: string
          user_id: string
          wordpress_category_id?: string | null
          wordpress_post_id?: number | null
          wordpress_url?: string | null
        }
        Update: {
          additional_medias?: string[] | null
          ai_instructions?: string | null
          create_facebook_post?: boolean | null
          create_instagram_post?: boolean | null
          created_at?: string
          description?: string | null
          facebook_content?: string | null
          facebook_error_message?: string | null
          facebook_hashtags?: string[] | null
          facebook_images?: string[] | null
          facebook_post_id?: string | null
          facebook_publication_status?: string | null
          facebook_published_at?: string | null
          facebook_url?: string | null
          id?: string
          images?: string[] | null
          instagram_content?: string | null
          instagram_error_message?: string | null
          instagram_hashtags?: string[] | null
          instagram_images?: string[] | null
          instagram_post_id?: string | null
          instagram_publication_status?: string | null
          instagram_published_at?: string | null
          instagram_url?: string | null
          is_divipixel?: boolean | null
          publish_date?: string | null
          seo_description?: string | null
          seo_slug?: string | null
          seo_title?: string | null
          social_content?: string | null
          social_hashtags?: string[] | null
          status?: Database["public"]["Enums"]["announcement_status"]
          title?: string
          updated_at?: string
          user_id?: string
          wordpress_category_id?: string | null
          wordpress_post_id?: number | null
          wordpress_url?: string | null
        }
        Relationships: []
      }
      facebook_connections: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          id: string
          page_access_token: string
          page_id: string
          page_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          id?: string
          page_access_token: string
          page_id: string
          page_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          page_access_token?: string
          page_id?: string
          page_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      maintenance_settings: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_maintenance_mode: boolean
          maintenance_end: string | null
          maintenance_start: string | null
          message: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_maintenance_mode?: boolean
          maintenance_end?: string | null
          maintenance_start?: string | null
          message?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_maintenance_mode?: boolean
          maintenance_end?: string | null
          maintenance_start?: string | null
          message?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      monthly_ai_limits: {
        Row: {
          created_at: string
          generation_count: number | null
          id: string
          max_limit: number | null
          month: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          generation_count?: number | null
          id?: string
          max_limit?: number | null
          month: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          generation_count?: number | null
          id?: string
          max_limit?: number | null
          month?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      monthly_publication_limits: {
        Row: {
          created_at: string
          id: string
          max_limit: number | null
          month: number
          published_count: number | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          max_limit?: number | null
          month: number
          published_count?: number | null
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          max_limit?: number | null
          month?: number
          published_count?: number | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          client_id: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: string
          updated_at: string
          wordpress_config_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          role?: string
          updated_at?: string
          wordpress_config_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
          wordpress_config_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_wordpress_config_id_fkey"
            columns: ["wordpress_config_id"]
            isOneToOne: false
            referencedRelation: "wordpress_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_google_business_profiles: {
        Row: {
          access_token: string | null
          created_at: string
          gmb_account_id: string | null
          gmb_location_id: string | null
          google_email: string | null
          id: string
          refresh_token: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          gmb_account_id?: string | null
          gmb_location_id?: string | null
          google_email?: string | null
          id?: string
          refresh_token: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          gmb_account_id?: string | null
          gmb_location_id?: string | null
          google_email?: string | null
          id?: string
          refresh_token?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wordpress_config_categories: {
        Row: {
          category_id: string
          category_name: string
          created_at: string
          id: string
          updated_at: string
          wordpress_config_id: string
        }
        Insert: {
          category_id: string
          category_name: string
          created_at?: string
          id?: string
          updated_at?: string
          wordpress_config_id: string
        }
        Update: {
          category_id?: string
          category_name?: string
          created_at?: string
          id?: string
          updated_at?: string
          wordpress_config_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wordpress_config_categories_wordpress_config_id_fkey"
            columns: ["wordpress_config_id"]
            isOneToOne: false
            referencedRelation: "wordpress_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      wordpress_configs: {
        Row: {
          app_password: string | null
          app_username: string | null
          created_at: string
          id: string
          name: string
          password: string | null
          prompt: string | null
          rest_api_key: string | null
          site_url: string
          updated_at: string
          username: string | null
        }
        Insert: {
          app_password?: string | null
          app_username?: string | null
          created_at?: string
          id?: string
          name: string
          password?: string | null
          prompt?: string | null
          rest_api_key?: string | null
          site_url: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          app_password?: string | null
          app_username?: string | null
          created_at?: string
          id?: string
          name?: string
          password?: string | null
          prompt?: string | null
          rest_api_key?: string | null
          site_url?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_maintenance_message: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_monthly_ai_count: {
        Args: { p_user_id: string }
        Returns: {
          generation_count: number
          max_limit: number
          remaining: number
        }[]
      }
      get_monthly_publication_count: {
        Args: { p_user_id: string }
        Returns: {
          max_limit: number
          published_count: number
          remaining: number
        }[]
      }
      increment_monthly_ai_count: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      increment_monthly_publication_count: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_editor: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_maintenance_active: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      announcement_status: "draft" | "published" | "scheduled"
      app_role: "admin" | "editor" | "client" | "commercial"
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
      announcement_status: ["draft", "published", "scheduled"],
      app_role: ["admin", "editor", "client", "commercial"],
    },
  },
} as const
