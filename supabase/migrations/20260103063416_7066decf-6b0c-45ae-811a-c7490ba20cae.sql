-- =============================================
-- COMPREHENSIVE SYSTEM UPDATE
-- =============================================

-- 1. PAYROLL SYSTEM TABLES
-- =============================================

-- Employee types enum
DO $$ BEGIN
  CREATE TYPE public.employee_type AS ENUM ('full_time', 'part_time', 'probation');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Employee status enum
DO $$ BEGIN
  CREATE TYPE public.employee_status AS ENUM ('active', 'probation', 'suspended', 'dismissed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Employees table
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid,
  employee_number text NOT NULL,
  name text NOT NULL,
  sex text NOT NULL CHECK (sex IN ('M', 'F')),
  phone_number text,
  email text,
  employee_type employee_type NOT NULL DEFAULT 'full_time',
  status employee_status NOT NULL DEFAULT 'active',
  department text,
  position text,
  date_hired date NOT NULL DEFAULT CURRENT_DATE,
  date_terminated date,
  monthly_salary numeric(10,2) NOT NULL DEFAULT 0,
  bank_name text,
  bank_account text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(school_id, employee_number)
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools can view own employees" ON public.employees
  FOR SELECT USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admin can manage employees" ON public.employees
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Teacher subjects (for teachers who teach multiple subjects)
CREATE TABLE IF NOT EXISTS public.teacher_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  subject_name text NOT NULL,
  class_form text,
  periods_per_week integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools can view teacher subjects" ON public.teacher_subjects
  FOR SELECT USING (employee_id IN (SELECT id FROM employees WHERE school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Admin can manage teacher subjects" ON public.teacher_subjects
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Payroll records
CREATE TABLE IF NOT EXISTS public.payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  pay_period_start date NOT NULL,
  pay_period_end date NOT NULL,
  basic_salary numeric(10,2) NOT NULL DEFAULT 0,
  bonus numeric(10,2) DEFAULT 0,
  deductions numeric(10,2) DEFAULT 0,
  gratuity numeric(10,2) DEFAULT 0,
  net_salary numeric(10,2) GENERATED ALWAYS AS (basic_salary + COALESCE(bonus, 0) + COALESCE(gratuity, 0) - COALESCE(deductions, 0)) STORED,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  paid_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools can view own payroll" ON public.payroll
  FOR SELECT USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admin can manage payroll" ON public.payroll
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Teacher role for user_roles
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teacher';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. FINANCIAL MODULE TABLES
-- =============================================

-- Income categories
CREATE TABLE IF NOT EXISTS public.income_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.income_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools can view income categories" ON public.income_categories
  FOR SELECT USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admin can manage income categories" ON public.income_categories
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Income records
CREATE TABLE IF NOT EXISTS public.income_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.income_categories(id),
  amount numeric(10,2) NOT NULL,
  source text NOT NULL,
  description text,
  received_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text,
  reference_number text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.income_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools can view income" ON public.income_records
  FOR SELECT USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admin can manage income" ON public.income_records
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Expense categories
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools can view expense categories" ON public.expense_categories
  FOR SELECT USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admin can manage expense categories" ON public.expense_categories
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Expense records
CREATE TABLE IF NOT EXISTS public.expense_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.expense_categories(id),
  amount numeric(10,2) NOT NULL,
  vendor text,
  description text NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text,
  receipt_number text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.expense_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools can view expenses" ON public.expense_records
  FOR SELECT USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admin can manage expenses" ON public.expense_records
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Financial documents (invoices, receipts, quotations)
CREATE TABLE IF NOT EXISTS public.financial_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('invoice', 'receipt', 'quotation')),
  document_number text NOT NULL,
  client_name text NOT NULL,
  client_address text,
  items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax_amount numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  due_date date,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(school_id, document_type, document_number)
);

ALTER TABLE public.financial_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools can view documents" ON public.financial_documents
  FOR SELECT USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admin can manage documents" ON public.financial_documents
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 3. AUDIT LOG / EVENT MANAGER
-- =============================================

-- Enhanced activity logs with more detail
ALTER TABLE public.activity_logs 
  ADD COLUMN IF NOT EXISTS module text,
  ADD COLUMN IF NOT EXISTS action_description text,
  ADD COLUMN IF NOT EXISTS old_values jsonb,
  ADD COLUMN IF NOT EXISTS new_values jsonb;

-- 4. TEACHER AUTHENTICATION
-- =============================================

-- Teacher credentials table for separate login
CREATE TABLE IF NOT EXISTS public.teacher_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE UNIQUE,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.teacher_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own credentials" ON public.teacher_credentials
  FOR SELECT USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Admin can manage teacher credentials" ON public.teacher_credentials
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Allow public to verify teacher login (for login functionality)
CREATE POLICY "Public can verify login" ON public.teacher_credentials
  FOR SELECT USING (true);

-- Teacher worklog (periods taught tracking)
CREATE TABLE IF NOT EXISTS public.teacher_worklog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  work_date date NOT NULL DEFAULT CURRENT_DATE,
  subject_name text NOT NULL,
  class_form text NOT NULL,
  periods_taught integer NOT NULL DEFAULT 1,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.teacher_worklog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own worklog" ON public.teacher_worklog
  FOR SELECT USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can insert own worklog" ON public.teacher_worklog
  FOR INSERT WITH CHECK (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Admin can manage worklog" ON public.teacher_worklog
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Function to generate employee number
CREATE OR REPLACE FUNCTION public.generate_employee_number(p_school_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
  v_year TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COUNT(*) INTO v_count
  FROM public.employees
  WHERE school_id = p_school_id;
  
  RETURN 'EMP-' || v_year || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
END;
$$;

-- Function to generate document number
CREATE OR REPLACE FUNCTION public.generate_document_number(p_school_id uuid, p_doc_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
  v_prefix TEXT;
  v_year TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  CASE p_doc_type
    WHEN 'invoice' THEN v_prefix := 'INV';
    WHEN 'receipt' THEN v_prefix := 'RCP';
    WHEN 'quotation' THEN v_prefix := 'QTN';
    ELSE v_prefix := 'DOC';
  END CASE;
  
  SELECT COUNT(*) INTO v_count
  FROM public.financial_documents
  WHERE school_id = p_school_id AND document_type = p_doc_type;
  
  RETURN v_prefix || '-' || v_year || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
END;
$$;

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payroll;
ALTER PUBLICATION supabase_realtime ADD TABLE public.income_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expense_records;