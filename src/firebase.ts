// src/firebase.ts
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBP8HKsR_a2hRot5QUApJiq5S_Fj4u-Y08",
  authDomain: "byzapa-porra-v1.firebaseapp.com",
  projectId: "byzapa-porra-v1",
  storageBucket: "byzapa-porra-v1.appspot.com",
  messagingSenderId: "618449953181",
  appId: "1:618449953181:web:1966a413d26a0ad026f074",
  measurementId: "G-P9TY8401DJ",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

// persistencia local
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("Persistencia:", err);
});

// ayuda de diagnóstico (se ve en la consola del navegador)
console.log("Firebase apiKey en runtime:", app.options.apiKey);
console.log("Firebase authDomain en runtime:", app.options.authDomain);
