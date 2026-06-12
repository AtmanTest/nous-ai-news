'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  displayName: string | null;
  handle: string | null;
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true,
  displayName: null, handle: null,
  signOut: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, displayName: null, handle: null });
  const supabase = createClient();

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setState({
      user,
      loading: false,
      displayName: user?.user_metadata?.display_name || user?.email?.split('@')[0] || null,
      handle: user?.email ? `@${user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')}` : null,
    });
  }, [supabase]);

  useEffect(() => {
    refresh();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => subscription.unsubscribe();
  }, [refresh, supabase.auth]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, loading: false, displayName: null, handle: null });
  }, [supabase.auth]);

  return (
    <AuthContext.Provider value={{ ...state, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
