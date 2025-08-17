import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db, auth } from "./firebase";

// Escucha si el usuario inicia sesión y lo guarda en Firestore
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, "users", user.uid);

    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email ?? "sin-email",
        isApproved: false,
        createdAt: new Date()
      },
      { merge: true }
    );
  }
});
