-- 1. Update trial period from 30 days to 5 days for new schools
CREATE OR REPLACE FUNCTION public.register_school(p_school_name text, p_center_number text, p_division_name text, p_zone_name text, p_district_name text, p_address text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_school_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.schools (
    school_name, center_number, division_name, zone_name, district_name, address, is_active, subscription_expiry
  ) values (
    p_school_name, p_center_number, p_division_name, p_zone_name, p_district_name, p_address, true, now() + interval '5 days'
  )
  returning id into v_school_id;

  -- Link school to user profile
  update public.profiles
  set school_id = v_school_id
  where id = v_user_id;

  -- Ensure the user has admin role
  insert into public.user_roles(user_id, role)
  values (v_user_id, 'admin')
  on conflict (user_id, role) do nothing;

  return v_school_id;
end;
$function$;

-- 2. Update activate_license to strictly enforce one-school-per-license
CREATE OR REPLACE FUNCTION public.activate_license(p_code text, p_school_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_license RECORD;
  v_new_expiry TIMESTAMP WITH TIME ZONE;
  v_current_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get license code with lock to prevent race conditions
  SELECT * INTO v_license
  FROM public.license_codes
  WHERE UPPER(code) = UPPER(p_code)
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid license code. Please check and try again.';
  END IF;

  -- Check if license has already been used by ANY school
  IF v_license.is_used = true THEN
    IF v_license.school_id = p_school_id THEN
      RAISE EXCEPTION 'This license code has already been activated for your school.';
    ELSE
      RAISE EXCEPTION 'This license code has already been used by another school. Each license can only be used once.';
    END IF;
  END IF;

  -- Get current expiry to extend from if not expired
  SELECT subscription_expiry INTO v_current_expiry
  FROM public.schools WHERE id = p_school_id;

  -- Calculate new expiry: extend from current if still active, otherwise from now
  IF v_current_expiry IS NOT NULL AND v_current_expiry > now() THEN
    v_new_expiry := v_current_expiry + (v_license.days || ' days')::interval;
  ELSE
    v_new_expiry := now() + (v_license.days || ' days')::interval;
  END IF;

  -- Update school subscription
  UPDATE public.schools
  SET subscription_expiry = v_new_expiry, is_active = true
  WHERE id = p_school_id;

  -- Mark license as used and bound to this school
  UPDATE public.license_codes
  SET is_used = true, used_at = now(), school_id = p_school_id
  WHERE UPPER(code) = UPPER(p_code);

  RETURN true;
END;
$function$;

-- 3. Add RLS policy for Super Admin to view ALL schools regardless of their own school
DROP POLICY IF EXISTS "Super admin can view all schools" ON public.schools;
CREATE POLICY "Super admin can view all schools" 
ON public.schools 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (id IN (SELECT school_id FROM profiles WHERE id = auth.uid()))
);