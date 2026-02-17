import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';

function formatDate(d) {
  if (!d) return '';
  const s = String(d);
  if (s.length >= 10) return s.slice(0, 10);
  return s;
}

function AddVacationModal({ open, onClose, dentist, vacations = [], onSubmit, onDeleteVacation }) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setStart('');
      setEnd('');
      setNote('');
    }
  }, [open]);

  if (!open || !dentist) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!start || !end) return;
    onSubmit({
      dentistId: dentist.id,
      start_date: start,
      end_date: end,
      note: note.trim() || null,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900 shrink-0">
          <h3 className="text-lg font-semibold text-white">
            Отпуск · {dentist.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 min-h-0 space-y-4">
          {vacations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Текущи отпуски</h4>
              <ul className="space-y-2">
                {vacations.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-slate-800 border border-slate-700"
                  >
                    <span className="text-sm text-slate-200">
                      {formatDate(v.start_date)} – {formatDate(v.end_date)}
                      {v.note && (
                        <span className="block text-xs text-slate-400 mt-0.5">{v.note}</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteVacation?.(v.id)}
                      className="p-1.5 rounded text-slate-400 hover:bg-red-900/60 hover:text-red-400 shrink-0"
                      title="Изтрий отпуск"
                      aria-label="Изтрий отпуск"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h4 className="text-sm font-medium text-slate-300 mb-2">Добави нов отпуск</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              От дата
            </label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              До дата (включително)
            </label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Бележка (по избор)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm resize-y"
              placeholder="Напр. конгрес, отпуск, болничен..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-200 bg-slate-700 rounded-lg hover:bg-slate-600"
            >
              Отказ
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500"
            >
              Запази отпуск
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

export default AddVacationModal;
