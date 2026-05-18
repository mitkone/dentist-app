import { useState } from 'react'
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const APP_BASE_URL = import.meta.env.VITE_APP_URL?.replace(/\/$/, '')
  || 'https://dentpro.dimitargrozdev.com'

const FALLBACK_REGISTER_URL = `${APP_BASE_URL}/register`

export default function HeroRegisterForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    const name = fullName.trim()
    const em = email.trim().toLowerCase()
    if (!name) {
      setError('Въведете име и фамилия.')
      return
    }
    if (!em) {
      setError('Въведете имейл.')
      return
    }
    if (password.length < 8) {
      setError('Паролата трябва да е поне 8 символа.')
      return
    }
    if (password !== confirm) {
      setError('Паролите не съвпадат.')
      return
    }

    if (!supabase) {
      window.location.href = FALLBACK_REGISTER_URL
      return
    }

    setBusy(true)
    try {
      const { data, error: signErr } = await supabase.auth.signUp({
        email: em,
        password,
        options: {
          data: { full_name: name, role: 'admin' },
        },
      })
      if (signErr) throw signErr

      if (data.session) {
        window.location.assign(`${APP_BASE_URL}/app/onboarding`)
        return
      }

      setInfo(
        'Изпратихме линк за потвърждение на имейла. След потвърждение влезте и завършете настройката на клиниката.',
      )
    } catch (err) {
      setError(err.message || 'Регистрацията не бе успешна.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div id="register" className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-md p-5 sm:p-6 shadow-xl shadow-black/20 scroll-mt-24">
      <h2 className="text-white font-semibold text-base mb-1">Безплатен бета достъп</h2>
      <p className="text-slate-400 text-xs mb-4">
        Пълен достъп · обратна връзка · без ангажимент
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-200 text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {info && (
          <div className="p-2.5 rounded-lg bg-medical-500/10 border border-medical-500/25 text-medical-100 text-xs leading-relaxed">
            {info}
          </div>
        )}

        <div>
          <label htmlFor="hero-reg-name" className="sr-only">Име и фамилия</label>
          <input
            id="hero-reg-name"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Име и фамилия"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-medical-400"
          />
        </div>
        <div>
          <label htmlFor="hero-reg-email" className="sr-only">Имейл</label>
          <input
            id="hero-reg-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Работен имейл"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-medical-400"
          />
        </div>
        <div>
          <label htmlFor="hero-reg-password" className="sr-only">Парола</label>
          <input
            id="hero-reg-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Парола (мин. 8 символа)"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-medical-400"
          />
        </div>
        <div>
          <label htmlFor="hero-reg-confirm" className="sr-only">Потвърдете паролата</label>
          <input
            id="hero-reg-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="Потвърдете паролата"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-medical-400"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-medical-500 hover:bg-medical-400 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:pointer-events-none"
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Регистрация…
            </>
          ) : (
            <>
              Вземи безплатен достъп сега
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-amber-200/90 leading-snug pt-1 px-1">
          Ограничено до първите 100 клиники. Вече 15 лекари работят с нас.
        </p>
        <p className="text-center text-[11px] text-slate-500 leading-snug pt-0.5">
          Без инсталация. Достъпно веднага.
        </p>
      </form>
    </div>
  )
}
