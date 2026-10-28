-- Digital World Marketing OS - additive Supabase setup
-- Run in Supabase SQL Editor. This creates new dw_* tables and does not drop existing tables.
create extension if not exists pgcrypto;

create table if not exists public.dw_customer_businesses (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
 category text,
 phone text,
 website text,
 google_review_url text,
 description text,
 services jsonb not null default '[]'::jsonb,
 owner_user_id uuid references auth.users(id) on delete set null,
 is_published boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.dw_visitor_events (
 id bigint generated always as identity primary key,
 event_type text not null default 'portfolio_view',
 slug text,
 page_path text,
 visitor_id text,
 referrer text,
 created_at timestamptz not null default now()
);

alter table public.dw_customer_businesses enable row level security;
alter table public.dw_visitor_events enable row level security;

-- Admin is the approved super_admin in the existing user_profiles table.
create or replace function public.dw_is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
 select exists (
   select 1 from public.user_profiles up
   where up.user_id = auth.uid()
     and up.role = 'super_admin'
     and up.approval_status = 'approved'
 );
$$;
revoke all on function public.dw_is_admin() from public;
grant execute on function public.dw_is_admin() to anon, authenticated;

drop policy if exists "dw_public_read_published_businesses" on public.dw_customer_businesses;
create policy "dw_public_read_published_businesses" on public.dw_customer_businesses
 for select to anon, authenticated using (is_published = true);

drop policy if exists "dw_admin_read_all_businesses" on public.dw_customer_businesses;
create policy "dw_admin_read_all_businesses" on public.dw_customer_businesses
 for select to authenticated using (public.dw_is_admin() or owner_user_id = auth.uid());

drop policy if exists "dw_admin_insert_businesses" on public.dw_customer_businesses;
create policy "dw_admin_insert_businesses" on public.dw_customer_businesses
 for insert to authenticated with check (public.dw_is_admin());

drop policy if exists "dw_admin_update_businesses" on public.dw_customer_businesses;
create policy "dw_admin_update_businesses" on public.dw_customer_businesses
 for update to authenticated using (public.dw_is_admin()) with check (public.dw_is_admin());

drop policy if exists "dw_admin_delete_businesses" on public.dw_customer_businesses;
create policy "dw_admin_delete_businesses" on public.dw_customer_businesses
 for delete to authenticated using (public.dw_is_admin());

drop policy if exists "dw_public_insert_visitor_events" on public.dw_visitor_events;
create policy "dw_public_insert_visitor_events" on public.dw_visitor_events
 for insert to anon, authenticated with check (event_type = 'portfolio_view');

drop policy if exists "dw_admin_read_visitor_events" on public.dw_visitor_events;
create policy "dw_admin_read_visitor_events" on public.dw_visitor_events
 for select to authenticated using (public.dw_is_admin());

grant select on public.dw_customer_businesses to anon, authenticated;
grant insert, update, delete on public.dw_customer_businesses to authenticated;
grant insert on public.dw_visitor_events to anon, authenticated;
grant select on public.dw_visitor_events to authenticated;
grant usage, select on sequence public.dw_visitor_events_id_seq to anon, authenticated;

-- Important: after first Google/email login, promote only the owner's user_id manually:
-- update public.user_profiles set role='super_admin', approval_status='approved', approved_at=now()
-- where user_id = 'YOUR-AUTH-USER-UUID';
