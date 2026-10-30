begin;
select plan(27);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.com');

insert into public.site_settings (singleton, owner_user_id)
values (true, '11111111-1111-1111-1111-111111111111')
on conflict (singleton) do update
set owner_user_id = excluded.owner_user_id;

insert into public.brands (name, normalized_name)
values ('Policy Test Brand', 'policy test brand');

insert into public.drinks (user_id, brand_id, flavor, normalized_flavor, rating, buy_again)
select '11111111-1111-1111-1111-111111111111', id, 'Owner Drink', 'owner drink', 8, true
from public.brands where normalized_name = 'policy test brand';

insert into public.drinks (user_id, brand_id, flavor, normalized_flavor, rating, buy_again)
select '22222222-2222-2222-2222-222222222222', id, 'Other Drink', 'other drink', 4, false
from public.brands where normalized_name = 'policy test brand';

insert into public.wishlist_items (user_id, brand_id, flavor, normalized_flavor)
select '11111111-1111-1111-1111-111111111111', id, 'Owner Wish', 'owner wish'
from public.brands where normalized_name = 'policy test brand';

insert into public.wishlist_items (user_id, brand_id, flavor, normalized_flavor)
select '22222222-2222-2222-2222-222222222222', id, 'Other Wish', 'other wish'
from public.brands where normalized_name = 'policy test brand';

set local role anon;
select results_eq(
  $$select name from public.brands order by name$$,
  array['Policy Test Brand'::text],
  'anonymous visitors can read brands'
);
select results_eq(
  $$select flavor from public.drinks order by flavor$$,
  array['Owner Drink'::text],
  'anonymous visitors can read only the owner rating collection'
);
select throws_ok(
  $$select * from public.wishlist_items$$,
  '42501',
  null,
  'anonymous users cannot read wishlist items'
);
select throws_ok(
  $$select * from public.merge_my_brand(1, 'Blocked')$$,
  '42501',
  null,
  'anonymous users cannot call brand management'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222"}', true);

select results_eq(
  $$select flavor from public.drinks order by flavor$$,
  array['Owner Drink'::text],
  'authenticated non-owners see the same public rating collection'
);
select throws_ok(
  $$insert into public.brands (name, normalized_name) values ('Blocked Brand', 'blocked brand')$$,
  '42501',
  null,
  'authenticated non-owners cannot create brands'
);
select throws_ok(
  $$insert into public.drinks (user_id, brand_id, flavor, normalized_flavor, rating)
    select '22222222-2222-2222-2222-222222222222', id, 'Blocked Drink', 'blocked drink', 5
    from public.brands where normalized_name = 'policy test brand'$$,
  '42501',
  null,
  'authenticated non-owners cannot create ratings'
);
select results_eq(
  $$select count(*)::bigint from public.wishlist_items$$,
  array[0::bigint],
  'authenticated non-owners cannot read the private wishlist'
);

select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', true);

select results_eq(
  $$select flavor from public.drinks order by flavor$$,
  array['Owner Drink'::text],
  'the owner can read the public rating collection'
);
select results_eq(
  $$select name from public.brands where normalized_name = 'policy test brand'$$,
  array['Policy Test Brand'::text],
  'authenticated users can read shared brands'
);
select results_eq(
  $$select flavor from public.wishlist_items order by flavor$$,
  array['Owner Wish'::text],
  'users can read only their own wishlist items'
);
select lives_ok(
  $$insert into public.brands (name, normalized_name) values ('New Test Brand', 'new test brand')$$,
  'the owner can create brands'
);
select throws_ok(
  $$update public.brands set name = 'Changed' where normalized_name = 'policy test brand'$$,
  '42501',
  null,
  'authenticated users cannot rename shared brands'
);
select lives_ok(
  $$insert into public.drinks (user_id, brand_id, flavor, normalized_flavor, rating)
    select '11111111-1111-1111-1111-111111111111', id, 'New Owner Drink', 'new owner drink', 7
    from public.brands where normalized_name = 'policy test brand'$$,
  'the owner can create ratings'
);
select throws_ok(
  $$insert into public.drinks (user_id, brand_id, flavor, normalized_flavor, rating)
    select '22222222-2222-2222-2222-222222222222', id, 'Stolen Drink', 'stolen drink', 7
    from public.brands where normalized_name = 'policy test brand'$$,
  '42501',
  null,
  'the owner cannot create ratings assigned to another user'
);
select lives_ok(
  $$insert into public.wishlist_items (user_id, brand_id, flavor, normalized_flavor)
    select '11111111-1111-1111-1111-111111111111', id, 'New Owner Wish', 'new owner wish'
    from public.brands where normalized_name = 'policy test brand'$$,
  'the owner can create wishlist items'
);
select throws_ok(
  $$insert into public.wishlist_items (user_id, brand_id, flavor, normalized_flavor)
    select '22222222-2222-2222-2222-222222222222', id, 'Stolen Wish', 'stolen wish'
    from public.brands where normalized_name = 'policy test brand'$$,
  '42501',
  null,
  'the owner cannot create wishlist items for another user'
);
select lives_ok(
  $$update public.drinks set rating = 9 where flavor = 'Owner Drink'$$,
  'users can update their own drinks'
);
select results_eq(
  $$select rating from public.drinks where flavor = 'Owner Drink'$$,
  array[9.0::numeric],
  'the owner update is persisted'
);
select lives_ok(
  $$update public.drinks set rating = 10 where flavor = 'Other Drink'$$,
  'cross-owner updates reveal no authorization error'
);
select results_eq(
  $$select count(*)::bigint from public.drinks where flavor = 'Other Drink'$$,
  array[0::bigint],
  'other users rows remain invisible'
);
select lives_ok(
  $$delete from public.drinks where flavor = 'Owner Drink'$$,
  'users can delete their own drinks'
);
select results_eq(
  $$select count(*)::bigint from public.drinks where flavor = 'Owner Drink'$$,
  array[0::bigint],
  'the owner delete is persisted'
);

select lives_ok(
  $$select * from public.merge_my_brand(
      (select id from public.brands where normalized_name = 'policy test brand'),
      'New Test Brand'
    )$$,
  'users can merge their collection into a canonical brand'
);
select results_eq(
  $$select brands.name from public.drinks join public.brands on brands.id = drinks.brand_id where drinks.flavor = 'New Owner Drink'$$,
  array['New Test Brand'::text],
  'brand merge moves the users rated drinks'
);
select results_eq(
  $$select brands.name from public.wishlist_items join public.brands on brands.id = wishlist_items.brand_id where wishlist_items.flavor = 'Owner Wish'$$,
  array['New Test Brand'::text],
  'brand merge moves the users wishlist items'
);

set local role postgres;
select results_eq(
  $$select brands.name from public.drinks join public.brands on brands.id = drinks.brand_id where drinks.flavor = 'Other Drink'$$,
  array['Policy Test Brand'::text],
  'brand merge does not rewrite another users collection'
);

select * from finish();
rollback;
