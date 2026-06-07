-- Quick fix: beta foreign keys pointing at production tables
-- Run in Supabase SQL Editor if order submit fails with:
--   beta_orders_customer_id_fkey → customers
--
-- Safe to re-run.

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
        or (src.relname = 'beta_film_rolls' and tgt.relname in ('orders', 'film_rolls'))
        or (src.relname = 'beta_payments' and tgt.relname in ('orders', 'payments'))
      )
  loop
    execute format('alter table public.%I drop constraint if exists %I', r.source_table, r.conname);
  end loop;
end $$;

alter table public.beta_orders drop constraint if exists beta_orders_customer_id_fkey;

alter table public.beta_orders
  add constraint beta_orders_customer_id_fkey
  foreign key (customer_id) references public.beta_customers (id) on delete cascade;

alter table public.beta_film_rolls drop constraint if exists beta_film_rolls_order_id_fkey;

alter table public.beta_film_rolls
  add constraint beta_film_rolls_order_id_fkey
  foreign key (order_id) references public.beta_orders (id) on delete cascade;

alter table public.beta_payments drop constraint if exists beta_payments_order_id_fkey;

alter table public.beta_payments
  add constraint beta_payments_order_id_fkey
  foreign key (order_id) references public.beta_orders (id) on delete cascade;
