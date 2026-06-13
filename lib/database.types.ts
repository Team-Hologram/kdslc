export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          category: string;
          price: number;
          price_formatted: string | null;
          tag: string | null;
          image: string | null;
          hero_image: string | null;
          images: string[] | null;
          description: string | null;
          details: string[] | null;
          sizes: string[] | null;
          colors: Json | null;
          is_new: boolean;
          is_best_seller: boolean;
          is_featured: boolean;
          is_active: boolean;
          rating: number;
          reviews: number;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
        Relationships: [];
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          quantity: number;
          size: string;
          color: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['cart_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Pick<Database['public']['Tables']['cart_items']['Row'], 'quantity'>>;
        Relationships: [];
      };
      watchlist_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['watchlist_items']['Row'], 'id' | 'created_at'>;
        Update: never;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          customer_name: string | null;
          customer_email: string | null;
          shipping_address: Json | null;
          items: Json;
          subtotal: number;
          shipping_fee: number;
          promo_code: string | null;
          discount_amount: number;
          payment_method: string | null;
          payment_status: string | null;
          payment_reference: string | null;
          paid_at: string | null;
          total: number;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'status'> & { status?: string };
        Update: Partial<Pick<Database['public']['Tables']['orders']['Row'], 'status'>>;
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          subscribed_at: string;
        };
        Insert: { email: string };
        Update: never;
        Relationships: [];
      };
      contact_submissions: {
        Row: {
          id: string;
          name: string;
          email: string;
          subject: string | null;
          message: string;
          submitted_at: string;
        };
        Insert: Omit<Database['public']['Tables']['contact_submissions']['Row'], 'id' | 'submitted_at'>;
        Update: never;
        Relationships: [];
      };
      site_settings: {
        Row: {
          key: string;
          value: string;
          description: string | null;
          updated_at: string | null;
        };
        Insert: {
          key: string;
          value: string;
          description?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['site_settings']['Insert']>;
        Relationships: [];
      };
      flash_sales: {
        Row: {
          id: string;
          title: string;
          ends_at: string;
          badge_text: string | null;
          free_shipping_enabled: boolean | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['flash_sales']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['flash_sales']['Insert']>;
        Relationships: [];
      };
      promo_codes: {
        Row: {
          id: string;
          code: string;
          label: string;
          description: string | null;
          discount_type: string;
          discount_value: number;
          min_order: number;
          color: string | null;
          is_active: boolean | null;
          expires_at: string | null;
          sort_order: number | null;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['promo_codes']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['promo_codes']['Insert']>;
        Relationships: [];
      };
      bundle_deals: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          saving_label: string | null;
          badge: string | null;
          product_ids: string[] | null;
          color: string | null;
          is_active: boolean | null;
          sort_order: number | null;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['bundle_deals']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['bundle_deals']['Insert']>;
        Relationships: [];
      };
      sale_items: {
        Row: {
          id: string;
          product_id: string;
          sale_percent: number;
          is_active: boolean | null;
          sort_order: number | null;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['sale_items']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['sale_items']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
