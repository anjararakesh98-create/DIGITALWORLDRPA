-- Digital World Marketing OS migration for the EXISTING digital-world-marketing project.
-- Run once in Supabase SQL Editor after reviewing. Does not drop existing tables/data.
-- Adds admin policies to the tables already created in this project and closes profile role self-escalation.

create or replace function public.dw_is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
      and p.approval_status = 'approved'
  );
$$;

revoke all on function public.dw_is_super_admin() from public;
grant execute on function public.dw_is_super_admin() to anon, authenticated;

-- Critical security fix: users must not be able to promote themselves to super_admin.
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Users update own basic profile" on public.profiles;
revoke update on table public.profiles from authenticated;
grant update (full_name, email, updated_at) on table public.profiles to authenticated;

create policy "Users update own basic profile"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Super admin access to all customer businesses; public visibility still depends on is_published.
drop policy if exists "dw_admin_read_businesses" on public.businesses;
create policy "dw_admin_read_businesses" on public.businesses
for select to authenticated using (public.dw_is_super_admin());

drop policy if exists "dw_admin_insert_businesses" on public.businesses;
create policy "dw_admin_insert_businesses" on public.businesses
for insert to authenticated with check (public.dw_is_super_admin());

drop policy if exists "dw_admin_update_businesses" on public.businesses;
create policy "dw_admin_update_businesses" on public.businesses
for update to authenticated using (public.dw_is_super_admin()) with check (public.dw_is_super_admin());

drop policy if exists "dw_admin_delete_businesses" on public.businesses;
create policy "dw_admin_delete_businesses" on public.businesses
for delete to authenticated using (public.dw_is_super_admin());

-- Admin can manage associated portfolio and digital-card content.
drop policy if exists "dw_admin_manage_portfolios" on public.portfolios;
create policy "dw_admin_manage_portfolios" on public.portfolios
for all to authenticated
using (public.dw_is_super_admin())
with check (public.dw_is_super_admin());

drop policy if exists "dw_admin_manage_digital_cards" on public.digital_cards;
create policy "dw_admin_manage_digital_cards" on public.digital_cards
for all to authenticated
using (public.dw_is_super_admin())
with check (public.dw_is_super_admin());

-- Admin can review saved review drafts and view analytics.
drop policy if exists "dw_admin_manage_review_drafts" on public.review_drafts;
create policy "dw_admin_manage_review_drafts" on public.review_drafts
for all to authenticated
using (public.dw_is_super_admin())
with check (public.dw_is_super_admin());

drop policy if exists "dw_public_insert_basic_analytics" on public.analytics_events;
create policy "dw_public_insert_basic_analytics" on public.analytics_events
for insert to anon, authenticated
with check (event_type in ('page_view', 'portfolio_view'));

drop policy if exists "dw_admin_read_analytics_events" on public.analytics_events;
create policy "dw_admin_read_analytics_events" on public.analytics_events
for select to authenticated
using (public.dw_is_super_admin());

grant select on public.businesses, public.portfolios, public.digital_cards, public.review_drafts, public.analytics_events to authenticated;
grant insert, update, delete on public.businesses, public.portfolios, public.digital_cards, public.review_drafts to authenticated;
grant insert on public.analytics_events to anon, authenticated;
