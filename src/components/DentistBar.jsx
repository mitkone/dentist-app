import { Stethoscope } from 'lucide-react';

export default function DentistBar({ dentists, selectedDentistIds, onDentistToggle }) {
  if (!dentists || dentists.length === 0) return null;

  const allSelected = dentists.length > 0 && dentists.every((d) => selectedDentistIds.includes(d.id));

  const handleToggleAll = () => {
    if (allSelected) {
      dentists.forEach((d) => {
        if (selectedDentistIds.includes(d.id)) onDentistToggle(d.id);
      });
    } else {
      dentists.forEach((d) => {
        if (!selectedDentistIds.includes(d.id)) onDentistToggle(d.id);
      });
    }
  };

  return (
    <div className="mt-3 mb-2 overflow-x-auto scroll-thin touch-pan-x overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="flex items-center gap-2 min-w-max pb-1">
        <button
          type="button"
          onClick={handleToggleAll}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs md:text-sm border transition-colors ${
            allSelected
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-slate-900 text-slate-200 border-slate-600 hover:border-emerald-500 hover:text-emerald-300'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>{allSelected ? 'Отмаркирай всички' : 'Избери всички'}</span>
        </button>
        {dentists.map((d) => {
          const selected = selectedDentistIds.includes(d.id);
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onDentistToggle(d.id)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs md:text-sm border transition-colors ${
                selected
                  ? 'bg-slate-100 text-slate-900 border-emerald-500'
                  : 'bg-slate-800 text-slate-200 border-slate-600 hover:border-emerald-500 hover:text-emerald-300'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              <span className="truncate max-w-[120px] md:max-w-[160px]">{d.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

