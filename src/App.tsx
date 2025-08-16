import React, { useEffect, useState, createContext, useContext } from 'react'
import { Route, Routes, Navigate, useLocation, Link } from 'react-router-dom'
import { auth } from './firebase'
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import LoginPage from './pages/LoginPage'
import PicksPage from './pages/PicksPage'
import AdminPage from './pages/AdminPage'
import StandingsPage from './pages/StandingsPage'
import Diagnostics from './pages/Diagnostics'

type Claims = { admin?: boolean }
const Ctx = createContext<{ user: any; claims: Claims }>({ user: null, claims: {} })
export const useAuthCtx = () => useContext(Ctx)

function Provider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [claims, setClaims] = useState<Claims>({})
  useEffect(() => onAuthStateChanged(auth, async (u) => {
    setUser(u)
    if (u) setClaims({ admin: !!(await getIdTokenResult(u, true)).claims.admin })
    else setClaims({})
  }), [])
  return <Ctx.Provider value={{ user, claims }}>{children}</Ctx.Provider>
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuthCtx()
  const loc = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />
  // devolvemos un elemento JSX siempre
  return <>{children}</>
}

// (si quieres volver a exigir admin en /admin, cambia RequireAuth por RequireAdmin aquí)
export default function App() {
  return (
    <Provider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={useAuthCtx().user ? <Navigate to="/picks" replace /> : <LoginPage />} />
          <Route path="/picks" element={<RequireAuth><PicksPage /></RequireAuth>} />
          <Route path="/standings" element={<RequireAuth><StandingsPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth><AdminPage /></RequireAuth>} />
          <Route path="/diag" element={<RequireAuth><Diagnostics /></RequireAuth>} />
          <Route path="*" element={
            <div className="p-8">
              <h1 className="text-2xl font-bold mb-2">404</h1>
              <Link to="/" className="text-emerald-400">Volver al inicio</Link>
            </div>
          } />
        </Routes>
      </Layout>
    </Provider>
  )
}
