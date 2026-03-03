import { useState } from 'react';
import { X, Lock } from 'lucide-react';

export default function ResetPasswordModal({ open, onClose, onUpdate }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Паролата трябва да е поне 6 символа');
      return;
    }
    if (password !== confirm) {
      setError('Паролите не съвпадат');
      return;
    }
    setLoading(true);
    try {
      await onUpdate?.(password);
      setPassword('');
      setConfirm('');
      onClose?.();
    } catch (err) {
      setError(err.message || 'Грешка при обновяване');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 w-full max-w-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800">
          <Lock className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Нова парола</h3>
          <button type="button" onClick={onClose} className="ml-auto p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>
          )}
          <p className="text-sm text-slate-400">Въведете нова парола за акаунта си.</p>
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Нова парола</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Потвърди парола</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-500 disabled:opacity-60">
            {loading ? 'Запазване...' : 'Запази новата парола'}
          </button>
        </form>
      </div>
    </div>
  );
}
