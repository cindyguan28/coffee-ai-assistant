-- COF-74 / COF-81: add a format-neutral Coffee Product discriminator and
-- preserve reference profile, user perception, and brew context as distinct layers.
-- Existing table names and identifiers remain unchanged for compatibility.

alter table public.beans
    add column if not exists product_format text not null default 'whole_bean',
    add column if not exists capsule_system text,
    add column if not exists capsule_line text,
    add column if not exists capsule_intensity smallint;

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'beans_product_format_check'
    ) then
        alter table public.beans add constraint beans_product_format_check
            check (product_format in ('whole_bean', 'ground_coffee', 'capsule', 'other'));
    end if;
    if not exists (
        select 1 from pg_constraint where conname = 'beans_capsule_intensity_check'
    ) then
        alter table public.beans add constraint beans_capsule_intensity_check
            check (capsule_intensity is null or capsule_intensity between 1 and 15);
    end if;
end
$$;

alter table public.bean_profiles
    add column if not exists reference_source_type text not null default 'personal_entry',
    add column if not exists reference_source_name text,
    add column if not exists reference_source_url text;

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'bean_profiles_reference_source_type_check'
    ) then
        alter table public.bean_profiles add constraint bean_profiles_reference_source_type_check
            check (reference_source_type in ('personal_entry', 'roaster_official', 'retailer', 'open_data', 'other'));
    end if;
end
$$;

alter table public.brew_logs
    add column if not exists perceived_flavor_notes text,
    add column if not exists normalized_flavor_families text[] not null default '{}'::text[],
    add column if not exists taste_description text;

comment on column public.beans.product_format is
    'Format-neutral Coffee Product discriminator. Existing rows default to whole_bean.';
comment on column public.bean_profiles.reference_source_type is
    'Provenance of the reference profile; user perception never overwrites this layer.';
comment on column public.brew_logs.perceived_flavor_notes is
    'User wording preserved verbatim for the specific brew.';
comment on column public.brew_logs.normalized_flavor_families is
    'Optional broad families derived from perceived_flavor_notes; never replaces the original wording.';
