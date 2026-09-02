import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase.ts";

type AuthState = { user: User | null; session: Session | null; isLoading: boolean; isAuthenticated: boolean; signin: () => Promise<void>; signout: () => Promise<void>; error: Error | null };
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => { setSession(data.session); setError(error); setIsLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setIsLoading(false); });
    return () => subscription.unsubscribe();
  }, []);
  const value = useMemo<AuthState>(() => ({
    user: session?.user ?? null, session, isLoading, isAuthenticated: Boolean(session?.user), error,
    signin: async () => { const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } }); if (error) { setError(error); throw error; } },
    signout: async () => { const { error } = await supabase.auth.signOut(); if (error) { setError(error); throw error; } },
  }), [session, isLoading, error]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const state = useContext(AuthContext); if (!state) throw new Error("useAuth must be used within AuthProvider"); return state; }
export function useUser() { return useAuth().user; }
export function Authenticated({ children }: { children: React.ReactNode }) { return useAuth().isAuthenticated ? <>{children}</> : null; }
export function Unauthenticated({ children }: { children: React.ReactNode }) { const { isAuthenticated, isLoading } = useAuth(); return !isLoading && !isAuthenticated ? <>{children}</> : null; }
export function AuthLoading({ children }: { children: React.ReactNode }) { return useAuth().isLoading ? <>{children}</> : null; }
