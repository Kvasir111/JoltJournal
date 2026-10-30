create table public.brands (
  id bigint generated always as identity primary key,
  name text not null,
  normalized_name text not null,
  created_at timestamptz not null default now(),
  constraint brands_name_length check (char_length(name) between 1 and 100),
  constraint brands_normalized_name_length check (char_length(normalized_name) between 1 and 100),
  constraint brands_normalized_name_format check (
    normalized_name = lower(btrim(regexp_replace(name, '\s+', ' ', 'g')))
  ),
  constraint brands_normalized_name_key unique (normalized_name)
);

create table public.drinks (
  id bigint generated always as identity primary key,
  user_id uuid null references auth.users (id) on delete cascade,
  brand_id bigint not null references public.brands (id) on delete restrict,
  source_key text null,
  flavor text not null,
  normalized_flavor text not null,
  rating numeric(3, 1) not null,
  buy_again boolean null,
  notes text null,
  tried_at date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint drinks_flavor_length check (char_length(flavor) between 1 and 160),
  constraint drinks_normalized_flavor_length check (char_length(normalized_flavor) between 1 and 160),
  constraint drinks_normalized_flavor_format check (
    normalized_flavor = lower(btrim(regexp_replace(flavor, '\s+', ' ', 'g')))
  ),
  constraint drinks_rating_range check (rating >= 1 and rating <= 10),
  constraint drinks_notes_length check (notes is null or char_length(notes) <= 2000),
  constraint drinks_source_key_key unique (source_key)
);

create index drinks_brand_id_idx on public.drinks (brand_id);
create index drinks_user_id_idx on public.drinks (user_id) where user_id is not null;
create unique index drinks_owner_brand_flavor_uidx
  on public.drinks (
    coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid),
    brand_id,
    normalized_flavor
  );

comment on table public.brands is 'Canonical energy drink brands shared by rating records.';
comment on table public.drinks is 'Energy drink flavor ratings. Null user_id rows are the pre-authentication owner collection.';
comment on column public.drinks.buy_again is 'True for yes, false for no, and null for not decided.';
comment on column public.drinks.source_key is 'Stable identifier used to idempotently import the original workbook data.';

alter table public.brands enable row level security;
alter table public.drinks enable row level security;

revoke all on table public.brands from anon, authenticated;
revoke all on table public.drinks from anon, authenticated;
revoke all on sequence public.brands_id_seq from anon, authenticated;
revoke all on sequence public.drinks_id_seq from anon, authenticated;

grant select, insert, update, delete on table public.brands to service_role;
grant select, insert, update, delete on table public.drinks to service_role;
grant usage, select on sequence public.brands_id_seq to service_role;
grant usage, select on sequence public.drinks_id_seq to service_role;

-- No anon or authenticated policies are created yet. The Nuxt server uses the
-- server-only secret key until user authentication and ownership policies land.
