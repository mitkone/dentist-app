/**
 * Опит за insert на час с отстъпление при липсващи колони в стара БД.
 */
export async function insertAppointmentWithFallbacks(supabase, fullPayload) {
  const msg = (e) => (e && (e.message || e.details || String(e))) || '';
  const minimalCore = {
    patient_name: fullPayload.patient_name,
    dentist_id: fullPayload.dentist_id,
    start_time: fullPayload.start_time,
    end_time: fullPayload.end_time,
    status: fullPayload.status ?? 'scheduled',
  };
  const withDoctorMinimal =
    fullPayload.doctor && String(fullPayload.doctor).trim()
      ? { ...minimalCore, doctor: String(fullPayload.doctor).trim() }
      : null;

  const variants = [
    fullPayload,
    withoutKeys(fullPayload, ['patient_id']),
    withoutKeys(fullPayload, ['location']),
    withoutKeys(fullPayload, ['location', 'patient_id']),
    withoutKeys(fullPayload, ['location', 'insurance']),
    withoutKeys(fullPayload, ['location', 'insurance', 'patient_id']),
    withoutKeys(fullPayload, ['location', 'insurance', 'notes']),
    withoutKeys(fullPayload, ['location', 'insurance', 'notes', 'patient_id']),
    ...(withDoctorMinimal ? [withDoctorMinimal] : []),
    minimalCore,
  ];

  let lastError = null;
  for (const payload of variants) {
    const { data, error } = await supabase.from('appointments').insert(payload).select().single();
    if (!error) return { data, error: null };
    lastError = error;
    const m = msg(error);
    if (!shouldRetryWithStrippedColumns(m)) break;
  }
  return { data: null, error: lastError };
}

function withoutKeys(obj, keys) {
  const o = { ...obj };
  keys.forEach((k) => delete o[k]);
  return o;
}

function shouldRetryWithStrippedColumns(errorMessage) {
  const m = (errorMessage || '').toLowerCase();
  return (
    m.includes('column') ||
    m.includes('does not exist') ||
    m.includes('unknown') ||
    m.includes('schema cache') ||
    m.includes('pgrst')
  );
}
