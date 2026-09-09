-- COF-37: remember the user's usual method so Bean guidance fits their setup.
alter table public.user_profiles
add column if not exists default_brew_method text;
