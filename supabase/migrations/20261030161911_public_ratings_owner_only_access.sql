create table public.site_settings (
  singleton boolean primary key default true,
  owner_user_id uuid not null unique references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint site_settings_singleton_check check (singleton)
);

comment on table public.site_settings is 'Singleton identifying the account that curates the public rating archive.';

alter table public.site_settings enable row level security;

revoke all on table public.site_settings from anon, authenticated;
grant select on table public.site_settings to anon, authenticated;
grant select, insert, update, delete on table public.site_settings to service_role;

-- Existing installations have one claimed collection. Adopt it automatically;
-- fresh databases remain unconfigured until the first owner is designated.
with existing_owners as (
  select distinct user_id
  from public.drinks
  where user_id is not null
)
insert into public.site_settings (singleton, owner_user_id)
select true, user_id
from existing_owners
where (select count(*) from existing_owners) = 1;

create policy "Public can read site settings"
on public.site_settings for select
to anon, authenticated
using (true);

create or replace function public.is_site_owner()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (select auth.uid()) = (
      select site_settings.owner_user_id
      from public.site_settings
      where site_settings.singleton
    ),
    false
  );
$$;

revoke all on function public.is_site_owner() from public, anon;
grant execute on function public.is_site_owner() to authenticated;

grant select on table public.brands to anon;
grant select on table public.drinks to anon;

drop policy if exists "Authenticated users can read brands" on public.brands;
drop policy if exists "Authenticated users can create brands" on public.brands;
drop policy if exists "Users can read their own drinks" on public.drinks;
drop policy if exists "Users can create their own drinks" on public.drinks;
drop policy if exists "Users can update their own drinks" on public.drinks;
drop policy if exists "Users can delete their own drinks" on public.drinks;
drop policy if exists "Users can read their own wishlist" on public.wishlist_items;
drop policy if exists "Users can create their own wishlist items" on public.wishlist_items;
drop policy if exists "Users can update their own wishlist items" on public.wishlist_items;
drop policy if exists "Users can delete their own wishlist items" on public.wishlist_items;

create policy "Public can read brands"
on public.brands for select
to anon, authenticated
using (true);

create policy "Owner can create brands"
on public.brands for insert
to authenticated
with check ((select public.is_site_owner()));

create policy "Public can read owner drinks"
on public.drinks for select
to anon, authenticated
using (
  user_id = (
    select site_settings.owner_user_id
    from public.site_settings
    where site_settings.singleton
  )
);

create policy "Owner can create drinks"
on public.drinks for insert
to authenticated
with check (
  (select public.is_site_owner())
  and (select auth.uid()) = user_id
);

create policy "Owner can update drinks"
on public.drinks for update
to authenticated
using (
  (select public.is_site_owner())
  and (select auth.uid()) = user_id
)
with check (
  (select public.is_site_owner())
  and (select auth.uid()) = user_id
);

create policy "Owner can delete drinks"
on public.drinks for delete
to authenticated
using (
  (select public.is_site_owner())
  and (select auth.uid()) = user_id
);

create policy "Owner can read wishlist"
on public.wishlist_items for select
to authenticated
using (
  (select public.is_site_owner())
  and (select auth.uid()) = user_id
);

create policy "Owner can create wishlist items"
on public.wishlist_items for insert
to authenticated
with check (
  (select public.is_site_owner())
  and (select auth.uid()) = user_id
);

create policy "Owner can update wishlist items"
on public.wishlist_items for update
to authenticated
using (
  (select public.is_site_owner())
  and (select auth.uid()) = user_id
)
with check (
  (select public.is_site_owner())
  and (select auth.uid()) = user_id
);

create policy "Owner can delete wishlist items"
on public.wishlist_items for delete
to authenticated
using (
  (select public.is_site_owner())
  and (select auth.uid()) = user_id
);
