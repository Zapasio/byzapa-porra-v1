import React, { useEffect, useState, createContext, useContext } from 'react'
import { Route, Routes, Navigate, useLocation } from 'react-router-dom'
import { auth } from './firebase'
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import LoginPage from './pages/LoginPage'
import PicksPage from './pages/PicksPage'
import AdminPage from './pages/AdminPage'
import StandingsPage from './pages/StandingsPage'
import Diagnostics from './pages/Diagnostics'
import AllPicksPage from './pages/AllPicksPage'
import MyHistoryPage from './pages/MyHistoryPage'

type Claims = { admin?: boolean }
const Ctx = createContext<{ user: any; claims: Claims }>({ user: null, claims: {} })
export const useAuthCtx = () => useContext(Ctx)

function Provider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [claims, setClaims] = useState<Claims>({})
  useEffect(()=> onAuthStateChanged(auth, async (u)=>{
    setUser(u)
    if(u){ const t=await getIdTokenResult(u,true); setClaims({ admin: !!t.claims.admin }) } else setClaims({})
  }),[])
  return <Ctx.Provider value={{ user, claims }}>{children}</Ctx.Provider>
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuthCtx(); const loc = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />
  return <>{children}</>
}
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, claims } = useAuthCtx(); const loc = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />
  if (!claims?.admin) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Provider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/picks" element={<RequireAuth><PicksPage /></RequireAuth>} />
          <Route path="/all-picks" element={<RequireAuth><AllPicksPage /></RequireAuth>} />
          <Route path="/history" element={<RequireAuth><MyHistoryPage /></RequireAuth>} />
          <Route path="/standings" element={<RequireAuth><StandingsPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
          <Route path="/diag" element={<RequireAuth><Diagnostics /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Provider>
  )
}
