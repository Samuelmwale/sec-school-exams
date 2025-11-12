-- Expose limited school info for public login (bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.get_school_public(p_school_id uuid)
RETURNS TABLE (
  id uuid,
  school_name text,
  center_number text,
  division_name text,
  zone_name text,
  district_name text,
  address text,
  is_active boolean,
  subscription_expiry timestamptz
) AS $$
  SELECT id, school_name, center_number, division_name, zone_name, district_name, address, is_active, subscription_expiry
  FROM public.schools
  WHERE id = p_school_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Auto-attach the current user's school_id to new students when missing
CREATE OR REPLACE FUNCTION public.set_student_school_id()
RETURNS trigger AS $$
DECLARE
  v_school_id uuid;
BEGIN
  IF NEW.school_id IS NULL THEN
    SELECT school_id INTO v_school_id FROM public.profiles WHERE id = auth.uid();
    IF v_school_id IS NOT NULL THEN
      NEW.school_id = v_school_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers to ensure IDs and auto-registration
DROP TRIGGER IF EXISTS trg_students_set_school_id ON public.students;
CREATE TRIGGER trg_students_set_school_id
BEFORE INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.set_student_school_id();

DROP TRIGGER IF EXISTS trg_students_generate_student_id ON public.students;
CREATE TRIGGER trg_students_generate_student_id
BEFORE INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.generate_student_id();

DROP TRIGGER IF EXISTS trg_students_auto_register ON public.students;
CREATE TRIGGER trg_students_auto_register
AFTER INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.auto_register_student();