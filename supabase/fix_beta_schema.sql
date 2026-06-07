-- Marla Film Lab — Beta schema alignment (complete ALTER TABLE migration)
-- Run in Supabase → SQL Editor (Beta project only).
-- Safe to re-run. Does not drop tables or delete data.
--
-- Payload source: lib/db/mappers.ts draftToDbPayload + lib/db/orders.ts createOrderInDb
-- Client entry: lib/customer/api.ts submitOrder → POST /api/orders

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

-- ===========================================================================
-- beta_customers
-- INSERT: name, phone, line_id, email, allow_social_share, instagram_username
-- ===========================================================================
alter table public.beta_customers add column if not exists id uuid default gen_random_uuid();
alter table public.beta_customers add column if not exists name text;
alter table public.beta_customers add column if not exists phone text;
alter table public.beta_customers add column if not exists line_id text;
alter table public.beta_customers add column if not exists email text;
alter table public.beta_customers add column if not exists allow_social_share boolean default false;
alter table public.beta_customers add column if not exists instagram_username text;
alter table public.beta_customers add column if not exists created_at timestamptz default now();
alter table public.beta_customers add column if not exists updated_at timestamptz default now();

-- ===========================================================================
-- beta_orders
-- INSERT: status, payment_status, payment_method, payment_slip_url,
--         payment_slip_file_name, film_delivery_method, return_method,
--         file_delivery, film_return, recipient_name, recipient_phone,
--         address, notes, film_total, shipping_fee, discount_amount,
--         total_price, order_code, customer_id
-- UPDATE (admin): status, payment_status
-- SELECT (track): order_code, status, payment_status, film_delivery_method, ...
-- ===========================================================================
alter table public.beta_orders add column if not exists id uuid default gen_random_uuid();
alter table public.beta_orders add column if not exists order_code text;
alter table public.beta_orders add column if not exists customer_id uuid;
alter table public.beta_orders add column if not exists status text default 'Received';
alter table public.beta_orders add column if not exists payment_status text default 'pending_payment_confirmation';
alter table public.beta_orders add column if not exists payment_method text;
alter table public.beta_orders add column if not exists payment_slip_url text;
alter table public.beta_orders add column if not exists payment_slip_file_name text;
alter table public.beta_orders add column if not exists film_delivery_method text default 'drop_off';
alter table public.beta_orders add column if not exists return_method text default 'pickup';
alter table public.beta_orders add column if not exists file_delivery text;
alter table public.beta_orders add column if not exists film_return text;
alter table public.beta_orders add column if not exists recipient_name text;
alter table public.beta_orders add column if not exists recipient_phone text;
alter table public.beta_orders add column if not exists address text;
alter table public.beta_orders add column if not exists notes text;
alter table public.beta_orders add column if not exists film_total integer default 0;
alter table public.beta_orders add column if not exists shipping_fee integer default 0;
alter table public.beta_orders add column if not exists discount_amount integer default 0;
alter table public.beta_orders add column if not exists total_price integer default 0;
alter table public.beta_orders add column if not exists created_at timestamptz default now();
alter table public.beta_orders add column if not exists updated_at timestamptz default now();

-- Backfill defaults for existing rows (safe if columns were just added)
update public.beta_orders set film_total = 0 where film_total is null;
update public.beta_orders set shipping_fee = 0 where shipping_fee is null;
update public.beta_orders set discount_amount = 0 where discount_amount is null;
update public.beta_orders set total_price = 0 where total_price is null;
update public.beta_orders set payment_status = 'pending_payment_confirmation' where payment_status is null;
update public.beta_orders set film_delivery_method = 'drop_off' where film_delivery_method is null;
update public.beta_orders set return_method = 'pickup' where return_method is null;
update public.beta_orders set status = 'Received' where status is null;

create unique index if not exists beta_orders_order_code_idx on public.beta_orders (order_code);
create index if not exists beta_orders_customer_id_idx on public.beta_orders (customer_id);
create index if not exists beta_orders_created_at_idx on public.beta_orders (created_at desc);

-- ===========================================================================
-- Fix foreign keys — beta tables must reference beta tables (NOT production)
-- Error seen: beta_orders_customer_id_fkey → customers instead of beta_customers
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
        (src.relname = 'beta_orders' and tgt.relname = 'customers')
        or (src.relname = 'beta_film_rolls' and tgt.relname = 'orders')
        or (src.relname = 'beta_film_rolls' and tgt.relname = 'film_rolls')
        or (src.relname = 'beta_payments' and tgt.relname = 'orders')
        or (src.relname = 'beta_payments' and tgt.relname = 'payments')
      )
  loop
    execute format('alter table public.%I drop constraint if exists %I', r.source_table, r.conname);
  end loop;
end $$;

alter table public.beta_orders drop constraint if exists beta_orders_customer_id_fkey;
alter table public.beta_orders drop constraint if exists orders_customer_id_fkey;

do $$
begin
  alter table public.beta_orders
    add constraint beta_orders_customer_id_fkey
    foreign key (customer_id) references public.beta_customers (id) on delete cascade;
exception
  when duplicate_object then null;
end $$;

-- ===========================================================================
-- beta_film_rolls
-- INSERT: format, process, service, push_pull, scan_size, brand, brand_other,
--         stock, stock_other, bw_developer, condition, push_pull_enabled,
--         push_pull_type, push_pull_stops, experimental_film, notes, price,
--         order_id
-- ===========================================================================
alter table public.beta_film_rolls add column if not exists id uuid default gen_random_uuid();
alter table public.beta_film_rolls add column if not exists order_id uuid;
alter table public.beta_film_rolls add column if not exists format text;
alter table public.beta_film_rolls add column if not exists process text;
alter table public.beta_film_rolls add column if not exists service text;
alter table public.beta_film_rolls add column if not exists push_pull text default 'Normal';
alter table public.beta_film_rolls add column if not exists scan_size text default 'N/A';
alter table public.beta_film_rolls add column if not exists brand text;
alter table public.beta_film_rolls add column if not exists brand_other text;
alter table public.beta_film_rolls add column if not exists stock text;
alter table public.beta_film_rolls add column if not exists stock_other text;
alter table public.beta_film_rolls add column if not exists bw_developer text;
alter table public.beta_film_rolls add column if not exists condition text;
alter table public.beta_film_rolls add column if not exists push_pull_enabled boolean default false;
alter table public.beta_film_rolls add column if not exists push_pull_type text;
alter table public.beta_film_rolls add column if not exists push_pull_stops integer;
alter table public.beta_film_rolls add column if not exists experimental_film boolean default false;
alter table public.beta_film_rolls add column if not exists notes text;
alter table public.beta_film_rolls add column if not exists price integer default 0;
alter table public.beta_film_rolls add column if not exists created_at timestamptz default now();
alter table public.beta_film_rolls add column if not exists updated_at timestamptz default now();

update public.beta_film_rolls set push_pull = 'Normal' where push_pull is null;
update public.beta_film_rolls set scan_size = 'N/A' where scan_size is null;
update public.beta_film_rolls set push_pull_enabled = false where push_pull_enabled is null;
update public.beta_film_rolls set experimental_film = false where experimental_film is null;
update public.beta_film_rolls set price = 0 where price is null;

create index if not exists beta_film_rolls_order_id_idx on public.beta_film_rolls (order_id);

alter table public.beta_film_rolls drop constraint if exists beta_film_rolls_order_id_fkey;
alter table public.beta_film_rolls drop constraint if exists film_rolls_order_id_fkey;

do $$
begin
  alter table public.beta_film_rolls
    add constraint beta_film_rolls_order_id_fkey
    foreign key (order_id) references public.beta_orders (id) on delete cascade;
exception
  when duplicate_object then null;
end $$;

-- ===========================================================================
-- beta_payments
-- INSERT: method, status, slip_url, slip_file_name, bank_name, account_number,
--         account_name, amount, order_id
-- UPDATE (admin confirm): status, confirmed_at
-- ===========================================================================
create table if not exists public.beta_payments (
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

alter table public.beta_payments add column if not exists id uuid default gen_random_uuid();
alter table public.beta_payments add column if not exists order_id uuid;
alter table public.beta_payments add column if not exists method text;
alter table public.beta_payments add column if not exists status text default 'pending_payment_confirmation';
alter table public.beta_payments add column if not exists slip_url text;
alter table public.beta_payments add column if not exists slip_file_name text;
alter table public.beta_payments add column if not exists bank_name text;
alter table public.beta_payments add column if not exists account_number text;
alter table public.beta_payments add column if not exists account_name text;
alter table public.beta_payments add column if not exists amount integer default 0;
alter table public.beta_payments add column if not exists confirmed_at timestamptz;
alter table public.beta_payments add column if not exists created_at timestamptz default now();
alter table public.beta_payments add column if not exists updated_at timestamptz default now();

update public.beta_payments set status = 'pending_payment_confirmation' where status is null;
update public.beta_payments set amount = 0 where amount is null;

create unique index if not exists beta_payments_order_id_unique on public.beta_payments (order_id);
create index if not exists beta_payments_order_id_idx on public.beta_payments (order_id);

do $$
begin
  alter table public.beta_payments
    add constraint beta_payments_order_id_fkey
    foreign key (order_id) references public.beta_orders (id) on delete cascade;
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Realtime (Track Order)
-- ---------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.beta_orders;
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- RLS — beta order submission + tracking + admin updates
-- ---------------------------------------------------------------------------
alter table public.beta_customers enable row level security;
alter table public.beta_orders enable row level security;
alter table public.beta_film_rolls enable row level security;
alter table public.beta_payments enable row level security;

drop policy if exists "beta_anon_select_customers" on public.beta_customers;
create policy "beta_anon_select_customers"
  on public.beta_customers for select to anon using (true);

drop policy if exists "beta_anon_insert_customers" on public.beta_customers;
create policy "beta_anon_insert_customers"
  on public.beta_customers for insert to anon with check (true);

drop policy if exists "beta_anon_select_orders" on public.beta_orders;
create policy "beta_anon_select_orders"
  on public.beta_orders for select to anon using (true);

drop policy if exists "beta_anon_insert_orders" on public.beta_orders;
create policy "beta_anon_insert_orders"
  on public.beta_orders for insert to anon with check (true);

drop policy if exists "beta_anon_update_orders" on public.beta_orders;
create policy "beta_anon_update_orders"
  on public.beta_orders for update to anon using (true) with check (true);

drop policy if exists "beta_anon_select_film_rolls" on public.beta_film_rolls;
create policy "beta_anon_select_film_rolls"
  on public.beta_film_rolls for select to anon using (true);

drop policy if exists "beta_anon_insert_film_rolls" on public.beta_film_rolls;
create policy "beta_anon_insert_film_rolls"
  on public.beta_film_rolls for insert to anon with check (true);

drop policy if exists "beta_anon_select_payments" on public.beta_payments;
create policy "beta_anon_select_payments"
  on public.beta_payments for select to anon using (true);

drop policy if exists "beta_anon_insert_payments" on public.beta_payments;
create policy "beta_anon_insert_payments"
  on public.beta_payments for insert to anon with check (true);

drop policy if exists "beta_anon_update_payments" on public.beta_payments;
create policy "beta_anon_update_payments"
  on public.beta_payments for update to anon using (true) with check (true);

grant select, insert on public.beta_customers, public.beta_orders, public.beta_film_rolls, public.beta_payments to anon;
grant update on public.beta_orders, public.beta_payments to anon;

-- ---------------------------------------------------------------------------
-- Verify: list beta_orders columns (optional — comment out if not wanted)
-- ---------------------------------------------------------------------------
-- select column_name, data_type
-- from information_schema.columns
-- where table_schema = 'public' and table_name = 'beta_orders'
-- order by ordinal_position;
