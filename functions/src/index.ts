import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { z } from "zod";

admin.initializeApp();
const db = admin.firestore();

const REGION = "europe-west1"; // usa tu región

/** Utilidades */
const seasonId = "2025-26"; // si cambias de temporada, actualiza aquí

/** Esquema de entrada para crear pick */
const CreatePickSchema = z.object({
  matchdayId: z.string(),      // ej: "2025-26_2"
  team: z.string().min(2),     // ej: "rma", "fcb", ...
});

/**
 * Dado un matchdayId, devuelve:
 * - firstKickoff (Date): primer kickoff de la jornada
 * - full (boolean): si la jornada es "completa" (tiene todos los partidos previstos)
 *   => En tu caso asumimos "completa" si hay 10 partidos de primera.
 */
async function getMatchdayInfo(matchdayId: string) {
  const snap = await db.collection("matches")
    .where("matchdayId", "==", matchdayId).get();
  const matches = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

  const kickoffs = matches
    .map(m => m.kickoff?.toDate?.() ?? (m.kickoff instanceof Date ? m.kickoff : new Date(m.kickoff)))
    .filter(Boolean) as Date[];

  const firstKickoff = kickoffs.length ? new Date(Math.min(...kickoffs.map(d => d.getTime()))) : null;

  return {
    matches,
    firstKickoff,
    full: matches.length >= 10, // ajusta si tu liga tiene otro nº
  };
}

/** Comprueba si un pick previo reutiliza equipo */
async function hasUsedTeam(userId: string, team: string) {
  const q = await db.collection("picks")
    .where("userId", "==", userId)
    .where("seasonId", "==", seasonId)
    .where("team", "==", team)
    .get();
  return !q.empty;
}

/** Comprueba si ya hizo pick en esa jornada */
async function hasPickThisMatchday(userId: string, matchdayId: string) {
  const q = await db.collection("picks")
    .where("userId", "==", userId)
    .where("matchdayId", "==", matchdayId)
    .get();
  return !q.empty;
}

/**
 * Callable para crear pick con TODAS las validaciones de reglas.
 */
export const createPick = functions
  .region(REGION)
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login requerido.");
    }
    const userId = context.auth.uid;

    // Validar payload
    const parsed = CreatePickSchema.safeParse(data);
    if (!parsed.success) {
      throw new functions.https.HttpsError("invalid-argument", "Datos inválidos.");
    }
    const { matchdayId, team } = parsed.data;

    // Usuario aprobado y NO eliminado
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new functions.https.HttpsError("failed-precondition", "Usuario no registrado.");
    }
    const user = userSnap.data() as any;
    if (!user.approved) {
      throw new functions.https.HttpsError("failed-precondition", "Usuario no aprobado.");
    }
    if (user.eliminated === true) {
      throw new functions.https.HttpsError("failed-precondition", "Usuario eliminado.");
    }

    // Jornada completa + tiempo (no empezada)
    const { matches, firstKickoff, full } = await getMatchdayInfo(matchdayId);

    if (!full) {
      throw new functions.https.HttpsError("failed-precondition", "La jornada no es completa.");
    }
    if (!firstKickoff) {
      throw new functions.https.HttpsError("failed-precondition", "La jornada no tiene horario.");
    }
    const now = new Date();
    if (now >= firstKickoff) {
      throw new functions.https.HttpsError("failed-precondition", "La jornada ya ha comenzado.");
    }

    // El equipo elegido debe estar en la lista de partidos de la jornada
    const appears = matches.some(m => m.homeTeam === team || m.awayTeam === team);
    if (!appears) {
      throw new functions.https.HttpsError("failed-precondition", "Equipo no pertenece a la jornada.");
    }

    // no repetir equipo en toda la temporada
    if (await hasUsedTeam(userId, team)) {
      throw new functions.https.HttpsError("failed-precondition", "Equipo ya usado esta temporada.");
    }

    // un pick por jornada
    if (await hasPickThisMatchday(userId, matchdayId)) {
      throw new functions.https.HttpsError("failed-precondition", "Ya has elegido en esta jornada.");
    }

    // Registrar pick
    const displayName = user.displayName || user.email || "Jugador";
    const pick = {
      userId,
      username: displayName,
      team,
      matchdayId,
      seasonId,
      status: "pending", // pending | win | lose
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("picks").add(pick);

    return { ok: true, pick };
  });

/**
 * Cuando se actualiza el resultado de un partido, evaluamos los picks de esa jornada.
 * Reglas:
 *  - Si el equipo elegido gana => win
 *  - Si empata/pierde => lose (y marcamos usuario eliminado=true)
 *  - Si partido "suspended":
 *      * si se suspendió una vez iniciada la jornada => win
 *      * si se suspendió antes de empezar la jornada => se anula ese pick (permitimos repetir; borramos doc)
 */
export const evaluatePicksOnMatchUpdate = functions
  .region(REGION)
  .firestore.document("matches/{matchId}")
  .onWrite(async (change, context) => {
    const after = change.after.exists ? change.after.data() as any : null;
    if (!after) return;

    const { matchdayId, homeTeam, awayTeam, result, status, kickoff } = after;
    if (!matchdayId) return;

    const kickoffDate = kickoff?.toDate?.() ?? new Date(kickoff);
    const mdInfo = await getMatchdayInfo(matchdayId);
    const firstKickoff = mdInfo.firstKickoff;

    // Picks de esa jornada que hayan elegido uno de los dos equipos
    const picksSnap = await db.collection("picks")
      .where("matchdayId", "==", matchdayId)
      .where("status", "==", "pending")
      .get();

    const batch = db.batch();

    for (const d of picksSnap.docs) {
      const p = d.data() as any;
      if (p.team !== homeTeam && p.team !== awayTeam) continue;

      // partido suspendido
      if (status === "suspended") {
        if (firstKickoff && kickoffDate && firstKickoff <= kickoffDate) {
          // la jornada ya había empezado cuando se suspendió => cuenta como ganada
          batch.update(d.ref, { status: "win", resolvedAt: admin.firestore.FieldValue.serverTimestamp() });
        } else {
          // suspensión previa al inicio de jornada => anular pick
          batch.delete(d.ref);
        }
        continue;
      }

      // si ya tenemos resultado normal
      if (result && typeof result === "object") {
        const { home, away } = result as { home: number; away: number };
        const winner =
          home > away ? homeTeam :
          away > home ? awayTeam : "draw";

        if (winner === "draw") {
          // eliminado
          batch.update(d.ref, { status: "lose", resolvedAt: admin.firestore.FieldValue.serverTimestamp() });
          // marcar usuario eliminado
          const uref = db.collection("users").doc(p.userId);
          batch.update(uref, { eliminated: true });
        } else {
          const isWin = (p.team === winner);
          if (isWin) {
            batch.update(d.ref, { status: "win", resolvedAt: admin.firestore.FieldValue.serverTimestamp() });
          } else {
            batch.update(d.ref, { status: "lose", resolvedAt: admin.firestore.FieldValue.serverTimestamp() });
            const uref = db.collection("users").doc(p.userId);
            batch.update(uref, { eliminated: true });
          }
        }
      }
    }

    await batch.commit();
  });
