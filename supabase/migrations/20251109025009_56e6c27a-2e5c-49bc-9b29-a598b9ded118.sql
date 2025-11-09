-- Create schools table for multi-school support
CREATE TABLE IF NOT EXISTS public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name text NOT NULL,
  center_number text UNIQUE NOT NULL,
  division_name text,
  zone_name text,
  district_name text,
  address text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  subscription_expiry timestamp with time zone NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS and policies for schools
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admin can manage schools"
  ON public.schools
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can view schools"
  ON public.schools
  FOR SELECT
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Update trigger for updated_at
DO $$ BEGIN
  CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add school_id to relevant tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_id uuid NULL REFERENCES public.schools(id);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS school_id uuid NULL REFERENCES public.schools(id);
ALTER TABLE public.student_registrations ADD COLUMN IF NOT EXISTS school_id uuid NULL REFERENCES public.schools(id);
ALTER TABLE public.student_invoices ADD COLUMN IF NOT EXISTS school_id uuid NULL REFERENCES public.schools(id);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS school_id uuid NULL REFERENCES public.schools(id);
