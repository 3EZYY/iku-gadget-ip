
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'seller');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS on user_roles: users can read their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Drop old journal policies
DROP POLICY IF EXISTS "Users can view their own journal" ON public.journal;
DROP POLICY IF EXISTS "Users can create their own journal" ON public.journal;
DROP POLICY IF EXISTS "Users can update their own journal" ON public.journal;
DROP POLICY IF EXISTS "Users can delete their own journal" ON public.journal;

-- New journal policies
-- Everyone (admin & seller) can view their own journal entries
CREATE POLICY "Users can view their own journal"
  ON public.journal FOR SELECT
  USING (auth.uid() = user_id);

-- Only admin can insert
CREATE POLICY "Admins can create journal"
  ON public.journal FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admin can update
CREATE POLICY "Admins can update journal"
  ON public.journal FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admin can delete
CREATE POLICY "Admins can delete journal"
  ON public.journal FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));
