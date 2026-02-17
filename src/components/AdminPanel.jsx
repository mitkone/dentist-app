import { useEffect, useState } from 'react';
import { X, Activity, Users, Calendar, Stethoscope, CheckCircle, XCircle, Clock, Plus, Trash2 } from 'lucide-react';

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
  { key: 'specialties', label: 'Специалности', table: 'specialties', column: 'id' },
  { key: 'appointment_types', label: 'Типове преглед', table: 'appointment_types', column: 'id' },
];

export default function AdminPanel({
  open,
  onClose,
  activityLog = [],
  loading,
  onRefresh,
  stats,
  supabase,
  workingHours = { start: 7, end: 19 },
  onSaveWorkingHours,
  specialties = [],
  onAddSpecialty,
  onDeleteSpecialty,
  appointmentTypes = [],
  onAddAppointmentType,
  onDeleteAppointmentType,
}) {
  const [systemCheck, setSystemCheck] = useState(null);
  const [hoursStart, setHoursStart] = useState(workingHours.start);
  const [hoursEnd, setHoursEnd] = useState(workingHours.end);
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecLabel, setNewSpecLabel] = useState('');
  const [newTypeKey, setNewTypeKey] = useState('');
  const [newTypeLabel, setNewTypeLabel] = useState('');

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

        <div className="p-4 border-b border-slate-800 shrink-0 space-y-3">
          <h3 className="text-sm font-medium text-slate-300">Проверка на системата</h3>
          {systemCheck === null ? (
            <p className="text-xs text-slate-500">Проверяваме таблиците...</p>
          ) : (
            <ul className="space-y-1.5">
              {CHECKS.map(({ key, label }) => {
                const r = systemCheck[key];
                const ok = r?.ok;
                return (
                  <li key={key} className="flex items-center gap-2 text-sm">
                    {ok ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span className={ok ? 'text-slate-200' : 'text-red-300'}>{label}</span>
                    {r && !ok && r.message && (
                      <span className="text-xs text-slate-500 truncate" title={r.message}>{r.message}</span>
                    )}
                  </li>
                );
              })}
            </ul>
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

          {onAddSpecialty && (
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-medium text-slate-300 mb-2">Специалности (лекари)</h3>
              <ul className="space-y-1 mb-2 max-h-24 overflow-y-auto">
                {specialties.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 py-1 px-2 rounded bg-slate-800 text-sm">
                    <span className="text-slate-200">{s.label_bg}</span>
                    <button type="button" onClick={() => onDeleteSpecialty(s.id)} className="p-1 rounded text-slate-400 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 flex-wrap items-center">
                <input
                  type="text"
                  placeholder="Ключ (напр. Implantology)"
                  value={newSpecKey}
                  onChange={(e) => setNewSpecKey(e.target.value)}
                  className="w-32 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 text-xs placeholder-slate-500"
                />
                <input
                  type="text"
                  placeholder="Име на български"
                  value={newSpecLabel}
                  onChange={(e) => setNewSpecLabel(e.target.value)}
                  className="w-36 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 text-xs placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const k = newSpecKey.trim();
                    const l = newSpecLabel.trim();
                    if (k && l) { onAddSpecialty(k, l); setNewSpecKey(''); setNewSpecLabel(''); }
                  }}
                  className="p-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {onAddAppointmentType && (
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-medium text-slate-300 mb-2">Видове преглед</h3>
              <ul className="space-y-1 mb-2 max-h-24 overflow-y-auto">
                {appointmentTypes.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 py-1 px-2 rounded bg-slate-800 text-sm">
                    <span className="text-slate-200">{t.label_bg}</span>
                    <button type="button" onClick={() => onDeleteAppointmentType(t.id)} className="p-1 rounded text-slate-400 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 flex-wrap items-center">
                <input
                  type="text"
                  placeholder="Ключ"
                  value={newTypeKey}
                  onChange={(e) => setNewTypeKey(e.target.value)}
                  className="w-28 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 text-xs placeholder-slate-500"
                />
                <input
                  type="text"
                  placeholder="Име на български"
                  value={newTypeLabel}
                  onChange={(e) => setNewTypeLabel(e.target.value)}
                  className="w-36 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 text-xs placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const k = newTypeKey.trim();
                    const l = newTypeLabel.trim();
                    if (k && l) { onAddAppointmentType(k, l); setNewTypeKey(''); setNewTypeLabel(''); }
                  }}
                  className="p-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <h3 className="text-sm font-medium text-slate-300 px-4 pt-3 pb-1">Последни действия</h3>
          {loading ? (
            <p className="px-4 py-6 text-slate-400 text-sm">Зареждане...</p>
          ) : activityLog.length === 0 ? (
            <p className="px-4 py-6 text-slate-500 text-sm">Няма записани действия</p>
          ) : (
            <ul className="p-4 space-y-2">
              {activityLog.map((entry) => (
                <li
                  key={entry.id}
                  className="flex gap-2 py-2 px-3 rounded-lg bg-slate-800/80 border border-slate-700 text-sm"
                >
                  <span className="text-slate-500 shrink-0 text-xs mt-0.5">{formatWhen(entry.created_at)}</span>
                  <span className="text-slate-200">
                    {ACTION_LABELS[entry.action] ?? entry.action}
                    {entry.details?.name && <span className="text-slate-400"> · {entry.details.name}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
