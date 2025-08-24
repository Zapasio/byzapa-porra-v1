// src/services/football.ts
import axios from "axios";

/**
 * LaLiga (1ª) en TheSportsDB:
 *  - idLeague = "4335"
 * Temporada deseada: 2025-2026
 * KEY: usa tu key o 123 para test
 */
const KEY = import.meta.env.VITE_TSD_API_KEY || "123";
const LEAGUE_ID = import.meta.env.VITE_TSD_LEAGUE_ID || "4335";     // LaLiga 1ª
const SEASON = import.meta.env.VITE_TSD_SEASON || "2025-2026";
const API_BASE = `https://www.thesportsdb.com/api/v1/json/${KEY}`;

/** Normaliza cadena para comparar nombres (evita líos con tildes/mayúsculas) */
function norm(s: string | undefined) {
  return (s ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** Equipos de LaLiga con escudo; filtramos por país y deporte para evitar ruido */
export async function getTeams() {
  const url = `${API_BASE}/lookup_all_teams.php?id=${LEAGUE_ID}`;
  const { data } = await axios.get(url);
  let teams = data?.teams ?? [];
  teams = teams.filter(
    (t: any) =>
      ["spain", "españa", "espana"].includes(norm(t?.strCountry)) &&
      ["soccer", "football"].includes(norm(t?.strSport))
  );
  // Orden alfabético por nombre de equipo
  teams.sort((a: any, b: any) => norm(a?.strTeam).localeCompare(norm(b?.strTeam)));
  return teams;
}

/** Eventos crudos de la temporada (toda la 25/26 de LaLiga) */
export async function getSeasonEventsRaw() {
  const url = `${API_BASE}/eventsseason.php?id=${LEAGUE_ID}&s=${encodeURIComponent(SEASON)}`;
  const { data } = await axios.get(url);
  return data?.events ?? [];
}

/** Eventos filtrados (asegura idLeague y/o nombre de liga contenga "La Liga") */
export async function getSeasonEvents() {
  const events = await getSeasonEventsRaw();
  return events.filter(
    (ev: any) =>
      String(ev?.idLeague) === String(LEAGUE_ID) ||
      /la\s*liga/i.test(ev?.strLeague ?? "")
  );
}

/** Agrupa por jornada (intRound) y devuelve Map<jornada, fixtures[]> */
export async function getSeasonFixturesByRound() {
  const events = await getSeasonEvents();

  // Limpieza básica por si viene algún registro incompleto
  const cleaned = events
    .filter((ev: any) => ev?.strHomeTeam && ev?.strAwayTeam && ev?.idEvent)
    .map((ev: any) => ({
      idEvent: String(ev.idEvent),
      round: Number(ev.intRound || 0) || 0,
      home: ev.strHomeTeam as string,
      away: ev.strAwayTeam as string,
      date: ev.dateEvent as string | undefined,
    }));

  const byRound = new Map<number, Array<{ idEvent: string; home: string; away: string; date?: string }>>();
  for (const ev of cleaned) {
    if (!byRound.has(ev.round)) byRound.set(ev.round, []);
    byRound.get(ev.round)!.push({ idEvent: ev.idEvent, home: ev.home, away: ev.away, date: ev.date });
  }
  return byRound;
}
