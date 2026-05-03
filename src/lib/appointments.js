/**
 * Convert Supabase appointment row to app format.
 * Стандарт в миграциите: dentist_id, status (вид преглед), insurance ...
 * По-стари/production схеми: doctor (име на лекар), appointment_type, status = private|nhif ...
 */
function normalizeDoctorMatchKey(s) {
  return String(s || '')
    .trim()
    .toLocaleLowerCase('bg-BG')
    .replace(/\u2010|\u2011|\u2212|\u002d/g, '-')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^dr\.?\s+/i, 'д-р ')
    .replace(/^д-р\.?\s+/i, 'д-р ');
}

/** Пълният женски йероглиф Й (един знак vs i + combining). */
function lastNameFingerprint(s) {
  const cleaned = normalizeDoctorMatchKey(s).replace(/^д-р\s+/, '');
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const last = parts.length ? parts[parts.length - 1] : cleaned;
  return last;
}

/** Мачва dentist_id число като → d6, UUID дословно, после по колона doctor. */
function resolveDentistIdFromRow(row, dentists = []) {
  if (!dentists.length) return String(row?.dentist_id ?? row?.doctor_id ?? '').trim();

  const rawSlot = row?.dentist_id ?? row?.doctor_id;
  let rawStr = rawSlot != null && rawSlot !== '' ? String(rawSlot).trim() : '';

  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawStr)
  ) {
    if (dentists.some((d) => String(d.id) === rawStr)) return rawStr;
    rawStr = '';
  }

  if (rawStr) {
    if (dentists.some((d) => String(d.id) === rawStr)) return rawStr;

    const afterD = rawStr.replace(/^d\s*/i, '');
    const n = /^(\d+)$/.exec(afterD) ? Number(afterD) : NaN;
    if (Number.isFinite(n) && n >= 1 && n <= 9999) {
      const prefixedId = /^d\d+$/i.test(rawStr) ? rawStr : `d${n}`;
      const byPref = dentists.find((d) => String(d.id).toLowerCase() === prefixedId.toLowerCase());
      if (byPref) return byPref.id;
    }

    rawStr = '';
  }

  const nameRaw =
    row?.doctor ??
    row?.Doctor ??
    row?.doctor_name ??
    row?.dentist_name ??
    row?.assigned_doctor ??
    row?.dentist_full_name ??
    '';
  const key = normalizeDoctorMatchKey(nameRaw);
  if (!key) return '';

  let found = dentists.find((d) => normalizeDoctorMatchKey(d.name) === key);

  const keyLast = lastNameFingerprint(nameRaw);
  if (!found && keyLast) {
    found = dentists.find((d) => lastNameFingerprint(d.name) === keyLast);
  }
  if (!found && keyLast.length >= 3) {
    found = dentists.find((d) => {
      const dl = lastNameFingerprint(d.name);
      if (!dl || !keyLast) return false;
      return dl === keyLast || dl.includes(keyLast) || keyLast.includes(dl);
    });
  }
  if (!found) {
    found = dentists.find((d) => {
      const dk = normalizeDoctorMatchKey(d.name);
      return dk === key || dk.includes(key) || key.includes(dk);
    });
  }

  return found?.id ?? '';
}

/**
 * Колона в графиката по id; ако записът няма валиден dentistId но има етикет на лекар (legacy import), мачва по име.
 */
export function effectiveDentistId(appointment, dentists = []) {
  const cur = String(appointment?.dentistId ?? '').trim();
  if (cur && dentists.some((d) => String(d.id) === cur)) return cur;

  const label = appointment?._doctorLabel ?? appointment?.doctorLabel ?? '';
  const trimmed = String(label).trim();
  if (trimmed && dentists.length) {
    const fromLabel = resolveDentistIdFromRow({ dentist_id: null, doctor: trimmed }, dentists);
    if (fromLabel) return fromLabel;
  }

  return cur;
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

function parseLooseTimeToMs(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const abs = Math.abs(value);
    return abs > 1e15 ? null : abs < 1e12 ? value * 1000 : value;
  }
  if (typeof value === 'string') {
    const t = value.trim();
    if (/^-?\d+(\.\d+)?$/.test(t)) {
      const n = Number(t);
      if (!Number.isFinite(n)) return null;
      const abs = Math.abs(n);
      if (abs > 1e15) return null;
      return abs < 1e12 ? n * 1000 : n;
    }
  }
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d.getTime();
  return null;
}

/** Редове от стари/външни БД: отделна дата + час, или липсващ end_time. */
function pickStartEndMsFromRow(row) {
  const startCandidates = [
    row.start_time,
    row.start,
    row.slot_start,
    row.slotStart,
    row.startTime,
    row.begin_time,
  ];
  let startMs = null;
  for (const c of startCandidates) {
    const t = parseLooseTimeToMs(c);
    if (t != null) {
      startMs = t;
      break;
    }
  }

  const dayCol =
    row.appointment_date ?? row.appointmentDate ?? row.calendar_date ?? row.visit_date ?? row.day_date ?? null;
  const timeOnly =
    row.time ??
    row.start_slot ??
    row.slot_time ??
    row.hour ??
    (typeof row.start_time === 'string' && /^\d{1,2}:\d{2}/.test(row.start_time.trim()) ? row.start_time : null);

  if (startMs == null && dayCol != null && timeOnly != null) {
    const dm = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dayCol).trim());
    const tm = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(String(timeOnly).trim());
    if (dm && tm) {
      const y = Number(dm[1]);
      const mo = Number(dm[2]);
      const da = Number(dm[3]);
      const hh = Number(tm[1]);
      const mm = Number(tm[2]);
      if (
        [y, mo, da, hh, mm].every(Number.isFinite) &&
        mo >= 1 &&
        mo <= 12 &&
        da >= 1 &&
        da <= 31
      ) {
        startMs = new Date(y, mo - 1, da, hh, mm, 0, 0).getTime();
      }
    }
  }

  const endCandidates = [row.end_time, row.end, row.slot_end, row.slotEnd, row.endTime, row.finish_time];
  let endMs = null;
  for (const c of endCandidates) {
    const t = parseLooseTimeToMs(c);
    if (t != null) {
      endMs = t;
      break;
    }
  }

  const dur = row.duration_minutes ?? row.durationMinutes ?? row.slot_duration;
  const durN = dur != null ? Number(dur) : NaN;

  if (startMs != null && endMs == null) {
    if (Number.isFinite(durN) && durN > 0 && durN <= 24 * 60) {
      endMs = startMs + durN * 60 * 1000;
    } else {
      endMs = startMs + 30 * 60 * 1000;
    }
  }

  if (startMs != null && endMs != null && endMs < startMs) {
    endMs = startMs + 30 * 60 * 1000;
  }

  return { startMs, endMs };
}

export function rowToAppointment(row, dentists = []) {
  if (!row || row.id == null) return null;
  const { startMs, endMs } = pickStartEndMsFromRow(row);
  if (startMs == null || endMs == null) return null;
  const startParts = isoDateTimeToLocalParts(startMs);
  const endParts = isoDateTimeToLocalParts(endMs);
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
