import { useEffect, useState } from "react";
import "./index.css";
import { onAuthStateChanged, signInWithRedirect, getRedirectResult } from "firebase/auth";
import type { User } from "firebase/auth";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, provider } from "./firebase";
import MatchdayViewer from "./components/MatchdayViewer";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [approved, setApproved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Forzamos redirect (sin popup)
  const login = async () => {
    await signInWithRedirect(auth, provider);
  };

  // Captura el resultado del redirect y muestra el error real si lo hay
  useEffect(() => {
    getRedirectResult(auth).catch((e: any) => {
      console.error("Redirect result error:", e?.code, e?.message);
      alert(`Error de login: ${e?.code || e?.message || e}`);
    });
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setApproved(false);
        setLoading(false);
        return;
      }
      const userRef = doc(db, "users", u.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data() as { approved?: boolean };
        setUser(u);
        setApproved(Boolean(data.approved));
      } else {
        await setDoc(userRef, {
          uid: u.uid,
          email: u.email ?? "",
          displayName: u.displayName ?? "",
          approved: false,
        });
        setUser(u);
        setApproved(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="text-white text-center mt-20">Cargando…</div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-white">
        <h1 className="text-3xl font-bold mb-4">ByZapa Porra VSLE</h1>
        <button onClick={login} className="bg-yellow-400 text-black px-4 py-2 rounded">
          Iniciar sesión con Google
        </button>
      </div>
    );
  }

  if (!approved) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-white text-center">
        <h1 className="text-2xl mb-2">Hola {user.displayName || "jugador"}</h1>
        <p className="mb-2">Tu cuenta aún no ha sido aprobada.</p>
        <p>Espera a que Zapa te active en Firestore (users → approved: true).</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <h1 className="text-center text-3xl font-bold py-6 text-yellow-400">ByZapa Porra VSLE</h1>
      <MatchdayViewer userId={user.uid} username={user.displayName || user.email || "Jugador"} />
    </div>
  );
}
