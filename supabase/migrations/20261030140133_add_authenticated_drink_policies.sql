revoke all on table public.brands from anon, authenticated;
revoke all on table public.drinks from anon, authenticated;
revoke all on sequence public.brands_id_seq from anon, authenticated;
revoke all on sequence public.drinks_id_seq from anon, authenticated;

grant select, insert on table public.brands to authenticated;
grant select, insert, update, delete on table public.drinks to authenticated;
grant usage, select on sequence public.brands_id_seq to authenticated;
grant usage, select on sequence public.drinks_id_seq to authenticated;

create policy "Authenticated users can read brands"
on public.brands for select
to authenticated
using (true);

create policy "Authenticated users can create brands"
on public.brands for insert
to authenticated
with check ((select auth.uid()) is not null);

create policy "Users can read their own drinks"
on public.drinks for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own drinks"
on public.drinks for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own drinks"
on public.drinks for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own drinks"
on public.drinks for delete
to authenticated
using ((select auth.uid()) = user_id);
