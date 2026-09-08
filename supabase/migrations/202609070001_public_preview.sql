-- Mylot public-preview schema.
-- Authentication is managed by Supabase Auth; all personal application rows
-- are protected by Row Level Security and owned by auth.uid().

create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.beans (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    legacy_id bigint,
    name text not null check (char_length(trim(name)) between 1 and 200),
    roaster text,
    country text,
    process text,
    roast_level text,
    price numeric(10, 2) check (price is null or price >= 0),
    weblink text,
    flavor_notes text,
    acidity text,
    body text,
    sweetness text,
    milk_compatibility text,
    personal_interest text,
    description_raw text,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, legacy_id)
);

create table if not exists public.bean_profiles (
    id uuid primary key default gen_random_uuid(),
    bean_id uuid not null unique references public.beans(id) on delete cascade,
    legacy_id bigint,
    predicted_acidity text,
    predicted_body text,
    predicted_sweetness text,
    predicted_notes text,
    recommended_method text,
    recommended_ratio text,
    recommended_temp text,
    confidence numeric(4, 3) check (confidence is null or confidence between 0 and 1),
    reasoning text,
    generated_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.brew_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    bean_id uuid references public.beans(id) on delete set null,
    legacy_id bigint,
    brew_date date,
    bean_best_before date,
    machine_model text,
    grinder_type text,
    default_dose_g numeric(7, 2) check (default_dose_g is null or default_dose_g >= 0),
    brew_method text,
    drink_type text,
    grind_setting integer,
    espresso_volume_ml numeric(8, 2) check (espresso_volume_ml is null or espresso_volume_ml >= 0),
    extraction_time_sec numeric(8, 2) check (extraction_time_sec is null or extraction_time_sec >= 0),
    milk_ml numeric(8, 2) check (milk_ml is null or milk_ml >= 0),
    milk_type text,
    acidity smallint check (acidity is null or acidity between 1 and 5),
    bitterness smallint check (bitterness is null or bitterness between 1 and 5),
    body smallint check (body is null or body between 1 and 5),
    sweetness smallint check (sweetness is null or sweetness between 1 and 5),
    balance smallint check (balance is null or balance between 1 and 5),
    aroma smallint check (aroma is null or aroma between 1 and 5),
    score numeric(4, 2) check (score is null or score between 0 and 10),
    taste_result text,
    problem_tags text,
    next_adjustment text,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, legacy_id)
);

create index if not exists beans_user_created_idx on public.beans (user_id, created_at desc);
create index if not exists brew_logs_user_date_idx on public.brew_logs (user_id, brew_date desc);
create index if not exists brew_logs_bean_idx on public.brew_logs (bean_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

drop trigger if exists beans_set_updated_at on public.beans;
create trigger beans_set_updated_at
before update on public.beans
for each row execute function public.set_updated_at();

drop trigger if exists bean_profiles_set_updated_at on public.bean_profiles;
create trigger bean_profiles_set_updated_at
before update on public.bean_profiles
for each row execute function public.set_updated_at();

drop trigger if exists brew_logs_set_updated_at on public.brew_logs;
create trigger brew_logs_set_updated_at
before update on public.brew_logs
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
    insert into public.user_profiles (user_id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
    on conflict (user_id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.user_profiles enable row level security;
alter table public.beans enable row level security;
alter table public.bean_profiles enable row level security;
alter table public.brew_logs enable row level security;

drop policy if exists "profiles_select_own" on public.user_profiles;
create policy "profiles_select_own" on public.user_profiles
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "profiles_update_own" on public.user_profiles;
create policy "profiles_update_own" on public.user_profiles
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "beans_select_own" on public.beans;
create policy "beans_select_own" on public.beans
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "beans_insert_own" on public.beans;
create policy "beans_insert_own" on public.beans
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "beans_update_own" on public.beans;
create policy "beans_update_own" on public.beans
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "beans_delete_own" on public.beans;
create policy "beans_delete_own" on public.beans
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "bean_profiles_select_through_bean" on public.bean_profiles;
create policy "bean_profiles_select_through_bean" on public.bean_profiles
for select to authenticated using (
    exists (
        select 1 from public.beans
        where beans.id = bean_profiles.bean_id
          and beans.user_id = (select auth.uid())
    )
);

drop policy if exists "bean_profiles_insert_through_bean" on public.bean_profiles;
create policy "bean_profiles_insert_through_bean" on public.bean_profiles
for insert to authenticated with check (
    exists (
        select 1 from public.beans
        where beans.id = bean_profiles.bean_id
          and beans.user_id = (select auth.uid())
    )
);

drop policy if exists "bean_profiles_update_through_bean" on public.bean_profiles;
create policy "bean_profiles_update_through_bean" on public.bean_profiles
for update to authenticated
using (
    exists (
        select 1 from public.beans
        where beans.id = bean_profiles.bean_id
          and beans.user_id = (select auth.uid())
    )
)
with check (
    exists (
        select 1 from public.beans
        where beans.id = bean_profiles.bean_id
          and beans.user_id = (select auth.uid())
    )
);

drop policy if exists "bean_profiles_delete_through_bean" on public.bean_profiles;
create policy "bean_profiles_delete_through_bean" on public.bean_profiles
for delete to authenticated using (
    exists (
        select 1 from public.beans
        where beans.id = bean_profiles.bean_id
          and beans.user_id = (select auth.uid())
    )
);

drop policy if exists "brew_logs_select_own" on public.brew_logs;
create policy "brew_logs_select_own" on public.brew_logs
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "brew_logs_insert_own" on public.brew_logs;
create policy "brew_logs_insert_own" on public.brew_logs
for insert to authenticated with check (
    (select auth.uid()) = user_id
    and (
        bean_id is null
        or exists (
            select 1 from public.beans
            where beans.id = brew_logs.bean_id
              and beans.user_id = (select auth.uid())
        )
    )
);

drop policy if exists "brew_logs_update_own" on public.brew_logs;
create policy "brew_logs_update_own" on public.brew_logs
for update to authenticated
using ((select auth.uid()) = user_id)
with check (
    (select auth.uid()) = user_id
    and (
        bean_id is null
        or exists (
            select 1 from public.beans
            where beans.id = brew_logs.bean_id
              and beans.user_id = (select auth.uid())
        )
    )
);

drop policy if exists "brew_logs_delete_own" on public.brew_logs;
create policy "brew_logs_delete_own" on public.brew_logs
for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.user_profiles, public.beans, public.bean_profiles, public.brew_logs from anon;
grant select, update on public.user_profiles to authenticated;
grant select, insert, update, delete on public.beans, public.bean_profiles, public.brew_logs to authenticated;

