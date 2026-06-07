create extension if not exists "pgcrypto";

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  line_id text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create type order_status as enum (
  'Received',
  'Developing',
  'Scanning',
  'Ready',
  'Completed',
  'Cancelled'
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  customer_id uuid not null references customers(id) on delete cascade,
  status order_status not null default 'Received',
  file_delivery text not null,
  film_return text not null,
  address text,
  notes text,
  total_price integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists film_rolls (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  format text not null,
  process text not null,
  service text not null,
  push_pull text not null,
  scan_size text not null,
  notes text,
  price integer not null default 0
);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password text not null,
  role text not null default 'owner'
);

create index if not exists orders_order_code_idx on orders(order_code);
create index if not exists orders_customer_id_idx on orders(customer_id);
create index if not exists film_rolls_order_id_idx on film_rolls(order_id);
