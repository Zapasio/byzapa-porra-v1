import { useEffect, useState } from 'react'
import { auth, provider } from '../firebase'
import {
  signInWithPopup, signInWithRedirect, getRedirectResult,
  setPersistence, browserLocalPersistence
} from 'firebase/auth'
import { useLocation, useNavigate } from 'react-router-dom'

const shouldUseRedirect = () => {
  const ua = navigator.userAgent || ''
  const inApp = /(FBAN|FBAV|Instagram|Line|WhatsApp|MicroMessenger)/i.test(ua)
  const iOS = /iPhone|iPad|iPod/i.test(ua)
  return iOS || inApp
}

export default function LoginPage() {
  const nav = useNavigate()
  const loc = useLocation() as any
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getRedirectResult(auth).then(() => {
      if (auth.currentUser) {
        const to = (loc.state?.from?.pathname as string) || '/picks'
        nav(to, { replace: true })
      }
    }).catch(() => {})
  }, [])

  const login = async () => {
    setLoading(true)
    try {
      await setPersistence(auth, browserLocalPersistence)
      if (shouldUseRedirect() || new URLSearchParams(location.search).get('redirect')==='1') {
        await signInWithRedirect(auth, provider); return
      }
      await signInWithPopup(auth, provider)
      const to = (loc.state?.from?.pathname as string) || '/picks'
      nav(to, { replace: true })
    } catch (e:any) {
      const code = e?.code || ''
      if (code==='auth/popup-closed-by-user' || code==='auth/popup-blocked' || code==='auth/cancelled-popup-request') {
        await signInWithRedirect(auth, provider); return
      }
      alert(e?.message || code || 'Error de autenticación')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-[60vh] grid place-items-center">
      <button onClick={login} disabled={loading}
        className="rounded-lg px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50">
        {loading ? 'Conectando…' : 'Entrar con Google'}
      </button>
      <p className="text-xs opacity-70 mt-3">
        ¿Problemas? <a className="underline" href="/login?redirect=1">Forzar redirect</a>
      </p>
    </div>
  )
}
