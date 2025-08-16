import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { auth, provider } from '../firebase'
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/picks' // a dónde volver tras login

  // Si ya estás logueado, sal de /login automáticamente
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) navigate(from, { replace: true })
    })
    return () => unsub()
  }, [navigate, from])

  const signin = async () => {
    try {
      await signInWithPopup(auth, provider)
      // la redirección la hace onAuthStateChanged de arriba
    } catch (e: any) {
      alert(e.message || e.code)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 bg-slate-900 p-6 rounded">
      <h1 className="text-2xl font-bold mb-4">Entrar</h1>
      <button className="bg-emerald-600 px-4 py-2 rounded" onClick={signin}>
        Entrar con Google
      </button>
    </div>
  )
}
