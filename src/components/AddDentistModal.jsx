import { useState } from 'react';
import { X } from 'lucide-react';
import { DEFAULT_DENTIST_COLORS } from '../data/mockData';

export default function AddDentistModal({ open, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_DENTIST_COLORS[0]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({ name: trimmed, specialty: 'General Dentistry', color });
    setName('');
    setColor(DEFAULT_DENTIST_COLORS[0]);
    setTimeout(() => onClose(), 0);
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white">
          <h3 className="text-lg font-semibold text-slate-900">Добави стоматолог</h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="dentist-name" className="block text-sm font-medium text-slate-800 mb-1">
              Име
            </label>
            <input
              id="dentist-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="напр. Д-р Иванова"
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">Цвят в графика</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_DENTIST_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-slate-800 ring-2 ring-slate-800 ring-offset-2 ring-offset-white' : 'border-transparent'}`}
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
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-800 bg-slate-200 rounded-lg hover:bg-slate-300"
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
