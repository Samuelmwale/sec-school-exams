-- Create a function to generate and insert license codes (bypasses RLS with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.create_license_code(p_days integer, p_package_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Generate a random 16-character code: XXXX-XXXX-XXXX-XXXX
  v_code := upper(
    substr(md5(random()::text), 1, 4) || '-' ||
    substr(md5(random()::text), 1, 4) || '-' ||
    substr(md5(random()::text), 1, 4) || '-' ||
    substr(md5(random()::text), 1, 4)
  );
  
  -- Insert the license code
  INSERT INTO public.license_codes (code, days, package_name)
  VALUES (v_code, p_days, p_package_name);
  
  RETURN v_code;
END;
$$;