import { useState, useEffect, useMemo, useRef } from 'react';
import {
  X, Activity, Users, Calendar, Stethoscope, CheckCircle, XCircle, Clock, Plus, Trash2,
  BarChart2, ChevronUp, ChevronDown, Settings, LayoutDashboard, Search, RefreshCw
} from 'lucide-react';

const ACTION_LABELS = {
  user_login: 'Вход в системата',
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

const CHECKS = [
  { key: 'appointments', label: 'Часове', table: 'appointments', column: 'id' },
  { key: 'patients', label: 'Пациенти', table: 'patients', column: 'id' },
  { key: 'doctor_vacations', label: 'Отпуски', table: 'doctor_vacations', column: 'id' },
  { key: 'patient_files', label: 'Файлове', table: 'patient_files', column: 'id' },
  { key: 'activity_log', label: 'Лог', table: 'activity_log', column: 'id' },
  { key: 'clinic_settings', label: 'Настройки', table: 'clinic_settings', column: 'key' },
  { key: 'appointment_types', label: 'Видове', table: 'appointment_types', column: 'id' },
];

function fmtWhen(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const now = new Date();
  if (now.toDateString() === d.toDateString()) return d.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, da] = dateStr.split('-');
  return `${da}.${m}.${y}`;
}

function formatDetails(action, details, dentists) {
  if (!details || typeof details !== 'object') return null;
  const parts = [];

  // Who performed the action
  if (details.actor_name) parts.push({ label: 'от', value: details.actor_name, key: 'actor' });

  // Appointment-related actions
  if (action?.includes('appointment') || action?.includes('vacation')) {
    if (details.patientName || details.oldPatientName) {
      const name = details.patientName || details.oldPatientName;
      parts.push({ label: 'пациент', value: name, key: 'patient' });
    }
    const dentistId = details.dentistId || details.dentist_id;
    if (dentistId && dentists?.length) {
      const d = dentists.find((x) => String(x.id) === String(dentistId));
      if (d) parts.push({ label: 'при', value: d.name, key: 'dentist' });
    }
    if (details.date && details.start) {
      parts.push({ label: 'час', value: `${fmtDate(details.date)} ${details.start}`, key: 'time' });
    } else if (details.date) {
      parts.push({ label: 'дата', value: fmtDate(details.date), key: 'date' });
    }
    if (details.oldDate && (details.oldDate !== details.date || details.oldStart !== details.start)) {
      const oldVal = details.oldStart ? `${fmtDate(details.oldDate)} ${details.oldStart}` : fmtDate(details.oldDate);
      parts.push({ label: 'преди', value: oldVal, key: 'old_time' });
    }
  }

  // Patient actions
  if (action?.includes('patient')) {
    if (details.name) parts.push({ label: 'пациент', value: details.name, key: 'patient' });
  }

  // Dentist actions
  if (action?.includes('dentist')) {
    if (details.name) parts.push({ label: 'лекар', value: details.name, key: 'dentist_name' });
  }

  // File actions
  if (action?.includes('file')) {
    if (details.fileName || details.name) parts.push({ label: 'файл', value: details.fileName || details.name, key: 'file' });
  }

  return parts;
}

function DetailsBadges({ action, details, dentists }) {
  const parts = formatDetails(action, details, dentists);
  if (!parts || parts.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {parts.map((p) => (
        <span key={p.key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600 border border-slate-200">
          <span className="text-slate-400">{p.label}:</span>
          <span className="font-medium text-slate-700 max-w-[160px] truncate">{p.value}</span>
        </span>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, value, label, color = 'emerald' }) {
  const colors = { emerald: 'bg-emerald-50 text-emerald-600', red: 'bg-red-50 text-red-600', blue: 'bg-blue-50 text-blue-600', amber: 'bg-amber-50 text-amber-600' };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-none">{value ?? '—'}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ---- Tab: Преглед ----
function OverviewTab({ stats, appointments, dentists, activityLog, onRefresh, loading }) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayApps = useMemo(() => appointments.filter((a) => a.date === todayKey), [appointments, todayKey]);
  const todayNoShow = todayApps.filter((a) => a.attendance === 'no_show').length;
  const todayPending = todayApps.filter((a) => (a.attendance || 'pending') === 'pending').length;
  const todayShowed = todayApps.filter((a) => a.attendance === 'showed').length;
  const busiestToday = useMemo(() => {
    const counts = new Map();
    todayApps.forEach((a) => counts.set(a.dentistId, (counts.get(a.dentistId) || 0) + 1));
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    if (!sorted.length) return null;
    const [did, cnt] = sorted[0];
    return { name: dentists.find((d) => d.id === did)?.name || did, count: cnt };
  }, [todayApps, dentists]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Преглед на деня</h2>
        <button type="button" onClick={onRefresh} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Обнови
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Calendar} value={todayApps.length} label="Часа днес" color="emerald" />
        <StatCard icon={Users} value={todayPending} label="Чакат статус" color="amber" />
        <StatCard icon={XCircle} value={todayNoShow} label="Не дойде" color="red" />
        <StatCard icon={CheckCircle} value={todayShowed} label="Дойдоха" color="blue" />
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard icon={Users} value={stats.patientsCount} label="Общо пациенти" color="blue" />
          <StatCard icon={Stethoscope} value={stats.dentistsCount} label="Стоматолози" color="emerald" />
          <StatCard icon={Calendar} value={stats.appointmentsToday} label="Записани за днес" color="amber" />
        </div>
      )}

      {busiestToday && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Най-натоварен лекар днес</p>
          <p className="text-base font-bold text-slate-900">{busiestToday.name} <span className="font-normal text-slate-500">— {busiestToday.count} часа</span></p>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Последни действия</h3>
        <div className="space-y-1.5">
          {activityLog.slice(0, 8).map((e) => (
            <div key={e.id} className="px-3 py-2.5 rounded-lg bg-white border border-slate-200">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="flex-1 text-sm text-slate-800 font-medium">{ACTION_LABELS[e.action] || e.action}</span>
                <span className="text-xs text-slate-400 shrink-0">{fmtWhen(e.created_at)}</span>
              </div>
              <div className="pl-5">
                <DetailsBadges action={e.action} details={e.details} dentists={dentists} />
              </div>
            </div>
          ))}
          {activityLog.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">Няма записи.</p>}
        </div>
      </div>
    </div>
  );
}

// ---- Tab: Активност ----
function ActivityTab({ activityLog, loading, onRefresh, onClear, dentists }) {
  const [filter, setFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showRawId, setShowRawId] = useState(null);

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    if (!q) return activityLog;
    return activityLog.filter((e) => {
      const label = (ACTION_LABELS[e.action] || e.action).toLowerCase();
      const det = JSON.stringify(e.details || {}).toLowerCase();
      return label.includes(q) || det.includes(q);
    });
  }, [activityLog, filter]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-slate-900">Дневник на действията</h2>
        <div className="flex gap-2">
          <button type="button" onClick={onRefresh} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Обнови
          </button>
          {onClear && (
            <button type="button" onClick={() => window.confirm('Изчистване на целия дневник?') && onClear()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
              <Trash2 className="w-3.5 h-3.5" />
              Изчисти
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)}
          placeholder="Търси действие…"
          className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30" />
      </div>

      <div className="space-y-1.5">
        {filtered.length === 0 && <p className="text-sm text-slate-400 py-8 text-center">Няма записи.</p>}
        {filtered.map((e) => {
          const isExpanded = expandedId === e.id;
          const isRaw = showRawId === e.id;
          const detailParts = formatDetails(e.action, e.details, dentists);
          return (
            <div key={e.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <button type="button" className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50"
                onClick={() => setExpandedId((cur) => (cur === e.id ? null : e.id))}>
                <Activity className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-slate-800 font-semibold">{ACTION_LABELS[e.action] || e.action}</span>
                  {/* Inline summary – always visible */}
                  {detailParts && detailParts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {detailParts.map((p) => (
                        <span key={p.key} className="text-xs text-slate-500">
                          <span className="text-slate-400">{p.label}: </span>
                          <span className="text-slate-700 font-medium">{p.value}</span>
                          {' '}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-xs text-slate-400 shrink-0 mt-0.5">{fmtWhen(e.created_at)}</span>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />}
              </button>
              {isExpanded && e.details && (
                <div className="px-4 pb-3 pt-0 space-y-2">
                  {/* Human-readable details */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
                    {detailParts && detailParts.length > 0 ? detailParts.map((p) => (
                      <div key={p.key} className="flex items-baseline gap-2 text-sm">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-16 shrink-0">{p.label}</span>
                        <span className="text-slate-800 font-medium">{p.value}</span>
                      </div>
                    )) : <p className="text-xs text-slate-400 italic">Няма допълнителни данни.</p>}
                  </div>
                  {/* Toggle raw JSON */}
                  <button type="button"
                    onClick={(ev) => { ev.stopPropagation(); setShowRawId(isRaw ? null : e.id); }}
                    className="text-[11px] text-slate-400 hover:text-slate-600 underline">
                    {isRaw ? 'Скрий суровите данни' : 'Покажи суровите данни'}
                  </button>
                  {isRaw && (
                    <pre className="text-xs bg-slate-900 text-emerald-300 rounded-lg p-3 overflow-x-auto">
                      {JSON.stringify(e.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Tab: Анализ ----
function AnalyticsTab({ activityLog }) {
  const counts = useMemo(() => {
    const map = {};
    for (const e of activityLog) {
      map[e.action] = (map[e.action] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [activityLog]);

  const max = counts[0]?.[1] || 1;

  const last30 = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return activityLog.filter((e) => new Date(e.created_at) >= cutoff);
  }, [activityLog]);

  const byDay = useMemo(() => {
    const map = {};
    for (const e of last30) {
      const d = e.created_at?.slice(0, 10);
      if (d) map[d] = (map[d] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
  }, [last30]);

  const dayMax = byDay.reduce((m, [, v]) => Math.max(m, v), 1);

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-lg font-bold text-slate-900">Анализ на използването</h2>

      <div>
        <h3 className="text-sm font-semibold text-slate-600 mb-4">Най-използвани функции</h3>
        <div className="space-y-3">
          {counts.length === 0 && <p className="text-sm text-slate-400">Няма данни.</p>}
          {counts.slice(0, 12).map(([action, count]) => (
            <div key={action} className="flex items-center gap-3">
              <span className="text-xs text-slate-600 w-44 shrink-0 truncate">{ACTION_LABELS[action] || action}</span>
              <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-lg transition-all"
                  style={{ width: `${Math.max(4, (count / max) * 100)}%` }}
                />
              </div>
              <span className="text-sm font-bold text-slate-800 w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-600 mb-4">Активност последните 14 дни</h3>
        <div className="flex items-end gap-1.5 h-28">
          {byDay.length === 0 && <p className="text-sm text-slate-400">Няма данни.</p>}
          {byDay.map(([day, cnt]) => (
            <div key={day} className="flex flex-col items-center flex-1 min-w-0 gap-1">
              <span className="text-[9px] text-slate-400">{cnt}</span>
              <div
                className="w-full bg-emerald-500 rounded-t"
                style={{ height: `${Math.max(4, (cnt / dayMax) * 80)}px` }}
                title={`${day}: ${cnt}`}
              />
              <span className="text-[9px] text-slate-400 truncate w-full text-center">
                {new Date(day + 'T12:00').toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{activityLog.length}</p>
          <p className="text-xs text-slate-500 mt-1">Общо действия</p>
        </div>
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{last30.length}</p>
          <p className="text-xs text-slate-500 mt-1">Последни 30 дни</p>
        </div>
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{counts.length}</p>
          <p className="text-xs text-slate-500 mt-1">Вида действия</p>
        </div>
      </div>
    </div>
  );
}

// ---- Tab: Потребители ----
function UsersTab({ supabase, dentists, getAdminPin }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const roleLabel = { admin: 'Админ', dentist: 'Стоматолог', receptionist: 'Регистратор' };

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.from('profiles').select('id, email, full_name, role, dentist_id, permissions').order('created_at', { ascending: false })
      .then(({ data }) => { setProfiles(data || []); setLoading(false); });
  }, [supabase]);

  const updateRole = async (profileId, role, dentistId = null) => {
    if (!supabase) return;
    const payload = { role, updated_at: new Date().toISOString(), dentist_id: role === 'dentist' ? (dentistId || null) : null };
    const adminPin = typeof getAdminPin === 'function' ? getAdminPin() : null;
    if (adminPin) {
      const { data, error } = await supabase.rpc('admin_update_profile_role', { target_id: profileId, new_role: role, new_dentist_id: payload.dentist_id, admin_pin: adminPin });
      if (data?.ok) setProfiles((p) => p.map((x) => x.id === profileId ? { ...x, role, dentist_id: payload.dentist_id } : x));
      else alert(data?.error || error?.message || 'Грешка');
      return;
    }
    const { error } = await supabase.from('profiles').update(payload).eq('id', profileId);
    if (!error) setProfiles((p) => p.map((x) => x.id === profileId ? { ...x, role, dentist_id: payload.dentist_id } : x));
    else alert(error.message);
  };

  const updatePerms = async (profileId, perms) => {
    if (!supabase) return;
    await supabase.from('profiles').update({ permissions: perms, updated_at: new Date().toISOString() }).eq('id', profileId);
    setProfiles((p) => p.map((x) => x.id === profileId ? { ...x, permissions: perms } : x));
  };

  if (loading) return <div className="p-8 text-center text-slate-400 text-sm">Зареждане…</div>;

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Потребители</h2>
      {profiles.length === 0 && <p className="text-sm text-slate-400">Няма регистрирани потребители.</p>}
      <div className="space-y-3">
        {profiles.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-slate-900">{p.full_name || '(без име)'}</p>
                <p className="text-xs text-slate-500">{p.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select value={p.role || ''} onChange={(e) => updateRole(p.id, e.target.value, p.dentist_id)}
                  className="text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500/30">
                  <option value="">— роля —</option>
                  {Object.entries(roleLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                {p.role === 'dentist' && (
                  <select value={p.dentist_id || ''} onChange={(e) => updateRole(p.id, 'dentist', e.target.value)}
                    className="text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500/30">
                    <option value="">— лекар —</option>
                    {dentists.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              {[
                ['can_book_all', 'Записва всички лекари'],
                ['can_view_admin', 'Вижда Админ'],
                ['can_edit_dentists', 'Редактира лекари'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox"
                    checked={Boolean(p.permissions?.[key])}
                    onChange={(e) => updatePerms(p.id, { ...(p.permissions || {}), [key]: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-slate-600">{label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Tab: Настройки ----
function SettingsTab({ workingHours, onSaveWorkingHours, appointmentTypes, onAddAppointmentType, onDeleteAppointmentType, onReorderAppointmentType, supabase }) {
  const [start, setStart] = useState(workingHours?.start ?? 7);
  const [end, setEnd] = useState(workingHours?.end ?? 19);
  const [newType, setNewType] = useState('');
  const [typeError, setTypeError] = useState('');
  const [systemCheck, setSystemCheck] = useState(null);

  useEffect(() => { setStart(workingHours?.start ?? 7); setEnd(workingHours?.end ?? 19); }, [workingHours]);

  useEffect(() => {
    if (!supabase) return;
    setSystemCheck({});
    let cancelled = false;
    (async () => {
      const result = {};
      for (const { key, table, column } of CHECKS) {
        if (cancelled) break;
        const { error } = await supabase.from(table).select(column).limit(1);
        result[key] = error ? { ok: false } : { ok: true };
      }
      if (!cancelled) setSystemCheck(result);
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Настройки на клиниката</h2>

      {/* Working hours */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-emerald-500" />Работни часове</h3>
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-600">От</label>
          <input type="number" min={0} max={23} value={start} onChange={(e) => setStart(Number(e.target.value))}
            className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-center" />
          <label className="text-xs text-slate-600">до</label>
          <input type="number" min={1} max={24} value={end} onChange={(e) => setEnd(Number(e.target.value))}
            className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-center" />
          <span className="text-xs text-slate-500">ч.</span>
          <button type="button" onClick={() => onSaveWorkingHours?.(start, end)}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500">Запази</button>
        </div>
      </div>

      {/* Appointment types */}
      {onAddAppointmentType && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Видове преглед</h3>
          <ul className="space-y-1.5 mb-3 max-h-52 overflow-y-auto">
            {appointmentTypes.length === 0 && <li className="text-sm text-slate-400 italic px-2 py-3">Няма добавени.</li>}
            {appointmentTypes.map((t, idx) => (
              <li key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm">
                {onReorderAppointmentType && (
                  <div className="flex flex-col gap-0 shrink-0">
                    <button type="button" onClick={() => onReorderAppointmentType(t.id, 'up')} disabled={idx === 0}
                      className="p-0.5 rounded text-slate-400 hover:text-emerald-600 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => onReorderAppointmentType(t.id, 'down')} disabled={idx === appointmentTypes.length - 1}
                      className="p-0.5 rounded text-slate-400 hover:text-emerald-600 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                  </div>
                )}
                <span className="flex-1 font-medium text-slate-800">{t.label_bg || t.key}</span>
                {onDeleteAppointmentType && (
                  <button type="button" onClick={() => onDeleteAppointmentType(t.id)}
                    className="p-1 rounded text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                )}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input type="text" value={newType} onChange={(e) => { setNewType(e.target.value); setTypeError(''); }}
              placeholder="Нов вид преглед…"
              className="flex-1 text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/30"
              onKeyDown={(e) => e.key === 'Enter' && newType.trim() && (onAddAppointmentType(newType.trim()) || setNewType(''))} />
            <button type="button" onClick={() => { if (!newType.trim()) { setTypeError('Въведете текст.'); return; } onAddAppointmentType(newType.trim()); setNewType(''); }}
              className="px-3 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 flex items-center gap-1">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {typeError && <p className="text-xs text-red-500 mt-1">{typeError}</p>}
        </div>
      )}

      {/* System check */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Проверка на системата</h3>
        {!systemCheck ? <p className="text-xs text-slate-400">Зареждане…</p> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CHECKS.map(({ key, label }) => {
              const ok = systemCheck[key]?.ok;
              return (
                <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {ok ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Tab: Лекари ----
function DentistsTab({ dentists, onOpenAddDentist, onDeleteDentist }) {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Стоматолози</h2>
        {onOpenAddDentist && (
          <button type="button" onClick={onOpenAddDentist}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500">
            <Plus className="w-4 h-4" /> Добави
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {dentists.map((d) => (
          <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4 items-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
              style={{ backgroundColor: d.color || '#64748b' }}>
              {d.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">{d.name}</p>
              {d.specialty && <p className="text-xs text-slate-500 truncate">{d.specialty}</p>}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-slate-400">{d.color}</span>
              </div>
            </div>
            {onDeleteDentist && (
              <button type="button" onClick={() => onDeleteDentist(d.id)} title="Премахни лекар"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0">
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        {dentists.length === 0 && <p className="col-span-2 text-sm text-slate-400 py-8 text-center">Няма добавени стоматолози.</p>}
      </div>
    </div>
  );
}

// ---- Main AdminHubPage ----
const TABS = [
  { id: 'overview', label: 'Преглед', icon: LayoutDashboard },
  { id: 'activity', label: 'Дневник', icon: Activity },
  { id: 'analytics', label: 'Анализ', icon: BarChart2 },
  { id: 'users', label: 'Потребители', icon: Users },
  { id: 'dentists', label: 'Лекари', icon: Stethoscope },
  { id: 'settings', label: 'Настройки', icon: Settings },
];

export default function AdminHubPage({
  open,
  onClose,
  supabase,
  activityLog = [],
  activityLogLoading = false,
  onRefreshActivityLog,
  onClearActivityLog,
  stats,
  appointments = [],
  dentists = [],
  patients = [],
  workingHours,
  onSaveWorkingHours,
  appointmentTypes = [],
  onAddAppointmentType,
  onDeleteAppointmentType,
  onReorderAppointmentType,
  onOpenAddDentist,
  onDeleteDentist,
  getAdminPin,
}) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[290] bg-white flex flex-col">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 bg-white shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <LayoutDashboard className="w-5 h-5 text-emerald-600" />
          <h1 className="text-base font-bold text-slate-900">Админ панел</h1>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Затвори">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left nav */}
        <nav className="w-48 shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col py-2 hidden md:flex">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setActiveTab(id)}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-colors
                ${activeTab === id ? 'bg-white text-emerald-700 border-r-2 border-emerald-500' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Mobile tab bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-slate-200 flex">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setActiveTab(id)}
              className={`flex-1 flex flex-col items-center py-2 text-[10px] font-medium
                ${activeTab === id ? 'text-emerald-600' : 'text-slate-500'}`}>
              <Icon className="w-4 h-4 mb-0.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {activeTab === 'overview' && (
            <OverviewTab stats={stats} appointments={appointments} dentists={dentists}
              activityLog={activityLog} onRefresh={onRefreshActivityLog} loading={activityLogLoading} />
          )}
          {activeTab === 'activity' && (
            <ActivityTab activityLog={activityLog} loading={activityLogLoading}
              onRefresh={onRefreshActivityLog} onClear={onClearActivityLog} dentists={dentists} />
          )}
          {activeTab === 'analytics' && <AnalyticsTab activityLog={activityLog} />}
          {activeTab === 'users' && <UsersTab supabase={supabase} dentists={dentists} getAdminPin={getAdminPin} />}
          {activeTab === 'dentists' && (
            <DentistsTab dentists={dentists}
              onOpenAddDentist={onOpenAddDentist} onDeleteDentist={onDeleteDentist} />
          )}
          {activeTab === 'settings' && (
            <SettingsTab workingHours={workingHours} onSaveWorkingHours={onSaveWorkingHours}
              appointmentTypes={appointmentTypes} onAddAppointmentType={onAddAppointmentType}
              onDeleteAppointmentType={onDeleteAppointmentType} onReorderAppointmentType={onReorderAppointmentType}
              supabase={supabase} />
          )}
        </div>
      </div>
    </div>
  );
}
