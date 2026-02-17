import { useState } from 'react';
import { Search, Stethoscope, Filter, UserPlus, Plus, Trash2, Phone, Mail, CalendarOff, Pencil, ChevronDown } from 'lucide-react';
import { specialtyLabel } from '../data/mockData';

export default function Sidebar({ dentists,
  selectedDentistIds,
  onDentistToggle,
  onDeleteDentist,
  patientSearch,
  onPatientSearch,
  patients,
  onAddDentist,
  onAddPatient,
  onOpenPatientDetail,
  onOpenVacation,
  onEditDentist,
  specialties = [],
}) {
  const specialtyLabelResolved = (key) => specialties.find((s) => s.key === key)?.label_bg ?? specialtyLabel(key);
  const q = (patientSearch || '').trim().toLowerCase();
  const filteredPatients = q
    ? patients.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.phone || '').includes(q) ||
          (p.notes || '').toLowerCase().includes(q) ||
          (p.address || '').toLowerCase().includes(q) ||
          (p.egn || '').includes(q) ||
          (p.email || '').toLowerCase().includes(q)
      )
    : [];
  const allSelected = dentists.length > 0 && dentists.every((d) => selectedDentistIds.includes(d.id));
  const noneSelected = dentists.every((d) => !selectedDentistIds.includes(d.id));
  const handleToggleAll = () => {
    if (allSelected) {
      // отмаркирай всички
      dentists.forEach((d) => {
        if (selectedDentistIds.includes(d.id)) onDentistToggle(d.id);
      });
    } else {
      // избери всички
      dentists.forEach((d) => {
        if (!selectedDentistIds.includes(d.id)) onDentistToggle(d.id);
      });
    }
  };
  const [dentistsOpen, setDentistsOpen] = useState(false);
  const selectedCount = selectedDentistIds.length;
  return (
    <aside className="w-full md:w-72 shrink-0 flex flex-col bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 shadow-sm max-h-[45vh] md:max-h-none z-10 md:z-auto">
      <div className="p-4 border-b border-slate-800 hidden md:block">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-400" />
          Филтри
        </h2>
      </div>

      <div className="p-4 border-b border-slate-800 md:block">
        <button
          type="button"
          onClick={() => setDentistsOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-2 py-1.5 text-left md:cursor-default"
        >
          <span className="text-sm font-medium text-slate-200">
            Стоматолози
            <span className="ml-1.5 text-slate-400 font-normal">
              ({selectedCount} избрани)
            </span>
          </span>
          <span className="flex items-center gap-1 shrink-0 md:hidden">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAddDentist?.(); }}
              className="p-1.5 rounded text-emerald-400 hover:bg-slate-800"
              aria-label="Добави"
            >
              <Plus className="w-4 h-4" />
            </button>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dentistsOpen ? 'rotate-180' : ''}`} />
          </span>
          <span className="hidden md:inline-flex">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAddDentist?.(); }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-400 hover:bg-slate-800 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              Добави
            </button>
          </span>
        </button>
        <div className={`overflow-hidden transition-all md:!block ${dentistsOpen ? 'max-h-[70vh] opacity-100' : 'max-h-0 opacity-0 md:max-h-none md:opacity-100'}`}>
          <div className="flex items-center gap-2 mt-2 mb-2 text-xs text-slate-300 pt-1 md:pt-0">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleToggleAll}
                className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
              />
              <span>{noneSelected ? 'Избери всички' : allSelected ? 'Отмаркирай всички' : 'Маркирай / отмаркирай всички'}</span>
            </label>
          </div>
          <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto scroll-thin">
            {dentists.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800 group"
              >
                <label className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDentistIds.includes(d.id)}
                    onChange={() => onDentistToggle(d.id)}
                    className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 shrink-0"
                  />
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-slate-100 block leading-snug">{d.name}</span>
                    <span className="text-xs text-slate-400 block truncate">{specialtyLabelResolved(d.specialty)}</span>
                  </div>
                </label>
                <div className="flex gap-1 shrink-0 relative z-10">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onEditDentist?.(d.id); }}
                    className="p-1.5 rounded text-slate-400 hover:bg-slate-600 hover:text-white shrink-0 opacity-70 group-hover:opacity-100"
                    title="Профил / Специалност"
                    aria-label="Редактирай"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (typeof onOpenVacation === 'function') onOpenVacation(d.id);
                    }}
                    className="p-1.5 rounded text-slate-400 hover:bg-red-900/60 hover:text-red-400 shrink-0 opacity-70 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                    title="Отпуск"
                    aria-label="Отпуск"
                  >
                    <CalendarOff className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDeleteDentist?.(d.id); }}
                    className="p-1.5 rounded text-slate-500 hover:bg-slate-700 hover:text-red-400 shrink-0 opacity-70 group-hover:opacity-100"
                    title="Премахни стоматолог"
                    aria-label="Премахни стоматолог"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-300">Търсене на пациенти</label>
          <button
            type="button"
            onClick={onAddPatient}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-400 hover:bg-slate-800 rounded-lg"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Добави
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Име, телефон или бележки..."
            value={patientSearch}
            onChange={(e) => onPatientSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
          />
        </div>
        {q && (
          <div className="mt-2 max-h-48 overflow-y-auto scroll-thin space-y-1 rounded-lg border border-slate-700 bg-slate-800/90 shadow-lg">
            {filteredPatients.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">Няма намерени пациенти</p>
            ) : (
              filteredPatients.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onOpenPatientDetail?.(p.id)}
                  className="w-full text-left p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 hover:border-slate-600 transition-colors"
                >
                  <span className="text-sm font-medium text-slate-100 block truncate">{p.name}</span>
                  {p.phone && (
                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 shrink-0" />
                      {p.phone}
                    </span>
                  )}
                  {p.email && (
                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{p.email}</span>
                    </span>
                  )}
                  {p.notes && (
                    <span className="text-xs text-slate-500 block truncate mt-0.5">{p.notes}</span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
        {!q && (
          <p className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <Stethoscope className="w-3.5 h-3.5" />
            Търсете в базата и кликнете за данни и бележки
          </p>
        )}
      </div>
    </aside>
  );
}
