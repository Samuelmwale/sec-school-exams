-- Create school_subjects table for custom subjects per school
CREATE TABLE public.school_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(school_id, name),
  UNIQUE(school_id, abbreviation)
);

-- Enable RLS
ALTER TABLE public.school_subjects ENABLE ROW LEVEL SECURITY;

-- RLS policies for school_subjects
CREATE POLICY "Schools can view their subjects"
ON public.school_subjects
FOR SELECT
USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()) OR school_id IS NULL);

CREATE POLICY "Admin can manage subjects"
ON public.school_subjects
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_school_subjects_updated_at
BEFORE UPDATE ON public.school_subjects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();