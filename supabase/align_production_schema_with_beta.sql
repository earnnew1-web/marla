-- Marla Film Lab — Align PRODUCTION schema with BETA (source of truth)
-- Run in Supabase → SQL Editor on the PRODUCTION project only.
--
-- Safe to re-run:
--   • CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
--   • Does NOT drop tables or delete rows
--   • Does NOT rename columns
--
-- Payload source: lib/db/mappers.ts draftToDbPayload + getOrderSelect()
-- See: supabase/align_production_schema_with_beta.REPORT.md

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Optional enum helpers (never abort migration if types are absent)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_type where typname = 'order_status') then
    alter type public.order_status add value if not exists 'Pending Payment Confirmation';
    alter type public.order_status add value if not exists 'Developing+Scanning';
  end if;
exception
  when others then null;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum (
      'pending_payment_confirmation',
      'paid',
      'unpaid'
    );
  end if;
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Base tables (no-op if production already created from schema.sql)
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  line_id text not null,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null,
  customer_id uuid not null,
  status text not null default 'Received',
  file_delivery text not null default 'Google Drive',
  film_return text not null default 'Pick up at store',
  total_price integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.film_rolls (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  format text not null,
  process text not null,
  service text not null,
  push_pull text not null default 'Normal',
  scan_size text not null default 'N/A',
  price integer not null default 0
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password text not null,
  role text not null default 'owner'
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  method text not null,
  status text not null default 'pending_payment_confirmation',
  slip_url text,
  slip_file_name text,
  bank_name text,
  account_number text,
  account_name text,
  amount integer not null default 0,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pricing_settings (
  id integer primary key default 1,
  develop_only integer not null default 100,
  develop_scan_standard integer not null default 150,
  develop_scan_xl integer not null default 180,
  tiff_addon integer not null default 150,
  push_pull_addon integer not null default 100,
  delivery_fee integer not null default 60
);

insert into public.pricing_settings (id)
values (1)
on conflict (id) do nothing;

-- ===========================================================================
-- customers  (mirror beta_customers)
-- INSERT: name, phone, line_id, email, allow_social_share, instagram_username
-- ===========================================================================
alter table public.customers add column if not exists id uuid default gen_random_uuid();
alter table public.customers add column if not exists name text;
alter table public.customers add column if not exists phone text;
alter table public.customers add column if not exists line_id text;
alter table public.customers add column if not exists email text;
alter table public.customers add column if not exists allow_social_share boolean default false;
alter table public.customers add column if not exists instagram_username text;
alter table public.customers add column if not exists line_user_id text;
alter table public.customers add column if not exists line_display_name text;
alter table public.customers add column if not exists line_picture_url text;
alter table public.customers add column if not exists line_connected boolean default false;
alter table public.customers add column if not exists created_at timestamptz default now();
alter table public.customers add column if not exists updated_at timestamptz default now();

do $$
begin
  alter table public.customers alter column email drop not null;
exception
  when others then null;
end $$;

-- ===========================================================================
-- orders  (mirror beta_orders)
-- ===========================================================================
alter table public.orders add column if not exists id uuid default gen_random_uuid();
alter table public.orders add column if not exists order_code text;
alter table public.orders add column if not exists customer_id uuid;
alter table public.orders add column if not exists status text default 'Received';
alter table public.orders add column if not exists payment_status text default 'pending_payment_confirmation';
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists payment_slip_url text;
alter table public.orders add column if not exists payment_slip_file_name text;
alter table public.orders add column if not exists film_delivery_method text default 'drop_off';
alter table public.orders add column if not exists return_method text default 'pickup';
alter table public.orders add column if not exists file_delivery text;
alter table public.orders add column if not exists film_return text;
alter table public.orders add column if not exists recipient_name text;
alter table public.orders add column if not exists recipient_phone text;
alter table public.orders add column if not exists address text;
alter table public.orders add column if not exists notes text;
alter table public.orders add column if not exists film_total integer default 0;
alter table public.orders add column if not exists shipping_fee integer default 0;
alter table public.orders add column if not exists discount_amount integer default 0;
alter table public.orders add column if not exists total_price integer default 0;
alter table public.orders add column if not exists created_at timestamptz default now();
alter table public.orders add column if not exists updated_at timestamptz default now();

update public.orders set film_total = 0 where film_total is null;
update public.orders set shipping_fee = 0 where shipping_fee is null;
update public.orders set discount_amount = 0 where discount_amount is null;
update public.orders set total_price = 0 where total_price is null;
update public.orders set payment_status = 'pending_payment_confirmation' where payment_status is null;
update public.orders set film_delivery_method = 'drop_off' where film_delivery_method is null;
update public.orders set return_method = 'pickup' where return_method is null;
update public.orders set status = 'Received' where status is null;

create unique index if not exists orders_order_code_idx on public.orders (order_code);
create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- ===========================================================================
-- Foreign keys — production tables must reference production tables
-- ===========================================================================
do $$
declare
  r record;
begin
  for r in
    select c.conname, src.relname as source_table
    from pg_constraint c
    join pg_class src on src.oid = c.conrelid
    join pg_class tgt on tgt.oid = c.confrelid
    join pg_namespace n on n.oid = src.relnamespace
    where n.nspname = 'public'
      and c.contype = 'f'
      and (
        (src.relname = 'orders' and tgt.relname like 'beta_%')
        or (src.relname = 'film_rolls' and tgt.relname like 'beta_%')
        or (src.relname = 'payments' and tgt.relname like 'beta_%')
      )
  loop
    execute format('alter table public.%I drop constraint if exists %I', r.source_table, r.conname);
  end loop;
end $$;

alter table public.orders drop constraint if exists orders_customer_id_fkey;

do $$
begin
  alter table public.orders
    add constraint orders_customer_id_fkey
    foreign key (customer_id) references public.customers (id) on delete cascade;
exception
  when duplicate_object then null;
end $$;

-- ===========================================================================
-- film_rolls  (mirror beta_film_rolls)
-- ===========================================================================
alter table public.film_rolls add column if not exists id uuid default gen_random_uuid();
alter table public.film_rolls add column if not exists order_id uuid;
alter table public.film_rolls add column if not exists format text;
alter table public.film_rolls add column if not exists process text;
alter table public.film_rolls add column if not exists service text;
alter table public.film_rolls add column if not exists push_pull text default 'Normal';
alter table public.film_rolls add column if not exists scan_size text default 'N/A';
alter table public.film_rolls add column if not exists brand text;
alter table public.film_rolls add column if not exists brand_other text;
alter table public.film_rolls add column if not exists stock text;
alter table public.film_rolls add column if not exists stock_other text;
alter table public.film_rolls add column if not exists bw_developer text;
alter table public.film_rolls add column if not exists condition text;
alter table public.film_rolls add column if not exists push_pull_enabled boolean default false;
alter table public.film_rolls add column if not exists push_pull_type text;
alter table public.film_rolls add column if not exists push_pull_stops integer;
alter table public.film_rolls add column if not exists experimental_film boolean default false;
alter table public.film_rolls add column if not exists notes text;
alter table public.film_rolls add column if not exists price integer default 0;
alter table public.film_rolls add column if not exists created_at timestamptz default now();
alter table public.film_rolls add column if not exists updated_at timestamptz default now();

update public.film_rolls set push_pull = 'Normal' where push_pull is null;
update public.film_rolls set scan_size = 'N/A' where scan_size is null;
update public.film_rolls set push_pull_enabled = false where push_pull_enabled is null;
update public.film_rolls set experimental_film = false where experimental_film is null;
update public.film_rolls set price = 0 where price is null;

create index if not exists film_rolls_order_id_idx on public.film_rolls (order_id);

alter table public.film_rolls drop constraint if exists film_rolls_order_id_fkey;

do $$
begin
  alter table public.film_rolls
    add constraint film_rolls_order_id_fkey
    foreign key (order_id) references public.orders (id) on delete cascade;
exception
  when duplicate_object then null;
end $$;

-- ===========================================================================
-- payments  (mirror beta_payments)
-- ===========================================================================
alter table public.payments add column if not exists id uuid default gen_random_uuid();
alter table public.payments add column if not exists order_id uuid;
alter table public.payments add column if not exists method text;
alter table public.payments add column if not exists status text default 'pending_payment_confirmation';
alter table public.payments add column if not exists slip_url text;
alter table public.payments add column if not exists slip_file_name text;
alter table public.payments add column if not exists bank_name text;
alter table public.payments add column if not exists account_number text;
alter table public.payments add column if not exists account_name text;
alter table public.payments add column if not exists amount integer default 0;
alter table public.payments add column if not exists confirmed_at timestamptz;
alter table public.payments add column if not exists created_at timestamptz default now();
alter table public.payments add column if not exists updated_at timestamptz default now();

update public.payments set status = 'pending_payment_confirmation' where status is null;
update public.payments set amount = 0 where amount is null;

create unique index if not exists payments_order_id_unique on public.payments (order_id);
create index if not exists payments_order_id_idx on public.payments (order_id);

alter table public.payments drop constraint if exists payments_order_id_fkey;

do $$
begin
  alter table public.payments
    add constraint payments_order_id_fkey
    foreign key (order_id) references public.orders (id) on delete cascade;
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Realtime (Track Order live status)
-- ---------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- RLS — order submission fallback, tracking, admin anon updates
-- Server should use SUPABASE_SERVICE_ROLE_KEY for writes when possible.
-- ---------------------------------------------------------------------------
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.film_rolls enable row level security;
alter table public.payments enable row level security;
alter table public.pricing_settings enable row level security;

drop policy if exists "prod_anon_select_customers" on public.customers;
create policy "prod_anon_select_customers"
  on public.customers for select to anon using (true);

drop policy if exists "prod_anon_insert_customers" on public.customers;
create policy "prod_anon_insert_customers"
  on public.customers for insert to anon with check (true);

drop policy if exists "prod_anon_select_orders" on public.orders;
create policy "prod_anon_select_orders"
  on public.orders for select to anon using (true);

drop policy if exists "prod_anon_insert_orders" on public.orders;
create policy "prod_anon_insert_orders"
  on public.orders for insert to anon with check (true);

drop policy if exists "prod_anon_update_orders" on public.orders;
create policy "prod_anon_update_orders"
  on public.orders for update to anon using (true) with check (true);

drop policy if exists "prod_anon_select_film_rolls" on public.film_rolls;
create policy "prod_anon_select_film_rolls"
  on public.film_rolls for select to anon using (true);

drop policy if exists "prod_anon_insert_film_rolls" on public.film_rolls;
create policy "prod_anon_insert_film_rolls"
  on public.film_rolls for insert to anon with check (true);

drop policy if exists "prod_anon_select_payments" on public.payments;
create policy "prod_anon_select_payments"
  on public.payments for select to anon using (true);

drop policy if exists "prod_anon_insert_payments" on public.payments;
create policy "prod_anon_insert_payments"
  on public.payments for insert to anon with check (true);

drop policy if exists "prod_anon_update_payments" on public.payments;
create policy "prod_anon_update_payments"
  on public.payments for update to anon using (true) with check (true);

drop policy if exists "prod_anon_select_pricing" on public.pricing_settings;
create policy "prod_anon_select_pricing"
  on public.pricing_settings for select to anon using (true);

-- Legacy policy names (from older scripts) — replaced above
drop policy if exists "anon_update_orders" on public.orders;
drop policy if exists "beta_anon_read_orders" on public.orders;
drop policy if exists "beta_anon_read_customers" on public.customers;
drop policy if exists "beta_anon_read_film_rolls" on public.film_rolls;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert on public.customers, public.orders, public.film_rolls, public.payments to anon;
grant update on public.orders, public.payments to anon;
grant select on public.pricing_settings to anon;
grant update on public.orders to authenticated;

-- ---------------------------------------------------------------------------
-- Verify (optional — uncomment to inspect after running)
-- ---------------------------------------------------------------------------
-- select table_name, column_name, data_type
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name in ('customers', 'orders', 'film_rolls', 'payments')
-- order by table_name, ordinal_position;
