-- Create school announcements table
CREATE TABLE public.school_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.school_announcements ENABLE ROW LEVEL SECURITY;

-- Students can view active announcements from their school
CREATE POLICY "Students can view school announcements"
ON public.school_announcements
FOR SELECT
USING (
  is_active = true AND
  school_id IN (
    SELECT school_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Admins can manage announcements
CREATE POLICY "Admins can manage announcements"
ON public.school_announcements
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  school_id IN (
    SELECT school_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_school_announcements_updated_at
BEFORE UPDATE ON public.school_announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();