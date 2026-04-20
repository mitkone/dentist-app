import { useState, useCallback, useEffect, useRef } from 'react';
import { Activity, Bell, LogIn, LogOut } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { dentists as initialDentists, initialPatients, getSlots } from './data/mockData';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { rowToAppointment, toSupabaseTime } from './lib/appointments';
import { logActivity, ACTIVITY_ACTIONS } from './lib/activityLog';
import Sidebar from './components/Sidebar';
import CalendarHeader from './components/CalendarHeader';
import DentistBar from './components/DentistBar';
import ResourceCalendar from './components/ResourceCalendar';
import AddAppointmentModal from './components/AddAppointmentModal';
import AddDentistModal from './components/AddDentistModal';
import AddPatientModal from './components/AddPatientModal';
import PatientDetailModal from './components/PatientDetailModal';
import EditAppointmentModal from './components/EditAppointmentModal';
import AddVacationModal from './components/AddVacationModal';
import AdminPanel from './components/AdminPanel';
import AdminPasswordModal from './components/AdminPasswordModal';
import AuthModal from './components/AuthModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import FreeSlotsModal from './components/FreeSlotsModal';
import DentistProfileModal from './components/DentistProfileModal';
import LandingAuth, { getAdminSession, setAdminSession, getAdminPin } from './components/LandingAuth';
import QuickBookBar from './components/QuickBookBar';
import { getPermissions } from './lib/permissions';

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
  const [editAppointment, setEditAppointment] = useState(null);
  const [doctorVacations, setDoctorVacations] = useState([]);
  const [vacationModal, setVacationModal] = useState({ open: false, dentistId: null });
  const [patientFiles, setPatientFiles] = useState([]);
  const [adminOpen, setAdminOpen] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [activityLog, setActivityLog] = useState([]);
  const [activityLogLoading, setActivityLogLoading] = useState(false);
  const [workingHours, setWorkingHours] = useState({ start: 7, end: 19 });
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [freeSlotsOpen, setFreeSlotsOpen] = useState(false);
  const [doctorAvailableSlots, setDoctorAvailableSlots] = useState({});
  const [doctorDayLocations, setDoctorDayLocations] = useState({});
  const [locationDoctorId, setLocationDoctorId] = useState('');
  const [dayLocationDraft, setDayLocationDraft] = useState('Дружба');
  const [slotsRefreshKey, setSlotsRefreshKey] = useState(0);
  const [dentistProfileModal, setDentistProfileModal] = useState(null);
  const [freeSlotsInitialDentist, setFreeSlotsInitialDentist] = useState(null);
  const [freeSlotsInitialDate, setFreeSlotsInitialDate] = useState(null);
  const [scheduleNotifications, setScheduleNotifications] = useState([]);
  const [scheduleNotificationsOpen, setScheduleNotificationsOpen] = useState(false);
  const [scheduleNotificationsSeen, setScheduleNotificationsSeen] = useState(true);
  const scheduleNotificationsRef = useRef(null);
  const [appointmentsRefreshKey, setAppointmentsRefreshKey] = useState(0);
  const [vacationsRefreshKey, setVacationsRefreshKey] = useState(0);

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

  useEffect(() => {
    const first = filteredDentists[0]?.id || dentists[0]?.id || '';
    if (!first) return;
    setLocationDoctorId((prev) => (prev && dentists.some((d) => d.id === prev) ? prev : first));
  }, [filteredDentists, dentists]);

  useEffect(() => {
    if (!locationDoctorId) return;
    const key = `${locationDoctorId}_${dateKey(currentDate)}`;
    setDayLocationDraft(doctorDayLocations[key] || 'Дружба');
  }, [locationDoctorId, currentDate, doctorDayLocations]);

  const saveDayLocation = useCallback(async () => {
    if (!supabase || !locationDoctorId) return;
    const dKey = dateKey(currentDate);
    const slotKey = `${locationDoctorId}_${dKey}`;
    const existingSlots = doctorAvailableSlots[slotKey] ? Array.from(doctorAvailableSlots[slotKey]) : [];
    let { error } = await supabase
      .from('doctor_available_slots')
      .upsert(
        {
          dentist_id: locationDoctorId,
          date: dKey,
          slots: existingSlots,
          location: dayLocationDraft,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'dentist_id,date' }
      );
    if (error && String(error.message || '').includes('location')) {
      ({ error } = await supabase
        .from('doctor_available_slots')
        .upsert(
          {
            dentist_id: locationDoctorId,
            date: dKey,
            slots: existingSlots,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'dentist_id,date' }
        ));
    }
    if (!error) {
      setDoctorDayLocations((prev) => ({ ...prev, [slotKey]: dayLocationDraft }));
      refreshDoctorSlots();
    }
  }, [supabase, locationDoctorId, dayLocationDraft, currentDate, doctorAvailableSlots, refreshDoctorSlots]);

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
    setAdminOpen(true);
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
        if (availableSet && availableSet.size > 0 && !availableSet.has(slot)) continue;
        const [h, min] = slot.split(':').map(Number);
        const slotDateTime = new Date(y, m - 1, d, h, min);
        if (isToday && slotDateTime < new Date()) continue;

        const slotStartMin = timeStrToMinutes(slot);
        const slotEndMin = slotStartMin + 15;
        const hasOverlap = appointments.some((a) => {
          if (a.dentistId !== dentistId || a.date !== dateStr) return false;
          const aStart = timeStrToMinutes(a.start);
          const aEnd = timeStrToMinutes(a.end);
          return !(aEnd <= slotStartMin || aStart >= slotEndMin);
        });
        if (!hasOverlap) result.push({ date: dateStr, time: slot });
      }
      return result;
    },
    [appointments, doctorVacations, workingHours, doctorAvailableSlots]
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
          if (availableSet && availableSet.size > 0 && !availableSet.has(slot)) continue;
          const [h, m] = slot.split(':').map(Number);
          const slotDateTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
          if (slotDateTime < new Date()) continue;

          const slotStartMin = timeStrToMinutes(slot);
          const slotEndMin = slotStartMin + 15;

          const hasOverlap = appointments.some((a) => {
            if (a.dentistId !== dentistId || a.date !== dateStr) return false;
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
    [appointments, doctorVacations, workingHours, doctorAvailableSlots]
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
  const appointmentsToday = appointments.filter((a) => a.date === todayKeyStr).length;
  const adminStats = {
    appointmentsToday,
    patientsCount: patients.length,
    dentistsCount: dentists.length,
  };

  function getFilePublicUrl(storagePath) {
    if (!supabase) return '';
    const { data } = supabase.storage.from('patient-files').getPublicUrl(storagePath);
    return data?.publicUrl ?? '';
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetchAppointments() {
      setAppointmentsLoading(true);
      setAppointmentsError(null);
      if (!supabase) {
        setAppointments([]);
        setAppointmentsLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .order('start_time', { ascending: true });
        if (error) {
          const msg = error.message || '';
          setAppointmentsError(
            msg.includes('schema cache') || msg.includes('does not exist')
              ? 'Таблицата appointments липсва. Създайте я от Supabase: Dashboard → SQL Editor → поставете скрипта от supabase/migrations/001_appointments.sql'
              : msg
          );
          setAppointments([]);
        } else {
          const list = (data || []).map(rowToAppointment).filter(Boolean);
          setAppointments(list);
        }
      } catch (err) {
        const msg = err?.message || '';
        // На мобилни браузъри понякога заявката се abort-ва при фон/фокус смяна.
        if (err?.name === 'AbortError' || msg.toLowerCase().includes('aborted')) {
          setAppointmentsError(null);
        } else {
          setAppointmentsError(msg || 'Грешка при зареждане');
          setAppointments([]);
        }
      }
      setAppointmentsLoading(false);
    }
    fetchAppointments();
  }, [isAuthenticated, appointmentsRefreshKey]);

  const myDentistId = permissions.myDentistId;

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
    if (!supabase || !myDentistId || adminSession || !isAuthenticated) return;
    const storageKey = `dentist_notif_last_open_${myDentistId}`;
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
  }, [adminSession, myDentistId, isAuthenticated, formatNotificationText]);

  useEffect(() => {
    if (!supabase || !myDentistId || adminSession || !isAuthenticated) return;
    const channel = supabase
      .channel(`dentist-activity-${myDentistId}-${Date.now()}`)
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
          else setAppointmentsRefreshKey((k) => k + 1);
          const text = formatNotificationText(action, d);
          setScheduleNotifications((prev) => [...prev, { id: row.id || crypto.randomUUID(), text, createdAt: Date.now() }]);
          setScheduleNotificationsSeen(false);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [adminSession, myDentistId, isAuthenticated, formatNotificationText]);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetchPatients() {
      if (!supabase) return;
      setPatientsLoading(true);
      const { data, error } = await supabase.from('patients').select('*').order('name');
      if (!error && data && data.length >= 0) {
        setPatients(
          data.map((row) => ({
            id: row.id,
            name: row.name ?? '',
            phone: row.phone ?? '',
            notes: row.notes ?? '',
            address: row.address ?? '',
            egn: row.egn ?? '',
            email: row.email ?? '',
          }))
        );
      }
      setPatientsLoading(false);
    }
    fetchPatients();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data } = await supabase.from('clinic_settings').select('key, value');
      if (data?.length) {
        const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
        const start = parseInt(map.working_hours_start, 10);
        const end = parseInt(map.working_hours_end, 10);
        if (!Number.isNaN(start) && !Number.isNaN(end)) setWorkingHours({ start, end });
      }
    })();
  }, []);

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
    if (!supabase) return;
    const dateStr = dateKey(currentDate);
    const week = getWeekBounds(currentDate);
    const rangeStart = calendarView === 'week' ? week.start : dateStr;
    const rangeEnd = calendarView === 'week' ? week.end : dateStr;
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
  }, [currentDate, supabase, slotsRefreshKey, calendarView]);

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

  const saveWorkingHours = useCallback(
    async (start, end) => {
      if (!supabase) return;
      await supabase.from('clinic_settings').upsert([{ key: 'working_hours_start', value: String(start) }, { key: 'working_hours_end', value: String(end) }], { onConflict: 'key' });
      setWorkingHours({ start, end });
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
  }, [vacationsRefreshKey]);

  const addPatient = useCallback(
    async ({ name, phone, notes, address, egn, email }) => {
      const payload = {
        name,
        phone: phone || null,
        notes: notes || null,
        address: address || null,
        egn: egn || null,
        email: email || null,
      };
      if (supabase) {
        const { data, error } = await supabase.from('patients').insert(payload).select().single();
        if (!error && data) {
          setPatients((prev) => [
            ...prev,
            {
              id: data.id,
              name: data.name,
              phone: data.phone ?? '',
              notes: data.notes ?? '',
              address: data.address ?? '',
              egn: data.egn ?? '',
              email: data.email ?? '',
            },
          ]);
          logWithActor({ action: ACTIVITY_ACTIONS.PATIENT_ADDED, entity_type: 'patient', entity_id: data.id, details: { name: data.name } });
          // отвори веднага профила с хронологията
          setPatientDetailId(data.id);
        }
      } else {
        const localId = `p-${Date.now()}`;
        setPatients((prev) => [
          ...prev,
          { id: localId, name, phone: phone ?? '', notes: notes ?? '', address: address ?? '', egn: egn ?? '', email: email ?? '' },
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
    if (supabase)
      supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Failed to update patient:', error);
          else logWithActor({ action: ACTIVITY_ACTIONS.PATIENT_UPDATED, entity_type: 'patient', entity_id: id, details: updates });
        });
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
    async ({ dentistId, patientId, patientName: providedName, patientPhone: providedPhone, start, end: endParam, type, durationMinutes, insurance = 'private', notes = '', location = 'Дружба', appointmentDate }) => {
      const date = appointmentDate || dateKey(currentDate);
      const end = endParam || addMinutes(start, durationMinutes ?? 30);
      let patient = patientId ? patients.find((p) => p.id === patientId) : null;
      let patientName = ((providedName && providedName.trim()) || patient?.name) ?? '';
      const phone = providedPhone?.trim() || patient?.phone || null;

      // Ако има име но няма избран пациент – създай пациента в БД
      if (supabase && patientName && !patientId) {
        const existing = patients.find((p) => (p.name || '').trim().toLowerCase() === patientName.trim().toLowerCase());
        if (!existing) {
          const { data: newPatient, error: insErr } = await supabase
            .from('patients')
            .insert({ name: patientName.trim(), phone, notes: null, address: null, egn: null, email: null })
            .select()
            .single();
          if (!insErr && newPatient) {
            patient = { id: newPatient.id, name: newPatient.name, phone: newPatient.phone ?? '', notes: '', address: '', egn: '', email: '' };
            setPatients((prev) => [...prev, patient]);
            logWithActor({ action: ACTIVITY_ACTIONS.PATIENT_ADDED, entity_type: 'patient', entity_id: newPatient.id, details: { name: newPatient.name } });
          }
        }
      }

      if (!supabase) {
        setAppointments((prev) => [
          ...prev,
          {
            id: `local-${Date.now()}`,
            dentistId,
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
        return;
      }

      try {
        const payload = {
          patient_name: patientName,
          dentist_id: dentistId,
          start_time: toSupabaseTime(date, start),
          end_time: toSupabaseTime(date, end),
          status: type,
          insurance,
          location,
        };
        payload.notes = notes?.trim() || null;
        let { data, error } = await supabase
          .from('appointments')
          .insert(payload)
          .select()
          .single();
        if (error && String(error.message || '').includes('location')) {
          const payloadLegacy = { ...payload };
          delete payloadLegacy.location;
          ({ data, error } = await supabase.from('appointments').insert(payloadLegacy).select().single());
        }

        if (error) {
          console.error('Failed to create appointment:', error);
          return;
        }
        const mapped = rowToAppointment(data);
        if (mapped) {
          if (notes?.trim()) mapped.notes = notes.trim();
          mapped.location = location;
          setAppointments((prev) => [...prev, mapped]);
          logWithActor({ action: ACTIVITY_ACTIONS.APPOINTMENT_CREATED, entity_type: 'appointment', entity_id: mapped.id, details: { date, patientName, dentist_id: mapped.dentistId, dentistId: mapped.dentistId, type, start } });
        }
      } catch (err) {
        console.error('Failed to create appointment:', err);
      }
    },
    [currentDate, patients]
  );

  const goPrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const goNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const goPrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const goNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  const goToDate = useCallback((date) => {
    if (date) setCurrentDate(new Date(date));
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
      const payload = {
        dentist_id: dentistId,
        patient_name: patientName ?? '',
        start_time: toSupabaseTime(date, start),
        end_time: toSupabaseTime(date, end),
        status: type,
      };
      if (notes !== undefined) payload.notes = notes;
      if (attendance !== undefined) payload.attendance = attendance;
      if (insurance !== undefined) payload.insurance = insurance;
      if (location !== undefined) payload.location = location;
      supabase
        .from('appointments')
        .update(payload)
        .eq('id', appointmentId)
        .then(({ error }) => {
          if (error && String(error.message || '').includes('location')) {
            const payloadLegacy = { ...payload };
            delete payloadLegacy.location;
            supabase.from('appointments').update(payloadLegacy).eq('id', appointmentId);
          } else if (error) {
            console.error('Failed to update appointment:', error);
          } else {
            logWithActor({ action: ACTIVITY_ACTIONS.APPOINTMENT_UPDATED, entity_type: 'appointment', entity_id: appointmentId, details: { dentist_id: dentistId, dentistId, patientName: patientName ?? app?.patientName, date, start, oldPatientName: app?.patientName, oldStart: app?.start, oldDate: app?.date } });
          }
        });
    }
    setEditAppointment(null);
  }, [appointments]);

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
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Хаджиев Дент</h1>
              <p className="text-xs text-slate-500">Запазване на часове</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {permissions.myDentistId && (
              <div ref={scheduleNotificationsRef} className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setScheduleNotificationsOpen((o) => !o);
                    if (scheduleNotifications.length > 0) setScheduleNotificationsSeen(true);
                  }}
                  className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  aria-label="Известия за графика"
                >
                  <Bell className="w-5 h-5" />
                  {scheduleNotifications.length > 0 && !scheduleNotificationsSeen && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-slate-900 bg-emerald-500 rounded-full">
                      {scheduleNotifications.length > 99 ? '99+' : scheduleNotifications.length}
                    </span>
                  )}
                </button>
                {scheduleNotificationsOpen && (
                  <div className="absolute right-0 top-full mt-1 w-72 max-h-64 overflow-y-auto bg-slate-100 border border-slate-200 rounded-lg shadow-xl z-[9999] flex flex-col">
                    <div className="p-2 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800">Промени в графика</span>
                      {scheduleNotifications.length > 0 && (
                        <button
                          type="button"
                          onClick={() => { setScheduleNotifications([]); setScheduleNotificationsSeen(true); }}
                          className="text-xs text-emerald-400 hover:text-emerald-700"
                        >
                          Изчисти
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {scheduleNotifications.length === 0 ? (
                        <p className="p-3 text-sm text-slate-500">Няма нови известия</p>
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
            {supabase && (
              <>
                {permissions.canViewAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 text-sm"
                  >
                    <Activity className="w-4 h-4" />
                    Админ
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

      <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-slate-50">
      <Sidebar
  dentists={dentists}
  selectedDentistIds={effectiveSelectedDentistIds}
  onDentistToggle={onDentistToggle}
  onDeleteDentist={permissions.canEditDentists ? deleteDentist : undefined}
  patientSearch={patientSearch}
  onPatientSearch={setPatientSearch}
  patients={patients}
  onAddDentist={permissions.canEditDentists ? () => setAddDentistOpen(true) : undefined}
  onAddPatient={() => setAddPatientOpen(true)}
  onOpenPatientDetail={setPatientDetailId}
  onOpenVacation={openVacationForDentist}
  showDentistsFilter={false}
  onOpenDentistSchedule={toggleDentistSchedule}
  activeDentistIds={visibleDentistIds}
  onClearDentistSchedule={clearDentistScheduleFocus}
/>

        <main className="flex-1 flex flex-col min-w-0 p-4 md:p-6 overflow-auto bg-slate-50 min-h-0">
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
            doctorsForLocation={filteredDentists.length ? filteredDentists : dentists}
            locationDoctorId={locationDoctorId}
            onLocationDoctorChange={setLocationDoctorId}
            dayLocation={dayLocationDraft}
            onDayLocationChange={setDayLocationDraft}
            onSaveDayLocation={saveDayLocation}
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
        canManageVacation={permissions.canBookAnyDentist || !!permissions.myDentistId}
        canManageFreeSlots
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
        getAdminPin={getAdminPin}
      />
    </div>
  );
}
