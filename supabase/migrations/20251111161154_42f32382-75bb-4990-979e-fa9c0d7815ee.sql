-- Drop existing policies on schools table
DROP POLICY IF EXISTS "Admin can manage schools" ON public.schools;
DROP POLICY IF EXISTS "Public can view schools" ON public.schools;

-- Allow authenticated users to insert their first school
CREATE POLICY "Users can create their first school"
ON public.schools
FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND school_id IS NOT NULL
  )
);

-- Allow users to view schools they're associated with
CREATE POLICY "Users can view own school"
ON public.schools
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT school_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Only admins can update schools
CREATE POLICY "Admins can update schools"
ON public.schools
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND id IN (
    SELECT school_id FROM public.profiles WHERE id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND id IN (
    SELECT school_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Only admins can delete schools
CREATE POLICY "Admins can delete schools"
ON public.schools
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND id IN (
    SELECT school_id FROM public.profiles WHERE id = auth.uid()
  )
);