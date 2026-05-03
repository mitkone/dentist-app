import { useMemo, useState } from 'react';
import { X, Search } from 'lucide-react';
import { appointmentTypeLabel } from '../data/mockData';

function patientCity(address = '') {
  const val = String(address || '').trim();
  if (!val) return '';
  const parts = val.split(',').map((x) => x.trim()).filter(Boolean);
  return parts[0] || val;
}

export default function PatientDatabaseModal({
  open,
  onClose,
  patients = [],
  appointments = [],
  appointmentTypes = [],
  onOpenPatient,
}) {
  const [query, setQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const typeLabel = (type) =>
    appointmentTypes.find((t) => t.key === type || t.label_bg === type)?.label_bg ?? appointmentTypeLabel(type) ?? type;

  const cities = useMemo(() => {
    const set = new Set(
      patients.map((p) => patientCity(p.address)).filter(Boolean)
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'bg'));
  }, [patients]);

  const interventionTypes = useMemo(() => {
    const set = new Set(appointments.map((a) => typeLabel(a.type)).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'bg'));
  }, [appointments, appointmentTypes]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients
      .filter((p) => {
        const city = patientCity(p.address);
        if (cityFilter !== 'all' && city !== cityFilter) return false;
        const pApps = appointments.filter((a) => a.patientId === p.id || (p.name && a.patientName === p.name));
        if (typeFilter !== 'all' && !pApps.some((a) => typeLabel(a.type) === typeFilter)) return false;
        if (!q) return true;
        const text = [p.name, p.phone, p.parentPhone, p.email, p.address, p.notes].filter(Boolean).join(' ').toLowerCase();
        return text.includes(q);
      })
      .map((p) => {
        const pApps = appointments
          .filter((a) => a.patientId === p.id || (p.name && a.patientName === p.name))
          .sort((a, b) => `${b.date} ${b.start}`.localeCompare(`${a.date} ${a.start}`));
        return {
          ...p,
          city: patientCity(p.address),
          visits: pApps.length,
          lastVisit: pApps[0] ? `${pApps[0].date} ${pApps[0].start}` : '—',
          lastType: pApps[0] ? typeLabel(pApps[0].type) : '—',
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'bg'));
  }, [patients, appointments, cityFilter, typeFilter, query, appointmentTypes]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/25 backdrop-blur-sm p-4 flex items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-5xl max-h-[90vh] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900">База пациенти</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Търси по име, телефон, имейл..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-100 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="px-3 py-2 text-sm bg-slate-100 border border-slate-300 rounded-lg text-slate-900">
            <option value="all">Всички градове</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 text-sm bg-slate-100 border border-slate-300 rounded-lg text-slate-900">
            <option value="all">Всички интервенции</option>
            {interventionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-100 border-b border-slate-200">
              <tr className="text-left text-slate-600">
                <th className="px-3 py-2">Пациент</th>
                <th className="px-3 py-2">Град</th>
                <th className="px-3 py-2">Посещения</th>
                <th className="px-3 py-2">Последно посещение</th>
                <th className="px-3 py-2">Последна интервенция</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-200 hover:bg-slate-50 cursor-pointer" onClick={() => onOpenPatient?.(r.id)}>
                  <td className="px-3 py-2 font-medium text-slate-900">
                    <span className="block">{r.name}</span>
                    <span className="flex flex-wrap gap-1 mt-1">
                      {r.isBlacklisted && (
                        <span className="text-[10px] font-semibold uppercase px-1 rounded bg-slate-900 text-white">ЧС</span>
                      )}
                      {r.unreliablePatient && (
                        <span className="text-[10px] font-semibold px-1 rounded bg-amber-200 text-amber-900">Нередовен</span>
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-700">{r.city || '—'}</td>
                  <td className="px-3 py-2 text-slate-700">{r.visits}</td>
                  <td className="px-3 py-2 text-slate-700">{r.lastVisit}</td>
                  <td className="px-3 py-2 text-slate-700">{r.lastType}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">Няма резултати за текущите филтри.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
