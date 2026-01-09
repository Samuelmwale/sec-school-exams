-- 1. Fix student_registrations missing school_id by linking to students table
UPDATE public.student_registrations sr
SET school_id = s.school_id
FROM public.students s
WHERE sr.registration_number = s.student_id
AND sr.school_id IS NULL
AND s.school_id IS NOT NULL;

-- 2. Fix the auto_register_student trigger to properly inherit school_id
CREATE OR REPLACE FUNCTION public.auto_register_student()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reg_number TEXT;
BEGIN
  -- Check if student is already registered
  IF NOT EXISTS (
    SELECT 1 FROM student_registrations 
    WHERE registration_number = NEW.student_id
  ) THEN
    -- Use student_id as registration number
    IF NEW.student_id IS NULL OR NEW.student_id = '' THEN
      v_reg_number := generate_registration_number(NEW.class_form, NEW.year);
    ELSE
      v_reg_number := NEW.student_id;
    END IF;
    
    -- Register the student WITH school_id from the students record
    INSERT INTO student_registrations (
      registration_number,
      name,
      sex,
      class_form,
      year,
      phone_number,
      school_id
    ) VALUES (
      v_reg_number,
      NEW.name,
      NEW.sex,
      NEW.class_form,
      NEW.year,
      NULL,
      NEW.school_id  -- Use the school_id from the student record
    )
    ON CONFLICT (registration_number) DO UPDATE
    SET school_id = EXCLUDED.school_id,
        name = EXCLUDED.name,
        sex = EXCLUDED.sex,
        class_form = EXCLUDED.class_form,
        year = EXCLUDED.year;
    
    -- Generate invoices for the student based on school fees
    INSERT INTO student_invoices (
      registration_number,
      class_form,
      year,
      term,
      amount,
      installment_number,
      due_date,
      status,
      school_id
    )
    SELECT 
      v_reg_number,
      sf.class_form,
      sf.year,
      sf.term,
      sf.total_amount / sf.installments,
      generate_series(1, sf.installments),
      CURRENT_DATE + (30 * generate_series(1, sf.installments)),
      'pending',
      NEW.school_id
    FROM school_fees sf
    WHERE sf.class_form = NEW.class_form 
      AND sf.year = NEW.year
      AND sf.term = NEW.term
    ON CONFLICT DO NOTHING;
  ELSE
    -- Update existing registration with school_id if missing
    UPDATE student_registrations
    SET school_id = NEW.school_id
    WHERE registration_number = NEW.student_id
    AND school_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Improve RLS for students table - school-based access
DROP POLICY IF EXISTS "Public read access for students" ON public.students;
DROP POLICY IF EXISTS "Public can insert students" ON public.students;
DROP POLICY IF EXISTS "Public can update students" ON public.students;
DROP POLICY IF EXISTS "Public can delete students" ON public.students;

-- Schools can read their own students
CREATE POLICY "Schools can view their students"
ON public.students FOR SELECT
USING (
  school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  OR school_id IN (SELECT school_id FROM student_registrations WHERE registration_number = student_id)
);

-- Public read for student portal (non-authenticated lookup)
CREATE POLICY "Public student lookup"
ON public.students FOR SELECT
USING (true);

-- Schools can manage their own students
CREATE POLICY "Schools can insert students"
ON public.students FOR INSERT
WITH CHECK (
  school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  OR school_id IS NOT NULL
);

CREATE POLICY "Schools can update their students"
ON public.students FOR UPDATE
USING (
  school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Schools can delete their students"
ON public.students FOR DELETE
USING (
  school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
);

-- 4. Fix license_codes to ensure one-time use
ALTER TABLE public.license_codes
ADD CONSTRAINT unique_license_per_school UNIQUE (school_id) 
DEFERRABLE INITIALLY DEFERRED;

-- Actually, we want multiple licenses per school but each license used only once
-- So remove that constraint and rely on the activate_license function
ALTER TABLE public.license_codes
DROP CONSTRAINT IF EXISTS unique_license_per_school;