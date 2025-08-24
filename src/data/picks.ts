// src/data/picks.ts
import {
  addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, where,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";

export type Fixture = { home: string; away: string };
export type PickDoc = {
  user: string;
  matchday: number;
  team: string;
  opponent: string;
  side: "home" | "away";
  fixture: Fixture;
  createdAt?: any;
};

// --- sesión anónima si no hay login ---
let cachedUserId: string | null = null;
onAuthStateChanged(auth, async (u) => {
  if (!u) {
    try { await signInAnonymously(auth); } catch {}
    return;
  }
  cachedUserId = u.email ?? u.uid;
});
export function getUserId(): string | null { return cachedUserId; }

// --- guardar pick ---
export async function savePick(input: {
  matchday: number; fixture: Fixture; side: "home" | "away";
}) {
  const user = getUserId();
  if (!user) throw new Error("No hay sesión de usuario.");
  const { matchday, fixture, side } = input;
  const team = side === "home" ? fixture.home : fixture.away;
  const opponent = side === "home" ? fixture.away : fixture.home;
  await addDoc(collection(db, "picks_user"), {
    user, matchday, team, opponent, side, fixture, createdAt: serverTimestamp(),
  } as PickDoc);
}

// --- escuchar estado del usuario (alive + usedTeams) ---
export function listenUserStatus(cb: (s: { alive: boolean|null; usedTeams: string[] }) => void) {
  const user = getUserId();
  if (!user) return () => {};
  const ref = doc(db, "users", user);
  return onSnapshot(ref, (snap) => {
    const d = snap.data() as any;
    cb({ alive: d?.alive ?? null, usedTeams: Array.isArray(d?.usedTeams) ? d.usedTeams : [] });
  });
}

// --- mis picks de una jornada ---
export function listenMyPicks(matchday: number, cb: (rows: PickDoc[]) => void) {
  const user = getUserId();
  if (!user) return () => {};
  const qy = query(
    collection(db, "picks_user"),
    where("user", "==", user),
    where("matchday", "==", matchday),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(qy, (snap) => {
    const r: PickDoc[] = [];
    snap.forEach((d) => r.push(d.data() as PickDoc));
    cb(r);
  });
}
