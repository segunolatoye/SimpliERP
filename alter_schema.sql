ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false;
