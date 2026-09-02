-- TOKO MELIORA - Supabase/PostgreSQL schema
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('owner','manager','cashier');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('cash','dana','qris','transfer','other');
exception when duplicate_object then null; end $$;

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.store_members (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'cashier',
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique(store_id, name)
);

create table if not exists public.products (
  id text primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  sku text not null,
  barcode text,
  category text,
  cost_price numeric(14,2) not null default 0,
  selling_price numeric(14,2) not null default 0,
  stock numeric(14,3) not null default 0,
  min_stock_alert numeric(14,3) not null default 0,
  unit text not null default 'pcs',
  image text,
  color_tag text,
  updated_at timestamptz not null default now(),
  unique(store_id, sku),
  unique(store_id, barcode)
);

create table if not exists public.store_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id text primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  transaction_date timestamptz not null default now(),
  customer_name text,
  payment_method public.payment_method not null default 'cash',
  subtotal numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  change_amount numeric(14,2) not null default 0,
  status text not null default 'completed',
  refund_reason text,
  cashier_name text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.shifts (
  id text primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  shift jsonb not null default '{}'::jsonb,
  status text not null default 'open',
  updated_at timestamptz not null default now()
);

create table if not exists public.held_orders (
  id text primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  order_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists products_store_id_idx on public.products(store_id);
create index if not exists transactions_store_date_idx on public.transactions(store_id, transaction_date desc);
create index if not exists categories_store_id_idx on public.categories(store_id);

create or replace function public.is_store_member(target_store uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.store_members
    where store_id = target_store and user_id = auth.uid()
  );
$$;

grant execute on function public.is_store_member(uuid) to authenticated;

-- Creates the first store for a user if they don't have one yet.
create or replace function public.ensure_my_store(store_name text default 'TOKO BERKAH JAYA')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_store uuid;
  new_store uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select store_id into existing_store from public.store_members where user_id = auth.uid() limit 1;
  if existing_store is not null then return existing_store; end if;
  insert into public.stores(name) values (coalesce(nullif(trim(store_name), ''), 'TOKO BERKAH JAYA')) returning id into new_store;
  insert into public.store_members(store_id, user_id, role) values (new_store, auth.uid(), 'owner');
  return new_store;
end;
$$;

grant execute on function public.ensure_my_store(text) to authenticated;

alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.store_settings enable row level security;
alter table public.transactions enable row level security;
alter table public.shifts enable row level security;
alter table public.held_orders enable row level security;

-- Re-runnable policies.
do $$ declare t text; begin
  foreach t in array array['categories','products','store_settings','transactions','shifts','held_orders'] loop
    execute format('drop policy if exists "store members full access %s" on public.%I', t, t);
    execute format('create policy "store members full access %s" on public.%I for all to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id))', t, t);
  end loop;
end $$;

drop policy if exists "members can read stores" on public.stores;
create policy "members can read stores" on public.stores for select to authenticated using (public.is_store_member(id));

drop policy if exists "members can read membership" on public.store_members;
create policy "members can read membership" on public.store_members for select to authenticated using (user_id = auth.uid());

-- Storage bucket for product photos. The app can upload only when the user is authenticated.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "authenticated product image upload" on storage.objects;
create policy "authenticated product image upload" on storage.objects
for insert to authenticated
with check (bucket_id = 'product-images');

drop policy if exists "authenticated product image update" on storage.objects;
create policy "authenticated product image update" on storage.objects
for update to authenticated
using (bucket_id = 'product-images') with check (bucket_id = 'product-images');

drop policy if exists "authenticated product image delete" on storage.objects;
create policy "authenticated product image delete" on storage.objects
for delete to authenticated using (bucket_id = 'product-images');

drop policy if exists "public product image read" on storage.objects;
create policy "public product image read" on storage.objects
for select to public using (bucket_id = 'product-images');

-- Atomic checkout: verifies stock and deducts it in one database transaction.
create or replace function public.commit_sale(
  p_store_id uuid,
  p_transaction jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  p_id text;
  qty numeric;
  current_stock numeric;
  new_tx jsonb;
begin
  if not public.is_store_member(p_store_id) then raise exception 'Not authorized for this store'; end if;

  for item in select * from jsonb_array_elements(coalesce(p_transaction->'items','[]'::jsonb)) loop
    p_id := item->>'productId';
    qty := greatest(coalesce((item->>'quantity')::numeric, 0), 0);
    select stock into current_stock from public.products where id = p_id and store_id = p_store_id for update;
    if current_stock is null then raise exception 'Product % not found', p_id; end if;
    if qty > current_stock then raise exception 'Insufficient stock for %', p_id; end if;
  end loop;

  for item in select * from jsonb_array_elements(coalesce(p_transaction->'items','[]'::jsonb)) loop
    p_id := item->>'productId';
    qty := greatest(coalesce((item->>'quantity')::numeric, 0), 0);
    update public.products set stock = stock - qty, updated_at = now() where id = p_id and store_id = p_store_id;
  end loop;

  insert into public.transactions (
    id, store_id, transaction_date, customer_name, payment_method,
    subtotal, discount_amount, tax_amount, total_amount, paid_amount,
    change_amount, status, refund_reason, cashier_name, items
  ) values (
    p_transaction->>'id', p_store_id,
    coalesce((p_transaction->>'date')::timestamptz, now()),
    p_transaction->>'customerName', coalesce((p_transaction->>'paymentMethod')::public.payment_method, 'cash'::public.payment_method),
    coalesce((p_transaction->>'subtotal')::numeric, 0), coalesce((p_transaction->>'discountAmount')::numeric, 0),
    coalesce((p_transaction->>'taxAmount')::numeric, 0), coalesce((p_transaction->>'totalAmount')::numeric, 0),
    coalesce((p_transaction->>'paidAmount')::numeric, 0), coalesce((p_transaction->>'changeAmount')::numeric, 0),
    coalesce(p_transaction->>'status', 'completed'), p_transaction->>'refundReason', p_transaction->>'cashierName',
    coalesce(p_transaction->'items','[]'::jsonb)
  ) returning to_jsonb(public.transactions.*) into new_tx;

  return new_tx;
end;
$$;

grant execute on function public.commit_sale(uuid, jsonb) to authenticated;

create or replace function public.refund_sale(
  p_store_id uuid,
  p_transaction_id text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  tx public.transactions%rowtype;
  item jsonb;
begin
  if not public.is_store_member(p_store_id) then raise exception 'Not authorized for this store'; end if;
  select * into tx from public.transactions where id = p_transaction_id and store_id = p_store_id for update;
  if tx.id is null then raise exception 'Transaction not found'; end if;
  if tx.status = 'refunded' then return to_jsonb(tx); end if;
  for item in select * from jsonb_array_elements(coalesce(tx.items,'[]'::jsonb)) loop
    update public.products set stock = stock + greatest(coalesce((item->>'quantity')::numeric,0),0), updated_at = now()
    where id = item->>'productId' and store_id = p_store_id;
  end loop;
  update public.transactions set status='refunded', refund_reason=p_reason where id=p_transaction_id and store_id=p_store_id returning * into tx;
  return to_jsonb(tx);
end;
$$;

grant execute on function public.refund_sale(uuid, text, text) to authenticated;
