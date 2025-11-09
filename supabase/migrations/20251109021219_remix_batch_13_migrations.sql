
-- Migration: 20251010031450
-- Create students table for persistent storage
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('M', 'F')),
  class_form TEXT NOT NULL,
  year TEXT NOT NULL,
  term TEXT NOT NULL,
  marks JSONB NOT NULL DEFAULT '{}'::jsonb,
  grades JSONB NOT NULL DEFAULT '{}'::jsonb,
  total INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  status TEXT NOT NULL CHECK (status IN ('PASS', 'FAIL')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, class_form, year, term)
);

-- Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Admin can do everything (we'll manage admin access through app logic)
CREATE POLICY "Public read access for students"
  ON public.students
  FOR SELECT
  USING (true);

CREATE POLICY "Admin can insert students"
  ON public.students
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can update students"
  ON public.students
  FOR UPDATE
  USING (true);

CREATE POLICY "Admin can delete students"
  ON public.students
  FOR DELETE
  USING (true);

-- Create profiles table for student authentication
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('M', 'F')),
  student_id TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Anyone can insert their profile (during registration)
CREATE POLICY "Users can create own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_students_class_year_term ON public.students(class_form, year, term);
CREATE INDEX idx_students_total ON public.students(total DESC);
CREATE INDEX idx_students_name ON public.students(name);
CREATE INDEX idx_profiles_student_id ON public.profiles(student_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Migration: 20251010031541
-- Fix security warning: Set search_path for function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Migration: 20251011042739
-- Add phone number to profiles
ALTER TABLE public.profiles 
ADD COLUMN phone_number TEXT;

-- Create table for school fees configuration
CREATE TABLE public.school_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_form TEXT NOT NULL,
  year TEXT NOT NULL,
  term TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  installments INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(class_form, year, term)
);

ALTER TABLE public.school_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view fees" ON public.school_fees
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage fees" ON public.school_fees
  FOR ALL USING (true);

-- Create student registrations table for registration numbers
CREATE TABLE public.student_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sex TEXT NOT NULL,
  phone_number TEXT,
  class_form TEXT NOT NULL,
  year TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.student_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own registration" ON public.student_registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all registrations" ON public.student_registrations
  FOR SELECT USING (true);

CREATE POLICY "Students can create registration" ON public.student_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage registrations" ON public.student_registrations
  FOR ALL USING (true);

-- Create invoices table
CREATE TABLE public.student_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number TEXT NOT NULL,
  class_form TEXT NOT NULL,
  year TEXT NOT NULL,
  term TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  installment_number INTEGER NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'paid', 'overdue'))
);

ALTER TABLE public.student_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own invoices" ON public.student_invoices
  FOR SELECT USING (
    registration_number IN (
      SELECT registration_number FROM public.student_registrations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage invoices" ON public.student_invoices
  FOR ALL USING (true);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.student_invoices(id) ON DELETE CASCADE,
  registration_number TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  paid_by TEXT,
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('bank', 'manual', 'cash', 'mobile_money'))
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own payments" ON public.payments
  FOR SELECT USING (
    registration_number IN (
      SELECT registration_number FROM public.student_registrations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage payments" ON public.payments
  FOR ALL USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_school_fees_updated_at
  BEFORE UPDATE ON public.school_fees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_registrations_updated_at
  BEFORE UPDATE ON public.student_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_invoices_updated_at
  BEFORE UPDATE ON public.student_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate registration number
CREATE OR REPLACE FUNCTION public.generate_registration_number(
  p_class_form TEXT,
  p_year TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_reg_number TEXT;
BEGIN
  -- Count existing registrations for this class and year
  SELECT COUNT(*) INTO v_count
  FROM public.student_registrations
  WHERE class_form = p_class_form AND year = p_year;
  
  -- Generate registration number: YEAR-CLASS-SEQUENCE
  -- Example: 2024-F1-001
  v_reg_number := p_year || '-' || p_class_form || '-' || LPAD((v_count + 1)::TEXT, 3, '0');
  
  RETURN v_reg_number;
END;
$$;

-- Function to automatically create invoices when fees are set
CREATE OR REPLACE FUNCTION public.create_invoices_for_term()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student RECORD;
  v_installment_amount DECIMAL(10, 2);
  v_due_date DATE;
BEGIN
  -- Calculate installment amount
  v_installment_amount := NEW.total_amount / NEW.installments;
  
  -- Create invoices for all students in this class/year/term
  FOR v_student IN 
    SELECT registration_number 
    FROM public.student_registrations 
    WHERE class_form = NEW.class_form AND year = NEW.year
  LOOP
    -- Create invoices for each installment
    FOR i IN 1..NEW.installments LOOP
      -- Set due dates (e.g., 30 days apart)
      v_due_date := CURRENT_DATE + (30 * i);
      
      INSERT INTO public.student_invoices (
        registration_number,
        class_form,
        year,
        term,
        amount,
        installment_number,
        due_date,
        status
      ) VALUES (
        v_student.registration_number,
        NEW.class_form,
        NEW.year,
        NEW.term,
        v_installment_amount,
        i,
        v_due_date,
        'pending'
      );
    END LOOP;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create invoices when fees are added
CREATE TRIGGER auto_create_invoices
  AFTER INSERT ON public.school_fees
  FOR EACH ROW
  EXECUTE FUNCTION public.create_invoices_for_term();

-- Create indexes for performance
CREATE INDEX idx_student_invoices_registration ON public.student_invoices(registration_number);
CREATE INDEX idx_student_invoices_status ON public.student_invoices(status);
CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX idx_student_registrations_number ON public.student_registrations(registration_number);

-- Migration: 20251011043055
-- Function to mark overdue invoices
CREATE OR REPLACE FUNCTION public.mark_overdue_invoices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.student_invoices
  SET status = 'overdue'
  WHERE status = 'pending'
  AND due_date < CURRENT_DATE;
END;
$$;

-- This function can be called manually or set up as a cron job
-- Admin can run: SELECT public.mark_overdue_invoices();

-- Migration: 20251012043728
-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS issues)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update students table RLS to use role-based access
DROP POLICY IF EXISTS "Admin can insert students" ON public.students;
DROP POLICY IF EXISTS "Admin can update students" ON public.students;
DROP POLICY IF EXISTS "Admin can delete students" ON public.students;

CREATE POLICY "Admin can insert students"
ON public.students FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update students"
ON public.students FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete students"
ON public.students FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update other tables to use role-based access
DROP POLICY IF EXISTS "Admin can manage fees" ON public.school_fees;
CREATE POLICY "Admin can manage fees"
ON public.school_fees FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can manage invoices" ON public.student_invoices;
CREATE POLICY "Admin can manage invoices"
ON public.student_invoices FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can manage payments" ON public.payments;
CREATE POLICY "Admin can manage payments"
ON public.payments FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can manage registrations" ON public.student_registrations;
DROP POLICY IF EXISTS "Admin can view all registrations" ON public.student_registrations;

CREATE POLICY "Admin can manage registrations"
ON public.student_registrations FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to auto-create registration and invoices when student is added
CREATE OR REPLACE FUNCTION public.auto_register_student()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg_number TEXT;
  v_existing_reg UUID;
  v_fee RECORD;
  v_installment_amount DECIMAL(10, 2);
  v_due_date DATE;
BEGIN
  -- Check if registration already exists for this student
  SELECT id INTO v_existing_reg
  FROM public.student_registrations
  WHERE student_id = NEW.student_id 
    AND class_form = NEW.class_form 
    AND year = NEW.year;
  
  -- If no registration exists, create one
  IF v_existing_reg IS NULL THEN
    -- Generate registration number
    v_reg_number := public.generate_registration_number(NEW.class_form, NEW.year);
    
    -- Create registration record
    INSERT INTO public.student_registrations (
      registration_number,
      student_id,
      name,
      sex,
      class_form,
      year
    ) VALUES (
      v_reg_number,
      NEW.student_id,
      NEW.name,
      NEW.sex,
      NEW.class_form,
      NEW.year
    );
    
    -- Check if fees are set for this class/year/term
    SELECT * INTO v_fee
    FROM public.school_fees
    WHERE class_form = NEW.class_form 
      AND year = NEW.year 
      AND term = NEW.term
    LIMIT 1;
    
    -- If fees exist, create invoices
    IF v_fee.id IS NOT NULL THEN
      v_installment_amount := v_fee.total_amount / v_fee.installments;
      
      FOR i IN 1..v_fee.installments LOOP
        v_due_date := CURRENT_DATE + (30 * i);
        
        INSERT INTO public.student_invoices (
          registration_number,
          class_form,
          year,
          term,
          amount,
          installment_number,
          due_date,
          status
        ) VALUES (
          v_reg_number,
          NEW.class_form,
          NEW.year,
          NEW.term,
          v_installment_amount,
          i,
          v_due_date,
          'pending'
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-registration
DROP TRIGGER IF EXISTS trigger_auto_register_student ON public.students;
CREATE TRIGGER trigger_auto_register_student
AFTER INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.auto_register_student();

-- Migration: 20251013032747
-- Create school_settings table for centralized school configuration
CREATE TABLE IF NOT EXISTS public.school_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name text NOT NULL DEFAULT 'Secondary School',
  school_address text NOT NULL DEFAULT 'P.O. Box 123, City, Country',
  subscription_days integer NOT NULL DEFAULT 30,
  subscription_expiry bigint,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read school settings
CREATE POLICY "Anyone can view school settings"
ON public.school_settings
FOR SELECT
USING (true);

-- Only admins can update school settings
CREATE POLICY "Admin can manage school settings"
ON public.school_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings if not exists
INSERT INTO public.school_settings (school_name, school_address, subscription_days, subscription_expiry)
VALUES ('Secondary School', 'P.O. Box 123, City, Country', 36500, extract(epoch from now() + interval '36500 days') * 1000)
ON CONFLICT DO NOTHING;

-- Trigger to update updated_at
CREATE TRIGGER update_school_settings_updated_at
  BEFORE UPDATE ON public.school_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251102013410
-- Delete duplicate students, keeping only the one with the earliest created_at
DELETE FROM public.students a
USING public.students b
WHERE a.id > b.id 
  AND a.name = b.name 
  AND a.class_form = b.class_form 
  AND a.year = b.year 
  AND a.term = b.term;

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.students 
ADD CONSTRAINT unique_student_per_class_term 
UNIQUE (name, class_form, year, term);

-- Drop old admin-only policies
DROP POLICY IF EXISTS "Admin can delete students" ON public.students;
DROP POLICY IF EXISTS "Admin can insert students" ON public.students;
DROP POLICY IF EXISTS "Admin can update students" ON public.students;

-- Create public access policies (we use password protection instead of auth)
CREATE POLICY "Public can delete students" 
ON public.students 
FOR DELETE 
USING (true);

CREATE POLICY "Public can insert students" 
ON public.students 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can update students" 
ON public.students 
FOR UPDATE 
USING (true);

-- Migration: 20251104051803

-- Create function to auto-generate student_id if not provided
CREATE OR REPLACE FUNCTION generate_student_id()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
  v_student_id TEXT;
BEGIN
  -- Only generate if student_id is not provided or is empty
  IF NEW.student_id IS NULL OR NEW.student_id = '' THEN
    -- Count existing students for this year
    SELECT COUNT(*) INTO v_count
    FROM students
    WHERE year = NEW.year;
    
    -- Generate student_id: YEAR-SEQUENCE (e.g., 2024-001)
    v_student_id := NEW.year || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
    NEW.student_id := v_student_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate student_id before insert
DROP TRIGGER IF EXISTS trigger_generate_student_id ON students;
CREATE TRIGGER trigger_generate_student_id
  BEFORE INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION generate_student_id();

-- Make student_id nullable so we can insert without it
ALTER TABLE students ALTER COLUMN student_id DROP NOT NULL;
ALTER TABLE students ALTER COLUMN student_id SET DEFAULT '';


-- Migration: 20251104051902

-- Fix search path for generate_student_id function
CREATE OR REPLACE FUNCTION generate_student_id()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
  v_student_id TEXT;
BEGIN
  -- Only generate if student_id is not provided or is empty
  IF NEW.student_id IS NULL OR NEW.student_id = '' THEN
    -- Count existing students for this year
    SELECT COUNT(*) INTO v_count
    FROM students
    WHERE year = NEW.year;
    
    -- Generate student_id: YEAR-SEQUENCE (e.g., 2024-001)
    v_student_id := NEW.year || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
    NEW.student_id := v_student_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;


-- Migration: 20251105133807
-- Fix the auto_register_student trigger to work with correct column names
-- The student_registrations table uses registration_number, not student_id

DROP TRIGGER IF EXISTS trigger_auto_register_student ON students;
DROP FUNCTION IF EXISTS auto_register_student();

-- We don't need the auto_register_student trigger for this application
-- The students table is independent from student_registrations table
-- They serve different purposes and should not be auto-linked

-- Ensure the generate_student_id trigger is working correctly
-- This trigger should only generate student_id when it's empty or null

CREATE OR REPLACE FUNCTION public.generate_student_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
  v_student_id TEXT;
BEGIN
  -- Only generate if student_id is not provided, is empty, or is null
  IF NEW.student_id IS NULL OR NEW.student_id = '' THEN
    -- Count existing students for this year
    SELECT COUNT(*) INTO v_count
    FROM students
    WHERE year = NEW.year;
    
    -- Generate student_id: YEAR-SEQUENCE (e.g., 2025-0001)
    v_student_id := NEW.year || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
    NEW.student_id := v_student_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Migration: 20251105152126
-- Auto-register students when they're added to students table
CREATE OR REPLACE FUNCTION public.auto_register_student()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if student is already registered
  IF NOT EXISTS (
    SELECT 1 FROM student_registrations 
    WHERE registration_number = NEW.student_id
  ) THEN
    -- Register the student
    INSERT INTO student_registrations (
      registration_number,
      name,
      sex,
      class_form,
      year,
      phone_number
    ) VALUES (
      NEW.student_id,
      NEW.name,
      NEW.sex,
      NEW.class_form,
      NEW.year,
      NULL
    );
    
    -- Generate invoices for the student based on school fees
    INSERT INTO student_invoices (
      registration_number,
      class_form,
      year,
      term,
      amount,
      installment_number,
      due_date,
      status
    )
    SELECT 
      NEW.student_id,
      sf.class_form,
      sf.year,
      sf.term,
      sf.total_amount / sf.installments,
      generate_series(1, sf.installments),
      CURRENT_DATE + (30 * generate_series(1, sf.installments)),
      'pending'
    FROM school_fees sf
    WHERE sf.class_form = NEW.class_form 
      AND sf.year = NEW.year
      AND sf.term = NEW.term;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-registration
DROP TRIGGER IF EXISTS trigger_auto_register_student ON students;
CREATE TRIGGER trigger_auto_register_student
  AFTER INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION auto_register_student();

-- Update student_registrations RLS to allow public read for login
DROP POLICY IF EXISTS "Public can view registrations for login" ON student_registrations;
CREATE POLICY "Public can view registrations for login"
  ON student_registrations
  FOR SELECT
  USING (true);

-- Migration: 20251108021653
-- Update auto_register_student trigger to use proper registration number format
CREATE OR REPLACE FUNCTION public.auto_register_student()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_reg_number TEXT;
BEGIN
  -- Check if student is already registered
  IF NOT EXISTS (
    SELECT 1 FROM student_registrations 
    WHERE registration_number = NEW.student_id
  ) THEN
    -- Use student_id as registration number (format: YEAR-XXXX)
    -- If student_id is not set, generate one
    IF NEW.student_id IS NULL OR NEW.student_id = '' THEN
      v_reg_number := generate_registration_number(NEW.class_form, NEW.year);
    ELSE
      v_reg_number := NEW.student_id;
    END IF;
    
    -- Register the student
    INSERT INTO student_registrations (
      registration_number,
      name,
      sex,
      class_form,
      year,
      phone_number
    ) VALUES (
      v_reg_number,
      NEW.name,
      NEW.sex,
      NEW.class_form,
      NEW.year,
      NULL
    )
    ON CONFLICT (registration_number) DO NOTHING;
    
    -- Generate invoices for the student based on school fees
    INSERT INTO student_invoices (
      registration_number,
      class_form,
      year,
      term,
      amount,
      installment_number,
      due_date,
      status
    )
    SELECT 
      v_reg_number,
      sf.class_form,
      sf.year,
      sf.term,
      sf.total_amount / sf.installments,
      generate_series(1, sf.installments),
      CURRENT_DATE + (30 * generate_series(1, sf.installments)),
      'pending'
    FROM school_fees sf
    WHERE sf.class_form = NEW.class_form 
      AND sf.year = NEW.year
      AND sf.term = NEW.term
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Migration: 20251108021741
-- Enable realtime for student_invoices table so students get instant updates when fees are cleared
ALTER PUBLICATION supabase_realtime ADD TABLE student_invoices;
