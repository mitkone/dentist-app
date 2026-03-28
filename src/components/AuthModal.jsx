import { useState, useEffect } from 'react';
import { X, LogIn, UserPlus } from 'lucide-react';

const REMEMBER_EMAIL_KEY = 'dentist_app_remember_email';

export default function AuthModal({ open, onClose, signIn, signUp, resetPassword, dentists = [] }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (saved) setEmail(saved);
    } catch (_) {}
  }, []);

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

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword?.(email);
      setForgotSuccess(true);
    } catch (err) {
      setError(err.message || 'Грешка при изпращане');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp?.({ email, password, fullName, role, dentistId: role === 'dentist' ? dentistId : null });
      onClose();
    } catch (err) {
      setError(err.message || 'Грешка при регистрация');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            {mode === 'login' ? 'Вход' : 'Регистрация'}
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium ${mode === 'login' ? 'text-emerald-700 border-b-2 border-emerald-500 bg-emerald-50/80' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <LogIn className="w-4 h-4" /> Вход
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium ${mode === 'register' ? 'text-emerald-700 border-b-2 border-emerald-500 bg-emerald-50/80' : 'text-slate-500 hover:text-slate-800'}`}
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
            forgotPassword ? (
              forgotSuccess ? (
                <div className="space-y-4">
                  <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                    Проверете имейла си за линк за нулиране на паролата.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setForgotPassword(false); setForgotSuccess(false); setError(''); }}
                    className="w-full py-2.5 text-sm font-medium text-slate-800 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-100"
                  >
                    Назад към вход
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-sm text-slate-500">Въведете имейла си и ще получите линк за нулиране на паролата.</p>
                  <div>
                    <label className="block text-sm font-medium text-slate-800 mb-1">Имейл</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setForgotPassword(false); setError(''); }}
                      className="flex-1 py-2.5 text-sm font-medium text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-100"
                    >
                      Отказ
                    </button>
                    <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-500 disabled:opacity-60">
                      {loading ? 'Изпращане...' : 'Изпрати'}
                    </button>
                  </div>
                </form>
              )
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">Имейл</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">Парола</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 bg-slate-100 text-emerald-500 focus:ring-emerald-500/40"
                    />
                    Запомни ме (имейл)
                  </label>
                  <button
                    type="button"
                    onClick={() => { setForgotPassword(true); setError(''); }}
                    className="text-xs text-slate-500 hover:text-emerald-600"
                  >
                    Забравена парола?
                  </button>
                </div>
                <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-500 disabled:opacity-60">
                  {loading ? 'Влизане...' : 'Вход'}
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">Пълно име</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Д-р Иванов"
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">Имейл</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">Парола</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">Роля</label>
                <select
                  value={role}
                  onChange={(e) => { setRole(e.target.value); setDentistId(''); }}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm"
                >
                  <option value="admin">Администратор</option>
                  <option value="dentist">Стоматолог</option>
                  <option value="receptionist">Регистратор</option>
                </select>
              </div>
              {role === 'dentist' && dentists.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">Профил на лекар</label>
                  <select
                    value={dentistId}
                    onChange={(e) => setDentistId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm"
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
