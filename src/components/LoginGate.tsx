import { useEffect, useState } from "react";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signOut,
} from "firebase/auth";

export default function LoginGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<null | { uid: string; email?: string }>(null);

  useEffect(() => {
    const auth = getAuth();
    setPersistence(auth, browserLocalPersistence).finally(() => {
      const unsub = onAuthStateChanged(auth, (u) => {
        setUser(u ? { uid: u.uid, email: u.email || undefined } : null);
        setReady(true);
      });
      return () => unsub();
    });
  }, []);

  const loginGoogle = async () => {
    const auth = getAuth();
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const logout = async () => {
    await signOut(getAuth());
  };

  if (!ready) return null;

  if (!user) {
    return (
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[460px] p-6 bg-slate-800 text-slate-100 rounded-2xl shadow-lg">
        <h2 className="text-xl font-semibold mb-2">Inicia sesión</h2>
        <p className="text-sm opacity-80 mb-4">
          Para jugar necesitas entrar con tu cuenta de ByZapa.
        </p>
        <button
          onClick={loginGoogle}
          className="w-full py-2 rounded-xl bg-white text-slate-900 font-medium"
        >
          Continuar con Google
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-3 right-3 text-xs text-slate-500">
        {user.email} · <button onClick={logout} className="underline">Salir</button>
      </div>
      {children}
    </>
  );
}
