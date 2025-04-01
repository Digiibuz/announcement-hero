export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      announcements: {
        Row: {
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          is_divipixel: boolean | null
          publish_date: string | null
          seo_description: string | null
          seo_slug: string | null
          seo_title: string | null
          status: Database["public"]["Enums"]["announcement_status"]
          title: string
          updated_at: string
          user_id: string
          wordpress_category_id: string | null
          wordpress_post_id: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_divipixel?: boolean | null
          publish_date?: string | null
          seo_description?: string | null
          seo_slug?: string | null
          seo_title?: string | null
          status?: Database["public"]["Enums"]["announcement_status"]
          title: string
          updated_at?: string
          user_id: string
          wordpress_category_id?: string | null
          wordpress_post_id?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_divipixel?: boolean | null
          publish_date?: string | null
          seo_description?: string | null
          seo_slug?: string | null
          seo_title?: string | null
          status?: Database["public"]["Enums"]["announcement_status"]
          title?: string
          updated_at?: string
          user_id?: string
          wordpress_category_id?: string | null
          wordpress_post_id?: number | null
        }
        Relationships: []
      }
      categories_keywords: {
        Row: {
          category_id: string
          category_name: string
          created_at: string
          id: string
          keyword: string
          wordpress_config_id: string
        }
        Insert: {
          category_id: string
          category_name: string
          created_at?: string
          id?: string
          keyword: string
          wordpress_config_id: string
        }
        Update: {
          category_id?: string
          category_name?: string
          created_at?: string
          id?: string
          keyword?: string
          wordpress_config_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_keywords_wordpress_config_id_fkey"
            columns: ["wordpress_config_id"]
            isOneToOne: false
            referencedRelation: "wordpress_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      client_wordpress_configs: {
        Row: {
          client_id: string
          created_at: string
          id: string
          wordpress_config_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          wordpress_config_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          wordpress_config_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_wordpress_configs_wordpress_config_id_fkey"
            columns: ["wordpress_config_id"]
            isOneToOne: false
            referencedRelation: "wordpress_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      localities: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          region: string | null
          wordpress_config_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          region?: string | null
          wordpress_config_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          region?: string | null
          wordpress_config_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "localities_wordpress_config_id_fkey"
            columns: ["wordpress_config_id"]
            isOneToOne: false
            referencedRelation: "wordpress_configs"
            referencedColumns: ["id"]
          },
        ]
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
      ticket_read_status: {
        Row: {
          id: string
          read_at: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          id?: string
          read_at?: string
          ticket_id: string
          user_id: string
        }
        Update: {
          id?: string
          read_at?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_read_status_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_responses: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          message: string
          ticket_id: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message: string
          ticket_id: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          ticket_id?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string
          id: string
          message: string
          priority: string
          status: string
          subject: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          priority: string
          status: string
          subject: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          priority?: string
          status?: string
          subject?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      tome_generations: {
        Row: {
          category_id: string
          content: string | null
          created_at: string
          description: string | null
          error_message: string | null
          id: string
          keyword_id: string | null
          locality_id: string | null
          published_at: string | null
          scheduled_at: string | null
          status: string
          title: string | null
          wordpress_config_id: string
          wordpress_post_id: number | null
        }
        Insert: {
          category_id: string
          content?: string | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          id?: string
          keyword_id?: string | null
          locality_id?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status: string
          title?: string | null
          wordpress_config_id: string
          wordpress_post_id?: number | null
        }
        Update: {
          category_id?: string
          content?: string | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          id?: string
          keyword_id?: string | null
          locality_id?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          title?: string | null
          wordpress_config_id?: string
          wordpress_post_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tome_generations_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "categories_keywords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tome_generations_locality_id_fkey"
            columns: ["locality_id"]
            isOneToOne: false
            referencedRelation: "localities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tome_generations_wordpress_config_id_fkey"
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
    }
    Enums: {
      announcement_status: "draft" | "published" | "scheduled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
