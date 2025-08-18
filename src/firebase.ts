// src/firebase.ts
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// La configuración de Firebase se toma de las variables de entorno
// definidas en `.env.local` (ver `.env.example`).
// Al no dejar claves embebidas en el código evitamos exponerlas en el repositorio.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// ---- Provider para Google y persistencia ----
export const provider = new GoogleAuthProvider();
// que te deje elegir cuenta siempre
provider.setCustomParameters({ prompt: "select_account" });

// sesión persistente
setPersistence(auth, browserLocalPersistence).catch((e) => {
  console.error("Persistencia auth falló:", e);
});
