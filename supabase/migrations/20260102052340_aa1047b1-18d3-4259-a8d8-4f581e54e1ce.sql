-- Fix the activate_license function to prevent license reuse
-- The function already checks is_used = false, so a license that's been used cannot be reused
-- But let's make it more robust with clearer error handling

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
  -- Find the license code
  SELECT * INTO v_license 
  FROM public.license_codes 
  WHERE code = p_code;
  
  -- Check if license exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid license code';
  END IF;
  
  -- Check if license is already used
  IF v_license.is_used = true THEN
    RAISE EXCEPTION 'This license code has already been used by another school';
  END IF;
  
  -- Calculate new expiry date
  v_new_expiry := now() + (v_license.days || ' days')::interval;
  
  -- Update the school subscription
  UPDATE public.schools 
  SET subscription_expiry = v_new_expiry, is_active = true
  WHERE id = p_school_id;
  
  -- Mark license as used and bind it to this school permanently
  UPDATE public.license_codes 
  SET is_used = true, used_at = now(), school_id = p_school_id
  WHERE id = v_license.id;
  
  RETURN true;
END;
$function$;