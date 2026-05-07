/**
 * Demo Mode — маскира реални имена на лекари и пациенти с фалшиви.
 * Маскирането е детерминистично: едно и също реално име → едно и също фалшиво,
 * за да изглежда последователно докато се записва видео.
 * Нищо не се записва в базата данни.
 */

const FAKE_DOCTOR_NAMES = [
  'Д-р Георгиев',
  'Д-р Иванова',
  'Д-р Петров',
  'Д-р Стоянова',
  'Д-р Димитров',
  'Д-р Николова',
  'Д-р Тодоров',
  'Д-р Маринова',
  'Д-р Христов',
  'Д-р Колева',
  'Д-р Атанасов',
  'Д-р Стефанова',
  'Д-р Михайлов',
  'Д-р Пенева',
  'Д-р Александров',
]

/** Стабилен числов хеш от низ (не е крипто — само за детерминизъм). */
function simpleHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/**
 * Маскира единично реално име на лекар с фалшиво.
 * @param {string} realName
 * @returns {string}
 */
export function maskDoctorName(realName) {
  if (!realName) return realName
  const idx = simpleHash(realName) % FAKE_DOCTOR_NAMES.length
  return FAKE_DOCTOR_NAMES[idx]
}

/**
 * Маскира единично реално пациентско досие с анонимен идентификатор.
 * Използва хеша на истинското ime за детерминистичен номер.
 * @param {string} realName
 * @returns {string}
 */
export function maskPatientName(realName) {
  if (!realName) return realName
  const num = (simpleHash(realName) % 900) + 100
  return `Пациент #${num}`
}

/**
 * Трансформира масив от лекари: заменя name с фалшиво, запазва всички останали полета.
 * @param {Array} dentists
 * @returns {Array}
 */
export function maskDentists(dentists) {
  return dentists.map(d => ({
    ...d,
    name: maskDoctorName(d.name),
  }))
}

/**
 * Трансформира масив от часове: заменя patientName с анонимен идентификатор.
 * @param {Array} appointments
 * @returns {Array}
 */
export function maskAppointments(appointments) {
  return appointments.map(a => ({
    ...a,
    patientName: maskPatientName(a.patientName ?? a.patient_name ?? ''),
    patient_name: maskPatientName(a.patient_name ?? a.patientName ?? ''),
  }))
}

/**
 * Трансформира масив от пациенти: заменя name с анонимен идентификатор.
 * @param {Array} patients
 * @returns {Array}
 */
export function maskPatients(patients) {
  return patients.map(p => ({
    ...p,
    name: maskPatientName(p.name),
  }))
}
