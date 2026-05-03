/**
 * Convert Supabase appointment row to app format.
 * Стандарт в миграциите: dentist_id, status (вид преглед), insurance ...
 * По-стари/production схеми: doctor (име на лекар), appointment_type, status = private|nhif ...
 */
function normalizeDoctorMatchKey(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\u2010|\u2011|\u2212|\u002d/g, '-')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^д-р\.?\s+/i, 'д-р ');
}

/** Мачва ред към приложенчески dentist.id от списъка (d6, ...) по dentist_id или текст doctor. */
function resolveDentistIdFromRow(row, dentists = []) {
  const fromCol = String(row?.dentist_id ?? row?.doctor_id ?? '').trim();
  if (fromCol) return fromCol;
  const nameRaw = row?.doctor ?? row?.doctor_name ?? row?.dentist_name ?? '';
  const key = normalizeDoctorMatchKey(nameRaw);
  if (!key || !dentists.length) return '';
  let found = dentists.find((d) => normalizeDoctorMatchKey(d.name) === key);
  if (!found) {
    found = dentists.find((d) => {
      const dk = normalizeDoctorMatchKey(d.name);
      if (!dk || !key) return false;
      return dk === key || dk.includes(key) || key.includes(dk);
    });
  }
  return found?.id ?? '';
}

function inferTypeAndInsuranceFromRow(row) {
  const at = row?.appointment_type ?? row?.appointmentType ?? row?.intervention ?? row?.vizit_type ?? '';
  const stRaw = row?.status;
  const st = String(stRaw ?? '').trim();
  const stLower = st.toLowerCase();
  const insColumn = row?.insurance;

  if (stLower === 'private' || stLower === 'nhif') {
    return {
      type: String(at || 'Checkup').trim() || 'Checkup',
      insurance: stLower === 'nhif' ? 'nhif' : 'private',
    };
  }

  const typeGuess = String(at || st || 'Checkup').trim() || 'Checkup';
  const lowIns = String(insColumn ?? '').toLowerCase();

  return {
    type: typeGuess,
    insurance: lowIns === 'nhif' ? 'nhif' : 'private',
  };
}

function isoDateTimeToLocalParts(isoMs) {
  const d = new Date(isoMs);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return { dateKey: `${y}-${m}-${day}`, hhmm: `${hh}:${mm}` };
}

export function rowToAppointment(row, dentists = []) {
  if (!row || row.id == null) return null;
  const startDate = new Date(row.start_time);
  const endDate = new Date(row.end_time);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  const startParts = isoDateTimeToLocalParts(startDate.getTime());
  const endParts = isoDateTimeToLocalParts(endDate.getTime());
  if (!startParts || !endParts) return null;
  const date = startParts.dateKey;
  const start = startParts.hhmm;
  const end = endParts.hhmm;
  const { type: typeVal, insurance: insVal } = inferTypeAndInsuranceFromRow(row);
  const clinicRaw = row.clinic_id ?? row.clinicId;
  return {
    id: row.id,
    dentistId: resolveDentistIdFromRow(row, dentists),
    patientId: row.patient_id ?? null,
    patientName: row.patient_name ?? row.patientName ?? '',
    date,
    start,
    end,
    type: typeVal || 'Checkup',
    notes: row.notes ?? '',
    attendance: row.attendance || 'pending',
    insurance: insVal === 'nhif' ? 'nhif' : 'private',
    location: row.location || 'Дружба',
    clinicId: clinicRaw != null ? clinicRaw : null,
    _doctorLabel: row.doctor ?? row.doctor_name ?? null,
  };
}

/**
 * Build start_time and end_time for Supabase (ISO strings).
 * Ползва експлицитни компоненти на локалната календарна дата и час –
 * браузърите третират ISO низ без timezone по различни начини и може да
 * променят деня при запис (напр. 6.6. да стане 5.6.).
 */
export function toSupabaseTime(dateStr, timeStr) {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || '').trim());
  const tm = /^(\d{1,2}):(\d{2})$/.exec(String(timeStr || '').trim());
  if (dm && tm) {
    const y = Number(dm[1]);
    const mo = Number(dm[2]);
    const da = Number(dm[3]);
    let hh = Number(tm[1]);
    let mm = Number(tm[2]);
    if (hh === 24) {
      hh = 0;
    }
    if (
      Number.isFinite(y) &&
      Number.isFinite(mo) &&
      Number.isFinite(da) &&
      Number.isFinite(hh) &&
      Number.isFinite(mm) &&
      mo >= 1 &&
      mo <= 12 &&
      da >= 1 &&
      da <= 31 &&
      hh >= 0 &&
      hh <= 23 &&
      mm >= 0 &&
      mm <= 59
    ) {
      return new Date(y, mo - 1, da, hh, mm, 0, 0).toISOString();
    }
  }
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

/**
 * Convert app appointment to Supabase row for insert/update.
 */
export function appointmentToRow(appointment, overrides = {}) {
  const { date, start, end } = appointment;
  return {
    patient_name: appointment.patientName ?? overrides.patient_name,
    dentist_id: appointment.dentistId ?? overrides.dentist_id,
    start_time: toSupabaseTime(date, start),
    end_time: toSupabaseTime(date, end),
    status: appointment.type ?? appointment.status ?? 'scheduled',
    insurance: appointment.insurance ?? overrides.insurance ?? 'private',
    location: appointment.location ?? overrides.location ?? 'Дружба',
    ...overrides,
  };
}
