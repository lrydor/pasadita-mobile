alter table public.products
  add column if not exists available boolean not null default true;

