import { useEffect, useState } from 'react';
import { X, Activity, Users, Calendar, Stethoscope, CheckCircle, XCircle, Clock, Plus, Trash2, UserCog, ChevronDown, ChevronUp } from 'lucide-react';

const ACTION_LABELS = {
  appointment_created: 'Създаден час',
  appointment_updated: 'Редактиран час',
  appointment_deleted: 'Изтрит час',
  appointment_moved: 'Преместен час',
  vacation_added: 'Добавен отпуск',
  vacation_deleted: 'Изтрит отпуск',
  patient_added: 'Добавен пациент',
  patient_updated: 'Обновен пациент',
  dentist_added: 'Добавен стоматолог',
  dentist_deleted: 'Премахнат стоматолог',
  file_uploaded: 'Качен файл',
  file_deleted: 'Изтрит файл',
};

function formatWhen(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return isoStr;
  const now = new Date();
  const today = now.toDateString() === d.toDateString();
  if (today) {
    return d.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const CHECKS = [
  { key: 'appointments', label: 'Часове', table: 'appointments', column: 'id' },
  { key: 'patients', label: 'Пациенти', table: 'patients', column: 'id' },
  { key: 'doctor_vacations', label: 'Отпуски', table: 'doctor_vacations', column: 'id' },
  { key: 'patient_files', label: 'Файлове', table: 'patient_files', column: 'id' },
  { key: 'activity_log', label: 'Лог', table: 'activity_log', column: 'id' },
  // В clinic_settings нямаме колона id, ползваме key
  { key: 'clinic_settings', label: 'Настройки', table: 'clinic_settings', column: 'key' },
  { key: 'appointment_types', label: 'Типове преглед', table: 'appointment_types', column: 'id' },
];

export default function AdminPanel({
  open,
  onClose,
  activityLog = [],
  loading,
  onRefresh,
  onClearActivityLog,
  stats,
  supabase,
  workingHours = { start: 7, end: 19 },
  onSaveWorkingHours,
  appointmentTypes = [],
  onAddAppointmentType,
  onDeleteAppointmentType,
  onReorderAppointmentType,
  dentists = [],
  patients = [],
  getAdminPin,
}) {
  const [systemCheck, setSystemCheck] = useState(null);
  const [hoursStart, setHoursStart] = useState(workingHours.start);
  const [hoursEnd, setHoursEnd] = useState(workingHours.end);
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [addTypeError, setAddTypeError] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [systemCheckOpen, setSystemCheckOpen] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    setHoursStart(workingHours.start);
    setHoursEnd(workingHours.end);
  }, [workingHours]);

  useEffect(() => {
    if (open && onRefresh) onRefresh();
  }, [open, onRefresh]);

  useEffect(() => {
    if (!open || !supabase) {
      setSystemCheck(null);
      return;
    }
    let cancelled = false;
    setSystemCheck({});
    (async () => {
      const result = {};
      for (const { key, table, column = 'id' } of CHECKS) {
        if (cancelled) return;
        const { error } = await supabase.from(table).select(column).limit(1);
        result[key] = error ? { ok: false, message: error.message } : { ok: true };
      }
      if (!cancelled) setSystemCheck(result);
    })();
    return () => { cancelled = true; };
  }, [open, supabase]);

  useEffect(() => {
    if (!open || !supabase) return;
    supabase.from('profiles').select('id, email, full_name, role, dentist_id, permissions').order('created_at', { ascending: false })
      .then(({ data }) => setProfiles(data || []));
  }, [open, supabase]);

  const updateProfilePermissions = async (profileId, permissions) => {
    if (!supabase) return;
    await supabase.from('profiles').update({ permissions, updated_at: new Date().toISOString() }).eq('id', profileId);
    setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, permissions } : p)));
  };

  const updateProfileRole = async (profileId, role, dentistId = null) => {
    if (!supabase) return;
    const payload = { role, updated_at: new Date().toISOString() };
    if (role === 'dentist') payload.dentist_id = dentistId || null;
    else payload.dentist_id = null;
    const adminPin = typeof getAdminPin === 'function' ? getAdminPin() : null;
    if (adminPin) {
      const { data, error } = await supabase.rpc('admin_update_profile_role', {
        target_id: profileId,
        new_role: role,
        new_dentist_id: role === 'dentist' ? (dentistId || null) : null,
        admin_pin: adminPin,
      });
      if (data?.ok) {
        setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, role, dentist_id: payload.dentist_id } : p)));
      } else if (data?.error) {
        alert(data.error);
      } else if (error) {
        alert(error.message || 'Грешка при промяна');
      }
      return;
    }
    const { error } = await supabase.from('profiles').update(payload).eq('id', profileId);
    if (!error) {
      setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, role, dentist_id: payload.dentist_id } : p)));
    } else {
      alert(error.message || 'Грешка при промяна. Влезте като админ чрез парола.');
    }
  };

  const roleLabel = { admin: 'Админ', dentist: 'Стоматолог', receptionist: 'Регистратор' };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col max-h-screen overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Админ панел
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-b border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setSystemCheckOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-slate-800/50"
          >
            <h3 className="text-sm font-medium text-slate-300">Проверка на системата</h3>
            {systemCheckOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {systemCheckOpen && (
            <div className="px-4 pb-4 pt-0">
              {systemCheck === null ? (
                <p className="text-xs text-slate-500">Проверяваме таблиците...</p>
              ) : (
                <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 text-xs">
                  {CHECKS.map(({ key, label }) => {
                    const r = systemCheck[key];
                    const ok = r?.ok;
                    return (
                      <li key={key} className="flex items-center gap-1.5">
                        {ok ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                        <span className={ok ? 'text-slate-200' : 'text-red-300'}>{label}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-2 p-4 border-b border-slate-800 shrink-0">
            <div className="rounded-lg bg-slate-800 border border-slate-700 p-3 text-center">
              <Calendar className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <span className="text-xl font-bold text-white block">{stats.appointmentsToday}</span>
              <span className="text-xs text-slate-400">Часа днес</span>
            </div>
            <div className="rounded-lg bg-slate-800 border border-slate-700 p-3 text-center">
              <Users className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <span className="text-xl font-bold text-white block">{stats.patientsCount}</span>
              <span className="text-xs text-slate-400">Пациенти</span>
            </div>
            <div className="rounded-lg bg-slate-800 border border-slate-700 p-3 text-center">
              <Stethoscope className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <span className="text-xl font-bold text-white block">{stats.dentistsCount}</span>
              <span className="text-xs text-slate-400">Стоматолози</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scroll-thin min-h-0">
          {onSaveWorkingHours && (
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Работни часове
              </h3>
              <div className="flex gap-2 items-center flex-wrap">
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={hoursStart}
                  onChange={(e) => setHoursStart(Number(e.target.value))}
                  className="w-14 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm"
                />
                <span className="text-slate-400">–</span>
                <input
                  type="number"
                  min={0}
                  max={24}
                  value={hoursEnd}
                  onChange={(e) => setHoursEnd(Number(e.target.value))}
                  className="w-14 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm"
                />
                <span className="text-slate-500 text-xs">час</span>
                <button
                  type="button"
                  onClick={() => onSaveWorkingHours(hoursStart, hoursEnd)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500"
                >
                  Запази
                </button>
              </div>
            </div>
          )}

          {onAddAppointmentType && (
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-medium text-slate-300 mb-2">Видове преглед</h3>
              <p className="text-xs text-slate-500 mb-2">↑↓ за подреждане · въведете име и натиснете +</p>
              <ul className="space-y-1.5 mb-3 max-h-48 overflow-y-auto scroll-thin min-h-[2.5rem]">
                {appointmentTypes.length === 0 && (
                  <li className="py-3 px-3 rounded-lg bg-slate-800/50 text-slate-500 text-sm italic">
                    Няма добавени видове. Добавете първия по-долу.
                  </li>
                )}
                {appointmentTypes.map((t, idx) => (
                  <li key={t.id} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-slate-800 text-sm">
                    {onReorderAppointmentType && (
                      <div className="flex flex-col gap-0 shrink-0" title="Подреди">
                        <button
                          type="button"
                          onClick={() => onReorderAppointmentType(t.id, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Нагоре"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onReorderAppointmentType(t.id, 'down')}
                          disabled={idx === appointmentTypes.length - 1}
                          className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Надолу"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <span className="flex-1 text-slate-200 truncate min-w-0">{t.label_bg}</span>
                    <button type="button" onClick={() => onDeleteAppointmentType(t.id)} className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-700 shrink-0" title="Изтрий">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 flex-wrap items-center border-t border-slate-700 pt-3">
                <input
                  type="text"
                  placeholder="Име (напр. Имплант)"
                  value={newTypeLabel}
                  onChange={(e) => { setNewTypeLabel(e.target.value); setAddTypeError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), document.getElementById('add-type-btn')?.click())}
                  className="flex-1 min-w-[140px] px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 text-xs placeholder-slate-500"
                />
                <button
                  id="add-type-btn"
                  type="button"
                  onClick={async () => {
                    const l = newTypeLabel.trim();
                    setAddTypeError('');
                    if (!l) return;
                    const result = await onAddAppointmentType(l);
                    if (result?.ok) {
                      setNewTypeLabel('');
                    } else if (result?.error) {
                      setAddTypeError(result.error);
                    }
                  }}
                  className="p-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {addTypeError && (
                <p className="text-xs text-red-400 mt-2">{addTypeError}</p>
              )}
            </div>
          )}

          {profiles.length > 0 && (
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <UserCog className="w-4 h-4 text-emerald-400" />
                Регистрирани профили
              </h3>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {profiles.map((p) => (
                  <li key={p.id} className="flex flex-col gap-2 py-2 px-3 rounded-lg bg-slate-800 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-100 font-medium truncate min-w-0">{p.full_name || p.email}</span>
                    </div>
                    <span className="text-xs text-slate-500 truncate">{p.email}</span>
                    <div className="flex flex-wrap gap-2 items-center">
                      <label className="text-xs text-slate-400 shrink-0">Роля:</label>
                      <select
                        value={p.role || 'receptionist'}
                        onChange={(e) => updateProfileRole(p.id, e.target.value)}
                        className="text-sm px-3 py-1.5 bg-slate-700 border border-slate-500 rounded-md text-slate-100 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none cursor-pointer hover:bg-slate-600"
                        title="Промяна на роля"
                      >
                        <option value="admin">Админ</option>
                        <option value="dentist">Стоматолог</option>
                        <option value="receptionist">Регистратор</option>
                      </select>
                      {(p.role || '') === 'dentist' && dentists.length > 0 && (
                        <>
                          <label className="text-xs text-slate-400 shrink-0">Лекар:</label>
                          <select
                            value={p.dentist_id || ''}
                            onChange={(e) => updateProfileRole(p.id, 'dentist', e.target.value || null)}
                            className="text-xs px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:ring-1 focus:ring-emerald-500/40 outline-none flex-1 min-w-0 max-w-[140px]"
                          >
                            <option value="">— Изберете —</option>
                            {dentists.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-0">
                      <label className="inline-flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={!!(p.permissions?.can_book_all ?? (p.role === 'receptionist' || p.role === 'admin'))}
                          onChange={(e) => updateProfilePermissions(p.id, { ...p.permissions, can_book_all: e.target.checked })}
                          className="rounded border-slate-600"
                        />
                        <span>Запис на всички</span>
                      </label>
                      <label className="inline-flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={!!(p.permissions?.can_view_admin ?? (p.role === 'admin'))}
                          onChange={(e) => updateProfilePermissions(p.id, { ...p.permissions, can_view_admin: e.target.checked })}
                          className="rounded border-slate-600"
                        />
                        <span>Вижда админ</span>
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <h3 className="text-sm font-medium text-slate-300">Последни действия</h3>
            {activityLog.length > 0 && onClearActivityLog && (
              <button
                type="button"
                onClick={() => { onClearActivityLog?.(); }}
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800"
              >
                Изчисти
              </button>
            )}
          </div>
          {loading ? (
            <p className="px-4 py-6 text-slate-400 text-sm">Зареждане...</p>
          ) : activityLog.length === 0 ? (
            <p className="px-4 py-6 text-slate-500 text-sm">Няма записани действия</p>
          ) : (
            <ul className="p-4 space-y-2">
              {activityLog.map((entry) => {
                const expanded = expandedLogId === entry.id;
                const details = entry.details || {};
                const dentistName = details.dentistId ? dentists.find((d) => d.id === details.dentistId)?.name : details.dentist_id ? dentists.find((d) => d.id === details.dentist_id)?.name : null;
                const detailLines = [];
                if (details.patientName) detailLines.push({ label: 'Пациент', val: details.patientName });
                if (dentistName || details.dentistId) detailLines.push({ label: 'Лекар', val: dentistName || details.dentistId });
                if (details.date) detailLines.push({ label: 'Дата', val: details.date });
                if (details.start) detailLines.push({ label: 'Час', val: details.start });
                if (details.type) detailLines.push({ label: 'Вид', val: details.type });
                if (details.start_date && details.end_date) detailLines.push({ label: 'Период', val: `${details.start_date} – ${details.end_date}` });
                if (details.file_name) detailLines.push({ label: 'Файл', val: details.file_name });
                if (details.name && !details.patientName) detailLines.push({ label: 'Име', val: details.name });

                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => setExpandedLogId(expanded ? null : entry.id)}
                      className="w-full flex gap-2 py-2 px-3 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-left hover:bg-slate-800 transition-colors"
                    >
                      <span className="text-slate-500 shrink-0 text-xs mt-0.5">{formatWhen(entry.created_at)}</span>
                      <span className="flex-1 text-slate-200">
                        {ACTION_LABELS[entry.action] ?? entry.action}
                        {details.name && !expanded && <span className="text-slate-400"> · {details.name}</span>}
                      </span>
                      {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                    </button>
                    {expanded && detailLines.length > 0 && (
                      <div className="mt-1 ml-2 pl-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/80 text-xs space-y-1">
                        {detailLines.map(({ label, val }) => (
                          <div key={label} className="flex gap-2">
                            <span className="text-slate-500 w-16 shrink-0">{label}:</span>
                            <span className="text-slate-200">{val}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
