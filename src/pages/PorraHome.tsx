// src/pages/PorraHome.tsx
import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import {
  collection, doc, getDoc, query, where, limit, getDocs, orderBy, addDoc, serverTimestamp
} from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";

type Team = {
  id: string;          // ej: "RMA", "FCB"
  name: string;        // "Real Madrid"
  crestUrl: string;    // URL del escudo
};

type Match = {
  id: string;
  date?: string;
  homeTeamId: string;
  awayTeamId: string;
  status?: "scheduled" | "finished" | "live";
};

type Jornada = {
  id: number;                     // 1..38
  status: "open" | "closed";
  deadline?: any;                 // Firestore Timestamp
  matches: Match[];
};

type Pick = {
  uid: string;
  jornadaId: number;
  teamId: string;
  teamName: string;
  createdAt: any;
};

type UserRow = {
  uid: string;
  displayName?: string;
  status?: "Activo" | "Eliminado";
  picksCount: number;
  lastPickAt?: number;
};

const classes = {
  glass: "bg-white/15 backdrop-blur-md border border-white/20",
  teamLogo: "w-[60px] h-[60px] object-contain",
  gold: "text-[#FFD700]",
};

export default function PorraHome() {
  const { firebaseUser, userDoc, loading } = useAuth();

  // Estado UI / datos
  const [currentJornada, setCurrentJornada] = useState<Jornada | null>(null);
  const [teamsMap, setTeamsMap] = useState<Record<string, Team>>({});
  const [userPreviousTeamIds, setUserPreviousTeamIds] = useState<Set<string>>(new Set());
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [leaderboard, setLeaderboard] = useState<UserRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Carga inicial: jornada actual + equipos
  useEffect(() => {
    (async () => {
      // 1) Jornada abierta más cercana
      // Estructura esperada: colección "jornadas" docs: { id: number, status: 'open'|'closed', matches: [] }
      // Si prefieres, puedes tener un doc "settings/currentJornada".
      const jornadasRef = collection(db, "jornadas");
      // primero intentamos coger una "open"; si no hay, cogemos la última "closed" para mostrar
      const qOpen = query(jornadasRef, where("status", "==", "open"), orderBy("id", "asc"), limit(1));
      const openSnap = await getDocs(qOpen);

      let jornada: Jornada | null = null;
      if (!openSnap.empty) {
        const d = openSnap.docs[0].data() as Jornada;
        jornada = d;
      } else {
        const qLast = query(jornadasRef, orderBy("id", "desc"), limit(1));
        const lastSnap = await getDocs(qLast);
        if (!lastSnap.empty) {
          jornada = lastSnap.docs[0].data() as Jornada;
        }
      }
      setCurrentJornada(jornada);

      // 2) Equipos (colección "teams" con docId = teamId)
      const teamsRef = collection(db, "teams");
      const teamsSnap = await getDocs(teamsRef);
      const map: Record<string, Team> = {};
      teamsSnap.forEach((d) => {
        const t = d.data() as Team;
        map[d.id] = { id: d.id, ...t };
      });
      setTeamsMap(map);
    })().catch((e) => setErrorMsg(e?.message || "Error cargando datos"));
  }, []);

  // Carga picks previos del usuario (para evitar repetir equipo)
  useEffect(() => {
    if (!firebaseUser) return;
    (async () => {
      const picksRef = collection(db, "picks");
      const qP = query(picksRef, where("uid", "==", firebaseUser.uid));
      const ps = await getDocs(qP);
      const setIds = new Set<string>();
      ps.forEach((d) => {
        const p = d.data() as Pick;
        setIds.add(p.teamId);
      });
      setUserPreviousTeamIds(setIds);
    })().catch((e) => setErrorMsg(e?.message || "Error cargando picks del usuario"));
  }, [firebaseUser]);

  // Leaderboard básico (cuenta de picks por usuario)
  useEffect(() => {
    (async () => {
      const picksRef = collection(db, "picks");
      const picksSnap = await getDocs(picksRef);
      const counts = new Map<string, number>();
      const lastAt = new Map<string, number>();

      picksSnap.forEach((d) => {
        const p = d.data() as Pick;
        counts.set(p.uid, (counts.get(p.uid) || 0) + 1);
        const ts = p.createdAt?.seconds ? p.createdAt.seconds : 0;
        if (!lastAt.has(p.uid) || ts > (lastAt.get(p.uid) || 0)) {
          lastAt.set(p.uid, ts);
        }
      });

      // Traemos nombres desde "users"
      const usersRef = collection(db, "users");
      const usersSnap = await getDocs(usersRef);
      const rows: UserRow[] = [];
      usersSnap.forEach((d) => {
        const u = d.data() as any;
        const uid = d.id;
        rows.push({
          uid,
          displayName: u.displayName || u.email || "Sin nombre",
          status: u.status || "Activo",
          picksCount: counts.get(uid) || 0,
          lastPickAt: lastAt.get(uid) || 0,
        });
      });

      rows.sort((a, b) => b.picksCount - a.picksCount || (b.lastPickAt! - a.lastPickAt!));
      setLeaderboard(rows);
    })().catch((e) => setErrorMsg(e?.message || "Error cargando clasificación"));
  }, []);

  const jornadaClosed = useMemo(() => currentJornada?.status === "closed", [currentJornada]);

  // Equipos elegibles: solo los que aparecen en los partidos de la jornada y que el usuario NO haya elegido antes
  const availableTeamIds = useMemo(() => {
    if (!currentJornada) return [];
    const ids = new Set<string>();
    currentJornada.matches.forEach((m) => {
      ids.add(m.homeTeamId);
      ids.add(m.awayTeamId);
    });
    // quita los repetidos ya elegidos por el usuario
    return Array.from(ids).filter((id) => !userPreviousTeamIds.has(id));
  }, [currentJornada, userPreviousTeamIds]);

  // Guardar pick
  async function handleConfirmPick() {
    setErrorMsg("");
    if (!firebaseUser) {
      setErrorMsg("Tienes que iniciar sesión.");
      return;
    }
    if (!userDoc?.approved) {
      setErrorMsg("Tu cuenta aún no está aprobada por el admin.");
      return;
    }
    if (!currentJornada) {
      setErrorMsg("No hay jornada disponible.");
      return;
    }
    if (jornadaClosed) {
      setErrorMsg("La jornada está cerrada. No puedes elegir ahora.");
      return;
    }
    if (!selectedTeamId) {
      setErrorMsg("Selecciona un equipo antes de confirmar.");
      return;
    }
    // Doble validación: no repetir equipo
    if (userPreviousTeamIds.has(selectedTeamId)) {
      setErrorMsg("Ese equipo ya lo elegiste en otra jornada.");
      return;
    }
    // Validación: el equipo debe pertenecer a la jornada actual
    const inThisJornada = currentJornada.matches.some(
      (m) => m.homeTeamId === selectedTeamId || m.awayTeamId === selectedTeamId
    );
    if (!inThisJornada) {
      setErrorMsg("Ese equipo no juega en la jornada actual.");
      return;
    }

    try {
      setSaving(true);
      const picksRef = collection(db, "picks");
      const team = teamsMap[selectedTeamId];
      await addDoc(picksRef, {
        uid: firebaseUser.uid,
        jornadaId: currentJornada.id,
        teamId: selectedTeamId,
        teamName: team?.name || selectedTeamId,
        createdAt: serverTimestamp(),
      } as Pick);
      // actualiza memoria local para bloquear repetidos
      setUserPreviousTeamIds((prev) => new Set(prev).add(selectedTeamId));
      setSelectedTeamId(null);
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudo guardar tu elección.");
    } finally {
      setSaving(false);
    }
  }

  // UI auxiliares
  function TeamBadge({ teamId }: { teamId: string }) {
    const team = teamsMap[teamId];
    const selected = selectedTeamId === teamId;
    const disabled = userPreviousTeamIds.has(teamId) || jornadaClosed;

    return (
      <button
        disabled={disabled}
        onClick={() => setSelectedTeamId(teamId)}
        className={`rounded-lg p-4 flex flex-col items-center border-2 transition ${classes.glass}
          ${selected ? "border-[#FFD700]" : "border-transparent"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-[#FFD700]"}
        `}
      >
        <img src={team?.crestUrl} alt={team?.name || teamId} className={`${classes.teamLogo} mb-2`} />
        <h3 className="font-bold">{team?.name || teamId}</h3>
        <p className="text-sm text-gray-300">{selected ? "Seleccionado" : "Elegir"}</p>
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mr-3" />
        <span>Cargando ByZapa Porra...</span>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
        <div className={`max-w-md w-full rounded-2xl p-6 ${classes.glass}`}>
          <h1 className="text-2xl font-bold mb-2">Inicia sesión</h1>
          <p className="text-gray-300">Para jugar necesitas entrar con tu cuenta de ByZapa.</p>
          <p className="text-sm text-gray-400 mt-4">*Ya tienes Auth configurado: usa la pantalla de login que tengas hecha.</p>
        </div>
      </div>
    );
  }

  if (userDoc && userDoc.approved === false) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
        <div className={`max-w-md w-full rounded-2xl p-6 ${classes.glass}`}>
          <h1 className="text-2xl font-bold mb-2">Cuenta pendiente</h1>
          <p className="text-gray-300">Tu acceso está pendiente de aprobación del admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#004680] to-[#002147] py-4 px-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-full p-1">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#004680]"><circle cx="12" cy="12" r="10" fill="currentColor" /></svg>
            </div>
            <h1 className={`text-xl md:text-2xl font-bold ${classes.gold}`}>Porra 1ª División ByZapa</h1>
          </div>
          <div className="text-sm opacity-90">
            {userDoc?.displayName || firebaseUser.email}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-12 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#004680] to-[#002147] opacity-80" />
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1542253512-900c300919b9?auto=format&fit=crop&w=1600&q=60)` }}
        />
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">¡Bienvenido a la Porra de LaLiga!</h2>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">Elige tu equipo de la jornada y sigue en juego.</p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 pb-16">
        {/* Jornada Actual */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              Jornada Actual: <span className={classes.gold}>{currentJornada?.id ?? "-"}</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${jornadaClosed ? "bg-red-500" : "bg-green-600"}`}>
                {jornadaClosed ? "Cerrada" : "Abierta"}
              </span>
            </div>
          </div>

          {/* Partidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentJornada?.matches?.map((m) => {
              const home = teamsMap[m.homeTeamId];
              const away = teamsMap[m.awayTeamId];
              return (
                <div key={m.id} className={`rounded-xl p-4 flex items-center justify-between ${classes.glass}`}>
                  <div className="flex items-center gap-4">
                    <img src={home?.crestUrl} className={classes.teamLogo} alt={home?.name} />
                    <div>
                      <h3 className="font-bold">{home?.name || m.homeTeamId}</h3>
                      <p className="text-sm text-gray-300">Local</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">VS</div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <h3 className="font-bold">{away?.name || m.awayTeamId}</h3>
                      <p className="text-sm text-gray-300">Visitante</p>
                    </div>
                    <img src={away?.crestUrl} className={classes.teamLogo} alt={away?.name} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Elección de Equipo */}
        <section className="mb-12">
          <div className={`rounded-xl p-6 ${classes.glass}`}>
            <h2 className="text-2xl font-bold mb-6">Tu elección para la jornada</h2>

            {errorMsg && (
              <div className="mb-4 text-sm text-red-300">{errorMsg}</div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availableTeamIds.map((tid) => (
                <TeamBadge key={tid} teamId={tid} />
              ))}
              {availableTeamIds.length === 0 && (
                <p className="text-gray-300">No hay equipos disponibles (o ya elegiste todos los de esta jornada).</p>
              )}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={handleConfirmPick}
                disabled={!selectedTeamId || jornadaClosed || saving}
                className={`font-bold py-3 px-8 rounded-full transition
                ${!selectedTeamId || jornadaClosed || saving
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-[#FFD700] text-black hover:opacity-90"}`}
              >
                {saving ? "Guardando..." : "Confirmar elección"}
              </button>
            </div>
          </div>
        </section>

        {/* Clasificación (simple por nº de picks) */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Clasificación general</h2>
          <div className={`rounded-xl overflow-hidden ${classes.glass}`}>
            <table className="w-full">
              <thead className="bg-[#004680]">
                <tr>
                  <th className="py-3 px-4 text-left">#</th>
                  <th className="py-3 px-4 text-left">Jugador</th>
                  <th className="py-3 px-4 text-left">Jornadas jugadas</th>
                  <th className="py-3 px-4 text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((r, i) => (
                  <tr key={r.uid} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-3 px-4">{i + 1}</td>
                    <td className="py-3 px-4">{r.displayName}</td>
                    <td className="py-3 px-4">{r.picksCount}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${r.status === "Eliminado" ? "bg-red-600" : "bg-green-600"}`}>
                        {r.status || "Activo"}
                      </span>
                    </td>
                  </tr>
                ))}
                {leaderboard.length === 0 && (
                  <tr><td className="py-3 px-4" colSpan={4}>Aún no hay datos de clasificación.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#004680] to-[#002147] py-8 px-4 mt-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div>
              <h3 className={`text-xl font-bold ${classes.gold}`}>Porra 1ª División ByZapa</h3>
              <p className="mt-1 text-gray-300">© 2025 Todos los derechos reservados</p>
            </div>
            <div className="text-gray-300 text-sm opacity-80">ByZapa • Hecho con Firebase</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
