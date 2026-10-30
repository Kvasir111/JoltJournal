create table public.wishlist_items (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  brand_id bigint not null references public.brands (id) on delete restrict,
  flavor text not null,
  normalized_flavor text not null,
  created_at timestamptz not null default now(),
  constraint wishlist_items_flavor_length check (char_length(flavor) between 1 and 160),
  constraint wishlist_items_normalized_flavor_length check (char_length(normalized_flavor) between 1 and 160),
  constraint wishlist_items_normalized_flavor_format check (
    normalized_flavor = lower(btrim(regexp_replace(flavor, '\s+', ' ', 'g')))
  ),
  constraint wishlist_items_owner_brand_flavor_key unique (user_id, brand_id, normalized_flavor)
);

create index wishlist_items_brand_id_idx on public.wishlist_items (brand_id);
create index wishlist_items_user_created_at_idx on public.wishlist_items (user_id, created_at desc);

comment on table public.wishlist_items is 'Energy drink flavors a user wants to try.';

alter table public.wishlist_items enable row level security;

revoke all on table public.wishlist_items from anon, authenticated;
revoke all on sequence public.wishlist_items_id_seq from anon, authenticated;

grant select, insert, update, delete on table public.wishlist_items to authenticated;
grant usage, select on sequence public.wishlist_items_id_seq to authenticated;
grant select, insert, update, delete on table public.wishlist_items to service_role;
grant usage, select on sequence public.wishlist_items_id_seq to service_role;

create policy "Users can read their own wishlist"
on public.wishlist_items for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own wishlist items"
on public.wishlist_items for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own wishlist items"
on public.wishlist_items for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own wishlist items"
on public.wishlist_items for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.merge_my_brand(
  source_brand_id bigint,
  requested_target_name text
)
returns table (
  source_name text,
  target_name text,
  moved_drinks bigint,
  moved_wishlist bigint
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  clean_target_name text := btrim(regexp_replace(requested_target_name, '\s+', ' ', 'g'));
  normalized_target_name text;
  target_brand_id bigint;
  current_source_name text;
  drink_count bigint;
  wishlist_count bigint;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Sign in to manage brands.';
  end if;

  if clean_target_name is null or char_length(clean_target_name) not between 1 and 100 then
    raise exception using errcode = '22023', message = 'Enter a brand name between 1 and 100 characters.';
  end if;

  normalized_target_name := lower(clean_target_name);

  select brands.name
  into current_source_name
  from public.brands
  where brands.id = source_brand_id;

  if current_source_name is null then
    raise exception using errcode = 'P0002', message = 'The source brand no longer exists.';
  end if;

  if not exists (
    select 1 from public.drinks
    where drinks.user_id = current_user_id and drinks.brand_id = source_brand_id
    union all
    select 1 from public.wishlist_items
    where wishlist_items.user_id = current_user_id and wishlist_items.brand_id = source_brand_id
  ) then
    raise exception using errcode = '42501', message = 'That brand is not in your collection.';
  end if;

  insert into public.brands (name, normalized_name)
  values (clean_target_name, normalized_target_name)
  on conflict (normalized_name) do nothing;

  select brands.id, brands.name
  into target_brand_id, clean_target_name
  from public.brands
  where brands.normalized_name = normalized_target_name;

  if target_brand_id = source_brand_id then
    raise exception using errcode = '22023', message = 'Choose a different canonical brand name.';
  end if;

  if exists (
    select 1
    from public.drinks source_drink
    join public.drinks target_drink
      on target_drink.user_id = source_drink.user_id
      and target_drink.brand_id = target_brand_id
      and target_drink.normalized_flavor = source_drink.normalized_flavor
    where source_drink.user_id = current_user_id
      and source_drink.brand_id = source_brand_id
  ) then
    raise exception using errcode = '23505', message = 'Both brands contain the same rated flavor. Resolve that duplicate first.';
  end if;

  if exists (
    select 1
    from public.wishlist_items source_item
    join public.wishlist_items target_item
      on target_item.user_id = source_item.user_id
      and target_item.brand_id = target_brand_id
      and target_item.normalized_flavor = source_item.normalized_flavor
    where source_item.user_id = current_user_id
      and source_item.brand_id = source_brand_id
  ) then
    raise exception using errcode = '23505', message = 'Both brands contain the same wishlist flavor. Resolve that duplicate first.';
  end if;

  update public.drinks
  set brand_id = target_brand_id,
      updated_at = now()
  where drinks.user_id = current_user_id
    and drinks.brand_id = source_brand_id;
  get diagnostics drink_count = row_count;

  update public.wishlist_items
  set brand_id = target_brand_id
  where wishlist_items.user_id = current_user_id
    and wishlist_items.brand_id = source_brand_id;
  get diagnostics wishlist_count = row_count;

  return query
  select current_source_name, clean_target_name, drink_count, wishlist_count;
end;
$$;

revoke all on function public.merge_my_brand(bigint, text) from public, anon;
grant execute on function public.merge_my_brand(bigint, text) to authenticated;
