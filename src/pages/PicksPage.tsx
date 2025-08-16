import { useEffect, useState } from 'react'
import { auth, db } from '../firebase'
import { collection, getDocs } from 'firebase/firestore'
import { submitPickFn } from '../lib/functions'
import { useAppConfig } from '../lib/config'

export default function PicksPage() {
  const { seasonId, matchdayNumber } = useAppConfig()
  const [teams, setTeams] = useState<any[]>([])
  const [teamId, setTeamId] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    getDocs(collection(db, 'teams')).then(s => setTeams(s.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

  const send = async () => {
    if (!auth.currentUser) return alert('Inicia sesión')
    if (!teamId) return
    setSending(true)
    try {
      await submitPickFn({ seasonId, matchdayNumber, teamId: teamId.trim().toLowerCase() })
      alert('Pick enviado ✅')
    } catch (e: any) {
      alert(e.message || e.code)
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-bold">Mi pick — Jornada {matchdayNumber}</h1>
      <div className="rounded-xl border border-white/5 bg-slate-900 p-4 flex flex-col sm:flex-row gap-3 items-center">
        <select className="bg-slate-800 p-2 rounded w-full sm:w-80" value={teamId} onChange={e => setTeamId(e.target.value)}>
          <option value="">-- Elige equipo --</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button
          className="rounded-lg px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
          disabled={!teamId || sending}
          onClick={send}
        >
          {sending ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
      <p className="text-xs opacity-60">Recuerda: no puedes repetir equipo durante la temporada.</p>
    </section>
  )
}
