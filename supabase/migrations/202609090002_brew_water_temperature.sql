-- COF-36: optional method-specific water temperature for Brew Journal entries.
alter table public.brew_logs
add column if not exists water_temp_c numeric(5, 2)
check (water_temp_c is null or water_temp_c between 0 and 100);
