-- Marla Film Lab — LINE OA customer fields
-- Safe to re-run on production or beta customers tables.

alter table public.customers add column if not exists line_user_id text;
alter table public.customers add column if not exists line_display_name text;
alter table public.customers add column if not exists line_picture_url text;
alter table public.customers add column if not exists line_connected boolean default false;

alter table public.beta_customers add column if not exists line_user_id text;
alter table public.beta_customers add column if not exists line_display_name text;
alter table public.beta_customers add column if not exists line_picture_url text;
alter table public.beta_customers add column if not exists line_connected boolean default false;

create index if not exists customers_line_user_id_idx on public.customers (line_user_id);
create index if not exists beta_customers_line_user_id_idx on public.beta_customers (line_user_id);

-- LIFF Endpoint URL: https://marlafilmlab.com/order
-- Rich Menu LIFF URL: https://liff.line.me/2010393020-8ooxNuQs
-- 2. Track Order           -> https://marlafilmlab.com/track-order
-- 3. Price Guide           -> https://marlafilmlab.com (homepage)
-- 4. Contact Store         -> LINE OA chat / https://line.me/R/ti/p/@marlafilmlab
