import { useEffect, useMemo, useState } from 'react'
import { db } from '../firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { TEAMS_25_26 } from '../lib/teams'

const seasonId = '2025-26'
const MD_MAX = 38

type PickDoc = { id: string; userId: string; displayName?: string; matchdayNumber: number; teamId: string }

export default function AllPicksPage() {
  const [md, setMd] = useState(1)
  const [rows, setRows] = useState<PickDoc[]>([])
  const teamName = useMemo(() => Object.fromEntries(TEAMS_25_26.map(t => [t.id, t.name])), [])

  const load = async (num: number) => {
    const qy = query(collection(db, 'picks'),
      where('seasonId', '==', seasonId),
      where('matchdayNumber', '==', num)
    )
    const s = await getDocs(qy)
    setRows(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
  }

  useEffect(() => { load(md) }, [md])

  const counts = rows.reduce<Record<string, number>>((acc, p) => {
    acc[p.teamId] = (acc[p.teamId] || 0) + 1; return acc
  }, {})

  return (
    <section className="grid gap-6">
      <div className="flex items-end gap-4">
        <h1 className="text-2xl font-bold">Picks de todos</h1>
        <div>
          <label className="text-sm opacity-80 mr-2">Jornada</label>
          <select className="bg-slate-800 p-2 rounded"
            value={md} onChange={e => setMd(parseInt(e.target.value))}>
            {Array.from({ length: MD_MAX }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
        <h2 className="font-semibold mb-2">Frecuencias</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(counts)
            .sort((a,b)=>b[1]-a[1])
            .map(([id, c]) => (
              <span key={id} className="px-2 py-1 rounded bg-slate-800">{teamName[id] || id} <b>×{c}</b></span>
            ))}
          {rows.length===0 && <div className="opacity-70 text-sm">Sin picks aún.</div>}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
        <h2 className="font-semibold mb-2">Detalle</h2>
        <ul className="divide-y divide-white/5">
          {rows.map(p => (
            <li key={p.id} className="py-2 flex items-center justify-between">
              <span className="opacity-80">{p.displayName || p.userId.slice(0,6)}</span>
              <span className="font-medium">{teamName[p.teamId] || p.teamId}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
