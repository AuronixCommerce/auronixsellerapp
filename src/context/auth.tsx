import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { auth, firebaseReady } from '@/src/lib/firebase';

type AuthValue = {
  user: User | null;
  ready: boolean;
  configured: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [ready, setReady] = useState(false);
  useEffect(() => onAuthStateChanged(auth, (next) => { setUser(next); setReady(true); }), []);
  const value = useMemo<AuthValue>(() => ({
    user,
    ready,
    configured: firebaseReady,
    login: async (email, password) => { await signInWithEmailAndPassword(auth, email.trim(), password); },
    logout: () => signOut(auth),
  }), [ready, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
