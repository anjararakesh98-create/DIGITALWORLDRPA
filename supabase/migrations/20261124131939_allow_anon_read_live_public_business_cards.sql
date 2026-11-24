CREATE OR REPLACE VIEW public.public_business_cards
WITH (security_invoker = true)
AS
SELECT
  slug,
  business_name,
  owner_name,
  public_data - 'email'::text - 'phone'::text AS public_data,
  card_status,
  activated_at,
  valid_until,
  id,
  contact_mobile
FROM public.business_cards
WHERE card_status = 'active'::text
   OR (card_status = 'trial'::text AND trial_ends_at > now());

-- Grant only the columns needed by the public view. Do not grant table-wide SELECT.
GRANT SELECT (slug, business_name, owner_name, public_data, card_status, activated_at, valid_until, id, contact_mobile, trial_ends_at)
ON public.business_cards TO anon;
