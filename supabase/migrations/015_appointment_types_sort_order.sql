-- Добавяне на sort_order за подреждане на видовете преглед
alter table public.appointment_types add column if not exists sort_order integer not null default 0;
create index if not exists idx_appointment_types_sort_order on public.appointment_types (sort_order);
-- Задаване на първоначални стойности на база key (азбучен ред)
update public.appointment_types set sort_order = sub.rn - 1
from (
  select id, row_number() over (order by label_bg) as rn
  from public.appointment_types
) sub
where public.appointment_types.id = sub.id;
