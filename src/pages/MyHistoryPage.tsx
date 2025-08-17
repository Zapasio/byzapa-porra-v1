import { useEffect, useMemo, useState } from 'react'
import { auth, db } from '../firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { TEAMS_25_26 } from '../lib/teams'

const seasonId = '2025-26'

type PickRow = { matchdayNumber: number; teamId: string }
type Match = { matchdayNumber: number; homeId: string; awayId: string; result?: 'HOME'|'AWAY'|'DRAW' }

export default function MyHistoryPage() {
  const [picks, setPicks] = useState<PickRow[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const teamName = useMemo(() => Object.fromEntries(TEAMS_25_26.map(t => [t.id, t.name])), [])

  useEffect(() => {
    const u = auth.currentUser; if (!u) return
    const qP = query(collection(db, 'picks'),
      where('userId', '==', u.uid), where('seasonId', '==', seasonId))
    getDocs(qP).then(s => {
      const list = s.docs.map(d => d.data() as any)
      setPicks(list.map((p:any)=>({ matchdayNumber: p.matchdayNumber, teamId: p.teamId })))
    })
    const qM = query(collection(db, 'matches'), where('seasonId', '==', seasonId))
    getDocs(qM).then(s => {
      const list = s.docs.map(d => d.data() as any)
      setMatches(list.map((m:any)=>({ matchdayNumber:m.matchdayNumber, homeId:m.homeId, awayId:m.awayId, result:m.result || null })))
    })
  }, [])

  const outcome = (md: number, teamId: string) => {
    const m = matches.find(mm => mm.matchdayNumber===md && (mm.homeId===teamId || mm.awayId===teamId))
    if (!m || !m.result) return { text:'—', pts: 0 }
    if (m.result==='DRAW') return { text:'➖ Empate', pts: 0.5 }
    if (m.result==='HOME' && m.homeId===teamId) return { text:'✅ Victoria', pts: 1 }
    if (m.result==='AWAY' && m.awayId===teamId) return { text:'✅ Victoria', pts: 1 }
    return { text:'❌ Derrota', pts: 0 }
  }

  const rows = picks.sort((a,b)=>a.matchdayNumber-b.matchdayNumber)
  const total = rows.reduce((acc,r)=> acc + outcome(r.matchdayNumber, r.teamId).pts, 0)

  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-bold">Mi historial — {seasonId}</h1>
      <table className="min-w-full text-sm">
        <thead className="text-left opacity-70">
          <tr><th className="py-2">Jornada</th><th>Equipo</th><th>Resultado</th><th>Puntos</th></tr>
        </thead>
        <tbody>
          {rows.map((r,i)=>{
            const o = outcome(r.matchdayNumber, r.teamId)
            return (
              <tr key={i} className="border-t border-white/5">
                <td className="py-2">{r.matchdayNumber}</td>
                <td>{teamName[r.teamId] || r.teamId}</td>
                <td>{o.text}</td>
                <td className="font-semibold">{o.pts}</td>
              </tr>
            )
          })}
          {rows.length===0 && (
            <tr className="border-t border-white/5"><td colSpan={4} className="py-4 opacity-70">Aún no has hecho picks.</td></tr>
          )}
        </tbody>
        <tfoot>
          <tr className="border-t border-white/5 font-semibold">
            <td colSpan={3} className="py-2 text-right">Total</td>
            <td>{total}</td>
          </tr>
        </tfoot>
      </table>
    </section>
  )
}
