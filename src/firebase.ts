// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AlzaSyBP8HKsR_a2hRot5QUApJiq5S_Fj4u-Y08",
  authDomain: "byzapa-porra-v1.firebaseapp.com",
  projectId: "byzapa-porra-v1",
  storageBucket: "byzapa-porra-v1.appspot.com",
  messagingSenderId: "618449953181",
  appId: "1:618449953181:web:1966a413d26a0ad026f074",
  measurementId: "G-P9TY8401DJ",
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// Exportamos servicios que usaremos
export const auth = getAuth(app);
export const db = getFirestore(app);
