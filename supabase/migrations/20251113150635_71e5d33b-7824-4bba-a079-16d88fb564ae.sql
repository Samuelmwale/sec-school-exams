-- Update auto_register_student to include school_id when creating invoices
CREATE OR REPLACE FUNCTION public.auto_register_student()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_reg_number TEXT;
  v_school_id UUID;
BEGIN
  -- Get school_id from the student record
  v_school_id := NEW.school_id;
  
  -- Check if student is already registered
  IF NOT EXISTS (
    SELECT 1 FROM student_registrations 
    WHERE registration_number = NEW.student_id
  ) THEN
    -- Use student_id as registration number (format: YEAR-XXXX)
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
      phone_number,
      school_id
    ) VALUES (
      v_reg_number,
      NEW.name,
      NEW.sex,
      NEW.class_form,
      NEW.year,
      NULL,
      v_school_id
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
      v_school_id
    FROM school_fees sf
    WHERE sf.class_form = NEW.class_form 
      AND sf.year = NEW.year
      AND sf.term = NEW.term
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;