
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

ALTER POLICY "Admins can delete all patients" ON public.patients USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins can update all patients" ON public.patients USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins can view all patients"   ON public.patients USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins can delete all profiles" ON public.profiles USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins can update all profiles" ON public.profiles USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins can view all profiles"   ON public.profiles USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins can delete all sessions" ON public.sessions USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins can update all sessions" ON public.sessions USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins can view all sessions"   ON public.sessions USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- user_roles policy also depends on public.has_role — recreate it
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

REVOKE ALL ON FUNCTION public.handle_new_user()      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_first_admin()   FROM PUBLIC, anon, authenticated;
