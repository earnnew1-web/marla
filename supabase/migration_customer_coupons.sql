-- Per-customer welcome coupons (unique MARLA-XXXXX codes bound to LINE users).
-- Run on production Supabase SQL editor.

create table if not exists public.customer_coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  customer_id uuid,
  line_user_id text,
  discount_type text not null default 'fixed',
  discount_value numeric not null default 50,
  applies_to text not null default 'first_order',
  usage_limit integer not null default 1,
  used_count integer not null default 0,
  is_used boolean not null default false,
  active boolean not null default true,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists customer_coupons_line_user_id_idx
  on public.customer_coupons (line_user_id)
  where line_user_id is not null;

create index if not exists customer_coupons_code_idx on public.customer_coupons (code);
create index if not exists customer_coupons_customer_id_idx on public.customer_coupons (customer_id);
create index if not exists customer_coupons_active_idx on public.customer_coupons (active, is_used, expires_at);

alter table public.orders add column if not exists discount_amount integer default 0;

do $$
begin
  if to_regclass('public.beta_orders') is not null then
    execute 'alter table public.beta_orders add column if not exists discount_amount integer default 0';
  end if;
end $$;
