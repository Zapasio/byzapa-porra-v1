# ByZapa Porra — Handoff Frontend

## Stack
- React + Vite + TypeScript + Tailwind v4
- Firebase: Auth (Google), Firestore, Cloud Functions (2ª gen, europe-west1)

## Variables de entorno (Frontend)
Crear `.env.local` (o variables en Vercel) SIN secretos:

VITE_FIREBASE_API_KEY=<TU_BROWSER_KEY>
VITE_FIREBASE_AUTH_DOMAIN=byzapa-porra-v1.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=byzapa-porra-v1
VITE_FIREBASE_STORAGE_BUCKET=byzapa-porra-v1.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=618449953181
VITE_FIREBASE_APP_ID=1:618449953181:web:1986a4312a60a02df60f74

> Usa exactamente los valores que aparecen en **Firebase → Configuración del proyecto → General → SDK de Firebase para Web**.  
> **Nunca** pongas claves privadas en el front.

## Contrato de datos (Firestore)
- `teams/{id}` → `{ name }`
- `matchdays/{seasonId__number}` → `{ seasonId, number, status: 'open'|'locked'|'processed' }`
- `matches/{seasonId__number__home-away}` → `{ seasonId, matchdayNumber, homeTeamId, awayTeamId, kickoff(Timestamp), result: 'HOME'|'AWAY'|'DRAW'|null }`
- `picks/{autoId}` → `{ userId, displayName, seasonId, matchdayNumber, teamId, createdAt(Timestamp) }`
- `leaderboards/{seasonId__number}` → `{ items: LeaderboardItem[] }` (flexible)

Tipos en `src/lib/types.ts`.

## Reglas de seguridad (resumen)
- Lectura pública de `teams`, `matchdays`, `matches`, `leaderboards`.
- Escritura de `teams/matchdays/matches` **solo admin** (custom claim `admin: true`).
- `picks` solo los escribe la **Function** `submitPick`.  
Reglas completas en `firestore.rules` del repo.

## Endpoints (Cloud Functions) — usar wrappers
- `bootstrapAdmin()` → otorga claim admin al usuario actual.
- `submitPick({ seasonId, matchdayNumber, teamId })` → valida y guarda pick (no repetir equipo).
- `processMatchday({ seasonId, matchdayNumber })` → procesa resultados y clasificaciones.

Wrappers listos en `src/lib/functions.ts`.

## Rutas mínimas a implementar o mejorar
- `/login` → botón “Entrar con Google” (popup + fallback redirect).
- `/picks` → selector de equipo + enviar (usa `submitPick`).
- `/standings` → tabla de clasificación.
- `/admin` (solo admin) → sembrar equipos/jornadas, bloquear picks, marcar resultados, procesar jornada.

## Arranque local
```bash
npm i
npm run dev

    Para probar en el móvil: vite.config.ts con server.host=true y añadir tu IP en Firebase → Auth → Dominios autorizados.

Estándares

    Tailwind v4 con clases inline (no @apply en runtime).

    No tocar reglas ni Functions desde UI.

    Accesibilidad básica, feedback claro de errores.
---

Ahora:

```powershell
mkdir .\src\lib -Force
notepad .\src\lib\types.tsexport type MatchResult = 'HOME' | 'AWAY' | 'DRAW' | null;

export interface Team { id: string; name: string; }

export interface Matchday {
  seasonId: string;
  number: number;
  status: 'open' | 'locked' | 'processed';
}

export interface Match {
  id: string;
  seasonId: string;
  matchdayNumber: number;
  homeTeamId: string;
  awayTeamId: string;
  kickoff: any;        // Firebase Timestamp
  result: MatchResult;
}

export interface Pick {
  id: string;
  userId: string;
  displayName: string;
  seasonId: string;
  matchdayNumber: number;
  teamId: string;
  createdAt: any;      // Timestamp
}

export interface LeaderboardItem {
  uid: string;
  displayName: string;
  points: number;
  played?: number;
  wins?: number;
}

export interface Leaderboard {
  id: string;
  items: LeaderboardItem[];
}

