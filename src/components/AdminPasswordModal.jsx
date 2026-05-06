import { useState } from 'react';
import { Lock } from 'lucide-react';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '1918138';
const REMEMBER_ADMIN_KEY = 'hdent_remember_admin';

export default function AdminPasswordModal({ open, onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    try { return localStorage.getItem(REMEMBER_ADMIN_KEY) === '1'; } catch { return false; }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (password.trim() === ADMIN_PASSWORD) {
      const pwd = password.trim();
      try {
        if (rememberMe) localStorage.setItem(REMEMBER_ADMIN_KEY, '1');
        else localStorage.removeItem(REMEMBER_ADMIN_KEY);
      } catch { /* ignore */ }
      setPassword('');
      onSuccess?.(pwd, rememberMe);
      onClose?.();
    } else {
      setError('Грешна парола');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/25" onClick={onClose}>
      <div
        className="bg-white rounded-xl border border-slate-200 w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-slate-900">Парола за админ</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Въведете парола"
            className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm"
            autoFocus
          />
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <label className="flex items-center gap-2 mt-3 text-sm text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-slate-300 bg-slate-100 text-emerald-500 focus:ring-emerald-500/40"
            />
            Запомни ме на този компютър
          </label>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-200 rounded-lg hover:bg-slate-300"
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
