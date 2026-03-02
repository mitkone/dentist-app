import { useState, useEffect } from 'react';
import { X, LogIn, UserPlus } from 'lucide-react';

const REMEMBER_EMAIL_KEY = 'dentist_app_remember_email';

export default function AuthModal({ open, onClose, signIn, signUp, dentists = [] }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (open) {
      try {
        const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
        if (saved) setEmail(saved);
      } catch (_) {}
    }
  }, [open]);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('receptionist');
  const [dentistId, setDentistId] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn?.(email, password);
      try {
        if (rememberMe) localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        else localStorage.removeItem(REMEMBER_EMAIL_KEY);
      } catch (_) {}
      onClose();
    } catch (err) {
      setError(err.message || 'Грешка при влизане');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp?.({ email, password, fullName, role, dentistId: role === 'dentist' ? dentistId : null, phone });
      onClose();
    } catch (err) {
      setError(err.message || 'Грешка при регистрация');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">
            {mode === 'login' ? 'Вход' : 'Регистрация'}
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-800">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium ${mode === 'login' ? 'text-emerald-400 border-b-2 border-emerald-500 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <LogIn className="w-4 h-4" /> Вход
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium ${mode === 'register' ? 'text-emerald-400 border-b-2 border-emerald-500 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <UserPlus className="w-4 h-4" /> Регистрация
          </button>
        </div>

        <div className="p-5">
          {error && (
            <p className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Имейл</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Парола</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/40"
                />
                Запомни ме (имейл)
              </label>
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-500 disabled:opacity-60">
                {loading ? 'Влизане...' : 'Вход'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Пълно име</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Д-р Иванов"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Имейл</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Телефон <span className="text-slate-500 font-normal">(по избор)</span></label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+359..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Парола</label>
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
                <label className="block text-sm font-medium text-slate-200 mb-1">Роля</label>
                <select
                  value={role}
                  onChange={(e) => { setRole(e.target.value); setDentistId(''); }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm"
                >
                  <option value="admin">Администратор</option>
                  <option value="dentist">Стоматолог</option>
                  <option value="receptionist">Регистратор</option>
                </select>
              </div>
              {role === 'dentist' && dentists.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Профил на лекар</label>
                  <select
                    value={dentistId}
                    onChange={(e) => setDentistId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm"
                  >
                    <option value="">— Изберете —</option>
                    {dentists.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-500 disabled:opacity-60">
                {loading ? 'Регистриране...' : 'Регистрация'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
