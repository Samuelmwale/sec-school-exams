-- Create table for license codes
CREATE TABLE public.license_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  school_id UUID REFERENCES public.schools(id),
  days INTEGER NOT NULL,
  package_name TEXT NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL DEFAULT 'Mr Mwale'
);

-- Enable RLS
ALTER TABLE public.license_codes ENABLE ROW LEVEL SECURITY;

-- Policy for schools to use their own license codes
CREATE POLICY "Schools can view their own license codes"
ON public.license_codes
FOR SELECT
USING (
  school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  OR school_id IS NULL
);

-- Policy for using license codes (anyone authenticated can attempt to use)
CREATE POLICY "Authenticated users can use license codes"
ON public.license_codes
FOR UPDATE
USING (is_used = false)
WITH CHECK (is_used = true);

-- Create function to generate random license code
CREATE OR REPLACE FUNCTION public.generate_license_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  RETURN v_code;
END;
$$;

-- Create function to activate license code
CREATE OR REPLACE FUNCTION public.activate_license(p_code TEXT, p_school_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_license RECORD;
  v_new_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Find the unused license code
  SELECT * INTO v_license 
  FROM public.license_codes 
  WHERE code = p_code AND is_used = false;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Calculate new expiry date
  v_new_expiry := now() + (v_license.days || ' days')::interval;
  
  -- Update the school subscription
  UPDATE public.schools 
  SET subscription_expiry = v_new_expiry, is_active = true
  WHERE id = p_school_id;
  
  -- Mark license as used
  UPDATE public.license_codes 
  SET is_used = true, used_at = now(), school_id = p_school_id
  WHERE id = v_license.id;
  
  RETURN true;
END;
$$;