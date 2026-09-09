-- COF-35: remember one default brewing setup per user.
-- Existing journal entries keep their own equipment snapshots.
alter table public.user_profiles
add column if not exists default_machine_model text;

alter table public.user_profiles
add column if not exists default_grinder_type text;
