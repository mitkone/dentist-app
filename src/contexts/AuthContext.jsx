import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
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

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx;
}
