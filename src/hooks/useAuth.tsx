// src/hooks/useAuth.tsx
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase";
import { collection, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

type UserDoc = {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  approved?: boolean;
  status?: "Activo" | "Eliminado";
};

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      if (u) {
        const ref = doc(collection(db, "users"), u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUserDoc({ uid: u.uid, ...snap.data() } as UserDoc);
        } else {
          // Si no existe, puedes crearlo en tu flujo de registro
          setUserDoc({ uid: u.uid, displayName: u.displayName || "", email: u.email || "", approved: false });
        }
      } else {
        setUserDoc(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { firebaseUser, userDoc, loading };
}
