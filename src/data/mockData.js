/* Specialty keys for dropdowns */
export const DENTIST_SPECIALTY_KEYS = [
  'General Dentistry',
  'Orthodontics',
  'Pediatric Dentistry',
  'Oral Surgery',
];

/* Bulgarian UI labels */
export function specialtyLabel(key) {
  const map = {
    'General Dentistry': 'Обща стоматология',
    'Orthodontics': 'Ортодонтия',
    'Pediatric Dentistry': 'Детска стоматология',
    'Oral Surgery': 'Орална хирургия',
  };
  return map[key] ?? key;
}

export function appointmentTypeLabel(key) {
  const map = {
    'Checkup': 'Преглед',
    'Filling': 'Пломба',
    'Extraction': 'Вадене',
    'Consultation': 'Консултация',
    'Follow-up': 'Контролен преглед',
    'Cleaning': 'Почистка',
  };
  return map[key] ?? key;
}

export const dentists = [
  { id: 'd1', name: 'Д-р П. Хаджиев', specialty: 'General Dentistry', color: '#14b8a6' },
  { id: 'd2', name: 'Д-р Маркова', specialty: 'General Dentistry', color: '#3b82f6' },
  { id: 'd3', name: 'Д-р Георгиева', specialty: 'General Dentistry', color: '#a855f7' },
  { id: 'd4', name: 'Д-р Митова', specialty: 'General Dentistry', color: '#f97316' },
  { id: 'd5', name: 'Д-р Масларски', specialty: 'General Dentistry', color: '#ec4899' },
  { id: 'd6', name: 'Д-р Караджова', specialty: 'General Dentistry', color: '#eab308' },
  { id: 'd7', name: 'Д-р Емилова', specialty: 'General Dentistry', color: '#22c55e' },
  { id: 'd8', name: 'Д-р Фаик', specialty: 'General Dentistry', color: '#0ea5e9' },
  { id: 'd9', name: 'Д-р Халваджиева', specialty: 'General Dentistry', color: '#8b5cf6' },
  { id: 'd10', name: 'Д-р Г. Хаджиев', specialty: 'General Dentistry', color: '#f97316' },
  { id: 'd11', name: 'Д-р Веселинова', specialty: 'General Dentistry', color: '#14b8a6' },
  { id: 'd12', name: 'Д-р Андреева', specialty: 'General Dentistry', color: '#3b82f6' },
];

export const DEFAULT_DENTIST_COLORS = ['#14b8a6', '#3b82f6', '#a855f7', '#f97316', '#ec4899', '#eab308'];

export const initialPatients = [
  { id: 'p1', name: 'Emma Thompson', phone: '+1 555-0101', notes: '', address: '', egn: '', email: '' },
  { id: 'p2', name: 'Michael Brown', phone: '+1 555-0102', notes: '', address: '', egn: '', email: '' },
  { id: 'p3', name: 'Olivia Davis', phone: '+1 555-0103', notes: '', address: '', egn: '', email: '' },
  { id: 'p4', name: 'William Martinez', phone: '+1 555-0104', notes: '', address: '', egn: '', email: '' },
  { id: 'p5', name: 'Sophia Anderson', phone: '+1 555-0105', notes: '', address: '', egn: '', email: '' },
  { id: 'p6', name: 'James Taylor', phone: '+1 555-0106', notes: '', address: '', egn: '', email: '' },
  { id: 'p7', name: 'Isabella White', phone: '+1 555-0107', notes: '', address: '', egn: '', email: '' },
  { id: 'p8', name: 'Benjamin Harris', phone: '+1 555-0108', notes: '', address: '', egn: '', email: '' },
];

const today = new Date();
const pad = (n) => String(n).padStart(2, '0');
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeSlot = (h, m) => `${pad(h)}:${pad(m)}`;

export const appointments = [
  { id: 'a1', dentistId: 'd1', patientId: 'p1', date: dateKey(today), start: '09:00', end: '09:30', type: 'Checkup' },
  { id: 'a2', dentistId: 'd1', patientId: 'p2', date: dateKey(today), start: '10:00', end: '10:45', type: 'Filling' },
  { id: 'a3', dentistId: 'd2', patientId: 'p3', date: dateKey(today), start: '09:30', end: '10:00', type: 'Consultation' },
  { id: 'a4', dentistId: 'd2', patientId: 'p4', date: dateKey(today), start: '11:00', end: '11:30', type: 'Follow-up' },
  { id: 'a5', dentistId: 'd3', patientId: 'p5', date: dateKey(today), start: '09:00', end: '09:30', type: 'Checkup' },
  { id: 'a6', dentistId: 'd4', patientId: 'p6', date: dateKey(today), start: '14:00', end: '14:45', type: 'Extraction' },
];

export const HOURS = { start: 7, end: 19 };
export const SLOT_MINUTES = 30;

export function getSlots(hours = HOURS) {
  const slots = [];
  const start = hours?.start ?? HOURS.start;
  const end = hours?.end ?? HOURS.end;
  for (let h = start; h < end; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      slots.push(timeSlot(h, m));
    }
  }
  return slots;
}
