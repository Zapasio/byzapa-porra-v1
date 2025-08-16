import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '../firebase'

// 2ª gen en europe-west1 (ajusta si cambiaste región)
const functions = getFunctions(app, 'europe-west1')

// Contratos tipados para que el LLM/DEV no la líe
export const submitPickFn = httpsCallable<
  { seasonId: string; matchdayNumber: number; teamId: string },
  any
>(functions, 'submitPick')

export const processMatchdayFn = httpsCallable<
  { seasonId: string; matchdayNumber: number },
  any
>(functions, 'processMatchday')

export const bootstrapAdminFn = httpsCallable<void, any>(
  functions,
  'bootstrapAdmin'
)
