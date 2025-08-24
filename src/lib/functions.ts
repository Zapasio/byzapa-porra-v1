// src/lib/functions.ts
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

type SubmitPickArgs = {
  uid: string;            // OBLIGATORIO
  seasonId: string;
  matchdayNumber: number;
  teamId: string;
};

export async function submitPick({ uid, seasonId, matchdayNumber, teamId }: SubmitPickArgs) {
  if (!uid) throw new Error("NO_AUTH");
  if (!seasonId || !matchdayNumber || !teamId) throw new Error("MISSING_FIELDS");

  const pickId = `${uid}_${seasonId}_${matchdayNumber}`;
  const ref = doc(db, "picks", pickId);

  await setDoc(ref, {
    uid,
    seasonId,
    matchdayNumber,
    teamId,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
