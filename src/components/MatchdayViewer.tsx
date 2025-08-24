// src/components/MatchdayViewer.tsx
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import JornadaPreview from "./JornadaPreview";

type Props = {
  userId: string;
  username: string;
};

type TeamDoc = {
  name: string;
  short?: string;
  logo?: string;
};

type MatchDoc = {
  hometeamid: string;
  awayteamid: string;
  seasonid: string;          // p.ej. "2025-26"
  matchdaynumber: number;    // p.ej. 1
  kickoff: Timestamp;        // timestamp de Firebase
  result?: string | null;
};

export default function MatchdayViewer({ userId, username }: Props) {
  // 👇 ajusta estos valores si quieres otra jornada por defecto
  const [seasonId, setSeasonId] = useState("2025-26");
  const [matchday, setMatchday] = useState(1);

  const [teams, setTeams] = useState<Record<string, TeamDoc>>({});
  const [matches, setMatches] = useState<MatchDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // id único para la previa de esta jornada (colección: aiPreviews/{id})
  const matchdayId = useMemo(
    () => `${seasonId}__${matchday}`,
    [seasonId, matchday]
  );

  // Cargar equipos (map por id -> {name, logo…})
  useEffect(() => {
    let alive = true;
    (async () => {
      const snap = await getDocs(collection(db, "teams"));
      const map: Record<string, TeamDoc> = {};
      snap.forEach((d) => (map[d.id] = d.data() as TeamDoc));
      if (alive) setTeams(map);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Cargar partidos de la jornada seleccionada
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const qy = query(
        collection(db, "matches"),
        where("seasonid", "==", seasonId),
        where("matchdaynumber", "==", matchday)
      );
      const qs = await getDocs(qy);
      const list: MatchDoc[] = qs.docs.map((d) => d.data() as MatchDoc);
      if (alive) {
        setMatches(list);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [seasonId, matchday]);

  return (
    <div className="max-w-5xl mx-auto px-4 pb-12">
      {/* Cabecera */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-yellow-400">
            Jornada {matchday} · {seasonId}
          </h2>
          <p className="text-sm text-gray-300">
            Jugador: <span className="font-medium">{username}</span>
          </p>
        </div>

        {/* Selectores rápidos (opcional) */}
        <div className="flex gap-2">
          <select
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
            title="Temporada"
          >
            {/* Añade aquí más temporadas si quieres */}
            <option value="2025-26">2025-26</option>
          </select>

          <select
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
            value={matchday}
            onChange={(e) => setMatchday(Number(e.target.value))}
            title="Jornada"
          >
            {Array.from({ length: 38 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                J-{n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 🧠 Previa AI para esta jornada */}
      <JornadaPreview matchdayId={matchdayId} />

      {/* Lista de partidos */}
      <div className="mt-4 rounded border border-gray-700 bg-gray-800/40">
        <div className="px-3 py-2 border-b border-gray-700 font-semibold text-yellow-400">
          Jornada
        </div>

        {loading && (
          <div className="px-3 py-6 text-center text-gray-400">Cargando…</div>
        )}

        {!loading && matches.length === 0 && (
          <div className="px-3 py-6 text-center text-gray-400">
            No hay partidos para esta jornada.
          </div>
        )}

        {!loading &&
          matches.map((m, idx) => {
            const h = teams[m.hometeamid];
            const a = teams[m.awayteamid];
            const kickoff = m.kickoff?.toDate?.() ?? new Date();
            const hora = kickoff.toLocaleString();

            return (
              <div
                key={`${m.hometeamid}-${m.awayteamid}-${idx}`}
                className="px-3 py-3 border-t border-gray-800 flex justify-between items-center"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {h?.name ?? m.hometeamid}
                  </span>
                  <span className="opacity-70">vs</span>
                  <span className="font-semibold">
                    {a?.name ?? m.awayteamid}
                  </span>
                </div>

                <div className="text-sm text-gray-300">
                  {m.result ? (
                    <span className="font-medium">{m.result}</span>
                  ) : (
                    <span className="opacity-80">{hora}</span>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* (a futuro) aquí podrías renderizar el bloque de “Mis elecciones” */}
      <div className="mt-6 rounded border border-yellow-700 bg-gray-900/60">
        <div className="px-3 py-2 font-semibold text-yellow-400">
          Elecciones de {username}
        </div>
        <div className="px-3 py-4 text-sm text-gray-400">
          Próximamente: selección de equipo por partido y resumen de picks.
        </div>
      </div>
    </div>
  );
}
