import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Activity, Bell, LogIn, LogOut, MessageCircle, LayoutDashboard, Bug, Search, UserPlus, Database } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { dentists as initialDentists, initialPatients, getSlots } from './data/mockData';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { rowToAppointment, toSupabaseTime, effectiveDentistId } from './lib/appointments';
import { getThreadRecipient } from './lib/doctorMessaging';
import { insertAppointmentWithFallbacks } from './lib/insertAppointment';
import { logActivity, ACTIVITY_ACTIONS } from './lib/activityLog';
import Sidebar from './components/Sidebar';
import CalendarHeader from './components/CalendarHeader';
import DentistBar from './components/DentistBar';
import ResourceCalendar from './components/ResourceCalendar';
import AddAppointmentModal from './components/AddAppointmentModal';
import AddDentistModal from './components/AddDentistModal';
import AddPatientModal from './components/AddPatientModal';
import PatientDetailModal from './components/PatientDetailModal';
import PatientDatabaseModal from './components/PatientDatabaseModal';
import EditAppointmentModal from './components/EditAppointmentModal';
import AddVacationModal from './components/AddVacationModal';
import AdminPanel from './components/AdminPanel';
import AdminHubPage from './components/AdminHubPage';
import FeedbackPage from './components/FeedbackPage';
import AdminPasswordModal from './components/AdminPasswordModal';
import AuthModal from './components/AuthModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import FreeSlotsModal from './components/FreeSlotsModal';
import DentistProfileModal from './components/DentistProfileModal';
import DoctorDayLocationModal from './components/DoctorDayLocationModal';
import LandingAuth, { getAdminSession, setAdminSession, getAdminPin } from './components/LandingAuth';
import QuickBookBar from './components/QuickBookBar';
import ChatPage from './components/ChatPage';
import {
  STAFF_DM_INBOX_DENTIST_ID,
  countUnreadForDentist,
  countUnreadForStaff,
  threadDoctorId,
} from './lib/doctorMessaging';
import { getPermissions } from './lib/permissions';

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function normalizeYmd(ds) {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(ds || '').trim());
  if (!m) return String(ds || '').trim();
  return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
}

/** YYYY-MM-DD или Date → календарен ден като локален Date (~обед): без полунощ UTC от `new Date('2026-06-06')`. */
function parseLocalDateInput(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0, 0);
  }
  const s = String(value).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const da = Number(m[3]);
    if (Number.isFinite(y) && Number.isFinite(mo) && Number.isFinite(da)) {
      return new Date(y, mo - 1, da, 12, 0, 0, 0);
    }
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
}

function anchorCurrentDateNoon(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
}

function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

function getDurationMinutes(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh - sh) * 60 + (em - sm);
}

function compareAppointmentsByDateTime(a, b) {
  const dc = (a.date || '').localeCompare(b.date || '');
  if (dc !== 0) return dc;
  return (a.start || '').localeCompare(b.start || '');
}

/** След INSERT GET понякога кратко не връща реда (read‑lag); държим локалния му клон докато не се появи в отговора. */
const APPOINTMENT_PRESERVE_UNTIL_VISIBLE_MS = 600000;

/**
 * PostgREST/Supabase по подразбиране връща до ~1000 реда на заявка.
 * Преди това зареждахме с order(start_time asc) → първите 1000 най-стари реда;
 * всички по-нови (бъдещи) часове липсваха след F5, макар да стояха в state по време на сесията.
 */
const APPOINTMENTS_PAGE_SIZE = 1000;
function appointmentsFetchWindowIsoBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 18, 1, 0, 0, 0, 0);
  const end = new Date(now);
  end.setMonth(end.getMonth() + 36);
  end.setHours(23, 59, 59, 999);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

function mergeFetchedAppointmentsPreserveRecent(fromServerMapped, prev) {
  const byId = new Map();
  fromServerMapped.forEach((a) => byId.set(String(a.id), a));
  const now = Date.now();
  for (const p of prev) {
    const id = String(p.id);
    if (byId.has(id)) continue;
    if (!p._preserveUntilFetched || typeof p._preserveAtMs !== 'number') continue;
    if (now - p._preserveAtMs > APPOINTMENT_PRESERVE_UNTIL_VISIBLE_MS) continue;
    byId.set(id, p);
  }
  return Array.from(byId.values()).sort(compareAppointmentsByDateTime);
}

function stripAppointmentClientMeta(appt) {
  if (!appt || typeof appt !== 'object') return appt;
  const { _preserveUntilFetched, _preserveAtMs, ...rest } = appt;
  void _preserveUntilFetched;
  void _preserveAtMs;
  return rest;
}

function mapPatientFromRow(row) {
  if (!row) return null;
  const dn = row.dentist_notes;
  return {
    id: row.id,
    name: row.name ?? '',
    phone: row.phone ?? '',
    notes: row.notes ?? '',
    address: row.address ?? '',
    egn: row.egn ?? '',
    email: row.email ?? '',
    parentPhone: row.parent_phone ?? '',
    isBlacklisted: Boolean(row.is_blacklisted),
    unreliablePatient: Boolean(row.unreliable_patient),
    dentistNotes: dn && typeof dn === 'object' && !Array.isArray(dn) ? { ...dn } : {},
  };
}

function patientUpdatesToDb(updates) {
  const db = { ...updates };
  if ('parentPhone' in db) {
    db.parent_phone = db.parentPhone?.trim() ? db.parentPhone.trim() : null;
    delete db.parentPhone;
  }
  if ('isBlacklisted' in db) {
    db.is_blacklisted = Boolean(db.isBlacklisted);
    delete db.isBlacklisted;
  }
  if ('unreliablePatient' in db) {
    db.unreliable_patient = Boolean(db.unreliablePatient);
    delete db.unreliablePatient;
  }
  if ('dentistNotes' in db) {
    db.dentist_notes = db.dentistNotes;
    delete db.dentistNotes;
  }
  return db;
}

function getWeekBounds(d) {
  const start = new Date(d);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: dateKey(start), end: dateKey(end) };
}

function readWorkingHoursCache() {
  try {
    const raw = localStorage.getItem('clinic_working_hours_v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const start = Number(parsed?.start);
    const end = Number(parsed?.end);
    if (!Number.isInteger(start) || !Number.isInteger(end)) return null;
    if (start < 0 || end > 24 || end <= start) return null;
    return { start, end };
  } catch {
    return null;
  }
}

function writeWorkingHoursCache(value) {
  try {
    localStorage.setItem('clinic_working_hours_v1', JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

export default function App() {
  const [dentists, setDentists] = useState(initialDentists);
  const [selectedDentistIds, setSelectedDentistIds] = useState(() => initialDentists.map((d) => d.id));
  const [patients, setPatients] = useState(initialPatients);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState(null);
  const [modal, setModal] = useState({ open: false, dentistId: null, slot: null, bookingDate: null });
  const [calendarView, setCalendarView] = useState('day');
  const [addDentistOpen, setAddDentistOpen] = useState(false);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [patientDetailId, setPatientDetailId] = useState(null);
  const [patientDbOpen, setPatientDbOpen] = useState(false);
  const [editAppointment, setEditAppointment] = useState(null);
  const [doctorVacations, setDoctorVacations] = useState([]);
  const [vacationModal, setVacationModal] = useState({ open: false, dentistId: null });
  const [patientFiles, setPatientFiles] = useState([]);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminHubOpen, setAdminHubOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackUnreadCount, setFeedbackUnreadCount] = useState(0);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [dentistPhotos, setDentistPhotos] = useState({});
  const [activityLog, setActivityLog] = useState([]);
  const [activityLogLoading, setActivityLogLoading] = useState(false);
  const [workingHours, setWorkingHours] = useState(() => readWorkingHoursCache() || { start: 7, end: 19 });
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [freeSlotsOpen, setFreeSlotsOpen] = useState(false);
  const [doctorAvailableSlots, setDoctorAvailableSlots] = useState({});
  const [doctorDayLocations, setDoctorDayLocations] = useState({});
  const [slotsRefreshKey, setSlotsRefreshKey] = useState(0);
  const [dentistProfileModal, setDentistProfileModal] = useState(null);
  const [dayLocationModal, setDayLocationModal] = useState({ open: false, dentist: null });
  const [freeSlotsInitialDentist, setFreeSlotsInitialDentist] = useState(null);
  const [freeSlotsInitialDate, setFreeSlotsInitialDate] = useState(null);
  const [scheduleNotifications, setScheduleNotifications] = useState([]);
  const [scheduleNotificationsOpen, setScheduleNotificationsOpen] = useState(false);
  const [scheduleNotificationsSeen, setScheduleNotificationsSeen] = useState(true);
  const scheduleNotificationsRef = useRef(null);
  const [doctorInboxMessages, setDoctorInboxMessages] = useState([]);
  const [staffDmMessages, setStaffDmMessages] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const doctorInboxMsgsRef = useRef([]);
  const [appointmentsRefreshKey, setAppointmentsRefreshKey] = useState(0);
  const [vacationsRefreshKey, setVacationsRefreshKey] = useState(0);
  /** Винаги актуален списък лекари за async/realtime (без да презакачаме цялото fetch при смяна на референцията на масива). */
  const dentistsRef = useRef(dentists);
  dentistsRef.current = dentists;
  /** Игнорира се остарял отговор от паралелни GET заявки към appointments (гонка → „изчезващ“ час). */
  const appointmentsFetchGenerationRef = useRef(0);
  /** След първо успешно зареждане повторни GET (Realtime refetch) не скриват графика с цял екран „Зареждане“. */
  const appointmentsHadInitialHydrateRef = useRef(false);

  useEffect(() => {
    function handleClickOutside(e) {
      if (scheduleNotificationsRef.current && !scheduleNotificationsRef.current.contains(e.target)) {
        setScheduleNotificationsOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const { user, profile, signIn, signUp, signOut, resetPassword, needsPasswordReset, updatePassword, dismissPasswordReset } = useAuth() ?? {};
  const [adminSession, setAdminSessionState] = useState(() => getAdminSession());
  const isAuthenticated = Boolean(user) || adminSession;
  const permissions = adminSession ? { canViewAllDentists: true, canBookAnyDentist: true, canEditDentists: true, canManageProfiles: true, canManageSettings: true, canViewAdmin: true, myDentistId: null } : getPermissions(profile);

  const effectiveSelectedDentistIds = permissions.myDentistId && dentists.some((d) => d.id === permissions.myDentistId)
    ? selectedDentistIds.includes(permissions.myDentistId)
      ? selectedDentistIds
      : [permissions.myDentistId, ...selectedDentistIds.filter((id) => id !== permissions.myDentistId)]
    : selectedDentistIds;
  const visibleDentistIds = effectiveSelectedDentistIds.length > 0 ? effectiveSelectedDentistIds : dentists.map((d) => d.id);
  const filteredDentists = dentists.filter((d) => visibleDentistIds.includes(d.id));

  const dentistViewInitialized = useRef(false);
  useEffect(() => {
    if (permissions.myDentistId && !adminSession && dentists.some((d) => d.id === permissions.myDentistId) && !dentistViewInitialized.current) {
      setSelectedDentistIds([permissions.myDentistId]);
      dentistViewInitialized.current = true;
    }
    if (!permissions.myDentistId) dentistViewInitialized.current = false;
  }, [permissions.myDentistId, adminSession, dentists]);

  const refreshDoctorSlots = useCallback(() => setSlotsRefreshKey((k) => k + 1), []);

  const saveDoctorDayLocation = useCallback(async (dentistId, dayKeyStr, location) => {
    if (!supabase || !dentistId || !dayKeyStr || !location) return false;
    const key = `${dentistId}_${dayKeyStr}`;
    const existingSlots = doctorAvailableSlots[key] ? Array.from(doctorAvailableSlots[key]) : getSlots(workingHours);
    const { error } = await supabase
      .from('doctor_available_slots')
      .upsert(
        {
          dentist_id: dentistId,
          date: dayKeyStr,
          slots: existingSlots,
          location,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'dentist_id,date' }
      );
    if (error) return false;
    setDoctorDayLocations((prev) => ({ ...prev, [key]: location }));
    return true;
  }, [supabase, doctorAvailableSlots, workingHours]);


  const logWithActor = useCallback(
    (payload) => {
      const defaultActor = adminSession ? 'Админ' : (profile?.full_name || user?.email?.split('@')[0] || user?.email || '—');
      const actorName = payload.details?.actor_name ?? defaultActor;
      logActivity(supabase, {
        ...payload,
        details: { ...payload.details, actor_name: actorName, actor_email: user?.email || null },
      });
    },
    [supabase, user, profile, adminSession]
  );

  const handleAdminPasswordSuccess = useCallback((password) => {
    setAdminSession(true, password);
    setAdminSessionState(true);
    setShowAdminPassword(false);
    setAdminHubOpen(true);
  }, []);

  const handleStaffLogout = useCallback(() => {
    if (adminSession) {
      setAdminSession(false);
      setAdminSessionState(false);
    }
    signOut?.();
  }, [adminSession, signOut]);

  const timeStrToMinutes = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const findAllFreeSlotsForDate = useCallback(
    (dentistId, dateStr) => {
      if (!dateStr) return [];
      const slots = getSlots(workingHours);
      const isOnVacationDay = doctorVacations.some(
        (v) => v.dentist_id === dentistId && v.start_date <= dateStr && v.end_date >= dateStr
      );
      if (isOnVacationDay) return [];

      const key = `${dentistId}_${dateStr}`;
      const availableSet = doctorAvailableSlots[key];
      const today = new Date();
      const [y, m, d] = dateStr.split('-').map(Number);
      const isToday = today.getFullYear() === y && today.getMonth() + 1 === m && today.getDate() === d;
      const result = [];

      for (const slot of slots) {
        if (availableSet && !availableSet.has(slot)) continue;
        const [h, min] = slot.split(':').map(Number);
        const slotDateTime = new Date(y, m - 1, d, h, min);
        if (isToday && slotDateTime < new Date()) continue;

        const slotStartMin = timeStrToMinutes(slot);
        const slotEndMin = slotStartMin + 15;
        const hasOverlap = appointments.some((a) => {
          if (
            effectiveDentistId(a, dentists) !== String(dentistId ?? '').trim() ||
            normalizeYmd(a.date) !== normalizeYmd(dateStr)
          ) {
            return false;
          }
          const aStart = timeStrToMinutes(a.start);
          const aEnd = timeStrToMinutes(a.end);
          return !(aEnd <= slotStartMin || aStart >= slotEndMin);
        });
        if (!hasOverlap) result.push({ date: dateStr, time: slot });
      }
      return result;
    },
    [appointments, doctorVacations, workingHours, doctorAvailableSlots, dentists]
  );

  const findFirstFreeForDate = useCallback(
    (dentistId, dateStr) => {
      const all = findAllFreeSlotsForDate(dentistId, dateStr);
      return all[0] ?? null;
    },
    [findAllFreeSlotsForDate]
  );

  const findNextFreeForDentist = useCallback(
    (dentistId) => {
      const maxDays = 30;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const slots = getSlots(workingHours);

      for (let offset = 0; offset < maxDays; offset += 1) {
        const d = new Date(today);
        d.setDate(today.getDate() + offset);
        const dateStr = dateKey(d);

        const isOnVacationDay = doctorVacations.some(
          (v) => v.dentist_id === dentistId && v.start_date <= dateStr && v.end_date >= dateStr
        );
        if (isOnVacationDay) continue;

        const key = `${dentistId}_${dateStr}`;
        const availableSet = doctorAvailableSlots[key];

        for (const slot of slots) {
          if (availableSet && !availableSet.has(slot)) continue;
          const [h, m] = slot.split(':').map(Number);
          const slotDateTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
          if (slotDateTime < new Date()) continue;

          const slotStartMin = timeStrToMinutes(slot);
          const slotEndMin = slotStartMin + 15;

          const hasOverlap = appointments.some((a) => {
            if (
              effectiveDentistId(a, dentists) !== String(dentistId ?? '').trim() ||
              normalizeYmd(a.date) !== normalizeYmd(dateStr)
            ) {
              return false;
            }
            const aStart = timeStrToMinutes(a.start);
            const aEnd = timeStrToMinutes(a.end);
            return !(aEnd <= slotStartMin || aStart >= slotEndMin);
          });

          if (!hasOverlap) {
            return { date: dateStr, time: slot };
          }
        }
      }

      return null;
    },
    [appointments, doctorVacations, workingHours, doctorAvailableSlots, dentists]
  );

  const nextFreeSummary = (() => {
    if (!appointments.length && !doctorVacations.length) return null;
    let best = null;
    const scopeDentists = selectedDentistIds.length
      ? dentists.filter((d) => selectedDentistIds.includes(d.id))
      : dentists;
    scopeDentists.forEach((d) => {
      const res = findNextFreeForDentist(d.id);
      if (!res) return;
      const [y, m, day] = res.date.split('-').map(Number);
      const [hh, mm] = res.time.split(':').map(Number);
      const dt = new Date(y, m - 1, day, hh, mm);
      if (!best || dt < best.when) {
        best = {
          dentistName: d.name,
          when: dt,
          dateLabel: dt.toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit' }),
          time: res.time,
        };
      }
    });
    return best;
  })();

  const todayKeyStr = dateKey(currentDate);
  const appointmentsToday = appointments.filter((a) => normalizeYmd(a.date) === normalizeYmd(todayKeyStr)).length;
  const adminStats = {
    appointmentsToday,
    patientsCount: patients.length,
    dentistsCount: dentists.length,
  };

  const headerPatientHits = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    if (q.length < 1) return [];
    return patients
      .filter((p) => [p.name, p.phone, p.parentPhone, p.email, p.notes].filter(Boolean).join(' ').toLowerCase().includes(q))
      .slice(0, 12);
  }, [patients, patientSearch]);

  function getFilePublicUrl(storagePath) {
    if (!supabase) return '';
    const { data } = supabase.storage.from('patient-files').getPublicUrl(storagePath);
    return data?.publicUrl ?? '';
  }

  useEffect(() => {
    if (!isAuthenticated) {
      appointmentsHadInitialHydrateRef.current = false;
      return;
    }
    const fetchGen = ++appointmentsFetchGenerationRef.current;
    const showFullScreenLoading = !appointmentsHadInitialHydrateRef.current;

    async function fetchAppointments() {
      if (showFullScreenLoading) setAppointmentsLoading(true);
      setAppointmentsError(null);
      if (!supabase) {
        if (appointmentsFetchGenerationRef.current === fetchGen) setAppointments([]);
        if (appointmentsFetchGenerationRef.current === fetchGen) setAppointmentsLoading(false);
        return;
      }
      try {
        await supabase.auth.getSession();
        const { startIso, endIso } = appointmentsFetchWindowIsoBounds();
        const rows = [];
        let rangeFrom = 0;
        let error = null;
        while (appointmentsFetchGenerationRef.current === fetchGen) {
          const { data, error: pageError } = await supabase
            .from('appointments')
            .select('*')
            .gte('start_time', startIso)
            .lte('start_time', endIso)
            .order('start_time', { ascending: true })
            .range(rangeFrom, rangeFrom + APPOINTMENTS_PAGE_SIZE - 1);
          if (appointmentsFetchGenerationRef.current !== fetchGen) return;
          if (pageError) {
            error = pageError;
            break;
          }
          const chunk = data || [];
          rows.push(...chunk);
          if (chunk.length < APPOINTMENTS_PAGE_SIZE) break;
          rangeFrom += APPOINTMENTS_PAGE_SIZE;
        }

        if (appointmentsFetchGenerationRef.current !== fetchGen) return;

        if (error) {
          const msg = error.message || '';
          setAppointmentsError(
            msg.includes('schema cache') || msg.includes('does not exist')
              ? 'Таблицата appointments липсва. Създайте я от Supabase: Dashboard → SQL Editor → поставете скрипта от supabase/migrations/001_appointments.sql'
              : msg
          );
          setAppointments([]);
        } else {
          const dentalNow = dentistsRef.current;
          const list = rows.map((row) => rowToAppointment(row, dentalNow)).filter(Boolean);
          setAppointments((prev) => mergeFetchedAppointmentsPreserveRecent(list, prev));
          appointmentsHadInitialHydrateRef.current = true;
        }
      } catch (err) {
        if (appointmentsFetchGenerationRef.current !== fetchGen) return;
        const msg = err?.message || '';
        // На мобилни браузъри понякога заявката се abort-ва при фон/фокус смяна.
        if (err?.name === 'AbortError' || msg.toLowerCase().includes('aborted')) {
          setAppointmentsError(null);
        } else {
          setAppointmentsError(msg || 'Грешка при зареждане');
          setAppointments([]);
        }
      }
      if (appointmentsFetchGenerationRef.current === fetchGen) setAppointmentsLoading(false);
    }
    fetchAppointments();
  }, [isAuthenticated, appointmentsRefreshKey]);

  /** Смяна на списък лекари (име/id) без нов GET — поправка на dentistId на вече заредени часове (импорт/realtime). */
  useEffect(() => {
    setAppointments((prev) => {
      let changed = false;
      const next = prev.map((a) => {
        const nid = effectiveDentistId(a, dentists);
        const cur = String(a.dentistId ?? '').trim();
        if (nid === cur) return a;
        changed = true;
        return { ...a, dentistId: nid };
      });
      return changed ? next : prev;
    });
  }, [dentists]);

  const myDentistId = permissions.myDentistId;
  const notificationUserKey = user?.id || user?.email || (myDentistId ? `dentist:${myDentistId}` : 'staff');

  useEffect(() => { doctorInboxMsgsRef.current = doctorInboxMessages; }, [doctorInboxMessages]);

  const unreadChatCount = myDentistId
    ? countUnreadForDentist(doctorInboxMessages, myDentistId)
    : countUnreadForStaff(staffDmMessages);
  const scheduleBellUnread = scheduleNotifications.length > 0 && !scheduleNotificationsSeen;
  const inboxBellCount = scheduleBellUnread ? scheduleNotifications.length : 0;
  const showInboxBellBadge = scheduleBellUnread;

  const fetchDoctorInbox = useCallback(async () => {
    if (!supabase || !myDentistId) return;
    const esc = String(myDentistId);
    const { data, error } = await supabase
      .from('admin_doctor_messages')
      .select('*')
      .or(`to_dentist_id.eq.${esc},from_dentist_id.eq.${esc}`)
      .order('created_at', { ascending: true })
      .limit(500);
    if (!error && data) setDoctorInboxMessages(data);
  }, [supabase, myDentistId]);

  const fetchStaffDmMessages = useCallback(async () => {
    if (!supabase) return;
    const S = STAFF_DM_INBOX_DENTIST_ID;
    const { data, error } = await supabase
      .from('admin_doctor_messages')
      .select('*')
      .or(`to_dentist_id.eq.${S},and(from_dentist_id.is.null,to_dentist_id.neq.${S})`)
      .order('created_at', { ascending: true })
      .limit(800);
    if (!error && data) setStaffDmMessages(data);
  }, [supabase]);

  const markDmThreadRead = useCallback(
    async (threadId) => {
      if (!supabase || !threadId) return;
      const nowIso = new Date().toISOString();
      if (myDentistId) {
        const { error } = await supabase
          .from('admin_doctor_messages')
          .update({ read_at: nowIso })
          .eq('thread_id', threadId)
          .eq('to_dentist_id', myDentistId)
          .is('read_at', null);
        if (!error) {
          setDoctorInboxMessages((prev) =>
            prev.map((m) =>
              m.thread_id === threadId && m.to_dentist_id === myDentistId && !m.read_at
                ? { ...m, read_at: nowIso }
                : m
            )
          );
        }
      } else if (!myDentistId && (permissions.canBookAnyDentist || adminSession)) {
        const { error } = await supabase
          .from('admin_doctor_messages')
          .update({ read_at: nowIso })
          .eq('thread_id', threadId)
          .eq('to_dentist_id', STAFF_DM_INBOX_DENTIST_ID)
          .not('from_dentist_id', 'is', null)
          .is('read_at', null);
        if (!error) {
          setStaffDmMessages((prev) =>
            prev.map((m) =>
              m.thread_id === threadId &&
              m.to_dentist_id === STAFF_DM_INBOX_DENTIST_ID &&
              m.from_dentist_id &&
              !m.read_at
                ? { ...m, read_at: nowIso }
                : m
            )
          );
        }
      }
    },
    [supabase, myDentistId, permissions.canBookAnyDentist, adminSession]
  );

  const deleteChatMessage = useCallback(
    async (messageId) => {
      if (!supabase || !messageId) return;
      const { error } = await supabase.from('admin_doctor_messages').delete().eq('id', messageId);
      if (error) { console.error('Failed to delete message:', error); return; }
      setDoctorInboxMessages((prev) => prev.filter((m) => m.id !== messageId));
      setStaffDmMessages((prev) => prev.filter((m) => m.id !== messageId));
    },
    [supabase]
  );

  const editChatMessage = useCallback(
    async (messageId, newBody) => {
      if (!supabase || !messageId || !String(newBody || '').trim()) return;
      const { error } = await supabase
        .from('admin_doctor_messages')
        .update({ body: String(newBody).trim() })
        .eq('id', messageId);
      if (error) { console.error('Failed to edit message:', error); return; }
      const updater = (prev) => prev.map((m) => m.id === messageId ? { ...m, body: String(newBody).trim() } : m);
      setDoctorInboxMessages(updater);
      setStaffDmMessages(updater);
    },
    [supabase]
  );

  const deleteChatThread = useCallback(
    async (threadId) => {
      if (!supabase || !threadId) return;
      const { error } = await supabase.from('admin_doctor_messages').delete().eq('thread_id', threadId);
      if (error) { console.error('Failed to delete thread:', error); return; }
      setDoctorInboxMessages((prev) => prev.filter((m) => m.thread_id !== threadId));
      setStaffDmMessages((prev) => prev.filter((m) => m.thread_id !== threadId));
    },
    [supabase]
  );

  useEffect(() => {
    if (!supabase || adminSession || !isAuthenticated || !myDentistId) return;
    fetchDoctorInbox();
  }, [supabase, adminSession, isAuthenticated, myDentistId, fetchDoctorInbox]);

  useEffect(() => {
    if (!supabase || !isAuthenticated || myDentistId) return;
    if (!adminSession && !permissions.canBookAnyDentist) return;
    fetchStaffDmMessages();
  }, [
    supabase,
    adminSession,
    isAuthenticated,
    myDentistId,
    permissions.canBookAnyDentist,
    fetchStaffDmMessages,
  ]);

  useEffect(() => {
    if (!supabase || adminSession || !isAuthenticated || !myDentistId) return;
    const id = String(myDentistId);
    const merge = (row) => {
      if (!row?.id) return;
      if (row.to_dentist_id !== id && String(row.from_dentist_id ?? '') !== id) return;
      setDoctorInboxMessages((prev) => {
        if (prev.some((x) => x.id === row.id)) return prev;
        return [...prev, row].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      });
    };
    const ch = supabase
      .channel(`admin-doctor-msgs-${notificationUserKey}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_doctor_messages', filter: `to_dentist_id=eq.${id}` },
        (payload) => merge(payload?.new)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_doctor_messages', filter: `from_dentist_id=eq.${id}` },
        (payload) => merge(payload?.new)
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [supabase, adminSession, isAuthenticated, myDentistId, notificationUserKey]);

  useEffect(() => {
    if (!supabase || !isAuthenticated || myDentistId) return;
    if (!adminSession && !permissions.canBookAnyDentist) return;
    const S = STAFF_DM_INBOX_DENTIST_ID;
    const ch = supabase
      .channel(`staff-dm-${notificationUserKey}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_doctor_messages' },
        (payload) => {
          const row = payload?.new;
          if (!row?.id) return;
          const forStaff =
            row.to_dentist_id === S || (!row.from_dentist_id && row.to_dentist_id && row.to_dentist_id !== S);
          if (!forStaff) return;
          setStaffDmMessages((prev) => {
            if (prev.some((x) => x.id === row.id)) return prev;
            return [...prev, row].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'admin_doctor_messages' },
        (payload) => {
          const id = payload?.old?.id;
          if (id) setStaffDmMessages((prev) => prev.filter((m) => m.id !== id));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'admin_doctor_messages' },
        (payload) => {
          const row = payload?.new;
          if (!row?.id) return;
          setStaffDmMessages((prev) => prev.map((m) => m.id === row.id ? { ...m, ...row } : m));
        }
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [supabase, adminSession, isAuthenticated, myDentistId, notificationUserKey, permissions.canBookAnyDentist]);

  const sendAdminDoctorMessage = useCallback(
    async ({ toDentistId, body: text }) => {
      if (!supabase) throw new Error('Supabase не е конфигуриран');
      const thread_id = crypto.randomUUID();
      const from_label = adminSession
        ? 'Админ'
        : (profile?.full_name || user?.email?.split('@')[0] || user?.email || 'Регистратура');
      const rowPayload = {
        thread_id,
        to_dentist_id: toDentistId,
        body: text,
        from_label,
        from_dentist_id: null,
      };
      const { data, error } = await supabase.from('admin_doctor_messages').insert(rowPayload).select('*').maybeSingle();
      if (error) throw new Error(error.message || String(error));
      if (data) {
        setStaffDmMessages((prev) => {
          if (prev.some((x) => x.id === data.id)) return prev;
          return [...prev, data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        });
      }
    },
    [supabase, adminSession, profile, user, permissions.myDentistId, permissions.canBookAnyDentist]
  );

  const sendDoctorMessage = useCallback(
    async ({ toDentistId, body: text }) => {
      if (!supabase || !myDentistId) throw new Error('Supabase не е конфигуриран');
      const thread_id = crypto.randomUUID();
      const dentistLabel =
        dentistsRef.current?.find((d) => String(d.id) === String(myDentistId))?.name?.trim?.() ||
        profile?.full_name ||
        '';
      const row = {
        thread_id,
        to_dentist_id: toDentistId,
        from_dentist_id: myDentistId,
        body: String(text || '').trim(),
        from_label: dentistLabel || null,
      };
      const { data, error } = await supabase
        .from('admin_doctor_messages')
        .insert(row)
        .select('*')
        .maybeSingle();
      if (error) throw new Error(error.message || String(error));
      if (data) {
        setDoctorInboxMessages((prev) => {
          if (prev.some((x) => x.id === data.id)) return prev;
          return [...prev, data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        });
      }
    },
    [supabase, myDentistId, profile]
  );

  const replyToDmThread = useCallback(
    async ({ threadId, body: text }) => {
      if (!supabase) throw new Error('Supabase не е конфигуриран');
      const trimmed = String(text ?? '').trim();
      if (!trimmed || !threadId) return;

      const from_label_staff = adminSession
        ? 'Админ'
        : (profile?.full_name || user?.email?.split('@')[0] || user?.email || 'Регистратура');

      if (myDentistId && !adminSession) {
        const dentistLabel =
          dentistsRef.current?.find((d) => String(d.id) === String(myDentistId))?.name?.trim?.() ||
          profile?.full_name ||
          '';
        const threadMsgs = (doctorInboxMsgsRef.current || []).filter((m) => m.thread_id === threadId);
        const toDentistId = getThreadRecipient(threadMsgs, myDentistId);
        const { data, error } = await supabase
          .from('admin_doctor_messages')
          .insert({
            thread_id: threadId,
            to_dentist_id: toDentistId,
            from_dentist_id: myDentistId,
            body: trimmed,
            from_label: dentistLabel || null,
          })
          .select('*')
          .maybeSingle();
        if (error) throw new Error(error.message || String(error));
        if (data) {
          setDoctorInboxMessages((prev) => {
            if (prev.some((x) => x.id === data.id)) return prev;
            return [...prev, data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          });
        }
        return;
      }

      if (!permissions.canBookAnyDentist) {
        throw new Error('Нямате права за отговор.');
      }

      const docId = threadDoctorId(staffDmMessages.filter((m) => m.thread_id === threadId));
      if (!docId) throw new Error('Не е намерен лекар за този разговор.');
      const { data, error } = await supabase
        .from('admin_doctor_messages')
        .insert({
          thread_id: threadId,
          to_dentist_id: docId,
          body: trimmed,
          from_label: from_label_staff,
          from_dentist_id: null,
        })
        .select('*')
        .maybeSingle();
      if (error) throw new Error(error.message || String(error));
      if (data) {
        setStaffDmMessages((prev) => {
          if (prev.some((x) => x.id === data.id)) return prev;
          return [...prev, data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        });
      }
    },
    [
      supabase,
      myDentistId,
      adminSession,
      profile,
      user,
      permissions.canBookAnyDentist,
      staffDmMessages,
    ]
  );

  const formatNotificationText = useCallback((action, details = {}) => {
    const d = typeof details === 'string' ? (() => { try { return JSON.parse(details); } catch { return {}; } })() : (details || {});
    const actor = d.actor_name ?? d.actorName ?? 'Регистратор';
    const patient = d.patientName ?? d.patient_name ?? 'пациент';
    const timeSlot = (d.start ? ` за ${d.start}` : '');
    const oldPatient = d.oldPatientName ?? d.old_patient_name;
    const oldStart = d.oldStart ?? d.old_start;
    const dentistName = d.dentist_name ?? d.dentistName ?? 'лекар';
    const vacationRange = (d.start_date && d.end_date) ? ` от ${d.start_date} до ${d.end_date}` : '';
    const actorOrDentist = (actor && actor !== '—') ? actor : dentistName;
    if (action === 'appointment_created') return `${actor} добави ${patient}${timeSlot}`;
    if (action === 'appointment_deleted') return `${actor} изтри час на ${patient}${timeSlot}`;
    if (action === 'appointment_updated') {
      const oldDate = d.oldDate ?? d.old_date;
      const newDate = d.date;
      const dateChanged = oldDate && newDate && oldDate !== newDate;
      if (dateChanged)
        return `${actor} промени час на ${patient}: от ${oldDate} на ${newDate}${d.start ? ` ${d.start}` : ''}`;
      if (oldStart || (oldPatient && oldPatient !== patient))
        return `${actor} промени час: от ${oldPatient || patient}${oldStart ? ` ${oldStart}` : ''} на ${patient}${d.start ? ` ${d.start}` : ''}`;
      return `${actor} промени час на ${patient}${timeSlot}`;
    }
    if (action === 'appointment_moved') return `${actor} премести час на ${patient}${timeSlot}`;
    if (action === 'vacation_added') return `${actorOrDentist} добави отпуск на ${dentistName}${vacationRange}`;
    if (action === 'vacation_deleted') return `${actorOrDentist} изтри отпуск на ${dentistName}${vacationRange}`;
    return `${actor} – ${action}`;
  }, []);

  useEffect(() => {
    if (!supabase || adminSession || !isAuthenticated) return;
    const storageKey = `schedule_notif_last_open_${notificationUserKey}`;
    const lastOpen = parseInt(localStorage.getItem(storageKey) || '0', 10);
    const actions = ['appointment_created', 'appointment_updated', 'appointment_deleted', 'appointment_moved', 'vacation_added', 'vacation_deleted'];
    supabase
      .from('activity_log')
      .select('id, action, details, created_at')
      .in('action', actions)
      .gt('created_at', lastOpen ? new Date(lastOpen).toISOString() : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        const list = (data || []).filter(() => true);
        const notifs = list.map((e) => {
          const d = e.details;
          return { id: e.id, text: formatNotificationText(e.action, typeof d === 'string' ? (() => { try { return JSON.parse(d); } catch { return {}; } })() : (d || {})), createdAt: new Date(e.created_at).getTime() };
        });
        setScheduleNotifications(notifs);
        if (notifs.length > 0) setScheduleNotificationsSeen(false);
        localStorage.setItem(storageKey, String(Date.now()));
      });
  }, [adminSession, isAuthenticated, formatNotificationText, notificationUserKey]);

  useEffect(() => {
    if (!supabase || adminSession || !isAuthenticated) return;
    const channel = supabase
      .channel(`schedule-activity-${notificationUserKey}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_log' },
        (payload) => {
          const row = payload?.new ?? payload?.record ?? {};
          const action = row.action ?? row.action_type;
          if (!['appointment_created', 'appointment_updated', 'appointment_deleted', 'appointment_moved', 'vacation_added', 'vacation_deleted'].includes(action)) return;
          let d = row.details ?? row.raw?.details ?? {};
          if (typeof d === 'string') { try { d = JSON.parse(d); } catch { d = {}; } }
          if (['vacation_added', 'vacation_deleted'].includes(action)) setVacationsRefreshKey((k) => k + 1);
          /* Часовете се синхронизират през realtime по таблица appointments —
           * пълен refetch тук понякога връща още без новия ред и „изчезва“ локално. */
          const text = formatNotificationText(action, d);
          setScheduleNotifications((prev) => [...prev, { id: row.id || crypto.randomUUID(), text, createdAt: Date.now() }]);
          setScheduleNotificationsSeen(false);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [adminSession, isAuthenticated, formatNotificationText, notificationUserKey]);

  useEffect(() => {
    if (!supabase || !isAuthenticated) return;
    const ch = supabase.channel(`appointments-live-${notificationUserKey}`);
    const hydrateTimers = new Map();

    async function fetchAppointmentRowById(rawId) {
      const idStr = rawId == null ? '' : String(rawId).trim();
      if (!idStr) return;
      const { data, error } = await supabase.from('appointments').select('*').eq('id', idStr).maybeSingle();
      if (error || !data) {
        setAppointmentsRefreshKey((k) => k + 1);
        return;
      }
      mergeUpsert(data);
    }

    function scheduleHydrateAfterPartialRealtime(row) {
      const idStr = row?.id == null ? '' : String(row.id).trim();
      if (!idStr) return;
      const oldT = hydrateTimers.get(idStr);
      if (oldT) window.clearTimeout(oldT);
      const tid = window.setTimeout(() => {
        hydrateTimers.delete(idStr);
        void fetchAppointmentRowById(idStr);
      }, 280);
      hydrateTimers.set(idStr, tid);
    }

    function mergeUpsert(row) {
      if (!row || row.id == null) return;

      let partialIdToHydrate = null;

      setAppointments((prev) => {
        const existing = prev.find((a) => String(a.id) === String(row.id));
        const fromRealtime = rowToAppointment(row, dentistsRef.current);

        if (!fromRealtime) {
          if (existing) return prev;
          partialIdToHydrate = row.id;
          return prev;
        }

        let merged = { ...fromRealtime };
        if (existing) {
          const mid = String(merged.dentistId ?? '').trim();
          const eid = String(existing.dentistId ?? '').trim();
          if (!mid && eid) merged = { ...merged, dentistId: existing.dentistId };

          const mdoc = String(merged._doctorLabel ?? '').trim();
          const edoc = String(existing._doctorLabel ?? '').trim();
          if (!mdoc && edoc) merged = { ...merged, _doctorLabel: existing._doctorLabel };

          if (!merged.date && existing.date) merged = { ...merged, date: existing.date };

          const hasTimes = !!(merged.start && merged.end);
          if (!hasTimes && existing.start && existing.end) {
            merged = {
              ...merged,
              date: merged.date || existing.date,
              start: merged.start || existing.start,
              end: merged.end || existing.end,
            };
          }

          const mname = String(merged.patientName ?? '').trim();
          const ename = String(existing.patientName ?? '').trim();
          if (!mname && ename) merged = { ...merged, patientName: existing.patientName };
        }

        merged = stripAppointmentClientMeta({ ...merged });

        const next = [...prev.filter((a) => String(a.id) !== String(row.id)), merged];
        next.sort(compareAppointmentsByDateTime);
        return next;
      });

      if (partialIdToHydrate != null) {
        scheduleHydrateAfterPartialRealtime({ id: partialIdToHydrate });
      }
    }
    ch
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'appointments' }, (payload) => {
        mergeUpsert(payload.new);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'appointments' }, (payload) => {
        mergeUpsert(payload.new);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'appointments' }, (payload) => {
        const id = payload.old?.id;
        if (id == null) return;
        setAppointments((prev) => prev.filter((a) => String(a.id) !== String(id)));
      })
      .subscribe();
    return () => {
      hydrateTimers.forEach((t) => window.clearTimeout(t));
      hydrateTimers.clear();
      supabase.removeChannel(ch);
    };
  }, [supabase, isAuthenticated, notificationUserKey]);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetchPatients() {
      if (!supabase) return;
      setPatientsLoading(true);
      const { data, error } = await supabase.from('patients').select('*').order('name');
      if (!error && data && data.length >= 0) {
        setPatients(data.map((row) => mapPatientFromRow(row)));
      }
      setPatientsLoading(false);
    }
    fetchPatients();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!supabase || !isAuthenticated) return;
    (async () => {
      const { data } = await supabase.from('clinic_settings').select('key, value');
      if (data?.length) {
        const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
        const start = parseInt(map.working_hours_start, 10);
        const end = parseInt(map.working_hours_end, 10);
        if (!Number.isNaN(start) && !Number.isNaN(end)) {
          const next = { start, end };
          setWorkingHours(next);
          writeWorkingHoursCache(next);
        }
      }
    })();
  }, [supabase, isAuthenticated]);

  const fetchAppointmentTypesAndSpecialties = useCallback(async () => {
    if (!supabase) return;
    let types = null;
    const { data: typesWithSort, error } = await supabase.from('appointment_types').select('*').order('sort_order', { ascending: true }).order('label_bg', { ascending: true });
    if (!error && typesWithSort) {
      types = typesWithSort;
    } else {
      const { data: typesFallback } = await supabase.from('appointment_types').select('*').order('label_bg', { ascending: true });
      if (typesFallback) types = typesFallback;
    }
    if (types) setAppointmentTypes(types);
  }, [supabase]);

  useEffect(() => {
    fetchAppointmentTypesAndSpecialties();
  }, [fetchAppointmentTypesAndSpecialties]);

  useEffect(() => {
    if (adminOpen) fetchAppointmentTypesAndSpecialties();
  }, [adminOpen, fetchAppointmentTypesAndSpecialties]);

  useEffect(() => {
    if (!supabase || !isAuthenticated) return;
    const from = new Date();
    from.setDate(from.getDate() - 30);
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setDate(to.getDate() + 120);
    to.setHours(23, 59, 59, 999);
    const rangeStart = dateKey(from);
    const rangeEnd = dateKey(to);
    (async () => {
      let data = null;
      let error = null;
      ({ data, error } = await supabase
        .from('doctor_available_slots')
        .select('dentist_id, date, slots, location')
        .gte('date', rangeStart)
        .lte('date', rangeEnd));
      if (error) {
        // Backward compatibility if location column/migration is not applied.
        ({ data } = await supabase
          .from('doctor_available_slots')
          .select('dentist_id, date, slots')
          .gte('date', rangeStart)
          .lte('date', rangeEnd));
      }
      if (data) {
        const slotsMap = {};
        const locationMap = {};
        data.forEach((r) => {
          const d = typeof r.date === 'string' ? r.date : dateKey(new Date(r.date));
          const k = `${r.dentist_id}_${d}`;
          slotsMap[k] = new Set(r.slots || []);
          locationMap[k] = r.location || '';
        });
        setDoctorAvailableSlots(slotsMap);
        setDoctorDayLocations(locationMap);
      }
    })().catch(() => {});
  }, [supabase, slotsRefreshKey, isAuthenticated]);

  const addDentist = useCallback(({ name, specialty, color }) => {
    const id = `d-${Date.now()}`;
    setDentists((prev) => [...prev, { id, name, specialty, color }]);
    setSelectedDentistIds((prev) => [...prev, id]);
    logWithActor({ action: ACTIVITY_ACTIONS.DENTIST_ADDED, entity_type: 'dentist', entity_id: id, details: { name } });
  }, [logWithActor]);

  const deleteDentist = useCallback((id) => {
    if (!window.confirm('Премахване на този стоматолог от списъка?')) return;
    setDentists((prev) => prev.filter((d) => d.id !== id));
    setSelectedDentistIds((prev) => prev.filter((x) => x !== id));
    logWithActor({ action: ACTIVITY_ACTIONS.DENTIST_DELETED, entity_type: 'dentist', entity_id: id });
  }, [logWithActor]);

  const updateDentist = useCallback((id, updates) => {
    setDentists((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  }, []);

  // --- Dentist photos ---
  const fetchDentistPhotos = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from('dentist_photos').select('dentist_id, storage_path');
    if (!data) return;
    const map = {};
    for (const row of data) {
      const { data: urlData } = supabase.storage.from('dentist-avatars').getPublicUrl(row.storage_path);
      map[row.dentist_id] = urlData?.publicUrl || null;
    }
    setDentistPhotos(map);
    setDentists((prev) => prev.map((d) => ({ ...d, photoUrl: map[d.id] || null })));
  }, [supabase]);

  const uploadDentistPhoto = useCallback(async (dentistId, file) => {
    if (!supabase || !file) return;
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${dentistId}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('dentist-avatars').upload(path, file, { upsert: true });
    if (upErr) { console.error('Upload photo error:', upErr); return; }
    const { error: dbErr } = await supabase.from('dentist_photos').upsert({ dentist_id: dentistId, storage_path: path, updated_at: new Date().toISOString() }, { onConflict: 'dentist_id' });
    if (dbErr) { console.error('Save photo path error:', dbErr); return; }
    const { data: urlData } = supabase.storage.from('dentist-avatars').getPublicUrl(path);
    const url = urlData?.publicUrl || null;
    setDentistPhotos((prev) => ({ ...prev, [dentistId]: url }));
    setDentists((prev) => prev.map((d) => d.id === dentistId ? { ...d, photoUrl: url } : d));
  }, [supabase]);

  const deleteDentistPhoto = useCallback(async (dentistId) => {
    if (!supabase) return;
    const { data } = await supabase.from('dentist_photos').select('storage_path').eq('dentist_id', dentistId).single();
    if (data?.storage_path) await supabase.storage.from('dentist-avatars').remove([data.storage_path]);
    await supabase.from('dentist_photos').delete().eq('dentist_id', dentistId);
    setDentistPhotos((prev) => { const n = { ...prev }; delete n[dentistId]; return n; });
    setDentists((prev) => prev.map((d) => d.id === dentistId ? { ...d, photoUrl: null } : d));
  }, [supabase]);

  useEffect(() => {
    fetchDentistPhotos();
  }, [fetchDentistPhotos]);

  // Feedback unread count for admin badge
  useEffect(() => {
    if (!supabase || !adminSession) { setFeedbackUnreadCount(0); return; }
    supabase.from('feedback').select('id', { count: 'exact', head: true }).eq('status', 'open')
      .then(({ count }) => setFeedbackUnreadCount(count || 0));
    const ch = supabase.channel('feedback-admin-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedback' }, () => {
        setFeedbackUnreadCount((n) => n + 1);
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [supabase, adminSession]);

  const saveWorkingHours = useCallback(
    async (start, end) => {
      if (!supabase) return;
      await supabase.from('clinic_settings').upsert([{ key: 'working_hours_start', value: String(start) }, { key: 'working_hours_end', value: String(end) }], { onConflict: 'key' });
      const next = { start, end };
      setWorkingHours(next);
      writeWorkingHoursCache(next);
    },
    []
  );

  const addAppointmentType = useCallback(
    async (label_bg) => {
      if (!supabase) return { ok: false, error: 'Supabase не е конфигуриран' };
      const trimmed = (label_bg || '').trim();
      if (!trimmed) return { ok: false, error: 'Въведете име' };
      const exists = appointmentTypes.some((t) => (t.label_bg || '').trim().toLowerCase() === trimmed.toLowerCase());
      if (exists) return { ok: false, error: 'Този вид вече съществува' };
      const key = trimmed;
      const payload = { key, label_bg: trimmed };
      const hasSortOrder = appointmentTypes.length === 0 || appointmentTypes[0]?.sort_order !== undefined;
      if (hasSortOrder) {
        const maxOrder = Math.max(0, ...appointmentTypes.map((t) => t.sort_order ?? 0));
        payload.sort_order = maxOrder + 1;
      }
      const { data, error } = await supabase.from('appointment_types').insert(payload).select().single();
      if (error) {
        const withoutSort = { key, label_bg: trimmed };
        const fallback = await supabase.from('appointment_types').insert(withoutSort).select().single();
        if (fallback.data) {
          setAppointmentTypes((prev) => [...prev, fallback.data].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
          return { ok: true };
        }
        const msg = error.code === '23505' ? 'Този вид вече съществува' : (error.message || 'Грешка при добавяне');
        return { ok: false, error: msg };
      }
      if (data) {
        setAppointmentTypes((prev) => [...prev, data].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
        return { ok: true };
      }
      return { ok: false, error: 'Неизвестна грешка' };
    },
    [appointmentTypes]
  );
  const deleteAppointmentType = useCallback(
    async (id) => {
      if (!supabase) return;
      await supabase.from('appointment_types').delete().eq('id', id);
      setAppointmentTypes((prev) => prev.filter((t) => t.id !== id));
    },
    []
  );
  const reorderAppointmentType = useCallback(
    async (id, direction) => {
      if (!supabase) return;
      const idx = appointmentTypes.findIndex((t) => t.id === id);
      if (idx < 0) return;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= appointmentTypes.length) return;
      const next = [...appointmentTypes];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      let hasError = false;
      for (let i = 0; i < next.length; i++) {
        const { error } = await supabase.from('appointment_types').update({ sort_order: i }).eq('id', next[i].id);
        if (error) {
          hasError = true;
          break;
        }
      }
      if (hasError) {
        await fetchAppointmentTypesAndSpecialties();
        return;
      }
      setAppointmentTypes(next);
    },
    [appointmentTypes, supabase, fetchAppointmentTypesAndSpecialties]
  );

  useEffect(() => {
    if (!supabase) return;
  
    async function fetchVacations() {
      const { data, error } = await supabase
        .from('doctor_vacations')
        .select('*');
  
      if (!error && data) {
        setDoctorVacations(data);
      }
    }
  
    fetchVacations();
  }, [vacationsRefreshKey, isAuthenticated]);

  const addPatient = useCallback(
    async ({ name, phone, notes, address, egn, email, parentPhone }) => {
      const payload = {
        name,
        phone: phone || null,
        notes: notes || null,
        address: address || null,
        egn: egn || null,
        email: email || null,
        parent_phone: parentPhone?.trim() || null,
      };
      if (supabase) {
        const { data, error } = await supabase.from('patients').insert(payload).select().single();
        if (!error && data) {
          setPatients((prev) => [...prev, mapPatientFromRow(data)]);
          logWithActor({ action: ACTIVITY_ACTIONS.PATIENT_ADDED, entity_type: 'patient', entity_id: data.id, details: { name: data.name } });
          // отвори веднага профила с хронологията
          setPatientDetailId(data.id);
        }
      } else {
        const localId = `p-${Date.now()}`;
        setPatients((prev) => [
          ...prev,
          {
            id: localId,
            name,
            phone: phone ?? '',
            notes: notes ?? '',
            address: address ?? '',
            egn: egn ?? '',
            email: email ?? '',
            parentPhone: parentPhone?.trim() ?? '',
            isBlacklisted: false,
            unreliablePatient: false,
            dentistNotes: {},
          },
        ]);
        setPatientDetailId(localId);
      }
    },
    []
  );

  const openVacationForDentist = useCallback((dentistId) => {
    setVacationModal({ open: true, dentistId });
  }, []);

  const addVacation = useCallback(
    async ({ dentistId, start_date, end_date, note }) => {
      if (!supabase) return;
      const dentistName = dentists.find((d) => d.id === dentistId)?.name ?? 'лекар';
      const actorName = adminSession ? 'Админ' : (profile?.full_name || user?.email?.split('@')[0] || user?.email || null);
      const { data, error } = await supabase
        .from('doctor_vacations')
        .insert({ dentist_id: dentistId, start_date, end_date, note })
        .select()
        .single();

      if (!error && data) {
        setDoctorVacations((prev) => [...prev, data]);
        logWithActor({ action: ACTIVITY_ACTIONS.VACATION_ADDED, entity_type: 'vacation', entity_id: data.id, details: { dentist_id: dentistId, dentist_name: dentistName, start_date, end_date, actor_name: actorName } });
      } else if (error) {
        console.error('Failed to add vacation:', error);
      }
    },
    [dentists, adminSession, profile, user]
  );

  const deleteVacation = useCallback(
    async (vacationId) => {
      if (!supabase || !window.confirm('Изтриване на този отпуск?')) return;
      const vac = doctorVacations.find((v) => v.id === vacationId);
      const dentistId = vac?.dentist_id;
      const dentistName = dentists.find((d) => d.id === dentistId)?.name ?? 'лекар';
      const { error } = await supabase
        .from('doctor_vacations')
        .delete()
        .eq('id', vacationId);
      if (!error) {
        setDoctorVacations((prev) => prev.filter((v) => v.id !== vacationId));
        const actorName = adminSession ? 'Админ' : (profile?.full_name || user?.email?.split('@')[0] || user?.email || null);
        logWithActor({ action: ACTIVITY_ACTIONS.VACATION_DELETED, entity_type: 'vacation', entity_id: vacationId, details: { dentist_id: dentistId, dentist_name: dentistName, start_date: vac?.start_date, end_date: vac?.end_date, actor_name: actorName } });
      } else {
        console.error('Failed to delete vacation:', error);
      }
    },
    [dentists, doctorVacations, adminSession, profile, user]
  );

  const updatePatient = useCallback((id, updates) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    if (supabase) {
      const dbPatch = patientUpdatesToDb(updates);
      supabase
        .from('patients')
        .update(dbPatch)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Failed to update patient:', error);
          else logWithActor({ action: ACTIVITY_ACTIONS.PATIENT_UPDATED, entity_type: 'patient', entity_id: id, details: updates });
        });
    }
  }, []);

  const deletePatient = useCallback(
    async (id) => {
      if (!window.confirm('Сигурни ли сте, че искате да изтриете този пациент?')) return;
      if (supabase) {
        const { error } = await supabase.from('patients').delete().eq('id', id);
        if (!error) {
          setPatients((prev) => prev.filter((p) => p.id !== id));
          setPatientDetailId(null);
          logWithActor({ action: ACTIVITY_ACTIONS.PATIENT_DELETED, entity_type: 'patient', entity_id: id });
        } else {
          console.error('Failed to delete patient:', error);
        }
      } else {
        setPatients((prev) => prev.filter((p) => p.id !== id));
        setPatientDetailId(null);
      }
    },
    []
  );

  useEffect(() => {
    if (!patientDetailId || !supabase) {
      setPatientFiles([]);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('patient_files')
        .select('*')
        .eq('patient_id', patientDetailId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setPatientFiles(data.map((f) => ({ ...f, url: getFilePublicUrl(f.storage_path) })));
      } else {
        setPatientFiles([]);
      }
    })();
  }, [patientDetailId]);

  const uploadPatientFile = useCallback(
    async (patientId, file) => {
      if (!supabase || !file) return;
      const ext = (file.name.match(/\.[^.]+$/) || [])[0] || '';
      const storagePath = `${patientId}/${crypto.randomUUID()}${ext}`;
      const { error: uploadError } = await supabase.storage.from('patient-files').upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (uploadError) {
        console.error('Upload failed:', uploadError);
        return;
      }
      const { data: row, error: insertError } = await supabase
        .from('patient_files')
        .insert({ patient_id: patientId, file_name: file.name, storage_path: storagePath, content_type: file.type || null })
        .select()
        .single();
      if (!insertError && row && patientId === patientDetailId) {
        setPatientFiles((prev) => [{ ...row, url: getFilePublicUrl(storagePath) }, ...prev]);
        logWithActor({ action: ACTIVITY_ACTIONS.FILE_UPLOADED, entity_type: 'patient_file', entity_id: row.id, details: { patient_id: patientId, file_name: file.name } });
      }
    },
    [patientDetailId]
  );

  const deletePatientFile = useCallback(
    async (patientId, fileId) => {
      if (!supabase || !window.confirm('Изтриване на този файл?')) return;
      const file = patientFiles.find((f) => f.id === fileId);
      if (file?.storage_path) {
        await supabase.storage.from('patient-files').remove([file.storage_path]);
      }
      const { error } = await supabase.from('patient_files').delete().eq('id', fileId);
      if (!error) {
        setPatientFiles((prev) => prev.filter((f) => f.id !== fileId));
        logWithActor({ action: ACTIVITY_ACTIONS.FILE_DELETED, entity_type: 'patient_file', entity_id: fileId });
      }
    },
    [patientFiles]
  );

  const onDentistToggle = useCallback((id) => {
    const myId = permissions.myDentistId;
    setSelectedDentistIds((prev) => {
      if (myId && id === myId) return prev;
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    });
  }, [permissions.myDentistId]);

  const toggleDentistSchedule = useCallback((dentistId) => {
    if (!dentistId) return;
    const myId = permissions.myDentistId;
    setSelectedDentistIds((prev) => {
      // Когато няма явна селекция, приемаме "всички", за да може toggle да работи интуитивно.
      const base = prev.length > 0 ? prev : dentists.map((d) => d.id);
      if (myId && dentistId === myId) return base;
      const next = base.includes(dentistId) ? base.filter((x) => x !== dentistId) : [...base, dentistId];
      // Не оставяме празен избор в quick access; връщаме към "всички".
      return next.length > 0 ? next : dentists.map((d) => d.id);
    });
  }, [permissions.myDentistId, dentists]);

  const clearDentistScheduleFocus = useCallback(() => {
    const myId = permissions.myDentistId;
    if (myId && !permissions.canBookAnyDentist) {
      setSelectedDentistIds([myId]);
      return;
    }
    setSelectedDentistIds(dentists.map((d) => d.id));
  }, [dentists, permissions.myDentistId, permissions.canBookAnyDentist]);

  const onSlotClick = useCallback((dentistId, slot, bookingDate) => {
    setModal({ open: true, dentistId, slot, bookingDate: bookingDate ?? null });
  }, []);

  const onAppointmentMove = useCallback((appointmentId, { dentistId, start }) => {
    const a = appointments.find((x) => x.id === appointmentId);
    if (!a) return;
    const myDentistId = permissions.myDentistId;
    const canBookAny = permissions.canBookAnyDentist;
    if (myDentistId && !canBookAny) {
      if (a.dentistId !== myDentistId) {
        return;
      }
      if (dentistId !== myDentistId) {
        return;
      }
    }
    setAppointments((prev) => {
      const apr = prev.find((x) => x.id === appointmentId);
      if (!apr) return prev;
      const durationMin = getDurationMinutes(apr.start, apr.end);
      const newEnd = addMinutes(start, durationMin);
      const date = apr.date;
      const updated = { ...apr, dentistId, start, end: newEnd };

      if (supabase) {
        supabase
          .from('appointments')
          .update({
            dentist_id: dentistId,
            start_time: toSupabaseTime(date, start),
            end_time: toSupabaseTime(date, newEnd),
          })
          .eq('id', appointmentId)
          .then(({ error }) => {
            if (error) console.error('Failed to update appointment:', error);
            else logWithActor({ action: ACTIVITY_ACTIONS.APPOINTMENT_MOVED, entity_type: 'appointment', entity_id: appointmentId, details: { dentist_id: dentistId, dentistId, patientName: apr?.patientName, start, date } });
          });
      }

      return prev.map((x) => (x.id === appointmentId ? updated : x));
    });
  }, [permissions, appointments]);

  const onAddAppointment = useCallback(
    async ({
      dentistId,
      patientId,
      patientName: providedName,
      patientPhone: providedPhone,
      start,
      end: endParam,
      type,
      durationMinutes,
      insurance = 'private',
      notes = '',
      location = 'Дружба',
      appointmentDate,
    }) => {
      const date = appointmentDate || dateKey(currentDate);
      const end = endParam || addMinutes(start, durationMinutes ?? 30);
      let resolvedPatient = patientId ? patients.find((p) => p.id === patientId) : null;
      let patientName = ((providedName && providedName.trim()) || resolvedPatient?.name) ?? '';
      const phone = providedPhone?.trim() || resolvedPatient?.phone || null;

      const nameNorm = patientName.trim().toLowerCase();
      if (supabase && patientName && !patientId) {
        const existing = patients.find((p) => (p.name || '').trim().toLowerCase() === nameNorm);
        if (existing) {
          resolvedPatient = existing;
        } else {
          const { data: newPatient, error: insErr } = await supabase
            .from('patients')
            .insert({ name: patientName.trim(), phone, notes: null, address: null, egn: null, email: null })
            .select()
            .single();
          if (!insErr && newPatient) {
            resolvedPatient = mapPatientFromRow(newPatient);
            setPatients((prev) => [...prev, resolvedPatient]);
            logWithActor({ action: ACTIVITY_ACTIONS.PATIENT_ADDED, entity_type: 'patient', entity_id: newPatient.id, details: { name: newPatient.name } });
          }
        }
      }

      if (!patientName.trim()) {
        return { ok: false, error: 'Въведете име на пациент.' };
      }

      const resolvedPatientId = patientId ?? resolvedPatient?.id ?? null;

      const newStartMin = timeStrToMinutes(start);
      const newEndMin = timeStrToMinutes(end);
      const overlapsExisting = appointments.some((a) => {
        if (effectiveDentistId(a, dentists) !== String(dentistId ?? '').trim()) return false;
        if (normalizeYmd(a.date) !== normalizeYmd(date)) return false;
        const aS = timeStrToMinutes(a.start);
        const aE = timeStrToMinutes(a.end);
        return !(newEndMin <= aS || newStartMin >= aE);
      });
      if (overlapsExisting) {
        return {
          ok: false,
          error:
            'Този час се припокрива с вече записан при същия лекар. Изберете друг интервал или обновете страницата.',
        };
      }

      if (!supabase) {
        setAppointments((prev) => [
          ...prev,
          {
            id: `local-${Date.now()}`,
            dentistId,
            patientId: resolvedPatientId,
            patientName,
            date,
            start,
            end,
            type,
            insurance,
            location,
            notes: notes || '',
          },
        ]);
        return { ok: true };
      }

      try {
        const dentistLabel = dentists.find((d) => d.id === dentistId)?.name;
        const payload = {
          patient_name: patientName.trim(),
          dentist_id: dentistId,
          start_time: toSupabaseTime(date, start),
          end_time: toSupabaseTime(date, end),
          status: type,
          insurance,
          location,
          notes: notes?.trim() ? notes.trim() : null,
        };
        if (dentistLabel) payload.doctor = dentistLabel;
        if (resolvedPatientId) payload.patient_id = resolvedPatientId;

        const { data, error } = await insertAppointmentWithFallbacks(supabase, payload);

        if (error) {
          console.error('Failed to create appointment:', error);
          const human = error.message || error.details || error.hint || JSON.stringify(error);
          return { ok: false, error: human };
        }
        let mapped = rowToAppointment(data, dentists);
        if (!mapped && data?.id != null && payload.start_time && payload.end_time) {
          mapped = rowToAppointment(
            {
              ...data,
              start_time: data.start_time ?? payload.start_time,
              end_time: data.end_time ?? payload.end_time,
            },
            dentists
          );
        }
        if (!mapped && data?.id != null) {
          mapped = {
            id: data.id,
            dentistId: String(dentistId ?? '').trim(),
            patientId: resolvedPatientId,
            patientName: patientName.trim(),
            date,
            start,
            end,
            type: type || 'Checkup',
            notes: notes?.trim() ? notes.trim() : '',
            attendance: 'pending',
            insurance,
            location,
            _doctorLabel: dentistLabel ?? (data?.doctor != null ? String(data.doctor).trim() : null),
          };
        }
        if (mapped) {
          if (notes?.trim()) mapped.notes = notes.trim();
          mapped.location = location;
          if (resolvedPatientId) mapped.patientId = resolvedPatientId;
          const formDid = String(dentistId ?? '').trim();
          if (formDid && !String(mapped.dentistId ?? '').trim()) mapped = { ...mapped, dentistId: formDid };
          mapped._preserveUntilFetched = true;
          mapped._preserveAtMs = Date.now();
          setAppointments((prev) => {
            const idStr = String(mapped.id);
            const next = [...prev.filter((a) => String(a.id) !== idStr), mapped];
            next.sort(compareAppointmentsByDateTime);
            return next;
          });
          logWithActor({
            action: ACTIVITY_ACTIONS.APPOINTMENT_CREATED,
            entity_type: 'appointment',
            entity_id: mapped.id,
            details: { date, patientName, dentist_id: mapped.dentistId, dentistId: mapped.dentistId, type, start },
          });
        }
        return { ok: true };
      } catch (err) {
        console.error('Failed to create appointment:', err);
        return { ok: false, error: err?.message || String(err) };
      }
    },
    [currentDate, patients, dentists, appointments]
  );

  const goPrevDay = () => {
    const d = anchorCurrentDateNoon(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const goNextDay = () => {
    const d = anchorCurrentDateNoon(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const goPrevWeek = () => {
    const d = anchorCurrentDateNoon(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const goNextWeek = () => {
    const d = anchorCurrentDateNoon(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  const goToDate = useCallback((date) => {
    const parsed = parseLocalDateInput(date);
    if (parsed) setCurrentDate(parsed);
  }, []);

  const onAppointmentClick = useCallback((appointment) => {
    setEditAppointment(appointment);
  }, []);

  const onUpdateAppointment = useCallback((appointmentId, { date: newDate, dentistId, start, end, patientName, patientId, type, notes, attendance, insurance, location }) => {
    const app = appointments.find((a) => a.id === appointmentId);
    const date = newDate || app?.date;
    if (!date) return;
    setAppointments((prev) =>
      prev.map((a) =>
        a.id !== appointmentId
          ? a
          : {
              ...a,
              date,
              dentistId,
              start,
              end,
              patientName: patientName ?? a.patientName,
              patientId: patientId ?? a.patientId,
              type,
              notes: notes !== undefined ? notes : a.notes,
              attendance: attendance !== undefined ? attendance : a.attendance,
              insurance: insurance !== undefined ? insurance : a.insurance,
              location: location !== undefined ? location : a.location,
            }
      )
    );
    if (supabase) {
      const dentistLabel = dentists.find((d) => d.id === dentistId)?.name;
      const payload = {
        dentist_id: dentistId,
        patient_name: patientName ?? '',
        start_time: toSupabaseTime(date, start),
        end_time: toSupabaseTime(date, end),
        status: type,
      };
      if (dentistLabel) payload.doctor = dentistLabel;
      if (notes !== undefined) payload.notes = notes;
      if (attendance !== undefined) payload.attendance = attendance;
      if (insurance !== undefined) payload.insurance = insurance;
      if (location !== undefined) payload.location = location;
      if (patientId) payload.patient_id = patientId;

      const rollback = () => {
        setAppointments((prev) =>
          prev.map((a) => (a.id !== appointmentId ? a : { ...app }))
        );
      };

      const tryUpdate = (p) =>
        supabase.from('appointments').update(p).eq('id', appointmentId).then(({ error: e }) => {
          if (!e) {
            logWithActor({ action: ACTIVITY_ACTIONS.APPOINTMENT_UPDATED, entity_type: 'appointment', entity_id: appointmentId, details: { dentist_id: dentistId, dentistId, patientName: patientName ?? app?.patientName, date, start, oldPatientName: app?.patientName, oldStart: app?.start, oldDate: app?.date } });
            return;
          }
          const msg = String(e.message || e.details || '');
          const hasDoctor = msg.includes('doctor');
          const hasLocation = msg.includes('location');
          if (hasDoctor || hasLocation) {
            const fallback = { ...p };
            if (hasDoctor) delete fallback.doctor;
            if (hasLocation) delete fallback.location;
            supabase.from('appointments').update(fallback).eq('id', appointmentId).then(({ error: e2 }) => {
              if (!e2) {
                logWithActor({ action: ACTIVITY_ACTIONS.APPOINTMENT_UPDATED, entity_type: 'appointment', entity_id: appointmentId, details: { dentist_id: dentistId, dentistId, patientName: patientName ?? app?.patientName, date, start, oldPatientName: app?.patientName, oldStart: app?.start, oldDate: app?.date } });
              } else {
                console.error('Failed to update appointment (fallback):', e2);
                rollback();
              }
            });
          } else {
            console.error('Failed to update appointment:', e);
            rollback();
          }
        });

      tryUpdate(payload);
    }
    setEditAppointment(null);
  }, [appointments, dentists]);

  const fetchActivityLog = useCallback(async () => {
    if (!supabase) return;
    setActivityLogLoading(true);
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(80);
    if (!error && data) setActivityLog(data);
    else setActivityLog([]);
    setActivityLogLoading(false);
  }, []);

  useEffect(() => {
    if (adminHubOpen) {
      fetchActivityLog();
      fetchAppointmentTypesAndSpecialties();
    }
  }, [adminHubOpen, fetchActivityLog, fetchAppointmentTypesAndSpecialties]);

  const onDeleteAppointment = useCallback((appointmentId) => {
    const app = appointments.find((a) => a.id === appointmentId);
    setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
    if (supabase) {
      supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)
        .then(({ error }) => {
          if (error) console.error('Failed to delete appointment:', error);
          else logWithActor({ action: ACTIVITY_ACTIONS.APPOINTMENT_DELETED, entity_type: 'appointment', entity_id: appointmentId, details: { dentist_id: app?.dentistId, dentistId: app?.dentistId, patientName: app?.patientName, date: app?.date, start: app?.start } });
        });
    }
    setEditAppointment(null);
  }, [appointments]);

  if (!isAuthenticated) {
    return (
      <>
        <LandingAuth
          onAdminClick={() => setShowAdminPassword(true)}
          onStaffClick={() => setAuthModalOpen(true)}
        />
        <AdminPasswordModal
          open={showAdminPassword}
          onClose={() => setShowAdminPassword(false)}
          onSuccess={handleAdminPasswordSuccess}
        />
        <AuthModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          signIn={signIn}
          signUp={signUp}
          resetPassword={resetPassword}
          dentists={dentists}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 py-2.5">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-slate-900 leading-tight">Хаджиев Дент</h1>
              <p className="text-[11px] text-slate-500 leading-none">Запазване на часове</p>
            </div>
          </div>

          {/* Patient search — visible when authenticated */}
          {isAuthenticated && (
            <div className="flex items-center gap-1.5 flex-1 min-w-0 max-w-sm">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-[1] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Търси пациент…"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  autoComplete="off"
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 outline-none"
                />
                {headerPatientHits.length > 0 && (
                  <ul className="absolute left-0 right-0 top-full z-[200] mt-0.5 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl py-1">
                    {headerPatientHits.map((p) => (
                      <li key={p.id}>
                        <button type="button"
                          className="w-full text-left px-3 py-2 text-sm text-slate-800 hover:bg-emerald-50 flex flex-col gap-0.5"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { setPatientDetailId(p.id); setPatientSearch(''); }}>
                          <span className="font-medium">{p.name}</span>
                          {(p.phone || p.parentPhone) && (
                            <span className="text-xs text-slate-500">{p.phone}{p.parentPhone ? ` · ${p.parentPhone}` : ''}</span>
                          )}
                          <span className="flex flex-wrap gap-1">
                            {p.isBlacklisted && <span className="text-[10px] font-semibold uppercase px-1 rounded bg-slate-900 text-white">Черен списък</span>}
                            {p.unreliablePatient && <span className="text-[10px] font-semibold px-1 rounded bg-amber-200 text-amber-900">Нередовен</span>}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {patientSearch.trim().length >= 1 && headerPatientHits.length === 0 && (
                  <div className="absolute left-0 right-0 top-full z-[200] mt-0.5 rounded-xl border border-slate-200 bg-white shadow-xl px-3 py-2.5 text-xs text-slate-500">
                    Няма съвпадения — отвори базата за пълен списък.
                  </div>
                )}
              </div>
              <button type="button" onClick={() => setAddPatientOpen(true)}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-emerald-600 shrink-0" title="Добави пациент">
                <UserPlus className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setPatientDbOpen(true)}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-emerald-600 shrink-0" title="База данни пациенти">
                <Database className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1 min-w-0" />

          {/* Right icon buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {isAuthenticated && supabase && (adminSession || myDentistId || permissions.canBookAnyDentist) && (
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                aria-label="Чат"
                title="Вътрешен чат"
              >
                <MessageCircle className="w-5 h-5" />
                {unreadChatCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-emerald-500 rounded-full">
                    {unreadChatCount > 99 ? '99+' : unreadChatCount}
                  </span>
                )}
              </button>
            )}
            {!adminSession && isAuthenticated && (
              <div ref={scheduleNotificationsRef} className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setScheduleNotificationsOpen((wasOpen) => {
                      const willOpen = !wasOpen;
                      if (willOpen && scheduleNotifications.length > 0) setScheduleNotificationsSeen(true);
                      return willOpen;
                    });
                  }}
                  className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  aria-label="Известия"
                  title="Промени в графика"
                >
                  <Bell className="w-5 h-5" />
                  {showInboxBellBadge && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-slate-900 bg-amber-400 rounded-full">
                      {inboxBellCount > 99 ? '99+' : inboxBellCount}
                    </span>
                  )}
                </button>
                {scheduleNotificationsOpen && (
                  <div className="absolute right-0 top-full mt-1 w-[min(96vw,22rem)] max-h-[min(92vh,32rem)] overflow-hidden bg-white border border-slate-200 rounded-lg shadow-xl z-[9999] flex flex-col">
                    <div className="p-2.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
                      <span className="text-sm font-semibold text-slate-800">Промени в графика</span>
                      {scheduleNotifications.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setScheduleNotifications([]);
                            setScheduleNotificationsSeen(true);
                          }}
                          className="text-xs text-emerald-600 hover:text-emerald-700"
                        >
                          Изчисти
                        </button>
                      )}
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      {scheduleNotifications.length === 0 ? (
                        <p className="p-4 text-sm text-slate-500 text-center">Няма промени по графика</p>
                      ) : (
                        scheduleNotifications.map((n) => (
                          <div key={n.id} className="px-3 py-2 border-b border-slate-200/50 last:border-0 text-sm text-slate-800">
                            {n.text}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {isAuthenticated && supabase && (
              <button
                type="button"
                onClick={() => { setFeedbackOpen(true); setFeedbackUnreadCount(0); }}
                className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                aria-label="Сигнали"
                title="Сигнали и предложения"
              >
                <Bug className="w-5 h-5" />
                {adminSession && feedbackUnreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-rose-500 rounded-full">
                    {feedbackUnreadCount > 99 ? '99+' : feedbackUnreadCount}
                  </span>
                )}
              </button>
            )}
            {supabase && (
              <>
                {permissions.canViewAdmin && (
                  <button
                    type="button"
                    onClick={() => adminSession ? setAdminHubOpen(true) : setShowAdminPassword(true)}
                    className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    aria-label="Админ панел"
                    title="Админ панел"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                  </button>
                )}
              </>
            )}
            {supabase && (
              user ? (
                <button
                  type="button"
                  onClick={handleStaffLogout}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">{profile?.full_name || user.email}</span>
                </button>
              ) : adminSession ? (
                <button
                  type="button"
                  onClick={handleStaffLogout}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Изход (Админ)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  Вход
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
        <main className="flex-1 flex flex-col min-w-0 px-4 pt-3 pb-4 overflow-auto bg-slate-50 min-h-0">
          <CalendarHeader
            currentDate={currentDate}
            onPrevDay={calendarView === 'week' ? goPrevWeek : goPrevDay}
            onNextDay={calendarView === 'week' ? goNextWeek : goNextDay}
            onToday={goToday}
            onDatePick={goToDate}
            nextFree={permissions.canBookAnyDentist ? null : nextFreeSummary}
            dentists={dentists}
            selectedDentistIds={effectiveSelectedDentistIds}
            onDentistToggle={onDentistToggle}
            showDentistBar={dentists.length > 1}
            viewMode={calendarView}
            onViewModeChange={setCalendarView}
          />
          {permissions.canBookAnyDentist && (
            <QuickBookBar
              dentists={filteredDentists}
              findFirstFreeForDate={findFirstFreeForDate}
              findAllFreeSlotsForDate={findAllFreeSlotsForDate}
              onBook={(dentistId, { date, time }) => {
                setModal({ open: true, dentistId, slot: time, bookingDate: date });
                goToDate(date);
              }}
              canUse
              currentDate={currentDate}
            />
          )}
          <div className="mt-4 flex-1 min-h-[480px] flex flex-col min-h-0">
            {!isSupabaseConfigured() && (
              <p className="text-sm text-amber-400/90 mb-2">
                Добавете VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env за запазване в базата.
              </p>
            )}
            {appointmentsError && (
              <p className="text-sm text-amber-400 mb-2">
                Грешка при зареждане: {appointmentsError}
              </p>
            )}
            {appointmentsLoading ? (
              <p className="text-slate-500 py-8">Зареждане на часове...</p>
            ) : (
              <ResourceCalendar
  dentists={filteredDentists}
  appointments={appointments}
  currentDate={currentDate}
  currentDateKey={dateKey(currentDate)}
  patientSearch={patientSearch}
  patients={patients}
  onSlotClick={onSlotClick}
  onAppointmentMove={onAppointmentMove}
  onAppointmentClick={onAppointmentClick}
  doctorVacations={doctorVacations}
  workingHours={workingHours}
  allDentists={dentists}
  selectedDentistIds={effectiveSelectedDentistIds}
  onDentistToggle={onDentistToggle}
  doctorAvailableSlots={doctorAvailableSlots}
  doctorDayLocations={doctorDayLocations}
  onDentistNameClick={(d) => setDentistProfileModal(d)}
  canManageVacation={permissions.canBookAnyDentist || !!permissions.myDentistId}
  appointmentTypes={appointmentTypes}
  viewMode={calendarView}
  onOpenFreeSlotsForDate={(dentistId, dayKey) => {
    const d = dentists.find((x) => x.id === dentistId) || null;
    if (!d || !dayKey) return;
    const [y, m, day] = dayKey.split('-').map(Number);
    setFreeSlotsInitialDentist(d);
    setFreeSlotsInitialDate(new Date(y, m - 1, day));
    setFreeSlotsOpen(true);
  }}
/>
            )}
          </div>
        </main>
      </div>

      <AddAppointmentModal
        open={modal.open}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        dentist={modal.dentistId}
        slot={modal.slot}
        bookingDate={modal.bookingDate}
        dentists={dentists}
        patients={patients}
        onSubmit={onAddAppointment}
        appointmentTypes={appointmentTypes}
        appointments={appointments}
        onOpenPatientProfile={(id) => setPatientDetailId(id)}
      />

      <AddDentistModal
        open={addDentistOpen}
        onClose={() => setAddDentistOpen(false)}
        onAdd={addDentist}
      />

      <AddPatientModal
        open={addPatientOpen}
        onClose={() => setAddPatientOpen(false)}
        onAdd={addPatient}
      />

      <PatientDetailModal
        patient={patients.find((p) => p.id === patientDetailId)}
        open={Boolean(patientDetailId)}
        onClose={() => setPatientDetailId(null)}
        onSave={(updates) => patientDetailId && updatePatient(patientDetailId, updates)}
        onDelete={deletePatient}
        appointments={appointments}
        dentists={dentists}
        patientFiles={patientFiles}
        onUploadFile={uploadPatientFile}
        onDeleteFile={deletePatientFile}
        canUseFiles={Boolean(supabase)}
        appointmentTypes={appointmentTypes}
      />

      <ChatPage
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={myDentistId ? doctorInboxMessages : staffDmMessages}
        perspective={myDentistId ? 'dentist' : 'staff'}
        myDentistId={myDentistId}
        dentists={dentists}
        isAdmin={!!adminSession}
        onSendReply={replyToDmThread}
        onStartConversation={myDentistId ? sendDoctorMessage : sendAdminDoctorMessage}
        onMarkThreadRead={markDmThreadRead}
        onDeleteMessage={deleteChatMessage}
        onEditMessage={editChatMessage}
        onDeleteThread={deleteChatThread}
      />
      <PatientDatabaseModal
        open={patientDbOpen}
        onClose={() => setPatientDbOpen(false)}
        patients={patients}
        appointments={appointments}
        appointmentTypes={appointmentTypes}
        onOpenPatient={(id) => {
          setPatientDbOpen(false);
          setPatientDetailId(id);
        }}
      />

      <EditAppointmentModal
        open={Boolean(editAppointment)}
        onClose={() => setEditAppointment(null)}
        appointment={editAppointment}
        dentists={dentists}
        patients={patients}
        onSave={onUpdateAppointment}
        onDelete={onDeleteAppointment}
        workingHours={workingHours}
        appointmentTypes={appointmentTypes}
        appointments={appointments}
        onOpenPatientProfile={(id) => setPatientDetailId(id)}
        canChangeDentist={permissions.canBookAnyDentist}
      />

      <AddVacationModal
        key={vacationModal.dentistId ?? 'closed'}
        open={vacationModal.open}
        onClose={() => setVacationModal({ open: false, dentistId: null })}
        dentist={dentists.find((d) => d.id === vacationModal.dentistId)}
        vacations={doctorVacations.filter((v) => v.dentist_id === vacationModal.dentistId)}
        onSubmit={addVacation}
        onDeleteVacation={deleteVacation}
      />

      <AdminPasswordModal
        open={showAdminPassword}
        onClose={() => setShowAdminPassword(false)}
        onSuccess={handleAdminPasswordSuccess}
      />
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        signIn={signIn}
        signUp={signUp}
        resetPassword={resetPassword}
        dentists={dentists}
      />
      <ResetPasswordModal
        open={needsPasswordReset}
        onClose={dismissPasswordReset}
        onUpdate={updatePassword}
      />

      <FreeSlotsModal
        open={freeSlotsOpen}
        onClose={() => { setFreeSlotsOpen(false); setFreeSlotsInitialDentist(null); setFreeSlotsInitialDate(null); }}
        dentist={freeSlotsInitialDentist}
        dentists={filteredDentists}
        date={freeSlotsInitialDate || currentDate}
        workingHours={workingHours}
        onSave={refreshDoctorSlots}
        supabase={supabase}
        doctorVacations={doctorVacations}
      />

      <DentistProfileModal
        open={Boolean(dentistProfileModal)}
        onClose={() => setDentistProfileModal(null)}
        dentist={typeof dentistProfileModal === 'object' ? dentistProfileModal : dentists.find((d) => d.id === dentistProfileModal)}
        onOpenVacation={(id) => { setDentistProfileModal(null); openVacationForDentist(id); }}
        onOpenFreeSlots={(d) => {
          setDentistProfileModal(null);
          setFreeSlotsInitialDentist(d);
          setFreeSlotsInitialDate(currentDate);
          setFreeSlotsOpen(true);
        }}
        onOpenDayLocation={(d) => {
          setDentistProfileModal(null);
          setDayLocationModal({ open: true, dentist: d });
        }}
        canManageVacation={permissions.canBookAnyDentist || !!permissions.myDentistId}
        canManageFreeSlots
        canManageDayLocation
        canUploadPhoto={
          adminSession ||
          (myDentistId && (typeof dentistProfileModal === 'object' ? dentistProfileModal?.id : dentistProfileModal) === myDentistId)
        }
        onUploadPhoto={uploadDentistPhoto}
        onDeletePhoto={deleteDentistPhoto}
      />
      <DoctorDayLocationModal
        open={dayLocationModal.open}
        onClose={() => setDayLocationModal({ open: false, dentist: null })}
        dentist={dayLocationModal.dentist}
        initialDate={currentDate}
        initialLocation={dayLocationModal.dentist ? (doctorDayLocations[`${dayLocationModal.dentist.id}_${dateKey(currentDate)}`] || 'Дружба') : 'Дружба'}
        onSave={saveDoctorDayLocation}
      />

      <AdminPanel
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        activityLog={activityLog}
        loading={activityLogLoading}
        onRefresh={fetchActivityLog}
        stats={adminStats}
        supabase={supabase}
        workingHours={workingHours}
        onSaveWorkingHours={saveWorkingHours}
        appointmentTypes={appointmentTypes}
        onClearActivityLog={async () => {
          if (supabase) {
            const { error } = await supabase.from('activity_log').delete().gte('created_at', '1970-01-01');
            if (!error) setActivityLog([]);
          } else {
            setActivityLog([]);
          }
        }}
        onAddAppointmentType={addAppointmentType}
        onDeleteAppointmentType={deleteAppointmentType}
        onReorderAppointmentType={reorderAppointmentType}
        dentists={dentists}
        patients={patients}
        appointments={appointments}
        onOpenAddDentist={() => setAddDentistOpen(true)}
        onDeleteDentist={deleteDentist}
        getAdminPin={getAdminPin}
      />

      <AdminHubPage
        open={adminHubOpen}
        onClose={() => setAdminHubOpen(false)}
        supabase={supabase}
        activityLog={activityLog}
        activityLogLoading={activityLogLoading}
        onRefreshActivityLog={fetchActivityLog}
        onClearActivityLog={async () => {
          if (supabase) {
            const { error } = await supabase.from('activity_log').delete().gte('created_at', '1970-01-01');
            if (!error) setActivityLog([]);
          } else {
            setActivityLog([]);
          }
        }}
        stats={adminStats}
        appointments={appointments}
        dentists={dentists}
        patients={patients}
        workingHours={workingHours}
        onSaveWorkingHours={saveWorkingHours}
        appointmentTypes={appointmentTypes}
        onAddAppointmentType={addAppointmentType}
        onDeleteAppointmentType={deleteAppointmentType}
        onReorderAppointmentType={reorderAppointmentType}
        onOpenAddDentist={() => setAddDentistOpen(true)}
        onDeleteDentist={deleteDentist}
        onUploadDentistPhoto={uploadDentistPhoto}
        onDeleteDentistPhoto={deleteDentistPhoto}
        getAdminPin={getAdminPin}
      />

      <FeedbackPage
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        supabase={supabase}
        fromLabel={adminSession ? 'Админ' : (profile?.full_name || user?.email || myDentistId ? dentists.find((d) => d.id === myDentistId)?.name : null)}
        fromDentistId={myDentistId || (adminSession ? '__admin__' : null)}
        isAdmin={adminSession}
      />
    </div>
  );
}
