// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDwmi-JPFrHWB72aJml-EIu2D22LQ9a5l8",
  authDomain: "byzapa-porra-v1.firebaseapp.com",
  projectId: "byzapa-porra-v1",
  storageBucket: "byzapa-porra-v1.appspot.com",
  messagingSenderId: "97857417454",
  appId: "1:97857417454:web:01b1d558b8d9b17b4c5c9d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider(); // ✅ Soluciona el error de LoginPage

export { app, db, auth, provider }; // ✅ Ya está todo exportado correctamente
