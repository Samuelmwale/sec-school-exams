-- Create RPC to register a school atomically and bypass RLS safely
create or replace function public.register_school(
  p_school_name text,
  p_center_number text,
  p_division_name text,
  p_zone_name text,
  p_district_name text,
  p_address text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_school_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.schools (
    school_name, center_number, division_name, zone_name, district_name, address, is_active, subscription_expiry
  ) values (
    p_school_name, p_center_number, p_division_name, p_zone_name, p_district_name, p_address, true, now() + interval '30 days'
  )
  returning id into v_school_id;

  -- Link school to user profile
  update public.profiles
  set school_id = v_school_id
  where id = v_user_id;

  -- Ensure the user has admin role
  insert into public.user_roles(user_id, role)
  values (v_user_id, 'admin')
  on conflict (user_id, role) do nothing;

  return v_school_id;
end;
$$;

-- Allow authenticated users to call the function
grant execute on function public.register_school(text, text, text, text, text, text) to authenticated;