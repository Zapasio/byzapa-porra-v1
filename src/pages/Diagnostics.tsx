import { useEffect, useState } from 'react'
import { auth, db } from '../firebase'
import { getIdTokenResult } from 'firebase/auth'
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore'

type Check = { label: string; ok: boolean; detail?: string }

export default function Diagnostics() {
  const [checks, setChecks] = useState<Check[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    ;(async () => {
      const out: Check[] = []

      const u = auth.currentUser
      out.push({ label: `Auth: usuario`, ok: !!u, detail: u ? `${u.email}` : 'no logueado' })

      let isAdmin = false
      if (u) {
        try {
          const t = await getIdTokenResult(u, true)
          isAdmin = !!t.claims.admin
          out.push({ label: 'Claims: admin', ok: isAdmin, detail: JSON.stringify(t.claims) })
        } catch (e: any) {
          out.push({ label: 'Claims: error al leer', ok: false, detail: e.message || e.code })
        }
      }

      try {
        const snap = await getDocs(collection(db, 'teams'))
        out.push({ label: 'Firestore: teams (lectura)', ok: snap.size >= 0, detail: `count=${snap.size}` })
      } catch (e: any) {
        out.push({ label: 'Firestore: teams (lectura)', ok: false, detail: e.message || e.code })
      }

      try {
        const md = await getDoc(doc(db, 'matchdays', '2025-26__1'))
        out.push({ label: 'Firestore: matchdays/2025-26__1 existe', ok: md.exists(), detail: md.exists() ? 'ok' : 'no existe' })
      } catch (e: any) {
        out.push({ label: 'Firestore: matchday lectura', ok: false, detail: e.message || e.code })
      }

      setChecks(out)
    })()
  }, [])

  const testAdminWrite = async () => {
    setBusy(true)
    try {
      const id = '__diag__' + Date.now()
      await setDoc(doc(db, 'matchdays', id), { seasonId: '2025-26', number: 99, status: 'open', at: Timestamp.now() })
      await deleteDoc(doc(db, 'matchdays', id))
      alert('Escritura admin OK (pudimos crear y borrar un doc).')
    } catch (e: any) {
      alert('Error de escritura: ' + (e.message || e.code))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="max-w-2xl mx-auto grid gap-4">
      <h1 className="text-2xl font-bold">Diagnóstico ByZapa</h1>
      <ul className="space-y-2">
        {checks.map((c, i) => (
          <li key={i} className={`p-3 rounded border ${c.ok ? 'border-emerald-500/30 bg-emerald-900/10' : 'border-rose-500/30 bg-rose-900/10'}`}>
            <div className="font-medium">{c.ok ? '✅' : '❌'} {c.label}</div>
            {c.detail && <div className="text-xs opacity-80 break-all">{c.detail}</div>}
          </li>
        ))}
      </ul>

      <div className="mt-2">
        <button
          onClick={testAdminWrite}
          disabled={busy}
          className="rounded px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
        >
          Probar escritura admin
        </button>
        <p className="text-xs opacity-70 mt-2">
          Si falla con <code>permission-denied</code>, no tienes claim admin o las reglas no permiten escribir.
        </p>
      </div>
    </section>
  )
}
