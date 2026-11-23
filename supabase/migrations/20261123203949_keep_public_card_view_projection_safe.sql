create or replace view public.public_business_cards as
select slug, business_name, owner_name, (public_data - 'email' - 'phone') as public_data,
       card_status, activated_at, valid_until, id, contact_mobile
from public.business_cards
where card_status = 'active'
   or (card_status = 'trial' and trial_ends_at > now());

alter view public.public_business_cards reset (security_invoker);
grant select on public.public_business_cards to anon, authenticated;
