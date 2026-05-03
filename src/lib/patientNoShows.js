/** Съвпадение на запис в графика с пациент (id или име). */
export function appointmentBelongsToPatient(a, patientId, patientNameNorm) {
  if (!a) return false;
  if (patientId && a.patientId === patientId) return true;
  if (patientNameNorm) {
    const n = (a.patientName || '').trim().toLowerCase();
    if (n && n === patientNameNorm) return true;
  }
  return false;
}

/** Брой завършени записи „не се яви“ за този пациент. */
export function countPatientNoShows(appointments, patientId, patientName) {
  const nameNorm = patientName?.trim()?.toLowerCase() || '';
  if (!patientId && !nameNorm) return 0;
  return (appointments || []).filter(
    (a) => appointmentBelongsToPatient(a, patientId, nameNorm || null) && a.attendance === 'no_show'
  ).length;
}
