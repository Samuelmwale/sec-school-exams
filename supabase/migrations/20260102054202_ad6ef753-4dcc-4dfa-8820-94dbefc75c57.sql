-- Fix: license codes must be one-school-only even if duplicate rows exist
CREATE OR REPLACE FUNCTION public.activate_license(p_code text, p_school_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_license RECORD;
  v_new_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Lock a representative row for this code to avoid race conditions
  SELECT * INTO v_license
  FROM public.license_codes
  WHERE code = p_code
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid license code';
  END IF;

  -- If ANY row with this code was already used, block reuse everywhere
  IF EXISTS (
    SELECT 1 FROM public.license_codes
    WHERE code = p_code AND is_used = true
  ) THEN
    RAISE EXCEPTION 'This license code has already been used by another school';
  END IF;

  v_new_expiry := now() + (v_license.days || ' days')::interval;

  UPDATE public.schools
  SET subscription_expiry = v_new_expiry, is_active = true
  WHERE id = p_school_id;

  -- Mark ALL rows with this code as used and bound to this school
  UPDATE public.license_codes
  SET is_used = true, used_at = now(), school_id = p_school_id
  WHERE code = p_code;

  RETURN true;
END;
$function$;

-- Backfill: link existing student results to the correct school where possible
UPDATE public.students s
SET school_id = sr.school_id
FROM public.student_registrations sr
WHERE s.school_id IS NULL
  AND sr.school_id IS NOT NULL
  AND s.student_id IS NOT NULL
  AND sr.registration_number = s.student_id;
