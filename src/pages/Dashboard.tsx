import { Link } from 'react-router-dom'
import { useAppConfig } from '../lib/config'

export default function Dashboard() {
  const { seasonId, matchdayNumber } = useAppConfig()
  return (
    <section className="grid gap-6">
      <div className="rounded-2xl p-8 bg-gradient-to-b from-slate-900 to-slate-950 border border-white/5">
        <h1 className="text-3xl font-extrabold tracking-tight">ByZapa Porra — LaLiga {seasonId}</h1>
        <p className="mt-2 opacity-80">Jornada {matchdayNumber}. Elige tu equipo, no lo repitas y ¡sigue en la lucha!</p>
        <div className="mt-6 flex gap-3">
          <Link to="/picks" className="rounded-lg px-4 py-2 bg-emerald-600 hover:bg-emerald-500">Hacer mi pick</Link>
          <Link to="/standings" className="rounded-lg px-4 py-2 bg-slate-800 hover:bg-slate-700">Ver clasificación</Link>
        </div>
      </div>
    </section>
  )
}
