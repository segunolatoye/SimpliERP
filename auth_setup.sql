-- 1. Create or replace the function to handle new users from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, phone_number, phone_verified, password_hash, is_superadmin, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    NEW.phone_confirmed_at IS NOT NULL,
    '', -- password_hash is not managed here
    COALESCE((NEW.raw_app_meta_data->>'is_super_admin')::boolean, false),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Create a trigger function to restrict updating is_superadmin
CREATE OR REPLACE FUNCTION public.restrict_superadmin_update()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_superadmin IS DISTINCT FROM OLD.is_superadmin THEN
    -- Only allow if session role is service_role or postgres
    IF current_setting('role') NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
      RAISE EXCEPTION 'You are not allowed to update the is_superadmin column';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Apply the update restriction trigger to public.users
DROP TRIGGER IF EXISTS check_superadmin_update ON public.users;
CREATE TRIGGER check_superadmin_update
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.restrict_superadmin_update();
