import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function DentistEditModal({ open, onClose, dentist, specialties = [], onSave }) {
  const [specialty, setSpecialty] = useState('');

  useEffect(() => {
    if (dentist) setSpecialty(dentist.specialty ?? '');
  }, [dentist]);

  if (!open || !dentist) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.(dentist.id, { specialty: specialty || dentist.specialty });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div
        className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Профил на лекар</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-slate-300 text-sm mb-4">{dentist.name}</p>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-200 mb-1">Специалност</label>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm"
          >
            {specialties.length > 0 ? (
              specialties.map((s) => (
                <option key={s.id} value={s.key}>
                  {s.label_bg}
                </option>
              ))
            ) : (
              <>
                <option value="General Dentistry">Обща стоматология</option>
                <option value="Orthodontics">Ортодонтия</option>
                <option value="Pediatric Dentistry">Детска стоматология</option>
                <option value="Oral Surgery">Орална хирургия</option>
              </>
            )}
          </select>
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600">
              Отказ
            </button>
            <button type="submit" className="flex-1 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500">
              Запази
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
