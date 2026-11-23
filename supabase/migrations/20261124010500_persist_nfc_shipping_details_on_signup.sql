create or replace function public.handle_new_business_card_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_owner text;
  v_business text;
  v_mobile text;
  v_plan text;
  v_slug text;
begin
  v_owner := coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1));
  v_business := coalesce(nullif(new.raw_user_meta_data->>'business_name',''), v_owner || '''s Business');
  v_mobile := nullif(new.raw_user_meta_data->>'mobile','');
  v_plan := case when new.raw_user_meta_data->>'plan_code'='with-nfc' then 'with-nfc' else 'without-nfc' end;
  insert into public.user_profiles(user_id,full_name,role)
  values(new.id,v_owner,'customer')
  on conflict(user_id) do nothing;

  v_slug := trim(both '-' from regexp_replace(lower(v_business), '[^a-z0-9]+', '-', 'g'))
            || '-' || substr(replace(new.id::text,'-',''),1,6);

  insert into public.business_cards(
    user_id,slug,business_name,owner_name,contact_email,contact_mobile,plan_code,
    card_status,public_data,shipping_address,shipping_city,shipping_state,shipping_pincode
  )
  values(
    new.id,v_slug,v_business,v_owner,coalesce(new.email,''),v_mobile,v_plan,'trial',
    jsonb_build_object(
      'phone',coalesce(v_mobile,''),'email',coalesce(new.email,''),
      'tagline','','about','','address','','website','','whatsapp','',
      'services','[]'::jsonb,'products','[]'::jsonb,'gallery','[]'::jsonb,
      'portfolio','[]'::jsonb,'social','{}'::jsonb,'hours','','logo_url','','cover_url',''
    ),
    nullif(new.raw_user_meta_data->>'shipping_address',''),
    nullif(new.raw_user_meta_data->>'shipping_city',''),
    nullif(new.raw_user_meta_data->>'shipping_state',''),
    nullif(new.raw_user_meta_data->>'shipping_pincode','')
  )
  on conflict(user_id) do nothing;
  return new;
end;
$function$;
