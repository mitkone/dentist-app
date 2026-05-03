import { useState, useMemo } from 'react';
import { Search, Filter, UserPlus, Plus, Trash2, CalendarOff, ChevronDown, Database } from 'lucide-react';
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
  onOpenPatientDatabase,
  onOpenVacation,
  showDentistsFilter = true,
}) {
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
  const patientQuery = patientSearch.trim().toLowerCase();
  const sidebarPatientHits = useMemo(() => {
    if (patientQuery.length < 1) return [];
    return patients
      .filter((p) => {
        const blob = [p.name, p.phone, p.parentPhone, p.email, p.notes]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return blob.includes(patientQuery);
      })
      .slice(0, 12);
  }, [patients, patientQuery]);
  return (
    <aside className="w-full md:w-72 shrink-0 flex flex-col bg-white border-b md:border-b-0 md:border-r border-slate-200 shadow-sm max-h-[45vh] md:max-h-none z-10 md:z-auto">
      {showDentistsFilter && (
        <div className="p-4 border-b border-slate-200 hidden md:block">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-400" />
            Филтри
          </h2>
        </div>
      )}

      {showDentistsFilter && (
      <div className="p-4 border-b border-slate-200 md:block">
        <button
          type="button"
          onClick={() => setDentistsOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-2 py-1.5 text-left md:cursor-default"
        >
          <span className="text-sm font-medium text-slate-800">
            Стоматолози
            <span className="ml-1.5 text-slate-500 font-normal">
              ({selectedCount} избрани)
            </span>
          </span>
          <span className="flex items-center gap-1 shrink-0 md:hidden">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAddDentist?.(); }}
              className="p-1.5 rounded text-emerald-400 hover:bg-slate-100"
              aria-label="Добави"
            >
              <Plus className="w-4 h-4" />
            </button>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${dentistsOpen ? 'rotate-180' : ''}`} />
          </span>
          <span className="hidden md:inline-flex">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAddDentist?.(); }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-400 hover:bg-slate-100 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              Добави
            </button>
          </span>
        </button>
        <div className={`overflow-hidden transition-all md:!block ${dentistsOpen ? 'max-h-[70vh] opacity-100' : 'max-h-0 opacity-0 md:max-h-none md:opacity-100'}`}>
          <div className="flex items-center gap-2 mt-2 mb-2 text-xs text-slate-600 pt-1 md:pt-0">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleToggleAll}
                className="rounded border-slate-300 bg-slate-100 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-white"
              />
              <span>{noneSelected ? 'Избери всички' : allSelected ? 'Отмаркирай всички' : 'Маркирай / отмаркирай всички'}</span>
            </label>
          </div>
          <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto scroll-thin">
            {dentists.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 group"
              >
                <label className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDentistIds.includes(d.id)}
                    onChange={() => onDentistToggle(d.id)}
                    className="rounded border-slate-300 bg-slate-100 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-white shrink-0"
                  />
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-slate-900 block leading-snug">{d.name}</span>
                  </div>
                </label>
                <div className="flex gap-1 shrink-0 relative z-10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (typeof onOpenVacation === 'function') onOpenVacation(d.id);
                    }}
                    className="p-1.5 rounded text-slate-500 hover:bg-red-50 hover:text-red-600 shrink-0 opacity-70 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                    title="Отпуск"
                    aria-label="Отпуск"
                  >
                    <CalendarOff className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDeleteDentist?.(d.id); }}
                    className="p-1.5 rounded text-slate-500 hover:bg-slate-200 hover:text-red-400 shrink-0 opacity-70 group-hover:opacity-100"
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
      )}

      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-600">Търсене на пациенти</label>
          <button
            type="button"
            onClick={onAddPatient}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-400 hover:bg-slate-100 rounded-lg"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Добави
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-[1]" />
          <input
            type="text"
            placeholder="Име, телефон, родител или бележки..."
            value={patientSearch}
            onChange={(e) => onPatientSearch(e.target.value)}
            autoComplete="off"
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-100 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
          />
          {sidebarPatientHits.length > 0 && (
            <ul className="absolute left-0 right-0 top-full z-20 mt-0.5 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg py-1">
              {sidebarPatientHits.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm text-slate-800 hover:bg-emerald-50 flex flex-col gap-0.5"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onOpenPatientDetail?.(p.id)}
                  >
                    <span className="font-medium">{p.name}</span>
                    {(p.phone || p.parentPhone) && (
                      <span className="text-xs text-slate-500">{p.phone}{p.parentPhone ? ` · родител: ${p.parentPhone}` : ''}</span>
                    )}
                    <span className="flex flex-wrap gap-1">
                      {p.isBlacklisted && (
                        <span className="text-[10px] font-semibold uppercase px-1 rounded bg-slate-900 text-white">Черен списък</span>
                      )}
                      {p.unreliablePatient && (
                        <span className="text-[10px] font-semibold px-1 rounded bg-amber-200 text-amber-900">Нередовен</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {patientQuery.length >= 1 && sidebarPatientHits.length === 0 && (
          <p className="mt-1 text-xs text-slate-500">Няма съвпадения в базата — използвайте бутона по-долу за пълен списък.</p>
        )}
        <button
          type="button"
          onClick={onOpenPatientDatabase}
          className="mt-2 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-slate-100 text-slate-800 text-sm font-medium hover:bg-slate-200"
        >
          <Database className="w-4 h-4" />
          Отвори база пациенти
        </button>

      </div>
    </aside>
  );
}
