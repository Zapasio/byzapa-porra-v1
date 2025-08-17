// Cloud Functions v2 (Node 20)
import { onCall, onRequest } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";

// Firebase Admin
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getDatabase as getRtdb } from "firebase-admin/database";

// ---- Init ----
initializeApp();
const db = getFirestore();
const authAdmin = getAuth();
const rtdb = getRtdb();
const REGION = "europe-west1";

// ---- Secrets ----
const ADMIN_EMAIL = defineSecret("ADMIN_EMAIL");
const SPORTS_API_KEY = defineSecret("SPORTS_API_KEY");
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

// ---- Helpers ----
function assertAuth(req: any) {
  if (!req.auth) throw new Error("auth-required");
}
function assertAdmin(req: any) {
  assertAuth(req);
  if (!(req.auth.token as any)?.admin) throw new Error("admin-only");
}
async function buildSnapshot(seasonId: string, md: number) {
  const [picksSnap, matchesSnap, lbSnap] = await Promise.all([
    db.collection("picks").where("seasonId","==",seasonId).where("matchdayNumber","==",md).get(),
    db.collection("matches").where("seasonId","==",seasonId).where("matchdayNumber","==",md).get(),
    db.collection("leaderboards").where("seasonId","==",seasonId).get(),
  ]);

  const picks = picksSnap.docs.map(d => {
    const x = d.data() as any;
    return {
      id: d.id,
      userId: x.userId,
      displayName: x.displayName || x.userId?.slice(0,6),
      teamId: x.teamId,
      matchdayNumber: x.matchdayNumber
    };
  });

  const matches = matchesSnap.docs.map(d => {
    const x = d.data() as any;
    return {
      id: d.id,
      homeId: x.homeId,
      awayId: x.awayId,
      result: x.result || null,
      order: x.order || 0
    };
  }).sort((a,b)=> (a.order??0) - (b.order??0));

  const leaderboard = lbSnap.docs.map(d => {
    const x = d.data() as any;
    return { userId: x.userId, displayName: x.displayName || x.userId?.slice(0,6), points: Number(x.points || 0) };
  }).sort((a,b)=> b.points - a.points);

  return { picks, matches, leaderboard };
}
async function publishLive(seasonId: string, md: number) {
  const live = await buildSnapshot(seasonId, md);
  const payload = { seasonId, md, ...live, updatedAt: Date.now() };
  await rtdb.ref(`live/${seasonId}/${md}`).set(payload);
  return payload;
}

// =======================
//  A) CALLABLES (backend)
// =======================

// 0) Hacer admin al email permitido por secret ADMIN_EMAIL
export const bootstrapAdmin = onCall({ region: REGION, secrets: [ADMIN_EMAIL] }, async (req) => {
  assertAuth(req);
  const callerEmail = (req.auth!.token.email || "").toLowerCase();
  const allowed = (ADMIN_EMAIL.value() || "").toLowerCase();
  if (!callerEmail || callerEmail !== allowed) throw new Error("not-allowed");

  await authAdmin.setCustomUserClaims(req.auth!.uid, { admin: true });
  await db.collection("users").doc(req.auth!.uid).set({ admin: true, email: callerEmail }, { merge: true });
  return { ok: true };
});

// 1) Enviar pick (no repetir equipo temporada / 1 pick por jornada / jornada abierta)
export const submitPick = onCall({ region: REGION }, async (req) => {
  assertAuth(req);
  const { seasonId, matchdayNumber, teamId } = req.data || {};
  if (!seasonId || !matchdayNumber || !teamId) throw new Error("missing-fields");

  const uid = req.auth!.uid;

  const prev = await db.collection("picks")
    .where("userId","==",uid).where("seasonId","==",seasonId)
    .where("matchdayNumber","==",matchdayNumber).limit(1).get();
  if (!prev.empty) throw new Error("already-picked-this-matchday");

  const used = await db.collection("picks")
    .where("userId","==",uid).where("seasonId","==",seasonId)
    .where("teamId","==",teamId).limit(1).get();
  if (!used.empty) throw new Error("team-already-used-this-season");

  const mdId = `${seasonId}__${matchdayNumber}`;
  const md = await db.collection("matchdays").doc(mdId).get();
  if (!md.exists) throw new Error("matchday-not-found");
  if ((md.data() as any).status !== "open") throw new Error("matchday-closed");

  const id = `${uid}__${seasonId}__${matchdayNumber}`;
  await db.collection("picks").doc(id).set({
    id, userId: uid, displayName: req.auth!.token.name || req.auth!.token.email,
    seasonId, matchdayNumber, teamId, createdAt: Timestamp.now()
  });

  return { ok: true };
});

// 2) Procesar jornada (suma puntos a leaderboards)
export const processMatchday = onCall({ region: REGION }, async (req) => {
  assertAdmin(req);
  const { seasonId, matchdayNumber } = req.data || {};
  if (!seasonId || !matchdayNumber) throw new Error("missing-fields");

  const matchesSnap = await db.collection("matches")
    .where("seasonId","==",seasonId).where("matchdayNumber","==",matchdayNumber).get();
  const picksSnap = await db.collection("picks")
    .where("seasonId","==",seasonId).where("matchdayNumber","==",matchdayNumber).get();

  const matches = matchesSnap.docs.map(d => d.data() as any);
  const pointsByUser = new Map<string, number>();

  for (const pDoc of picksSnap.docs) {
    const p = pDoc.data() as any;
    const m = matches.find((mm:any)=> mm.homeId===p.teamId || mm.awayId===p.teamId);
    let pts = 0;
    if (m) {
      if (m.result === "DRAW") pts = 0.5;
      else if (m.result === "HOME" && m.homeId === p.teamId) pts = 1;
      else if (m.result === "AWAY" && m.awayId === p.teamId) pts = 1;
    }
    pointsByUser.set(p.userId, (pointsByUser.get(p.userId) || 0) + pts);
  }

  for (const [uid, pts] of pointsByUser) {
    const lbRef = db.collection("leaderboards").doc(`${seasonId}__${uid}`);
    const snap = await lbRef.get();
    const prev = (snap.data() as any)?.points || 0;

    const anyPick = picksSnap.docs.find(d => (d.data() as any).userId === uid);
    const displayName = anyPick ? ((anyPick.data() as any).displayName || "") : "";

    await lbRef.set({
      id: `${seasonId}__${uid}`,
      seasonId, userId: uid,
      displayName,
      points: prev + pts
    }, { merge: true });
  }

  await db.collection("matchdays").doc(`${seasonId}__${matchdayNumber}`).set({ status: "processed" }, { merge: true });
  return { ok: true, users: pointsByUser.size };
});

// 3) Importar resultados desde API externa
export const ingestResults = onCall({ region: REGION, secrets: [SPORTS_API_KEY] }, async (req) => {
  assertAdmin(req);
  const { seasonId, matchdayNumber } = req.data || {};
  if (!seasonId || !matchdayNumber) throw new Error("missing-fields");
  const key = SPORTS_API_KEY.value();
  if (!key) throw new Error("sports-api-key-missing");

  const endpoint = process.env.SPORTS_ENDPOINT || "https://api.tu-proveedor.com/laliga/matchday";
  const url = `${endpoint}?season=${encodeURIComponent(seasonId)}&md=${matchdayNumber}`;

  const resp = await fetch(url, { headers: { Authorization: `Bearer ${key}` } as any });
  if (!resp.ok) throw new Error(`sports-api ${resp.status}`);
  const data = await resp.json() as { matches: Array<{ homeId:string; awayId:string; result:'HOME'|'AWAY'|'DRAW' }> };

  let updated = 0;
  for (const m of data.matches) {
    const id = `${seasonId}__${matchdayNumber}__${m.homeId}-${m.awayId}`;
    const ref = db.collection("matches").doc(id);
    if ((await ref.get()).exists) { await ref.update({ result: m.result }); updated++; }
  }
  return { updated };
});

// 4) Resumen IA callable (guarda en summaries y devuelve)
export const generateSummary = onCall({ region: REGION, secrets: [GEMINI_API_KEY] }, async (req) => {
  assertAdmin(req);
  const { seasonId, matchdayNumber } = req.data || {};
  if (!seasonId || !matchdayNumber) throw new Error("missing-fields");

  const [mSnap, pSnap] = await Promise.all([
    db.collection("matches").where("seasonId","==",seasonId).where("matchdayNumber","==",matchdayNumber).get(),
    db.collection("picks").where("seasonId","==",seasonId).where("matchdayNumber","==",matchdayNumber).get(),
  ]);

  const matches = mSnap.docs.map(d=>d.data());
  const picks = pSnap.docs.map(d=>d.data());

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const apiKey = GEMINI_API_KEY.value();
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const prompt = `Genera un resumen (≤120 palabras) Jornada ${matchdayNumber} LaLiga ${seasonId}.
Resultados: ${JSON.stringify(matches)}
Picks: ${JSON.stringify(picks.map((p:any)=>({userId:p.userId, displayName:p.displayName, teamId:p.teamId})))}
Devuelve TEXTO PLANO.`;

  const out = await model.generateContent(prompt);
  const text = out.response.text();

  await db.collection("summaries").doc(`${seasonId}__${matchdayNumber}`).set({
    seasonId, matchdayNumber, text, createdAt: Timestamp.now()
  }, { merge:true });

  return { text };
});

// 5) Admin: siembra de datos (equipos + partidos + matchdays)
export const adminSeed = onCall({ region: REGION }, async (req) => {
  assertAdmin(req);
  const { seasonId, teams = [], matches = [] } = req.data || {};
  if (!seasonId) throw new Error("missing-seasonId");

  const batch = db.batch();

  // teams
  for (const t of teams) {
    const id = String(t.id);
    const ref = db.collection("teams").doc(id);
    batch.set(ref, { id, name: t.name, shortName: t.shortName || id.toUpperCase(), crestUrl: t.crestUrl || "" }, { merge: true });
  }

  // matches + matchdays
  const mdSet = new Set<number>();
  for (const m of matches) {
    const md = Number(m.matchdayNumber);
    mdSet.add(md);
    const id = `${seasonId}__${md}__${m.homeId}-${m.awayId}`;
    const ref = db.collection("matches").doc(id);
    batch.set(ref, {
      id, seasonId, matchdayNumber: md, homeId: m.homeId, awayId: m.awayId,
      order: Number(m.order ?? 0), result: m.result ?? null
    }, { merge: true });
  }
  for (const md of mdSet) {
    const ref = db.collection("matchdays").doc(`${seasonId}__${md}`);
    batch.set(ref, { id: `${seasonId}__${md}`, seasonId, matchdayNumber: md, status: "open" }, { merge: true });
  }

  await batch.commit();
  return { ok: true, teams: teams.length, matches: matches.length, matchdays: mdSet.size };
});

// 6) Cambiar estado de jornada
export const setMatchdayStatus = onCall({ region: REGION }, async (req) => {
  assertAdmin(req);
  const { seasonId, matchdayNumber, status } = req.data || {};
  if (!seasonId || !matchdayNumber || !status) throw new Error("missing-fields");
  await db.collection("matchdays").doc(`${seasonId}__${matchdayNumber}`).set({ status }, { merge: true });
  return { ok: true };
});

// 7) Publicar snapshot en vivo (RTDB) manualmente
export const refreshLive = onCall({ region: REGION }, async (req) => {
  assertAdmin(req);
  const { seasonId, matchdayNumber } = req.data || {};
  if (!seasonId || !matchdayNumber) throw new Error("missing-fields");
  const out = await publishLive(seasonId, Number(matchdayNumber));
  return { ok: true, size: { picks: out.picks.length, matches: out.matches.length, leaderboard: out.leaderboard.length } };
});

// ===================================
//  B) HTTP onRequest (público)
// ===================================

// 8) Foto pública de la jornada (JSON)
export const publicSnapshot = onRequest({ region: REGION }, async (req, res) => {
  try {
    res.set("Access-Control-Allow-Origin", "*");
    const seasonId = String(req.query.seasonId ?? "2025-26");
    const md = Number(req.query.md ?? 1);
    const out = await buildSnapshot(seasonId, md);
    res.set("Cache-Control","public, max-age=30, s-maxage=30");
    res.json({ seasonId, md, ...out });
  } catch (e:any) {
    console.error(e);
    res.status(500).json({ error: e.message || "error" });
  }
});

// 9) Resumen IA HTTP (markdown)
export const matchdaySummary = onRequest({ region: REGION, secrets: [GEMINI_API_KEY] }, async (req, res) => {
  try {
    res.set("Access-Control-Allow-Origin", "*");
    const seasonId = String(req.query.seasonId ?? "2025-26");
    const md = Number(req.query.md ?? 1);

    const [pSnap, mSnap, lSnap] = await Promise.all([
      db.collection("picks").where("seasonId","==",seasonId).where("matchdayNumber","==",md).get(),
      db.collection("matches").where("seasonId","==",seasonId).where("matchdayNumber","==",md).get(),
      db.collection("leaderboards").where("seasonId","==",seasonId).get(),
    ]);
    const picks = pSnap.docs.map(d => d.data());
    const matches = mSnap.docs.map(d => d.data());
    const leader = lSnap.docs.map(d => d.data() as any).sort((a,b)=> Number(b.points)-Number(a.points)).slice(0,10);

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const apiKey = GEMINI_API_KEY.value();
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = [
      `Eres el cronista de la porra ByZapa (LaLiga ${seasonId}).`,
      `Genera un resumen de 100-130 palabras de la Jornada ${md}.`,
      `Partidos: ${JSON.stringify(matches)}`,
      `Picks: ${JSON.stringify(picks.map((p:any)=>({userId:p.userId, displayName:p.displayName, teamId:p.teamId})))}`,
      `Top: ${JSON.stringify(leader.map((l:any)=>({displayName:l.displayName, points:l.points})))}`,
      `Usa Markdown simple (título + viñetas). Español neutro.`
    ].join("\n");

    const out = await model.generateContent(prompt);
    const text = out.response.text();
    res.json({ seasonId, md, summary: text });
  } catch (e:any) {
    console.error(e);
    res.status(500).json({ error: e.message || "error" });
  }
});

// ===================================
//  C) Triggers automáticos para "live"
// ===================================

function parseMdFromPickId(id: string, data: any) {
  const parts = id.split("__");
  if (parts.length === 3) return { seasonId: parts[1], md: Number(parts[2]) };
  return { seasonId: data?.seasonId, md: Number(data?.matchdayNumber) };
}
function parseMdFromMatchId(id: string, data: any) {
  const [seasonId, mdStr] = String(id).split("__");
  const md = Number(mdStr);
  return { seasonId, md };
}

export const liveOnPickWrite = onDocumentWritten(
  { region: REGION, document: "picks/{pickId}" },
  async (event) => {
    const after = event.data?.after?.data();
    const before = event.data?.before?.data();
    const id = event.params.pickId as string;
    const info = parseMdFromPickId(id, after || before);
    if (!info.seasonId || !info.md) return;
    await publishLive(info.seasonId, info.md);
  }
);

export const liveOnMatchWrite = onDocumentWritten(
  { region: REGION, document: "matches/{matchId}" },
  async (event) => {
    const id = event.params.matchId as string;
    const data = event.data?.after?.data() || event.data?.before?.data();
    const info = parseMdFromMatchId(id, data);
    if (!info.seasonId || !info.md) return;
    await publishLive(info.seasonId, info.md);
  }
);
