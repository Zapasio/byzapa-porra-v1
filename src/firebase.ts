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
  // 👇 PÉGALO EXACTO desde Firebase Console (botón "Configurar SDK" de tu app web)
  apiKey: "AIzaSyBsRpKA8nR0otSqUu4j55_p5ju-Y8a0",
  authDomain: "byzapa-porra-v1.firebaseapp.com",
  projectId: "byzapa-porra-v1",
  storageBucket: "byzapa-porra-v1.firebasestorage.app",
  messagingSenderId: "618449953181",
  appId: "1:618449953181:web:1966a413d26a0ad026f074",
  measurementId: "G-P9TY8401DJ",
};

// 👇 imprime la apiKey y su longitud para detectar errores de copia
console.log("FB apiKey =>", firebaseConfig.apiKey, "| len:", firebaseConfig.apiKey?.length);

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error configurando persistencia:", error);
});
