-- Add unique constraint for school identification (all fields combined)
CREATE UNIQUE INDEX idx_schools_unique_identity 
ON public.schools (
  LOWER(school_name), 
  LOWER(COALESCE(center_number, '')), 
  LOWER(COALESCE(district_name, '')), 
  LOWER(COALESCE(zone_name, '')), 
  LOWER(COALESCE(division_name, ''))
);

-- Add blocking columns to schools table
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS blocked_until timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS blocked_permanently boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS block_reason text DEFAULT NULL;

-- Create messages table for two-way and broadcast messaging
CREATE TABLE public.admin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_type text NOT NULL CHECK (sender_type IN ('admin', 'school')),
  sender_id uuid, -- NULL for admin (Mr Mwale), school_id for schools
  recipient_school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE, -- NULL for broadcast
  is_broadcast boolean DEFAULT false,
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create activity logs table for tracking
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid,
  student_registration_number text,
  activity_type text NOT NULL CHECK (activity_type IN ('login', 'logout', 'page_view', 'action')),
  details jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Add last_seen tracking
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone DEFAULT NULL;

ALTER TABLE public.student_registrations 
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone DEFAULT NULL;

-- Enable RLS
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS for admin_messages
CREATE POLICY "Admin can manage all messages" ON public.admin_messages
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Schools can view their messages" ON public.admin_messages
FOR SELECT USING (
  recipient_school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  OR is_broadcast = true
);

CREATE POLICY "Schools can send messages" ON public.admin_messages
FOR INSERT WITH CHECK (
  sender_type = 'school' 
  AND sender_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Schools can mark messages as read" ON public.admin_messages
FOR UPDATE USING (
  recipient_school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
);

-- RLS for activity_logs  
CREATE POLICY "Admin can view all activity logs" ON public.activity_logs
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Schools can insert own logs" ON public.activity_logs
FOR INSERT WITH CHECK (
  school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
);

-- Function to check if school is blocked
CREATE OR REPLACE FUNCTION public.is_school_blocked(p_school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.schools 
    WHERE id = p_school_id 
    AND (blocked_permanently = true OR (blocked_until IS NOT NULL AND blocked_until > now()))
  );
$$;

-- Function to check duplicate school on registration
CREATE OR REPLACE FUNCTION public.check_duplicate_school(
  p_school_name text,
  p_center_number text,
  p_district_name text,
  p_zone_name text,
  p_division_name text
)
RETURNS TABLE(is_duplicate boolean, existing_school_id uuid, existing_school_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    true as is_duplicate,
    id as existing_school_id,
    school_name as existing_school_name
  FROM public.schools 
  WHERE LOWER(school_name) = LOWER(p_school_name)
    AND LOWER(COALESCE(center_number, '')) = LOWER(COALESCE(p_center_number, ''))
    AND LOWER(COALESCE(district_name, '')) = LOWER(COALESCE(p_district_name, ''))
    AND LOWER(COALESCE(zone_name, '')) = LOWER(COALESCE(p_zone_name, ''))
    AND LOWER(COALESCE(division_name, '')) = LOWER(COALESCE(p_division_name, ''))
  LIMIT 1;
$$;

-- Update activity tracking function
CREATE OR REPLACE FUNCTION public.log_activity(
  p_school_id uuid,
  p_activity_type text,
  p_details jsonb DEFAULT '{}',
  p_student_reg text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_logs (school_id, user_id, student_registration_number, activity_type, details)
  VALUES (p_school_id, auth.uid(), p_student_reg, p_activity_type, p_details);
  
  -- Update last active timestamp
  IF p_school_id IS NOT NULL THEN
    UPDATE public.schools SET last_active_at = now() WHERE id = p_school_id;
  END IF;
  
  IF p_student_reg IS NOT NULL THEN
    UPDATE public.student_registrations SET last_seen_at = now() WHERE registration_number = p_student_reg;
  END IF;
END;
$$;