import { Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuthCtx } from '../App'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, claims } = useAuthCtx()
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/5 bg-slate-900/80 backdrop-blur">
        <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
          <Link to="/" className="text-emerald-400 font-extrabold tracking-tight">ByZapa Porra</Link>
          <span className="text-sm opacity-70">LaLiga 2025/26</span>
          <div className="ml-auto flex items-center gap-4 text-sm">
            <Link to="/picks" className="hover:text-emerald-400">Picks</Link>
            <Link to="/standings" className="hover:text-emerald-400">Clasificación</Link>
            <Link to="/admin" className="hover:text-emerald-400">Admin</Link>
            {user && <button onClick={() => signOut(auth)} className="rounded px-2 py-1 bg-slate-800 hover:bg-slate-700">Salir</button>}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="mt-12 border-t border-white/5 py-6 text-center text-xs opacity-60">
        © {new Date().getFullYear()} ByZapa — React + Vite + Tailwind + Firebase
      </footer>
    </div>
  )
}
