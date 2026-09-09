-- COF-34: retain the package size used with a Bean price.
alter table public.beans
add column if not exists package_weight_g numeric(8, 2);

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'beans_package_weight_g_check'
    ) then
        alter table public.beans
        add constraint beans_package_weight_g_check
        check (package_weight_g is null or package_weight_g > 0);
    end if;
end
$$;
