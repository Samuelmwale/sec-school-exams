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
      activity_logs: {
        Row: {
          action_description: string | null
          activity_type: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          module: string | null
          new_values: Json | null
          old_values: Json | null
          school_id: string | null
          student_registration_number: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_description?: string | null
          activity_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          module?: string | null
          new_values?: Json | null
          old_values?: Json | null
          school_id?: string | null
          student_registration_number?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_description?: string | null
          activity_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          module?: string | null
          new_values?: Json | null
          old_values?: Json | null
          school_id?: string | null
          student_registration_number?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_messages: {
        Row: {
          created_at: string | null
          id: string
          is_broadcast: boolean | null
          is_read: boolean | null
          message: string
          read_at: string | null
          recipient_school_id: string | null
          sender_id: string | null
          sender_type: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_broadcast?: boolean | null
          is_read?: boolean | null
          message: string
          read_at?: string | null
          recipient_school_id?: string | null
          sender_id?: string | null
          sender_type: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_broadcast?: boolean | null
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          recipient_school_id?: string | null
          sender_id?: string | null
          sender_type?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_messages_recipient_school_id_fkey"
            columns: ["recipient_school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          bank_account: string | null
          bank_name: string | null
          created_at: string | null
          date_hired: string
          date_terminated: string | null
          department: string | null
          email: string | null
          employee_number: string
          employee_type: Database["public"]["Enums"]["employee_type"]
          id: string
          monthly_salary: number
          name: string
          phone_number: string | null
          position: string | null
          school_id: string | null
          sex: string
          status: Database["public"]["Enums"]["employee_status"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bank_account?: string | null
          bank_name?: string | null
          created_at?: string | null
          date_hired?: string
          date_terminated?: string | null
          department?: string | null
          email?: string | null
          employee_number: string
          employee_type?: Database["public"]["Enums"]["employee_type"]
          id?: string
          monthly_salary?: number
          name: string
          phone_number?: string | null
          position?: string | null
          school_id?: string | null
          sex: string
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bank_account?: string | null
          bank_name?: string | null
          created_at?: string | null
          date_hired?: string
          date_terminated?: string | null
          department?: string | null
          email?: string | null
          employee_number?: string
          employee_type?: Database["public"]["Enums"]["employee_type"]
          id?: string
          monthly_salary?: number
          name?: string
          phone_number?: string | null
          position?: string | null
          school_id?: string | null
          sex?: string
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          school_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          school_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_records: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          created_by: string | null
          description: string
          expense_date: string
          id: string
          payment_method: string | null
          receipt_number: string | null
          school_id: string | null
          updated_at: string | null
          vendor: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          expense_date?: string
          id?: string
          payment_method?: string | null
          receipt_number?: string | null
          school_id?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          expense_date?: string
          id?: string
          payment_method?: string | null
          receipt_number?: string | null
          school_id?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_records_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_records_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_documents: {
        Row: {
          client_address: string | null
          client_name: string
          created_at: string | null
          created_by: string | null
          document_number: string
          document_type: string
          due_date: string | null
          id: string
          items: Json
          notes: string | null
          school_id: string | null
          status: string | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          client_address?: string | null
          client_name: string
          created_at?: string | null
          created_by?: string | null
          document_number: string
          document_type: string
          due_date?: string | null
          id?: string
          items?: Json
          notes?: string | null
          school_id?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          client_address?: string | null
          client_name?: string
          created_at?: string | null
          created_by?: string | null
          document_number?: string
          document_type?: string
          due_date?: string | null
          id?: string
          items?: Json
          notes?: string | null
          school_id?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_documents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      income_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          school_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          school_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_categories_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      income_records: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          payment_method: string | null
          received_date: string
          reference_number: string | null
          school_id: string | null
          source: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          received_date?: string
          reference_number?: string | null
          school_id?: string | null
          source: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          received_date?: string
          reference_number?: string | null
          school_id?: string | null
          source?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_records_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "income_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_records_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
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
      payroll: {
        Row: {
          basic_salary: number
          bonus: number | null
          created_at: string | null
          deductions: number | null
          employee_id: string | null
          gratuity: number | null
          id: string
          net_salary: number | null
          notes: string | null
          paid_at: string | null
          pay_period_end: string
          pay_period_start: string
          school_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          basic_salary?: number
          bonus?: number | null
          created_at?: string | null
          deductions?: number | null
          employee_id?: string | null
          gratuity?: number | null
          id?: string
          net_salary?: number | null
          notes?: string | null
          paid_at?: string | null
          pay_period_end: string
          pay_period_start: string
          school_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          basic_salary?: number
          bonus?: number | null
          created_at?: string | null
          deductions?: number | null
          employee_id?: string | null
          gratuity?: number | null
          id?: string
          net_salary?: number | null
          notes?: string | null
          paid_at?: string | null
          pay_period_end?: string
          pay_period_start?: string
          school_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_school_id_fkey"
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
      school_subjects: {
        Row: {
          abbreviation: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          is_custom: boolean
          name: string
          school_id: string | null
          updated_at: string
        }
        Insert: {
          abbreviation: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_custom?: boolean
          name: string
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          abbreviation?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_custom?: boolean
          name?: string
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string
          block_reason: string | null
          blocked_permanently: boolean | null
          blocked_until: string | null
          center_number: string
          created_at: string | null
          district_name: string | null
          division_name: string | null
          id: string
          is_active: boolean
          last_active_at: string | null
          school_name: string
          subscription_expiry: string | null
          updated_at: string | null
          zone_name: string | null
        }
        Insert: {
          address: string
          block_reason?: string | null
          blocked_permanently?: boolean | null
          blocked_until?: string | null
          center_number: string
          created_at?: string | null
          district_name?: string | null
          division_name?: string | null
          id?: string
          is_active?: boolean
          last_active_at?: string | null
          school_name: string
          subscription_expiry?: string | null
          updated_at?: string | null
          zone_name?: string | null
        }
        Update: {
          address?: string
          block_reason?: string | null
          blocked_permanently?: boolean | null
          blocked_until?: string | null
          center_number?: string
          created_at?: string | null
          district_name?: string | null
          division_name?: string | null
          id?: string
          is_active?: boolean
          last_active_at?: string | null
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
          last_login_at: string | null
          last_seen_at: string | null
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
          last_login_at?: string | null
          last_seen_at?: string | null
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
          last_login_at?: string | null
          last_seen_at?: string | null
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
      teacher_credentials: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
          last_login_at: string | null
          password_hash: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          last_login_at?: string | null
          password_hash: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          last_login_at?: string | null
          password_hash?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_credentials_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_subjects: {
        Row: {
          class_form: string | null
          created_at: string | null
          employee_id: string | null
          id: string
          periods_per_week: number | null
          subject_name: string
        }
        Insert: {
          class_form?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          periods_per_week?: number | null
          subject_name: string
        }
        Update: {
          class_form?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          periods_per_week?: number | null
          subject_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_worklog: {
        Row: {
          class_form: string
          created_at: string | null
          employee_id: string | null
          id: string
          notes: string | null
          periods_taught: number
          subject_name: string
          work_date: string
        }
        Insert: {
          class_form: string
          created_at?: string | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          periods_taught?: number
          subject_name: string
          work_date?: string
        }
        Update: {
          class_form?: string
          created_at?: string | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          periods_taught?: number
          subject_name?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_worklog_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
      check_duplicate_school: {
        Args: {
          p_center_number: string
          p_district_name: string
          p_division_name: string
          p_school_name: string
          p_zone_name: string
        }
        Returns: {
          existing_school_id: string
          existing_school_name: string
          is_duplicate: boolean
        }[]
      }
      create_license_code: {
        Args: { p_days: number; p_package_name: string }
        Returns: string
      }
      generate_document_number: {
        Args: { p_doc_type: string; p_school_id: string }
        Returns: string
      }
      generate_employee_number: {
        Args: { p_school_id: string }
        Returns: string
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
      is_school_blocked: { Args: { p_school_id: string }; Returns: boolean }
      log_activity: {
        Args: {
          p_activity_type: string
          p_details?: Json
          p_school_id: string
          p_student_reg?: string
        }
        Returns: undefined
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
      app_role: "admin" | "student" | "teacher"
      employee_status: "active" | "probation" | "suspended" | "dismissed"
      employee_type: "full_time" | "part_time" | "probation"
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
      app_role: ["admin", "student", "teacher"],
      employee_status: ["active", "probation", "suspended", "dismissed"],
      employee_type: ["full_time", "part_time", "probation"],
    },
  },
} as const
