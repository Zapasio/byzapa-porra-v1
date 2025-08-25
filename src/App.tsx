import { createContext, useContext, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { onAuthStateChanged, getIdTokenResult, type User } from 'firebase/auth'
import { auth } from './firebase'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import PicksPage from './pages/PicksPage'
import AllPicksPage from './pages/AllPicksPage'
import MyHistoryPage from './pages/MyHistoryPage'
import AdminPage from './pages/AdminPage'

type AuthCtx = {
  user: User | null
  claims: Record<string, any> | null
}

const AuthContext = createContext<AuthCtx>({ user: null, claims: null })
export const useAuthCtx = () => useContext(AuthContext)

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [claims, setClaims] = useState<Record<string, any> | null>(null)

  useEffect(() => {
    return onAuthStateChanged(auth, async u => {
      setUser(u)
      if (u) {
        const res = await getIdTokenResult(u)
        setClaims(res.claims)
      } else {
        setClaims(null)
      }
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, claims }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="picks" element={<PicksPage />} />
            <Route path="all-picks" element={<AllPicksPage />} />
            <Route path="history" element={<MyHistoryPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}
