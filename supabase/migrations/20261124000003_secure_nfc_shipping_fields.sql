alter table public.business_cards
 add column if not exists shipping_address text,
 add column if not exists shipping_city text,
 add column if not exists shipping_state text,
 add column if not exists shipping_pincode text;
update public.business_cards set public_data=public_data-'shipping_address' where public_data ? 'shipping_address';
create or replace function public.handle_dw_auth_user_created()
returns trigger language plpgsql security definer set search_path = ''
as $function$
declare
 v_business text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'business_name'),''),'My Business');
 v_owner text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'),''),'Business Owner');
 v_slug text;
 v_plan text := case when new.raw_user_meta_data ->> 'plan_code'='with-nfc' then 'with-nfc' else 'without-nfc' end;
begin
 insert into public.user_profiles(user_id,full_name,role) values(new.id,v_owner,'customer') on conflict(user_id) do nothing;
 if nullif(trim(new.raw_user_meta_data ->> 'business_name'),'') is not null then
  v_slug := trim(both '-' from regexp_replace(lower(v_business),'[^a-z0-9]+','-','g')) || '-' || substr(replace(new.id::text,'-',''),1,6);
  insert into public.business_cards(user_id,slug,business_name,owner_name,contact_email,contact_mobile,plan_code,shipping_address,shipping_city,shipping_state,shipping_pincode,public_data)
  values(new.id,v_slug,v_business,v_owner,lower(new.email),nullif(new.raw_user_meta_data ->> 'mobile',''),v_plan,
   case when v_plan='with-nfc' then nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'shipping_address','')),400),'') end,
   case when v_plan='with-nfc' then nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'shipping_city','')),80),'') end,
   case when v_plan='with-nfc' then nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'shipping_state','')),80),'') end,
   case when v_plan='with-nfc' then nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'shipping_pincode','')),6),'') end,
   '{}'::jsonb)
  on conflict(user_id) do nothing;
 end if;
 return new;
end;
$function$;