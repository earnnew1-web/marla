-- Google Drive link for scan orders when status is Ready.
-- Run on production Supabase SQL editor.

alter table public.orders add column if not exists scan_drive_url text;

do $$
begin
  if to_regclass('public.beta_orders') is not null then
    execute 'alter table public.beta_orders add column if not exists scan_drive_url text';
  end if;
end $$;
