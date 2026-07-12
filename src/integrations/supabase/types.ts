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
      companies: {
        Row: {
          city: string | null
          created_at: string
          created_by: string | null
          id: string
          industry: string | null
          name: string
          province: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          industry?: string | null
          name: string
          province?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          industry?: string | null
          name?: string
          province?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      drivers: {
        Row: {
          capacity_ton: number | null
          completed_trips: number | null
          created_at: string
          full_name: string
          id: string
          insurance_expiry: string | null
          is_active: boolean
          license_plate: string | null
          national_id: string | null
          ownership: string | null
          phone: string | null
          preferred_cargo_types: string[] | null
          preferred_destination_cities: string[] | null
          preferred_origin_cities: string[] | null
          rating_avg: number | null
          technical_inspection_expiry: string | null
          truck_type: string | null
          user_id: string | null
          vehicle_model: string | null
          vehicle_year: number | null
        }
        Insert: {
          capacity_ton?: number | null
          completed_trips?: number | null
          created_at?: string
          full_name: string
          id?: string
          insurance_expiry?: string | null
          is_active?: boolean
          license_plate?: string | null
          national_id?: string | null
          ownership?: string | null
          phone?: string | null
          preferred_cargo_types?: string[] | null
          preferred_destination_cities?: string[] | null
          preferred_origin_cities?: string[] | null
          rating_avg?: number | null
          technical_inspection_expiry?: string | null
          truck_type?: string | null
          user_id?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
        }
        Update: {
          capacity_ton?: number | null
          completed_trips?: number | null
          created_at?: string
          full_name?: string
          id?: string
          insurance_expiry?: string | null
          is_active?: boolean
          license_plate?: string | null
          national_id?: string | null
          ownership?: string | null
          phone?: string | null
          preferred_cargo_types?: string[] | null
          preferred_destination_cities?: string[] | null
          preferred_origin_cities?: string[] | null
          rating_avg?: number | null
          technical_inspection_expiry?: string | null
          truck_type?: string | null
          user_id?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_toman: number
          customer_id: string
          id: string
          issued_at: string
          number: string
          paid_at: string | null
          shipment_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
        }
        Insert: {
          amount_toman: number
          customer_id: string
          id?: string
          issued_at?: string
          number?: string
          paid_at?: string | null
          shipment_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
        }
        Update: {
          amount_toman?: number
          customer_id?: string
          id?: string
          issued_at?: string
          number?: string
          paid_at?: string | null
          shipment_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
        }
        Relationships: [
          {
            foreignKeyName: "invoices_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "driver_assigned_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "driver_available_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          full_name: string | null
          id: string
          job_title: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_audit_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          shipment_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          shipment_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_audit_log_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "driver_assigned_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_audit_log_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "driver_available_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_audit_log_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_documents: {
        Row: {
          caption: string | null
          created_at: string
          doc_type: string
          id: string
          shipment_id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          doc_type: string
          id?: string
          shipment_id: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          doc_type?: string
          id?: string
          shipment_id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipment_documents_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "driver_assigned_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_documents_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "driver_available_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_documents_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_requests: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          message: string | null
          shipment_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          message?: string | null
          shipment_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          message?: string | null
          shipment_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_requests_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_requests_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_requests_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "driver_assigned_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_requests_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "driver_available_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_requests_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          from_status: Database["public"]["Enums"]["shipment_status"] | null
          id: string
          note: string | null
          shipment_id: string
          to_status: Database["public"]["Enums"]["shipment_status"]
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["shipment_status"] | null
          id?: string
          note?: string | null
          shipment_id: string
          to_status: Database["public"]["Enums"]["shipment_status"]
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["shipment_status"] | null
          id?: string
          note?: string | null
          shipment_id?: string
          to_status?: Database["public"]["Enums"]["shipment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "shipment_status_history_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "driver_assigned_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_status_history_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "driver_available_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_status_history_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_tracking_events: {
        Row: {
          created_at: string
          created_by: string | null
          event_type: string
          id: string
          lat: number | null
          lng: number | null
          note: string | null
          photo_path: string | null
          shipment_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_type: string
          id?: string
          lat?: number | null
          lng?: number | null
          note?: string | null
          photo_path?: string | null
          shipment_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_type?: string
          id?: string
          lat?: number | null
          lng?: number | null
          note?: string | null
          photo_path?: string | null
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_tracking_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "driver_assigned_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_tracking_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "driver_available_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_tracking_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          cargo_category: string | null
          cargo_type: string
          cargo_value_toman: number | null
          code: string
          company_id: string | null
          created_at: string
          customer_id: string
          delivery_contact_name: string | null
          delivery_contact_phone: string | null
          destination_address: string | null
          destination_city: string
          destination_province: string | null
          driver_id: string | null
          driver_payout_toman: number | null
          handling_requirements: string | null
          id: string
          internal_notes: string | null
          loading_date: string | null
          operator_id: string | null
          origin_address: string | null
          origin_city: string
          origin_province: string | null
          payment_terms: string | null
          pickup_contact_name: string | null
          pickup_contact_phone: string | null
          pieces_count: number | null
          price_toman: number | null
          special_instructions: string | null
          status: Database["public"]["Enums"]["shipment_status"]
          suggested_price_toman: number | null
          truck_type: string | null
          updated_at: string
          volume_m3: number | null
          weight_kg: number | null
        }
        Insert: {
          cargo_category?: string | null
          cargo_type: string
          cargo_value_toman?: number | null
          code?: string
          company_id?: string | null
          created_at?: string
          customer_id: string
          delivery_contact_name?: string | null
          delivery_contact_phone?: string | null
          destination_address?: string | null
          destination_city: string
          destination_province?: string | null
          driver_id?: string | null
          driver_payout_toman?: number | null
          handling_requirements?: string | null
          id?: string
          internal_notes?: string | null
          loading_date?: string | null
          operator_id?: string | null
          origin_address?: string | null
          origin_city: string
          origin_province?: string | null
          payment_terms?: string | null
          pickup_contact_name?: string | null
          pickup_contact_phone?: string | null
          pieces_count?: number | null
          price_toman?: number | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          suggested_price_toman?: number | null
          truck_type?: string | null
          updated_at?: string
          volume_m3?: number | null
          weight_kg?: number | null
        }
        Update: {
          cargo_category?: string | null
          cargo_type?: string
          cargo_value_toman?: number | null
          code?: string
          company_id?: string | null
          created_at?: string
          customer_id?: string
          delivery_contact_name?: string | null
          delivery_contact_phone?: string | null
          destination_address?: string | null
          destination_city?: string
          destination_province?: string | null
          driver_id?: string | null
          driver_payout_toman?: number | null
          handling_requirements?: string | null
          id?: string
          internal_notes?: string | null
          loading_date?: string | null
          operator_id?: string | null
          origin_address?: string | null
          origin_city?: string
          origin_province?: string | null
          payment_terms?: string | null
          pickup_contact_name?: string | null
          pickup_contact_phone?: string | null
          pieces_count?: number | null
          price_toman?: number | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          suggested_price_toman?: number | null
          truck_type?: string | null
          updated_at?: string
          volume_m3?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      shippers: {
        Row: {
          address: string | null
          city: string | null
          company_name: string
          contact_person: string | null
          created_at: string
          id: string
          industry: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name: string
          contact_person?: string | null
          created_at?: string
          id: string
          industry?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string
          contact_person?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          updated_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      driver_assigned_shipments: {
        Row: {
          cargo_category: string | null
          cargo_type: string | null
          code: string | null
          created_at: string | null
          delivery_contact_name: string | null
          delivery_contact_phone: string | null
          destination_address: string | null
          destination_city: string | null
          destination_province: string | null
          driver_id: string | null
          driver_payout_toman: number | null
          handling_requirements: string | null
          id: string | null
          loading_date: string | null
          origin_address: string | null
          origin_city: string | null
          origin_province: string | null
          pickup_contact_name: string | null
          pickup_contact_phone: string | null
          pieces_count: number | null
          special_instructions: string | null
          status: Database["public"]["Enums"]["shipment_status"] | null
          truck_type: string | null
          updated_at: string | null
          volume_m3: number | null
          weight_kg: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_available_shipments: {
        Row: {
          cargo_category: string | null
          cargo_type: string | null
          code: string | null
          created_at: string | null
          destination_city: string | null
          destination_province: string | null
          driver_payout_toman: number | null
          id: string | null
          loading_date: string | null
          origin_city: string | null
          origin_province: string | null
          status: Database["public"]["Enums"]["shipment_status"] | null
          truck_type: string | null
          volume_m3: number | null
          weight_kg: number | null
        }
        Insert: {
          cargo_category?: string | null
          cargo_type?: string | null
          code?: string | null
          created_at?: string | null
          destination_city?: string | null
          destination_province?: string | null
          driver_payout_toman?: number | null
          id?: string | null
          loading_date?: string | null
          origin_city?: string | null
          origin_province?: string | null
          status?: Database["public"]["Enums"]["shipment_status"] | null
          truck_type?: string | null
          volume_m3?: number | null
          weight_kg?: number | null
        }
        Update: {
          cargo_category?: string | null
          cargo_type?: string | null
          code?: string | null
          created_at?: string | null
          destination_city?: string | null
          destination_province?: string | null
          driver_payout_toman?: number | null
          id?: string | null
          loading_date?: string | null
          origin_city?: string | null
          origin_province?: string | null
          status?: Database["public"]["Enums"]["shipment_status"] | null
          truck_type?: string | null
          volume_m3?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      drivers_public: {
        Row: {
          completed_trips: number | null
          full_name: string | null
          id: string | null
          license_plate: string | null
          rating_avg: number | null
          truck_type: string | null
          vehicle_model: string | null
        }
        Insert: {
          completed_trips?: number | null
          full_name?: string | null
          id?: string | null
          license_plate?: string | null
          rating_avg?: number | null
          truck_type?: string | null
          vehicle_model?: string | null
        }
        Update: {
          completed_trips?: number | null
          full_name?: string | null
          id?: string | null
          license_plate?: string | null
          rating_avg?: number | null
          truck_type?: string | null
          vehicle_model?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "customer" | "operator" | "manager" | "driver" | "admin"
      invoice_status: "unpaid" | "partial" | "paid" | "void"
      shipment_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "price_approved"
        | "truck_assigned"
        | "loading"
        | "in_transit"
        | "delivered"
        | "completed"
        | "archived"
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
      app_role: ["customer", "operator", "manager", "driver", "admin"],
      invoice_status: ["unpaid", "partial", "paid", "void"],
      shipment_status: [
        "draft",
        "submitted",
        "under_review",
        "price_approved",
        "truck_assigned",
        "loading",
        "in_transit",
        "delivered",
        "completed",
        "archived",
      ],
    },
  },
} as const
