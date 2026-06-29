-- First-order discount codes + order pricing fields.
-- Run on production Supabase SQL editor.

create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null default 'first_order',
  discount_type text not null default 'fixed',
  discount_value numeric not null default 50,
  usage_limit integer not null default 1,
  used_count integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists discount_codes_code_idx on public.discount_codes (code);
create index if not exists discount_codes_active_idx on public.discount_codes (active);

alter table public.orders add column if not exists discount_code text;
alter table public.orders add column if not exists final_price integer;

update public.orders
set final_price = total_price
where final_price is null;

do $$
begin
  if to_regclass('public.beta_orders') is not null then
    execute 'alter table public.beta_orders add column if not exists discount_code text';
    execute 'alter table public.beta_orders add column if not exists final_price integer';
    execute 'update public.beta_orders set final_price = total_price where final_price is null';
  end if;
end $$;
