import { useEffect, useState } from 'react'
import { db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'

export function useAppConfig() {
  const [cfg, setCfg] = useState<{ seasonId: string; matchdayNumber: number }>({ seasonId: '2025-26', matchdayNumber: 1 })
  useEffect(() => {
    getDoc(doc(db, 'config', 'app')).then(s => {
      const d = (s.data() as any) || {}
      setCfg({ seasonId: d.seasonId || '2025-26', matchdayNumber: Number(d.matchdayNumber || 1) })
    })
  }, [])
  return cfg
}
