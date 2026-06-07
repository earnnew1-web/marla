-- Add social sharing fields to customers. Run once in Supabase SQL Editor.

alter table public.customers
  add column if not exists allow_social_share boolean not null default false,
  add column if not exists instagram_username text;

alter table public.customers
  alter column email drop not null;
