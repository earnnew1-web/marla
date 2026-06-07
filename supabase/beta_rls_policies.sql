-- Beta table RLS policies for Marla Film Lab
-- Run once in Supabase → SQL Editor (Beta project only)
--
-- Preferred fix: set SUPABASE_SERVICE_ROLE_KEY in .env.local instead (bypasses RLS on server).
-- Use this script only if you cannot use the service role key yet.

-- Customers
alter table public.beta_customers enable row level security;

drop policy if exists "beta_anon_select_customers" on public.beta_customers;
create policy "beta_anon_select_customers"
  on public.beta_customers for select to anon using (true);

drop policy if exists "beta_anon_insert_customers" on public.beta_customers;
create policy "beta_anon_insert_customers"
  on public.beta_customers for insert to anon with check (true);

-- Orders
alter table public.beta_orders enable row level security;

drop policy if exists "beta_anon_select_orders" on public.beta_orders;
create policy "beta_anon_select_orders"
  on public.beta_orders for select to anon using (true);

drop policy if exists "beta_anon_insert_orders" on public.beta_orders;
create policy "beta_anon_insert_orders"
  on public.beta_orders for insert to anon with check (true);

drop policy if exists "beta_anon_update_orders" on public.beta_orders;
create policy "beta_anon_update_orders"
  on public.beta_orders for update to anon using (true) with check (true);

-- Film rolls
alter table public.beta_film_rolls enable row level security;

drop policy if exists "beta_anon_select_film_rolls" on public.beta_film_rolls;
create policy "beta_anon_select_film_rolls"
  on public.beta_film_rolls for select to anon using (true);

drop policy if exists "beta_anon_insert_film_rolls" on public.beta_film_rolls;
create policy "beta_anon_insert_film_rolls"
  on public.beta_film_rolls for insert to anon with check (true);

grant select, insert on public.beta_customers, public.beta_orders, public.beta_film_rolls to anon;
grant update on public.beta_orders to anon;
