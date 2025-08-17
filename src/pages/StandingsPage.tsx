import { useEffect, useState } from 'react'
import { db } from '../firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

const seasonId = '2025-26'

type Row = { userId:string; displayName?:string; points:number }

export default function StandingsPage() {
  const [rows, setRows] = useState<Row[]>([])
  useEffect(()=>{
    const qy = query(collection(db,'leaderboards'), where('seasonId','==', seasonId))
    getDocs(qy).then(s=>{
      const list = s.docs.map(d=> d.data() as any)
      setRows(list.sort((a:any,b:any)=> (b.points||0)-(a.points||0)))
    })
  }, [])
  return (
    <section className="grid gap-3">
      <h1 className="text-2xl font-bold">Clasificación — {seasonId}</h1>
      <table className="min-w-full text-sm">
        <thead className="text-left opacity-70">
          <tr><th className="py-2">#</th><th>Jugador</th><th>Puntos</th></tr>
        </thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={r.userId} className="border-t border-white/5">
              <td className="py-2">{i+1}</td>
              <td>{r.displayName || r.userId.slice(0,6)}</td>
              <td className="font-semibold">{r.points ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
