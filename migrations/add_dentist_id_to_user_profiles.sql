-- Link system users to doctor profiles for doctor-specific dashboard customization
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS dentist_id UUID NULL REFERENCES public.dentists(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_dentist_id
ON public.user_profiles(dentist_id);
