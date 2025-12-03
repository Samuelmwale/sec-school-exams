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
      license_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          days: number
          id: string
          is_used: boolean
          package_name: string
          school_id: string | null
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string
          days: number
          id?: string
          is_used?: boolean
          package_name: string
          school_id?: string | null
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          days?: number
          id?: string
          is_used?: boolean
          package_name?: string
          school_id?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "license_codes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          invoice_id: string | null
          paid_at: string | null
          paid_by: string | null
          payment_method: string
          payment_reference: string | null
          registration_number: string
          school_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          paid_at?: string | null
          paid_by?: string | null
          payment_method: string
          payment_reference?: string | null
          registration_number: string
          school_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          paid_at?: string | null
          paid_by?: string | null
          payment_method?: string
          payment_reference?: string | null
          registration_number?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "student_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          name: string
          phone_number: string | null
          role: string
          school_id: string | null
          sex: string
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name: string
          phone_number?: string | null
          role?: string
          school_id?: string | null
          sex: string
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          phone_number?: string | null
          role?: string
          school_id?: string | null
          sex?: string
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_announcements: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          message: string
          priority: string
          school_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          message: string
          priority?: string
          school_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string
          priority?: string
          school_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_announcements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_fees: {
        Row: {
          class_form: string
          created_at: string | null
          id: string
          installments: number
          term: string
          total_amount: number
          updated_at: string | null
          year: string
        }
        Insert: {
          class_form: string
          created_at?: string | null
          id?: string
          installments?: number
          term: string
          total_amount: number
          updated_at?: string | null
          year: string
        }
        Update: {
          class_form?: string
          created_at?: string | null
          id?: string
          installments?: number
          term?: string
          total_amount?: number
          updated_at?: string | null
          year?: string
        }
        Relationships: []
      }
      school_settings: {
        Row: {
          created_at: string | null
          id: string
          school_address: string
          school_name: string
          subscription_days: number
          subscription_expiry: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          school_address?: string
          school_name?: string
          subscription_days?: number
          subscription_expiry?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          school_address?: string
          school_name?: string
          subscription_days?: number
          subscription_expiry?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      schools: {
        Row: {
          address: string
          center_number: string
          created_at: string | null
          district_name: string | null
          division_name: string | null
          id: string
          is_active: boolean
          school_name: string
          subscription_expiry: string | null
          updated_at: string | null
          zone_name: string | null
        }
        Insert: {
          address: string
          center_number: string
          created_at?: string | null
          district_name?: string | null
          division_name?: string | null
          id?: string
          is_active?: boolean
          school_name: string
          subscription_expiry?: string | null
          updated_at?: string | null
          zone_name?: string | null
        }
        Update: {
          address?: string
          center_number?: string
          created_at?: string | null
          district_name?: string | null
          division_name?: string | null
          id?: string
          is_active?: boolean
          school_name?: string
          subscription_expiry?: string | null
          updated_at?: string | null
          zone_name?: string | null
        }
        Relationships: []
      }
      student_invoices: {
        Row: {
          amount: number
          class_form: string
          created_at: string | null
          due_date: string | null
          id: string
          installment_number: number
          registration_number: string
          school_id: string | null
          status: string
          term: string
          updated_at: string | null
          year: string
        }
        Insert: {
          amount: number
          class_form: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          installment_number: number
          registration_number: string
          school_id?: string | null
          status?: string
          term: string
          updated_at?: string | null
          year: string
        }
        Update: {
          amount?: number
          class_form?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          installment_number?: number
          registration_number?: string
          school_id?: string | null
          status?: string
          term?: string
          updated_at?: string | null
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_invoices_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      student_registrations: {
        Row: {
          class_form: string
          created_at: string | null
          id: string
          name: string
          phone_number: string | null
          registration_number: string
          school_id: string | null
          sex: string
          updated_at: string | null
          user_id: string | null
          year: string
        }
        Insert: {
          class_form: string
          created_at?: string | null
          id?: string
          name: string
          phone_number?: string | null
          registration_number: string
          school_id?: string | null
          sex: string
          updated_at?: string | null
          user_id?: string | null
          year: string
        }
        Update: {
          class_form?: string
          created_at?: string | null
          id?: string
          name?: string
          phone_number?: string | null
          registration_number?: string
          school_id?: string | null
          sex?: string
          updated_at?: string | null
          user_id?: string | null
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_registrations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          class_form: string
          created_at: string | null
          grades: Json
          id: string
          marks: Json
          name: string
          rank: number | null
          school_id: string | null
          sex: string
          status: string
          student_id: string | null
          term: string
          total: number
          updated_at: string | null
          year: string
        }
        Insert: {
          class_form: string
          created_at?: string | null
          grades?: Json
          id?: string
          marks?: Json
          name: string
          rank?: number | null
          school_id?: string | null
          sex: string
          status: string
          student_id?: string | null
          term: string
          total?: number
          updated_at?: string | null
          year: string
        }
        Update: {
          class_form?: string
          created_at?: string | null
          grades?: Json
          id?: string
          marks?: Json
          name?: string
          rank?: number | null
          school_id?: string | null
          sex?: string
          status?: string
          student_id?: string | null
          term?: string
          total?: number
          updated_at?: string | null
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      activate_license: {
        Args: { p_code: string; p_school_id: string }
        Returns: boolean
      }
      generate_license_code: { Args: never; Returns: string }
      generate_registration_number: {
        Args: { p_class_form: string; p_year: string }
        Returns: string
      }
      get_school_public: {
        Args: { p_school_id: string }
        Returns: {
          address: string
          center_number: string
          district_name: string
          division_name: string
          id: string
          is_active: boolean
          school_name: string
          subscription_expiry: string
          zone_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_overdue_invoices: { Args: never; Returns: undefined }
      register_school: {
        Args: {
          p_address: string
          p_center_number: string
          p_district_name: string
          p_division_name: string
          p_school_name: string
          p_zone_name: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "student"
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
      app_role: ["admin", "student"],
    },
  },
} as const
