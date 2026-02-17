import { useState } from 'react';
import { Lock } from 'lucide-react';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '1918138';

export default function AdminPasswordModal({ open, onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (password.trim() === ADMIN_PASSWORD) {
      setPassword('');
      onSuccess?.();
      onClose?.();
    } else {
      setError('Грешна парола');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div
        className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Парола за админ</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Въведете парола"
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm"
            autoFocus
          />
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600"
            >
              Отказ
            </button>
            <button
              type="submit"
              className="flex-1 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500"
            >
              Вход
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
