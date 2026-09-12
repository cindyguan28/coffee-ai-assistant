-- User-owned library lifecycle and intent signals.
-- These signals remain separate from brew liking and sensory observations.

alter table public.beans
    add column if not exists favorite boolean not null default false,
    add column if not exists lifecycle_state text,
    add column if not exists repurchase_intent text;

alter table public.beans
    drop constraint if exists beans_lifecycle_state_check,
    add constraint beans_lifecycle_state_check
        check (lifecycle_state is null or lifecycle_state in ('want_to_try', 'currently_have', 'finished')),
    drop constraint if exists beans_repurchase_intent_check,
    add constraint beans_repurchase_intent_check
        check (repurchase_intent is null or repurchase_intent in ('buy_again', 'would_not_buy_again'));

create table if not exists public.bean_lifecycle_events (
    id uuid primary key default gen_random_uuid(),
    bean_id uuid not null references public.beans(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    field_name text not null check (field_name in ('favorite', 'lifecycle_state', 'repurchase_intent')),
    field_value text,
    created_at timestamptz not null default now()
);

create index if not exists bean_lifecycle_events_bean_created_idx
    on public.bean_lifecycle_events (bean_id, created_at desc);
create index if not exists bean_lifecycle_events_user_created_idx
    on public.bean_lifecycle_events (user_id, created_at desc);

alter table public.bean_lifecycle_events enable row level security;

drop policy if exists "Users read own bean lifecycle history" on public.bean_lifecycle_events;
create policy "Users read own bean lifecycle history"
on public.bean_lifecycle_events for select
using (auth.uid() = user_id);

drop policy if exists "Users add own bean lifecycle history" on public.bean_lifecycle_events;
create policy "Users add own bean lifecycle history"
on public.bean_lifecycle_events for insert
with check (
    auth.uid() = user_id
    and exists (
        select 1 from public.beans
        where beans.id = bean_lifecycle_events.bean_id
          and beans.user_id = auth.uid()
    )
);

create or replace function public.record_bean_library_state_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if old.favorite is distinct from new.favorite then
        insert into public.bean_lifecycle_events (bean_id, user_id, field_name, field_value)
        values (new.id, new.user_id, 'favorite', new.favorite::text);
    end if;
    if old.lifecycle_state is distinct from new.lifecycle_state then
        insert into public.bean_lifecycle_events (bean_id, user_id, field_name, field_value)
        values (new.id, new.user_id, 'lifecycle_state', new.lifecycle_state);
    end if;
    if old.repurchase_intent is distinct from new.repurchase_intent then
        insert into public.bean_lifecycle_events (bean_id, user_id, field_name, field_value)
        values (new.id, new.user_id, 'repurchase_intent', new.repurchase_intent);
    end if;
    return new;
end;
$$;

drop trigger if exists beans_record_library_state_change on public.beans;
create trigger beans_record_library_state_change
after update of favorite, lifecycle_state, repurchase_intent on public.beans
for each row execute function public.record_bean_library_state_change();

comment on column public.beans.favorite is 'Independent user favorite signal; not a sensory rating.';
comment on column public.beans.lifecycle_state is 'Current library lifecycle: want_to_try, currently_have, finished, or null.';
comment on column public.beans.repurchase_intent is 'Independent repurchase intent: buy_again, would_not_buy_again, or null.';
