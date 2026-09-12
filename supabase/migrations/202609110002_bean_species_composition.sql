-- Add optional coffee species metadata without changing existing beans.

alter table public.beans
    add column if not exists species text,
    add column if not exists arabica_percentage smallint;

alter table public.beans
    drop constraint if exists beans_species_check,
    add constraint beans_species_check
        check (species is null or species in ('100% Arabica', '100% Robusta', 'Blend', 'Other', 'Unknown')),
    drop constraint if exists beans_arabica_percentage_check,
    add constraint beans_arabica_percentage_check
        check (
            (species = 'Blend' and (arabica_percentage is null or arabica_percentage between 0 and 100))
            or (species is distinct from 'Blend' and arabica_percentage is null)
        );

comment on column public.beans.species is 'User-facing species classification; Unknown is explicit and null means not provided.';
comment on column public.beans.arabica_percentage is 'Optional Arabica share for Arabica/Robusta blends; remaining percentage is Robusta.';
