-- Премахва Д-р Ивайлова (d14) от запазения списък лекари, ако вече е записан в базата.
UPDATE public.clinic_settings cs
SET value = filtered.new_value
FROM (
  SELECT coalesce(json_agg(elem)::text, '[]') AS new_value
  FROM (
    SELECT e AS elem
    FROM json_array_elements(
      (SELECT value::json FROM public.clinic_settings WHERE key = 'dentists_list' LIMIT 1)
    ) AS e
    WHERE e->>'id' IS DISTINCT FROM 'd14'
  ) AS kept
) AS filtered
WHERE cs.key = 'dentists_list'
  AND cs.value LIKE '%d14%';
