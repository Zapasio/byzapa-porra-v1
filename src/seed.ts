// src/seed.ts
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export async function seedByZapa() {
  const db = getFirestore();
  const auth = getAuth();
  const uid = auth.currentUser?.uid || "WmqQzhDvPVQ..."; // pon tu UID si no estás logueado

  // --- LEADERBOARDS: un doc por usuario (ID = uid para no duplicar) ---
  await setDoc(doc(db, "leaderboards", uid), {
    displayName: "misihomaraaa@gmail.com", // o tu nombre
    points: 5,
    played: 2,
    uid,
    wins: 1,
  });

  await setDoc(doc(db, "leaderboards", "user-test-1"), {
    displayName: "Amigo Test",
    points: 3,
    played: 1,
    uid: "user-test-1",
    wins: 0,
  });

  // --- PICKS_USER: dos picks de ejemplo (IDs automáticos) ---
  await addDoc(collection(db, "picks_user"), {
    createdAt: serverTimestamp(),
    fixture: "Real Madrid vs Sevilla",
    home: "rma",
    matchdayNumber: 1,
    opponent: "sev",
    result: null,
    side: "home",
    team: "rma",
    user: uid,
  });

  await addDoc(collection(db, "picks_user"), {
    createdAt: serverTimestamp(),
    fixture: "Barcelona vs Atlético",
    home: "bar",
    matchdayNumber: 2,
    opponent: "atm",
    result: null,
    side: "home",
    team: "bar",
    user: uid,
  });

  return "Seed OK";
}
