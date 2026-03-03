import { useState, useCallback, useEffect, useRef } from 'react';
import { Activity, LogIn, LogOut } from 'lucide-react';
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
  const [modal, setModal] = useState({ open: false, dentistId: null, slot: null });
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
  const [slotsRefreshKey, setSlotsRefreshKey] = useState(0);
  const [dentistProfileModal, setDentistProfileModal] = useState(null);
  const [freeSlotsInitialDentist, setFreeSlotsInitialDentist] = useState(null);
  const [scheduleNotification, setScheduleNotification] = useState(null);
  const [appointmentsRefreshKey, setAppointmentsRefreshKey] = useState(0);

  const { user, profile, signIn, signUp, signOut, resetPassword, needsPasswordReset, updatePassword, dismissPasswordReset } = useAuth() ?? {};
  const [adminSession, setAdminSessionState] = useState(() => getAdminSession());
  const isAuthenticated = Boolean(user) || adminSession;
  const permissions = adminSession ? { canViewAllDentists: true, canBookAnyDentist: true, canEditDentists: true, canManageProfiles: true, canManageSettings: true, canViewAdmin: true, myDentistId: null } : getPermissions(profile);

  const effectiveSelectedDentistIds = permissions.myDentistId && dentists.some((d) => d.id === permissions.myDentistId)
    ? selectedDentistIds.includes(permissions.myDentistId)
      ? selectedDentistIds
      : [permissions.myDentistId, ...selectedDentistIds.filter((id) => id !== permissions.myDentistId)]
    : selectedDentistIds;

  const dentistViewInitialized = useRef(false);
  useEffect(() => {
    if (permissions.myDentistId && !adminSession && dentists.some((d) => d.id === permissions.myDentistId) && !dentistViewInitialized.current) {
      setSelectedDentistIds([permissions.myDentistId]);
      dentistViewInitialized.current = true;
    }
    if (!permissions.myDentistId) dentistViewInitialized.current = false;
  }, [permissions.myDentistId, adminSession, dentists]);

  const refreshDoctorSlots = useCallback(() => setSlotsRefreshKey((k) => k + 1), []);

  const logWithActor = useCallback(
    (payload) => {
      const actorName = adminSession ? 'Админ' : (profile?.full_name || user?.email?.split('@')[0] || user?.email || '—');
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

  const filteredDentists = dentists.filter((d) => effectiveSelectedDentistIds.includes(d.id));
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
        setAppointmentsError(err?.message || 'Грешка при зареждане');
        setAppointments([]);
      }
      setAppointmentsLoading(false);
    }
    fetchAppointments();
  }, [isAuthenticated, appointmentsRefreshKey]);

  const myDentistId = permissions.myDentistId;
  useEffect(() => {
    if (!supabase || !myDentistId || adminSession || !isAuthenticated) return;
    const channel = supabase
      .channel(`dentist-schedule-${myDentistId}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'appointments', filter: `dentist_id=eq.${myDentistId}` },
        () => {
          setAppointmentsRefreshKey((k) => k + 1);
          setScheduleNotification('Нов час е записан в графика ви');
          setTimeout(() => setScheduleNotification(null), 5000);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'appointments', filter: `dentist_id=eq.${myDentistId}` },
        () => {
          setAppointmentsRefreshKey((k) => k + 1);
          setScheduleNotification('Часът е променен в графика ви');
          setTimeout(() => setScheduleNotification(null), 5000);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'appointments' },
        (payload) => {
          const oldDentId = payload.old?.dentist_id;
          if (oldDentId !== myDentistId) return;
          setAppointmentsRefreshKey((k) => k + 1);
          setScheduleNotification('Часът е изтрит от графика ви');
          setTimeout(() => setScheduleNotification(null), 5000);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') console.warn('Realtime subscription error – проверете дали appointments е в supabase_realtime publication');
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminSession, myDentistId, isAuthenticated]);

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
    (async () => {
      const { data } = await supabase
        .from('doctor_available_slots')
        .select('dentist_id, slots')
        .eq('date', dateStr);
      if (data) {
        const map = {};
        data.forEach((r) => { map[`${r.dentist_id}_${dateStr}`] = new Set(r.slots || []); });
        setDoctorAvailableSlots(map);
      }
    })().catch(() => {});
  }, [currentDate, supabase, slotsRefreshKey]);

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
  }, []);

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
      const { data, error } = await supabase
        .from('doctor_vacations')
        .insert({ dentist_id: dentistId, start_date, end_date, note })
        .select()
        .single();

      if (!error && data) {
        setDoctorVacations((prev) => [...prev, data]);
        logWithActor({ action: ACTIVITY_ACTIONS.VACATION_ADDED, entity_type: 'vacation', entity_id: data.id, details: { dentist_id: dentistId, start_date, end_date } });
      } else if (error) {
        console.error('Failed to add vacation:', error);
      }
    },
    []
  );

  const deleteVacation = useCallback(
    async (vacationId) => {
      if (!supabase || !window.confirm('Изтриване на този отпуск?')) return;
      const { error } = await supabase
        .from('doctor_vacations')
        .delete()
        .eq('id', vacationId);
      if (!error) {
        setDoctorVacations((prev) => prev.filter((v) => v.id !== vacationId));
        logWithActor({ action: ACTIVITY_ACTIONS.VACATION_DELETED, entity_type: 'vacation', entity_id: vacationId });
      } else {
        console.error('Failed to delete vacation:', error);
      }
    },
    []
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

  const onSlotClick = useCallback((dentistId, slot) => {
    setModal({ open: true, dentistId, slot });
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
            else logWithActor({ action: ACTIVITY_ACTIONS.APPOINTMENT_MOVED, entity_type: 'appointment', entity_id: appointmentId, details: { dentistId, start, date } });
          });
      }

      return prev.map((x) => (x.id === appointmentId ? updated : x));
    });
  }, [permissions, appointments]);

  const onAddAppointment = useCallback(
    async ({ dentistId, patientId, patientName: providedName, patientPhone: providedPhone, start, end: endParam, type, durationMinutes, insurance = 'private', notes = '' }) => {
      const date = dateKey(currentDate);
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
        };
        payload.notes = notes?.trim() || null;
        const { data, error } = await supabase
          .from('appointments')
          .insert(payload)
          .select()
          .single();

        if (error) {
          console.error('Failed to create appointment:', error);
          return;
        }
        const mapped = rowToAppointment(data);
        if (mapped) {
          if (notes?.trim()) mapped.notes = notes.trim();
          setAppointments((prev) => [...prev, mapped]);
          logWithActor({ action: ACTIVITY_ACTIONS.APPOINTMENT_CREATED, entity_type: 'appointment', entity_id: mapped.id, details: { date, patientName, dentistId, type } });
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

  const goToday = () => setCurrentDate(new Date());

  const goToDate = useCallback((date) => {
    if (date) setCurrentDate(new Date(date));
  }, []);

  const onAppointmentClick = useCallback((appointment) => {
    setEditAppointment(appointment);
  }, []);

  const onUpdateAppointment = useCallback((appointmentId, { dentistId, start, end, patientName, patientId, type, notes, attendance, insurance }) => {
    const app = appointments.find((a) => a.id === appointmentId);
    const date = app?.date;
    if (!date) return;
    setAppointments((prev) =>
      prev.map((a) =>
        a.id !== appointmentId
          ? a
          : {
              ...a,
              dentistId,
              start,
              end,
              patientName: patientName ?? a.patientName,
              patientId: patientId ?? a.patientId,
              type,
              notes: notes !== undefined ? notes : a.notes,
              attendance: attendance !== undefined ? attendance : a.attendance,
              insurance: insurance !== undefined ? insurance : a.insurance,
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
      supabase
        .from('appointments')
        .update(payload)
        .eq('id', appointmentId)
        .then(({ error }) => {
          if (error) console.error('Failed to update appointment:', error);
          else logWithActor({ action: ACTIVITY_ACTIONS.APPOINTMENT_UPDATED, entity_type: 'appointment', entity_id: appointmentId });
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
    setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
    if (supabase) {
      supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)
        .then(({ error }) => {
          if (error) console.error('Failed to delete appointment:', error);
          else logWithActor({ action: ACTIVITY_ACTIONS.APPOINTMENT_DELETED, entity_type: 'appointment', entity_id: appointmentId });
        });
    }
    setEditAppointment(null);
  }, []);

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
          dentists={dentists}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
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
              <h1 className="text-lg font-bold text-white">Хаджиев Дент</h1>
              <p className="text-xs text-slate-400">Запазване на часове</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {supabase && (
              <>
                {permissions.canViewAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white text-sm"
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
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">{profile?.full_name || user.email}</span>
                </button>
              ) : adminSession ? (
                <button
                  type="button"
                  onClick={handleStaffLogout}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Изход (Админ)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  Вход
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-black">
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
  showDentistsFilter={!!permissions.myDentistId}
/>

        <main className="flex-1 flex flex-col min-w-0 p-4 md:p-6 overflow-auto bg-black overscroll-contain" style={{ overscrollBehavior: 'contain' }}>
          <CalendarHeader
            currentDate={currentDate}
            onPrevDay={goPrevDay}
            onNextDay={goNextDay}
            onToday={goToday}
            onDatePick={goToDate}
            nextFree={permissions.canBookAnyDentist ? null : nextFreeSummary}
            dentists={dentists}
            selectedDentistIds={effectiveSelectedDentistIds}
            onDentistToggle={onDentistToggle}
            showDentistBar={dentists.length > 1}
          />
          {permissions.canBookAnyDentist && (
            <QuickBookBar
              dentists={filteredDentists}
              findFirstFreeForDate={findFirstFreeForDate}
              findAllFreeSlotsForDate={findAllFreeSlotsForDate}
              onBook={(dentistId, { date, time }) => {
                setModal({ open: true, dentistId, slot: time });
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
              <p className="text-slate-400 py-8">Зареждане на часове...</p>
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
  onDentistNameClick={(d) => setDentistProfileModal(d)}
  canManageVacation={permissions.canBookAnyDentist || !!permissions.myDentistId}
  appointmentTypes={appointmentTypes}
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
        onClose={() => { setFreeSlotsOpen(false); setFreeSlotsInitialDentist(null); }}
        dentist={freeSlotsInitialDentist}
        dentists={filteredDentists}
        date={currentDate}
        workingHours={workingHours}
        onSave={refreshDoctorSlots}
        supabase={supabase}
      />

      <DentistProfileModal
        open={Boolean(dentistProfileModal)}
        onClose={() => setDentistProfileModal(null)}
        dentist={typeof dentistProfileModal === 'object' ? dentistProfileModal : dentists.find((d) => d.id === dentistProfileModal)}
        onOpenVacation={(id) => { setDentistProfileModal(null); openVacationForDentist(id); }}
        onOpenFreeSlots={(d) => { setDentistProfileModal(null); setFreeSlotsInitialDentist(d); setFreeSlotsOpen(true); }}
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
        getAdminPin={getAdminPin}
      />
      {scheduleNotification && (
        <div
          role="alert"
          className="fixed bottom-4 right-4 z-[9999] px-4 py-3 rounded-lg bg-emerald-600 text-white shadow-lg border border-emerald-500/50 flex items-center gap-2"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">{scheduleNotification}</span>
        </div>
      )}
    </div>
  );
}
