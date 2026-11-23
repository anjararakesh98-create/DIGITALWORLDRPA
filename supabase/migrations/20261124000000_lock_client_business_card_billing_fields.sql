-- Prevent client accounts from editing billing, activation, ownership or trial fields.
-- RLS still limits permitted profile updates to the authenticated card owner.
revoke update on table public.business_cards from authenticated;
grant update (business_name, owner_name, contact_mobile, public_data, updated_at)
on table public.business_cards to authenticated;
