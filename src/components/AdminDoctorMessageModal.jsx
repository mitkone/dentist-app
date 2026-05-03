import { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';

export default function AdminDoctorMessageModal({
  open,
  onClose,
  dentists,
  onSubmit,
}) {
  const [dentistId, setDentistId] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setDentistId('');
      setBody('');
      setError('');
      setSending(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const did = String(dentistId || '').trim();
    const txt = body.trim();
    if (!did) {
      setError('Изберете лекар.');
      return;
    }
    if (!txt) {
      setError('Въведете текст на съобщението.');
      return;
    }
    setSending(true);
    try {
      await onSubmit?.({ toDentistId: did, body: txt });
      onClose();
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Съобщение към лекар</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-600">
            Всеки влезъл потребител може да изпрати бележка до избран лекар; получателят я вижда под камбанката (секция „Съобщения от регистратура“).
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">Лекар</label>
            <select
              value={dentistId}
              onChange={(e) => setDentistId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="">— изберете лекар —</option>
              {dentists.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">Текст</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="Напр. промяна на графика, обща бележка…"
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 text-sm resize-y min-h-[100px] outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-800 bg-slate-200 rounded-lg hover:bg-slate-300"
            >
              Отказ
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Изпращане…' : 'Изпрати'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
