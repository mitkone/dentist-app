import { useState } from 'react';
import { X } from 'lucide-react';
import { DENTIST_SPECIALTY_KEYS, specialtyLabel, DEFAULT_DENTIST_COLORS } from '../data/mockData';

export default function AddDentistModal({ open, onClose, onAdd, specialties = [] }) {
  const specialtyOptions = specialties.length > 0 ? specialties : DENTIST_SPECIALTY_KEYS.map((key) => ({ key, label_bg: specialtyLabel(key) }));
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState(specialtyOptions[0]?.key ?? DENTIST_SPECIALTY_KEYS[0]);
  const [color, setColor] = useState(DEFAULT_DENTIST_COLORS[0]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({ name: trimmed, specialty, color });
    setName('');
    setSpecialty(specialtyOptions[0]?.key ?? DENTIST_SPECIALTY_KEYS[0]);
    setColor(DEFAULT_DENTIST_COLORS[0]);
    setTimeout(() => onClose(), 0);
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900">
          <h3 className="text-lg font-semibold text-white">Добави стоматолог</h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="dentist-name" className="block text-sm font-medium text-slate-200 mb-1">
              Име
            </label>
            <input
              id="dentist-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="напр. Д-р Иванова"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="dentist-specialty" className="block text-sm font-medium text-slate-200 mb-1">
              Специалност
            </label>
            <select
              id="dentist-specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
            >
              {specialtyOptions.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label_bg}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Цвят в графика</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_DENTIST_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-white ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  aria-label="Избери цвят"
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-200 bg-slate-700 rounded-lg hover:bg-slate-600"
            >
              Отказ
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500"
            >
              Добави
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
