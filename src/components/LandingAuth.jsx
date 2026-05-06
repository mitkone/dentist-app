import { Lock, UserCheck } from 'lucide-react';

const ADMIN_SESSION_KEY = 'hdent_admin_session';
const ADMIN_PIN_KEY = 'hdent_admin_pin';
const REMEMBER_ADMIN_KEY = 'hdent_remember_admin';

/** Returns true if admin session is active (checks localStorage first, then sessionStorage). */
export function getAdminSession() {
  try {
    if (localStorage.getItem(ADMIN_SESSION_KEY) === '1') return true;
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

/** Stores or clears admin session. Pass remember=true to persist across browser restarts. */
export function setAdminSession(value, adminPin = null, remember = false) {
  try {
    if (value) {
      if (remember) {
        localStorage.setItem(ADMIN_SESSION_KEY, '1');
        if (adminPin) localStorage.setItem(ADMIN_PIN_KEY, adminPin);
      } else {
        sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
        if (adminPin) sessionStorage.setItem(ADMIN_PIN_KEY, adminPin);
      }
    } else {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem(ADMIN_PIN_KEY);
      localStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(ADMIN_PIN_KEY);
    }
  } catch {}
}

export function getAdminPin() {
  try {
    return localStorage.getItem(ADMIN_PIN_KEY) || sessionStorage.getItem(ADMIN_PIN_KEY) || null;
  } catch {
    return null;
  }
}

export default function LandingAuth({ onAdminClick, onStaffClick }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Хаджиев Дент</h1>
          <p className="text-slate-500 mt-1">Запазване на часове</p>
        </div>
        <div className="space-y-3">
          <button
            type="button"
            onClick={onAdminClick}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-left transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Lock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">Админ</div>
              <div className="text-sm text-slate-500">Вход с парола</div>
            </div>
          </button>
          <button
            type="button"
            onClick={onStaffClick}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-left transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">Регистратори и лекари</div>
              <div className="text-sm text-slate-500">Вход с имейл и парола</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
