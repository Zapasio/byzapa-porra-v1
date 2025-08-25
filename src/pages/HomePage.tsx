import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <section className="grid gap-4 text-center">
      <h1 className="text-3xl font-bold text-emerald-400">ByZapa Porra</h1>
      <p>Inicia sesión para enviar tus picks de cada jornada.</p>
      <div className="space-x-4">
        <Link to="/login" className="underline text-emerald-400">Entrar</Link>
        <Link to="/picks" className="underline text-emerald-400">Ir a Picks</Link>
      </div>
    </section>
  )
}
