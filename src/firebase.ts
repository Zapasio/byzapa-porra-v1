export {};import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
export const db = getFirestore(app);

export const provider = new GoogleAuthProvider();
// siempre elegir cuenta
provider.setCustomParameters({ prompt: "select_account" });

// persistencia local para no perder sesión
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error configurando persistencia:", error);
});
e);
