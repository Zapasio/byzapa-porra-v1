// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBP8HKsR_a2hRot5QUApJiq5S_Fj4u-Y08",
  authDomain: "byzapa-porra-v1.firebaseapp.com",
  databaseURL: "https://byzapa-porra-v1-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "byzapa-porra-v1",
  storageBucket: "byzapa-porra-v1.appspot.com", // <-- CORREGIDO AQUÍ
  messagingSenderId: "618449953181",
  appId: "1:618449953181:web:1986a4312a60a0d2f60f74",
  measurementId: "G-P9TYE841DJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { app, db, auth, provider };
