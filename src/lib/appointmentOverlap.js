import { effectiveDentistId, rowToAppointment, toSupabaseTime } from './appointments';

export function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = String(t).trim().split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

export function timesOverlap(startA, endA, startB, endB) {
  const aS = timeToMinutes(startA);
  const aE = timeToMinutes(endA);
  const bS = timeToMinutes(startB);
  const bE = timeToMinutes(endB);
  return !(aE <= bS || aS >= bE);
}

function normalizeYmd(ds) {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(ds || '').trim());
  if (!m) return String(ds || '').trim();
  return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
}

export function isSameDentist(appointment, dentistId, dentists = []) {
  const want = String(dentistId ?? '').trim();
  if (!want) return false;
  if (String(appointment?.dentistId ?? '').trim() === want) return true;
  return effectiveDentistId(appointment, dentists) === want;
}

function normalizePatientName(name) {
  return String(name || '').trim().toLowerCase();
}

export function isSamePatient(appointment, { patientId, patientName } = {}) {
  if (patientId && appointment?.patientId && String(appointment.patientId) === String(patientId)) return true;
  const n1 = normalizePatientName(patientName);
  const n2 = normalizePatientName(appointment?.patientName);
  return Boolean(n1 && n2 && n1 === n2);
}

export function findOverlappingAppointments(
  appointments,
  { dentistId, date, start, end, excludeId, dentists = [] } = {}
) {
  const day = normalizeYmd(date);
  const exclude = excludeId != null ? String(excludeId) : null;
  return (appointments || []).filter((a) => {
    if (!a) return false;
    if (exclude && String(a.id) === exclude) return false;
    if (!isSameDentist(a, dentistId, dentists)) return false;
    if (normalizeYmd(a.date) !== day) return false;
    return timesOverlap(start, end, a.start, a.end);
  });
}

function nextDateKey(dateStr) {
  const [y, m, d] = String(dateStr).split('-').map(Number);
  const dt = new Date(y, m - 1, d + 1);
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

export async function fetchDayAppointments(supabase, date, dentists = []) {
  if (!supabase || !date) return [];
  const startIso = toSupabaseTime(date, '00:00');
  const endIso = toSupabaseTime(nextDateKey(date), '00:00');
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .gte('start_time', startIso)
    .lt('start_time', endIso)
    .limit(500);
  if (error || !data) return [];
  return data.map((row) => rowToAppointment(row, dentists)).filter(Boolean);
}

export function mergeAppointmentLists(...lists) {
  const byId = new Map();
  for (const list of lists) {
    for (const a of list || []) {
      if (a?.id == null) continue;
      byId.set(String(a.id), a);
    }
  }
  return Array.from(byId.values());
}

export function describeOverlapConflicts(overlaps, { patientId, patientName } = {}) {
  if (!overlaps?.length) return null;
  const other = overlaps.filter((a) => !isSamePatient(a, { patientId, patientName }));
  const same = overlaps.filter((a) => isSamePatient(a, { patientId, patientName }));
  const formatList = (items) =>
    items
      .map((a) => `${a.patientName?.trim() || 'Пациент'} (${a.start}–${a.end})`)
      .join(', ');
  const lines = [];
  if (other.length) {
    lines.push(`В този интервал вече има записан друг пациент: ${formatList(other)}.`);
  }
  if (same.length) {
    lines.push(`Същият пациент вече има час, който се застъпва: ${formatList(same)}.`);
  }
  if (!lines.length) {
    lines.push(`Интервалът се застъпва със съществуващ час: ${formatList(overlaps)}.`);
  }
  return {
    message: lines.join(' '),
    hasOtherPatient: other.length > 0,
    overlaps,
  };
}

export async function detectAppointmentOverlap({
  supabase,
  localAppointments,
  dentists,
  dentistId,
  date,
  start,
  end,
  excludeId,
  patientId,
  patientName,
}) {
  const query = { dentistId, date, start, end, excludeId, dentists };
  const localHits = findOverlappingAppointments(localAppointments, query);
  let dbHits = [];
  if (supabase) {
    const dayList = await fetchDayAppointments(supabase, date, dentists);
    dbHits = findOverlappingAppointments(dayList, query);
  }
  const overlaps = mergeAppointmentLists(localHits, dbHits);
  const desc = describeOverlapConflicts(overlaps, { patientId, patientName });
  return { overlaps, description: desc };
}
