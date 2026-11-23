drop policy if exists "public read live business cards" on public.business_cards;
create policy "public read live business cards"
on public.business_cards
for select
to anon, authenticated
using (
  card_status = 'active'
  or (card_status = 'trial' and trial_ends_at > now())
);