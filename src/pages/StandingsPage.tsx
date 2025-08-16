import { useEffect, useState } from 'react'
import { db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useAppConfig } from '../lib/config'

type Row = { uid: string; status: 'win' | 'out' }

export default function StandingsPage() {
  const { seasonId, matchdayNumber } = useAppConfig()
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    getDoc(doc(db, 'leaderboards', `${seasonId}__${matchdayNumber}`)).then(s => {
      const data = s.data() as any
      if (data?.standings) setRows(Object.values(data.standings))
      else setRows([])
    })
  }, [seasonId, matchdayNumber])

  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-bold">Clasificación — Jornada {matchdayNumber}</h1>
      <div className="rounded-xl border border-white/5 bg-slate-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/60">
            <tr>
              <th className="text-left px-4 py-2">Jugador</th>
              <th className="text-left px-4 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="px-4 py-4 opacity-60" colSpan={2}>Aún no hay resultados.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.uid} className="border-t border-white/5">
                <td className="px-4 py-2">{r.uid}</td>
                <td className="px-4 py-2">
                  <span className={r.status === 'win' ? 'text-emerald-400' : 'text-rose-400'}>
                    {r.status === 'win' ? 'Sigue en juego' : 'Eliminado'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
