/**
 * Generated from the live Supabase schema with the Supabase MCP
 * (generate_typescript_types). Do not hand-edit — regenerate after any
 * migration so the app and the database cannot drift apart.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admins: {
        Row: { created_at: string; email: string; user_id: string }
        Insert: { created_at?: string; email: string; user_id: string }
        Update: { created_at?: string; email?: string; user_id?: string }
        Relationships: []
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          hero_image_alt: string | null
          hero_image_url: string | null
          id: string
          is_visible: boolean
          name: string
          seo_description: string | null
          seo_og_image_url: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hero_image_alt?: string | null
          hero_image_url?: string | null
          id?: string
          is_visible?: boolean
          name?: string
          seo_description?: string | null
          seo_og_image_url?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hero_image_alt?: string | null
          hero_image_url?: string | null
          id?: string
          is_visible?: boolean
          name?: string
          seo_description?: string | null
          seo_og_image_url?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          is_handled: boolean
          message: string
          name: string
          product_id: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_handled?: boolean
          message: string
          name: string
          product_id?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_handled?: boolean
          message?: string
          name?: string
          product_id?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_posts: {
        Row: {
          body_html: string
          cover_image_alt: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          seo_description: string | null
          seo_og_image_url: string | null
          seo_title: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          body_html?: string
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          seo_description?: string | null
          seo_og_image_url?: string | null
          seo_title?: string | null
          slug: string
          title?: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          seo_description?: string | null
          seo_og_image_url?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      look_items: {
        Row: {
          id: string
          intensity: number | null
          look_id: string
          shade_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          intensity?: number | null
          look_id: string
          shade_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          intensity?: number | null
          look_id?: string
          shade_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "look_items_look_id_fkey"
            columns: ["look_id"]
            isOneToOne: false
            referencedRelation: "looks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "look_items_shade_id_fkey"
            columns: ["shade_id"]
            isOneToOne: false
            referencedRelation: "shades"
            referencedColumns: ["id"]
          },
        ]
      }
      looks: {
        Row: {
          cover_image_alt: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_visible: boolean
          name: string
          seo_description: string | null
          seo_og_image_url: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_visible?: boolean
          name?: string
          seo_description?: string | null
          seo_og_image_url?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_visible?: boolean
          name?: string
          seo_description?: string | null
          seo_og_image_url?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: { created_at: string; email: string; id: string; source: string | null }
        Insert: { created_at?: string; email: string; id?: string; source?: string | null }
        Update: { created_at?: string; email?: string; id?: string; source?: string | null }
        Relationships: []
      }
      pages: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          seo_description: string | null
          seo_og_image_url: string | null
          seo_title: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          seo_description?: string | null
          seo_og_image_url?: string | null
          seo_title?: string | null
          slug: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          seo_description?: string | null
          seo_og_image_url?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      press_logos: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          link_url: string | null
          logo_alt: string | null
          logo_url: string | null
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          link_url?: string | null
          logo_alt?: string | null
          logo_url?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          link_url?: string | null
          logo_alt?: string | null
          logo_url?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_related: {
        Row: { product_id: string; related_product_id: string; sort_order: number }
        Insert: { product_id: string; related_product_id: string; sort_order?: number }
        Update: { product_id?: string; related_product_id?: string; sort_order?: number }
        Relationships: [
          {
            foreignKeyName: "product_related_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_related_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          collection_id: string | null
          created_at: string
          details: string | null
          gallery: Json
          how_to_apply: string | null
          id: string
          ingredients: string | null
          is_bestseller: boolean
          is_visible: boolean
          name: string
          price_display: string | null
          seo_description: string | null
          seo_og_image_url: string | null
          seo_title: string | null
          shop_label: string | null
          shop_url: string | null
          short_description: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["product_category"]
          collection_id?: string | null
          created_at?: string
          details?: string | null
          gallery?: Json
          how_to_apply?: string | null
          id?: string
          ingredients?: string | null
          is_bestseller?: boolean
          is_visible?: boolean
          name?: string
          price_display?: string | null
          seo_description?: string | null
          seo_og_image_url?: string | null
          seo_title?: string | null
          shop_label?: string | null
          shop_url?: string | null
          short_description?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          collection_id?: string | null
          created_at?: string
          details?: string | null
          gallery?: Json
          how_to_apply?: string | null
          id?: string
          ingredients?: string | null
          is_bestseller?: boolean
          is_visible?: boolean
          name?: string
          price_display?: string | null
          seo_description?: string | null
          seo_og_image_url?: string | null
          seo_title?: string | null
          shop_label?: string | null
          shop_url?: string | null
          short_description?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_visible: boolean
          page_id: string
          sort_order: number
          type: Database["public"]["Enums"]["section_type"]
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          page_id: string
          sort_order?: number
          type: Database["public"]["Enums"]["section_type"]
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          page_id?: string
          sort_order?: number
          type?: Database["public"]["Enums"]["section_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      shades: {
        Row: {
          created_at: string
          default_intensity: number
          finish: Database["public"]["Enums"]["shade_finish"]
          hex: string
          id: string
          is_visible: boolean
          name: string
          product_id: string
          sort_order: number
          swatch_image_alt: string | null
          swatch_image_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_intensity?: number
          finish?: Database["public"]["Enums"]["shade_finish"]
          hex?: string
          id?: string
          is_visible?: boolean
          name?: string
          product_id: string
          sort_order?: number
          swatch_image_alt?: string | null
          swatch_image_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_intensity?: number
          finish?: Database["public"]["Enums"]["shade_finish"]
          hex?: string
          id?: string
          is_visible?: boolean
          name?: string
          product_id?: string
          sort_order?: number
          swatch_image_alt?: string | null
          swatch_image_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shades_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          accent_color: string
          brand_name: string
          camera_permission_body: string | null
          camera_permission_title: string | null
          contact_address: string | null
          contact_email: string | null
          contact_phone: string | null
          favicon_url: string | null
          footer_columns: Json
          footer_text: string | null
          id: number
          legal_links: Json
          logo_alt: string | null
          logo_url: string | null
          nav_links: Json
          seo_description: string | null
          seo_og_image_url: string | null
          seo_title: string | null
          social_links: Json
          try_on_disclaimer: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string
          brand_name?: string
          camera_permission_body?: string | null
          camera_permission_title?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          favicon_url?: string | null
          footer_columns?: Json
          footer_text?: string | null
          id?: number
          legal_links?: Json
          logo_alt?: string | null
          logo_url?: string | null
          nav_links?: Json
          seo_description?: string | null
          seo_og_image_url?: string | null
          seo_title?: string | null
          social_links?: Json
          try_on_disclaimer?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string
          brand_name?: string
          camera_permission_body?: string | null
          camera_permission_title?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          favicon_url?: string | null
          footer_columns?: Json
          footer_text?: string | null
          id?: number
          legal_links?: Json
          logo_alt?: string | null
          logo_url?: string | null
          nav_links?: Json
          seo_description?: string | null
          seo_og_image_url?: string | null
          seo_title?: string | null
          social_links?: Json
          try_on_disclaimer?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_name: string
          author_role: string | null
          created_at: string
          id: string
          image_alt: string | null
          image_url: string | null
          is_visible: boolean
          quote: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          author_name?: string
          author_role?: string | null
          created_at?: string
          id?: string
          image_alt?: string | null
          image_url?: string | null
          is_visible?: boolean
          quote?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_role?: string | null
          created_at?: string
          id?: string
          image_alt?: string | null
          image_url?: string | null
          is_visible?: boolean
          quote?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      try_on_models: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          name: string
          photo_alt: string | null
          photo_url: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          name?: string
          photo_alt?: string | null
          photo_url?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          name?: string
          photo_alt?: string | null
          photo_url?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      product_category: "lips" | "cheeks" | "eyes" | "brows" | "face"
      section_type:
        | "hero"
        | "collections"
        | "try_on_feature"
        | "bestsellers"
        | "looks"
        | "brand_story"
        | "craft"
        | "testimonials"
        | "press"
        | "newsletter"
        | "rich_text"
        | "image_text"
        | "contact_details"
        | "contact_form"
      shade_finish: "matte" | "satin" | "gloss" | "shimmer" | "natural"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      product_category: ["lips", "cheeks", "eyes", "brows", "face"],
      section_type: [
        "hero",
        "collections",
        "try_on_feature",
        "bestsellers",
        "looks",
        "brand_story",
        "craft",
        "testimonials",
        "press",
        "newsletter",
        "rich_text",
        "image_text",
        "contact_details",
        "contact_form",
      ],
      shade_finish: ["matte", "satin", "gloss", "shimmer", "natural"],
    },
  },
} as const
