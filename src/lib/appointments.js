/**
 * Convert Supabase appointment row to app format.
 * DB: id, created_at, patient_name, dentist_id, start_time, end_time, status
 * App: id, dentistId, patientName, date, start, end, type
 */
export function rowToAppointment(row) {
  if (!row || row.id == null) return null;
  const startDate = new Date(row.start_time);
  const endDate = new Date(row.end_time);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  const date = startDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
  const start = startDate.toTimeString().slice(0, 5); // HH:mm
  const end = endDate.toTimeString().slice(0, 5);
  return {
    id: row.id,
    dentistId: row.dentist_id ?? '',
    patientName: row.patient_name ?? '',
    date,
    start,
    end,
    type: row.status || 'Checkup',
    notes: row.notes ?? '',
    attendance: row.attendance || 'pending',
    insurance: row.insurance || 'private',
  };
}

/**
 * Build start_time and end_time for Supabase (ISO strings).
 */
export function toSupabaseTime(date, time) {
  return new Date(`${date}T${time}:00`).toISOString();
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
    ...overrides,
  };
}
