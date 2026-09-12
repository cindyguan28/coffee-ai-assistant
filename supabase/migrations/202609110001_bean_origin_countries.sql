-- COF-56: structured multi-origin support while retaining the legacy country
-- summary for older clients and gradual rollout compatibility.

alter table public.beans
    add column if not exists origin_countries text[];

update public.beans
set origin_countries = array[trim(country)]
where origin_countries is null
  and nullif(trim(country), '') is not null;

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'beans_origin_countries_size_check'
    ) then
        alter table public.beans
            add constraint beans_origin_countries_size_check
            check (origin_countries is null or cardinality(origin_countries) between 1 and 12);
    end if;
end
$$;
