-- Create a function for super admin to get all schools (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_all_schools_admin()
RETURNS SETOF public.schools
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.schools ORDER BY created_at DESC;
$$;