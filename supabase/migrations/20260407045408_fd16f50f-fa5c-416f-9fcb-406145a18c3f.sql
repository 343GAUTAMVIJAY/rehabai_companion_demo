
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('ded56968-10ca-4742-b9e1-7f757fcf4036', 'admin'),
  ('929cc8af-ff75-475f-a196-660804f92dc4', 'user'),
  ('9ccb902b-a67a-4cfb-9dd9-7206ed1f8a34', 'user'),
  ('f13243c8-bfa2-4e5d-8c6d-dbe48da684b7', 'user')
ON CONFLICT DO NOTHING;
