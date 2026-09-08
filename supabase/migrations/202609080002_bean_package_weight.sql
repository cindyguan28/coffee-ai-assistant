-- COF-34: retain the package size used with a Bean price.
alter table public.beans
add column if not exists package_weight_g numeric(8, 2);

alter table public.beans
drop constraint if exists beans_package_weight_g_check;

alter table public.beans
add constraint beans_package_weight_g_check
check (package_weight_g is null or package_weight_g > 0);
