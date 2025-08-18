// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Config pública (la de tu proyecto Byzapa-porra-v1)
const firebaseConfig = {
  apiKey: "AIzaSyDv8gYpZ9MlHTuCGeF_KhEZsZ_9IPXWfcI",
  authDomain: "byzapa-porra-v1.firebaseapp.com",
  projectId: "byzapa-porra-v1",
  storageBucket: "byzapa-porra-v1.appspot.com",
  messagingSenderId: "983580189308",
  appId: "1:983580189308:web:0410d462d65fa1f6b2c10c",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
