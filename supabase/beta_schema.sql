-- Marla Film Lab — Beta database schema
-- Run in Supabase SQL Editor on a dedicated Beta project (not production).

create extension if not exists "pgcrypto";

-- Customers
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  line_id text not null,
  email text,
  allow_social_share boolean not null default false,
  instagram_username text,
  created_at timestamptz not null default now()
);

-- Order workflow status
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum (
      'Pending Payment Confirmation',
      'Received',
      'Developing+Scanning',
      'Ready',
      'Completed',
      'Cancelled'
    );
  end if;
end $$;

-- Payment status (separate from workflow)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum (
      'pending_payment_confirmation',
      'paid',
      'unpaid'
    );
  end if;
end $$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  customer_id uuid not null references public.customers(id) on delete cascade,
  status order_status not null default 'Received',
  payment_status payment_status not null default 'pending_payment_confirmation',
  payment_method text,
  payment_slip_url text,
  film_delivery_method text not null default 'drop_off',
  file_delivery text not null,
  film_return text not null,
  recipient_name text,
  recipient_phone text,
  address text,
  notes text,
  total_price integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.film_rolls (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  format text not null,
  process text not null,
  service text not null,
  push_pull text not null,
  scan_size text not null,
  notes text,
  price integer not null default 0
);

create table if not exists public.pricing_settings (
  id integer primary key default 1,
  develop_only integer not null default 150,
  develop_scan_standard integer not null default 250,
  develop_scan_xl integer not null default 350,
  tiff_addon integer not null default 150,
  push_pull_addon integer not null default 50,
  delivery_fee integer not null default 60
);

insert into public.pricing_settings (id)
values (1)
on conflict (id) do nothing;

-- Extend existing beta tables (safe if already applied)
alter table public.customers
  add column if not exists allow_social_share boolean not null default false,
  add column if not exists instagram_username text;

alter table public.customers
  alter column email drop not null;

alter table public.orders
  add column if not exists payment_status payment_status not null default 'pending_payment_confirmation',
  add column if not exists payment_method text,
  add column if not exists payment_slip_url text,
  add column if not exists film_delivery_method text not null default 'drop_off',
  add column if not exists recipient_name text,
  add column if not exists recipient_phone text;

-- Enum migrations for older schemas
alter type order_status add value if not exists 'Pending Payment Confirmation';
alter type order_status add value if not exists 'Developing+Scanning';

create index if not exists orders_order_code_idx on public.orders(order_code);
create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists film_rolls_order_id_idx on public.film_rolls(order_id);

-- Realtime for Track Order live updates
alter publication supabase_realtime add table public.orders;

-- RLS — Beta: open read for anon; writes via service role on server
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.film_rolls enable row level security;
alter table public.pricing_settings enable row level security;

drop policy if exists "beta_anon_read_orders" on public.orders;
create policy "beta_anon_read_orders"
  on public.orders for select to anon using (true);

drop policy if exists "beta_anon_read_customers" on public.customers;
create policy "beta_anon_read_customers"
  on public.customers for select to anon using (true);

drop policy if exists "beta_anon_read_film_rolls" on public.film_rolls;
create policy "beta_anon_read_film_rolls"
  on public.film_rolls for select to anon using (true);

drop policy if exists "beta_anon_read_pricing" on public.pricing_settings;
create policy "beta_anon_read_pricing"
  on public.pricing_settings for select to anon using (true);

drop policy if exists "beta_anon_update_orders" on public.orders;
create policy "beta_anon_update_orders"
  on public.orders for update to anon using (true) with check (true);

grant select on public.customers, public.orders, public.film_rolls, public.pricing_settings to anon;
grant update on public.orders to anon;
