import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { logActivity, ACTIVITY_ACTIONS } from '../lib/activityLog';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
      if (event === 'PASSWORD_RECOVERY') setNeedsPasswordReset(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      setProfile(data ?? null);
    } catch {
      setProfile(null);
    }
  }

  async function signIn(email, password) {
    if (!supabase) throw new Error('Supabase не е конфигуриран');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data?.user) {
      const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', data.user.id).maybeSingle();
      logActivity(supabase, {
        action: ACTIVITY_ACTIONS.USER_LOGIN,
        entity_type: 'profile',
        entity_id: data.user.id,
        details: { email: data.user.email, full_name: profile?.full_name, role: profile?.role, actor_name: profile?.full_name || data.user.email },
      });
    }
  }

  async function signUp({ email, password, fullName, role, dentistId, phone }) {
    if (!supabase) throw new Error('Supabase не е конфигуриран');
    const { data: { user: u }, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role, dentist_id: dentistId || null, phone: phone || null } },
    });
    if (error) throw error;
    if (u) {
      await supabase.from('profiles').insert({
        id: u.id,
        email,
        full_name: fullName || null,
        role,
        dentist_id: dentistId || null,
        phone: phone || null,
      });
    }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
  }

  /** Изпраща имейл с линк за смяна на парола (чрез Supabase Auth). Работи, ако в Supabase са настроени SMTP/Site URL и имейл шаблоните. */
  async function resetPassword(email) {
    if (!supabase) throw new Error('Supabase не е конфигуриран');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash?.includes('type=recovery')) {
      setNeedsPasswordReset(true);
    }
  }, []);

  async function updatePassword(newPassword) {
    if (!supabase) throw new Error('Supabase не е конфигуриран');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    setNeedsPasswordReset(false);
    window.history.replaceState(null, '', window.location.pathname);
  }

  function dismissPasswordReset() {
    setNeedsPasswordReset(false);
    window.history.replaceState(null, '', window.location.pathname);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, resetPassword, needsPasswordReset, updatePassword, dismissPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx;
}
