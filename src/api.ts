// src/api.ts
import { app } from "./firebase";
import { getFunctions, httpsCallable } from "firebase/functions";

const fns = getFunctions(app, "europe-west1");

export async function adminSetResult(
  matchday: number,
  fixtureId: string,
  result: "H" | "A" | "D"
) {
  const call = httpsCallable(fns, "setResultSurvivor");
  return await call({ matchday, fixtureId, result });
}
