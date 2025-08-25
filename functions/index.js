// functions/index.js
const admin = require("firebase-admin");

// ⚙️ Firebase Functions v2 (NO usar functions.region)
const { setGlobalOptions } = require("firebase-functions/v2");
const { onRequest, onCall } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");

// Región y límites globales
setGlobalOptions({
  region: "europe-west1",
  memory: "256MiB",
  maxInstances: 5,
});

// Inicializa Admin una única vez
try { admin.app(); } catch { admin.initializeApp(); }
const db = admin.firestore();

// Helpers de respuesta
const ok = (res, data = {}) => res.status(200).json({ ok: true, ...data });
const fail = (res, e) => {
  console.error(e);
  res.status(500).json({ ok: false, error: e?.message || String(e) });
};

// ================= HTTPS (por URL) =================
exports.adminSeed = onRequest(async (req, res) => {
  try {
    // TODO: sembrar colecciones (teams, jornadas…)
    return ok(res, { msg: "adminSeed stub ejecutado" });
  } catch (e) { return fail(res, e); }
});

exports.bootstrapAdmin = onRequest(async (req, res) => {
  try {
    return ok(res, { msg: "bootstrapAdmin stub ejecutado" });
  } catch (e) { return fail(res, e); }
});

exports.generateSummary = onRequest(async (req, res) => {
  try {
    return ok(res, { msg: "generateSummary stub ejecutado" });
  } catch (e) { return fail(res, e); }
});

exports.ingestResults = onRequest(async (req, res) => {
  try {
    return ok(res, { msg: "ingestResults stub ejecutado" });
  } catch (e) { return fail(res, e); }
});

exports.matchdaySummary = onRequest(async (req, res) => {
  try {
    return ok(res, { msg: "matchdaySummary stub ejecutado" });
  } catch (e) { return fail(res, e); }
});

exports.processMatchday = onRequest(async (req, res) => {
  try {
    return ok(res, { msg: "processMatchday stub ejecutado" });
  } catch (e) { return fail(res, e); }
});

exports.publicSnapshot = onRequest(async (req, res) => {
  try {
    return ok(res, { msg: "publicSnapshot stub ejecutado" });
  } catch (e) { return fail(res, e); }
});

exports.refreshLive = onRequest(async (req, res) => {
  try {
    return ok(res, { msg: "refreshLive stub ejecutado" });
  } catch (e) { return fail(res, e); }
});

exports.setMatchdayStatus = onRequest(async (req, res) => {
  try {
    return ok(res, { msg: "setMatchdayStatus stub ejecutado" });
  } catch (e) { return fail(res, e); }
});

// ================= Callable (desde cliente) =================
exports.submitPick = onCall({ region: "us-central1" }, async (request) => {
  const uid = request?.auth?.uid || null;
  if (!uid) {
    const err = new Error("Debes iniciar sesión.");
    err.code = "unauthenticated";
    throw err;
  }
  // TODO: validar y guardar pick
  return { ok: true, msg: "submitPick stub ejecutado", data: request?.data || {} };
});

// ================= Triggers Firestore =================
exports.liveOnMatchWrite = onDocumentWritten("matches/{matchId}", async (event) => {
  const matchId = event.params.matchId;
  const before = event.data?.before?.data() || null;
  const after = event.data?.after?.data() || null;
  console.log("liveOnMatchWrite", { matchId, before, after });
  // TODO: lógica al cambiar un partido
  return;
});

exports.liveOnPickWrite = onDocumentWritten("picks/{pickId}", async (event) => {
  const pickId = event.params.pickId;
  const before = event.data?.before?.data() || null;
  const after = event.data?.after?.data() || null;
  console.log("liveOnPickWrite", { pickId, before, after });
  // TODO: validaciones/side effects
  return;
});

// Opcional healthcheck
exports.health = onRequest((req, res) => ok(res, { msg: "OK", time: new Date().toISOString() }));
