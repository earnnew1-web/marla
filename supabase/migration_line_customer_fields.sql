-- Marla Film Lab — LINE customer fields (production + beta)
-- Run in Supabase → SQL Editor
-- Safe to re-run (IF NOT EXISTS / idempotent updates)
--
-- Field usage (customers table):
--   line_id           — manual LINE ID from browser orders, or display name from LIFF
--   line_user_id      — LINE userId from LIFF (required for Flex push notifications)
--   line_display_name — LIFF profile display name
--   line_picture_url  — LIFF profile picture URL
--   line_connected    — true when customer opened the order flow inside LINE

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- customers (production — NEXT_PUBLIC_APP_ENV=production)
-- ---------------------------------------------------------------------------
alter table public.customers add column if not exists line_id text;
alter table public.customers add column if not exists allow_social_share boolean default false;
alter table public.customers add column if not exists instagram_username text;
alter table public.customers add column if not exists line_user_id text;
alter table public.customers add column if not exists line_display_name text;
alter table public.customers add column if not exists line_picture_url text;
alter table public.customers add column if not exists line_connected boolean default false;

update public.customers
set line_id = '-'
where line_id is null or trim(line_id) = '';

alter table public.customers alter column line_id set default '-';

do $$
begin
  alter table public.customers alter column line_id set not null;
exception
  when others then null;
end $$;

update public.customers
set line_connected = true
where line_user_id is not null
  and trim(line_user_id) <> ''
  and coalesce(line_connected, false) = false;

create index if not exists customers_line_user_id_idx
  on public.customers (line_user_id)
  where line_user_id is not null;

-- ---------------------------------------------------------------------------
-- beta_customers (local / beta env only — skip if table does not exist)
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.beta_customers') is not null then
    alter table public.beta_customers add column if not exists line_id text;
    alter table public.beta_customers add column if not exists allow_social_share boolean default false;
    alter table public.beta_customers add column if not exists instagram_username text;
    alter table public.beta_customers add column if not exists line_user_id text;
    alter table public.beta_customers add column if not exists line_display_name text;
    alter table public.beta_customers add column if not exists line_picture_url text;
    alter table public.beta_customers add column if not exists line_connected boolean default false;

    update public.beta_customers
    set line_id = '-'
    where line_id is null or trim(line_id) = '';

    update public.beta_customers
    set line_connected = true
    where line_user_id is not null
      and trim(line_user_id) <> ''
      and coalesce(line_connected, false) = false;

    execute 'create index if not exists beta_customers_line_user_id_idx on public.beta_customers (line_user_id) where line_user_id is not null';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
select
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('customers', 'beta_customers')
  and (
    column_name like 'line%'
    or column_name in ('allow_social_share', 'instagram_username')
  )
order by table_name, column_name;
