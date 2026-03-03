-- RPC за промяна на роля чрез админ парола (когато няма Supabase auth)
-- Позволява промяна при валидна admin_pin от clinic_settings

create extension if not exists pgcrypto;

-- Хеш на паролата по подразбиране (съвпада с VITE_ADMIN_PASSWORD / 1918138)
insert into public.clinic_settings (key, value)
values ('admin_pin_hash', crypt('1918138', gen_salt('bf')))
on conflict (key) do nothing;

create or replace function public.admin_update_profile_role(
  target_id uuid,
  new_role text,
  new_dentist_id text default null,
  admin_pin text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pin_hash text;
  new_dentist text;
begin
  new_dentist := nullif(trim(new_dentist_id), '');
  if new_role is null or new_role not in ('admin', 'dentist', 'receptionist') then
    return jsonb_build_object('ok', false, 'error', 'Невалидна роля');
  end if;

  select value into pin_hash from clinic_settings where key = 'admin_pin_hash' limit 1;
  if pin_hash is null then
    return jsonb_build_object('ok', false, 'error', 'Липсва настройка за админ');
  end if;
  if admin_pin is null or trim(admin_pin) = '' then
    return jsonb_build_object('ok', false, 'error', 'Въведете админ парола');
  end if;
  if crypt(trim(admin_pin), pin_hash) != pin_hash then
    return jsonb_build_object('ok', false, 'error', 'Грешна админ парола');
  end if;

  update profiles
  set role = new_role,
      dentist_id = case when new_role = 'dentist' then new_dentist else null end,
      updated_at = now()
  where id = target_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Профилът не е намерен');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.admin_update_profile_role(uuid, text, text, text) to anon;
grant execute on function public.admin_update_profile_role(uuid, text, text, text) to authenticated;
