import * as admin from 'firebase-admin'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'

admin.initializeApp()
const db = admin.firestore()

// --- Secrets (Blaze) ---
const ADMIN_EMAIL = defineSecret('ADMIN_EMAIL')
// (opcional, por si luego conectas APIs)
const SPORTS_API_KEY = defineSecret('SPORTS_API_KEY')
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY')

// --- Hacer admin al email autorizado ---
export const bootstrapAdmin = onCall({ region: 'europe-west1', secrets: [ADMIN_EMAIL] }, async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Inicia sesión')
  const allowed = ADMIN_EMAIL.value()
  const email = (req.auth.token as any)?.email
  if (!email || email !== allowed) throw new HttpsError('permission-denied', 'No autorizado')
  await admin.auth().setCustomUserClaims(req.auth.uid, { admin: true })
  return { ok: true }
})

// --- Enviar pick (normaliza a minúsculas, evita repetir equipo) ---
export const submitPick = onCall({ region: 'europe-west1' }, async (req) => {
  const uid = req.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Inicia sesión')

  const { seasonId, matchdayNumber, teamId } =
    req.data as { seasonId: string; matchdayNumber: number; teamId: string }
  if (!seasonId || !matchdayNumber || !teamId) throw new HttpsError('invalid-argument', 'Faltan datos')

  const normTeamId = String(teamId).trim().toLowerCase()

  const mdId = `${seasonId}__${matchdayNumber}`
  const mdSnap = await db.collection('matchdays').doc(mdId).get()
  if (!mdSnap.exists) throw new HttpsError('failed-precondition', 'Jornada no existe')
  const md = mdSnap.data()!
  if (md.status !== 'open') throw new HttpsError('failed-precondition', 'Jornada no está abierta')

  const pickId = `${uid}__${seasonId}__${matchdayNumber}`
  if ((await db.collection('picks').doc(pickId).get()).exists)
    throw new HttpsError('already-exists', 'Ya elegiste esta jornada')

  const dup = await db.collection('picks')
    .where('uid','==',uid)
    .where('seasonId','==',seasonId)
    .where('teamId','==',normTeamId)
    .limit(1).get()
  if (!dup.empty) throw new HttpsError('failed-precondition', 'No puedes repetir equipo')

  await db.collection('picks').doc(pickId).set({
    uid, seasonId, matchdayNumber,
    teamId: normTeamId,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })
  await db.collection('users').doc(uid).set({
    picksCount: admin.firestore.FieldValue.increment(1)
  }, { merge: true })

  return { ok: true }
})

// --- Procesar jornada (compara IDs en minúsculas) ---
export const processMatchday = onCall({ region: 'europe-west1' }, async (req) => {
  if (!req.auth?.token?.admin) throw new HttpsError('permission-denied', 'Solo admin')

  const { seasonId, matchdayNumber } = req.data as { seasonId: string; matchdayNumber: number }
  const mdRef = db.collection('matchdays').doc(`${seasonId}__${matchdayNumber}`)
  const mdSnap = await mdRef.get()
  if (!mdSnap.exists) throw new HttpsError('failed-precondition', 'Jornada no existe')
  if (mdSnap.data()!.status === 'processed') return { ok: true, msg: 'Ya procesada' }

  const matchesSnap = await db.collection('matches')
    .where('seasonId','==',seasonId).where('matchdayNumber','==',matchdayNumber).get()

  const winners = new Set<string>()
  matchesSnap.forEach(d => {
    const m = d.data() as any
    if (m.result === 'HOME') winners.add(String(m.homeTeamId).toLowerCase())
    if (m.result === 'AWAY') winners.add(String(m.awayTeamId).toLowerCase())
  })

  const picksSnap = await db.collection('picks')
    .where('seasonId','==',seasonId).where('matchdayNumber','==',matchdayNumber).get()

  const batch = db.batch()
  const standings: Record<string, { uid: string; status: 'win'|'out' }> = {}

  for (const p of picksSnap.docs) {
    const pick = p.data() as any
    const win = winners.has(String(pick.teamId).toLowerCase())
    standings[pick.uid] = { uid: pick.uid, status: win ? 'win' : 'out' }
    if (!win) {
      batch.set(db.collection('users').doc(pick.uid), {
        isAlive: false,
        eliminatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true })
    }
  }

  batch.set(db.collection('leaderboards').doc(`${seasonId}__${matchdayNumber}`), {
    seasonId, matchdayNumber, standings,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })
  batch.update(mdRef, { status: 'processed' })
  await batch.commit()
  return { ok: true }
})
