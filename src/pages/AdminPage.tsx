import { useEffect, useState } from 'react'
import { db, auth } from '../firebase'
import { doc, getDoc, updateDoc, collection, query, where, getDocs, Timestamp, setDoc } from 'firebase/firestore'
import { processMatchdayFn, bootstrapAdminFn } from '../lib/functions'
import { useAppConfig } from '../lib/config'
import { TEAMS_25_26 } from '../lib/teams'
import { MD1_25_26 } from '../lib/fixtures_2025_26_md1'

export default function AdminPage() {
  const { seasonId, matchdayNumber } = useAppConfig()
  const mdId = `${seasonId}__${matchdayNumber}`

  const [status, setStatus] = useState<'open'|'locked'|'processed'>('open')
  const [matches, setMatches] = useState<any[]>([])
  const [home, setHome] = useState('rma')
  const [away, setAway] = useState('fcb')
  const [kickoff, setKickoff] = useState('') // YYYY-MM-DDTHH:mm

  const load = async () => {
    const md = await getDoc(doc(db, 'matchdays', mdId))
    setStatus((md.data() as any)?.status || 'open')
    const q = query(
      collection(db, 'matches'),
      where('seasonId', '==', seasonId),
      where('matchdayNumber', '==', matchdayNumber)
    )
    const s = await getDocs(q)
    setMatches(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
  }
  useEffect(() => { load() }, [mdId])

  const addMatch = async () => {
    if (!home || !away || !kickoff) return alert('Rellena home, away y kickoff')
    const id = `${seasonId}__${matchdayNumber}__${home}-${away}`
    const ts = Timestamp.fromDate(new Date(kickoff))
    await setDoc(doc(db, 'matches', id), {
      seasonId, matchdayNumber,
      homeTeamId: home.trim().toLowerCase(),
      awayTeamId: away.trim().toLowerCase(),
      kickoff: ts,
      result: null
    }, { merge: true })
    setKickoff('')
    await load()
  }

  const setResult = async (id: string, result: 'HOME' | 'AWAY' | 'DRAW') => {
    await updateDoc(doc(db, 'matches', id), { result })
    await load()
  }

  const lock = async () => { await updateDoc(doc(db, 'matchdays', mdId), { status: 'locked' }); setStatus('locked') }
  const process = async () => { await processMatchdayFn({ seasonId, matchdayNumber }); setStatus('processed') }

  const makeMeAdmin = async () => {
    if (!auth.currentUser) return alert('Inicia sesión')
    try { await bootstrapAdminFn(); alert('Listo. Pulsa “Salir” y vuelve a entrar para refrescar permisos.') }
    catch (e: any) { console.error(e); alert(e.message || e.code) }
  }

  const seedTeams_Official = async () => {
    for (const t of TEAMS_25_26) {
      await setDoc(doc(db, 'teams', t.id), { name: t.name }, { merge: true })
    }
    alert('Equipos LaLiga 2025/26 sembrados ✅')
  }

  const seedMD1_Official = async () => {
    await setDoc(doc(db, 'matchdays', `${seasonId}__1`), { seasonId, number: 1, status: 'open' }, { merge: true })
    for (const m of MD1_25_26) {
      const id = `${seasonId}__1__${m.home}-${m.away}`
      const ts = Timestamp.fromDate(new Date(m.kickoff))
      await setDoc(doc(db, 'matches', id), {
        seasonId,
        matchdayNumber: 1,
        homeTeamId: m.home,
        awayTeamId: m.away,
        kickoff: ts,
        result: null,
      }, { merge: true })
    }
    alert('Jornada 1 (real) sembrada ✅')
    await load()
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Panel Admin — Jornada {matchdayNumber}</h1>
        <span className="px-2 py-1 text-xs rounded bg-slate-800 border border-white/10">Estado: {status}</span>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <AdminCard title="Roles">
          <button className="rounded-lg px-3 py-2 bg-emerald-600 hover:bg-emerald-500" onClick={makeMeAdmin}>
            Hacerme admin
          </button>
        </AdminCard>

        <AdminCard title="Datos base">
          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg px-3 py-2 bg-emerald-600 hover:bg-emerald-500" onClick={seedTeams_Official}>
              Sembrar equipos 25/26 (oficial)
            </button>
            <button className="rounded-lg px-3 py-2 bg-blue-600 hover:bg-blue-500" onClick={seedMD1_Official}>
              Sembrar Jornada 1 (real)
            </button>
          </div>
        </AdminCard>

        <AdminCard title="Acciones jornada">
          <div className="flex gap-2">
            <button className="rounded-lg px-3 py-2 bg-yellow-600 hover:bg-yellow-500" onClick={lock}>Bloquear picks</button>
            <button className="rounded-lg px-3 py-2 bg-blue-600 hover:bg-blue-500" onClick={process}>Procesar jornada</button>
          </div>
        </AdminCard>
      </div>

      <AdminCard title="Partidos de la jornada">
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            className="bg-slate-800 p-2 rounded w-full sm:w-56"
            placeholder="homeTeamId (rma)"
            value={home}
            onChange={(e) => setHome(e.target.value)}
          />
          <input
            className="bg-slate-800 p-2 rounded w-full sm:w-56"
            placeholder="awayTeamId (fcb)"
            value={away}
            onChange={(e) => setAway(e.target.value)}
          />
          <input
            className="bg-slate-800 p-2 rounded w-full sm:w-56"
            type="datetime-local"
            value={kickoff}
            onChange={(e) => setKickoff(e.target.value)}
          />
          <button className="rounded-lg px-3 py-2 bg-emerald-600 hover:bg-emerald-500" onClick={addMatch}>Añadir</button>
        </div>

        <ul className="space-y-2">
          {matches.map(m => (
            <li key={m.id} className="p-3 rounded bg-slate-900 border border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="font-medium">{m.homeTeamId} vs {m.awayTeamId}</div>
                <div className="text-sm opacity-75">{m.kickoff?.toDate?.().toLocaleString?.() ?? ''}</div>
                <div className="text-sm">resultado: <b>{m.result ?? '—'}</b></div>
              </div>
              <div className="flex gap-2">
                <button className="rounded px-2 py-1 bg-slate-700 hover:bg-slate-600" onClick={() => setResult(m.id, 'HOME')}>HOME</button>
                <button className="rounded px-2 py-1 bg-slate-700 hover:bg-slate-600" onClick={() => setResult(m.id, 'AWAY')}>AWAY</button>
                <button className="rounded px-2 py-1 bg-slate-700 hover:bg-slate-600" onClick={() => setResult(m.id, 'DRAW')}>DRAW</button>
              </div>
            </li>
          ))}
        </ul>
      </AdminCard>
    </section>
  )
}

function AdminCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-slate-900 p-4">
      <h2 className="font-semibold mb-3">{title}</h2>
      <div>{children}</div>
    </div>
  )
}
