-- Marla Film Lab — Production schema alignment (OPTIONAL — run manually on production only)
-- Mirrors beta payload fields for: customers, orders, film_rolls, payments

create extension if not exists "pgcrypto";

do $$
begin
  if exists (select 1 from pg_type where typname = 'order_status') then
    alter type public.order_status add value if not exists 'Pending Payment Confirmation';
    alter type public.order_status add value if not exists 'Developing+Scanning';
  end if;
exception
  when others then null;
end $$;

-- customers
alter table public.customers add column if not exists allow_social_share boolean default false;
alter table public.customers add column if not exists instagram_username text;
alter table public.customers add column if not exists updated_at timestamptz default now();

do $$
begin
  alter table public.customers alter column email drop not null;
exception
  when others then null;
end $$;

-- orders
alter table public.orders add column if not exists payment_status text default 'pending_payment_confirmation';
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists payment_slip_url text;
alter table public.orders add column if not exists payment_slip_file_name text;
alter table public.orders add column if not exists film_delivery_method text default 'drop_off';
alter table public.orders add column if not exists return_method text default 'pickup';
alter table public.orders add column if not exists recipient_name text;
alter table public.orders add column if not exists recipient_phone text;
alter table public.orders add column if not exists film_total integer default 0;
alter table public.orders add column if not exists shipping_fee integer default 0;
alter table public.orders add column if not exists discount_amount integer default 0;
alter table public.orders add column if not exists updated_at timestamptz default now();

-- film_rolls
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
alter table public.film_rolls add column if not exists created_at timestamptz default now();
alter table public.film_rolls add column if not exists updated_at timestamptz default now();

-- payments
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

create unique index if not exists payments_order_id_unique on public.payments (order_id);

do $$
begin
  alter table public.payments
    add constraint payments_order_id_fkey
    foreign key (order_id) references public.orders (id) on delete cascade;
exception
  when duplicate_object then null;
end $$;
