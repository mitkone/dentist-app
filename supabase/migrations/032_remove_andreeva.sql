-- Премахва Д-р Андреева (d12) от списъка лекари и спира достъпа на свързаните профили.

UPDATE public.clinic_settings cs
SET value = filtered.new_value
FROM (
  SELECT coalesce(json_agg(elem)::text, '[]') AS new_value
  FROM (
    SELECT e AS elem
    FROM json_array_elements(
      (SELECT value::json FROM public.clinic_settings WHERE key = 'dentists_list' LIMIT 1)
    ) AS e
    WHERE e->>'id' IS DISTINCT FROM 'd12'
      AND lower(e->>'name') NOT LIKE '%андреева%'
      AND lower(e->>'name') NOT LIKE '%andreeva%'
  ) AS kept
) AS filtered
WHERE cs.key = 'dentists_list';

UPDATE public.profiles
SET
  dentist_id = null,
  updated_at = now()
WHERE dentist_id = 'd12'
   OR lower(coalesce(full_name, '')) LIKE '%андреева%'
   OR lower(coalesce(full_name, '')) LIKE '%andreeva%';
