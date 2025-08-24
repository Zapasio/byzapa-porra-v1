import { useEffect, useState } from "react";
import { submitPickFn } from "../lib/functions";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { TEAMS_25_26 } from "../lib/teams";
import { useAppConfig } from "../lib/config";
import { MD1_25_26 } from "../lib/fixtures_2025_26_md1";

export default function PicksPage() {
  const [userEmail, setUserEmail] = useState("");
  const [teamId, setTeamId] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("esperando");
  const { seasonId, matchdayNumber, loading: cfgLoading, error: cfgError } = useAppConfig();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && u.email) setUserEmail(u.email);
    });
    return () => unsub();
  }, []);

  const handleSubmitPick = async () => {
    if (!teamId) {
      alert("Selecciona un equipo");
      return;
    }
    setSending(true);
    setMessage("");
    try {
      await submitPickFn({ seasonId, matchdayNumber, teamId });
      setMessage("Pick enviado correctamente");
    } catch (error: any) {
      console.error("Error al enviar pick:", error.message);
      setMessage("Error al enviar pick");
    } finally {
      setSending(false);
    }
  };

  const teamMap = Object.fromEntries(TEAMS_25_26.map(t => [t.id, t]));

  if (cfgLoading) return <p>Cargando configuración...</p>
  if (cfgError) return <p>Error: {cfgError}</p>

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Elige tu equipo para Jornada {matchdayNumber}</h1>
      <p>Usuario: {userEmail || "no identificado"}</p>

      <ul className="space-y-1">
        {MD1_25_26.map((m, i) => (
          <li key={i} className={teamId === m.home || teamId === m.away ? "font-semibold" : ""}>
            {teamMap[m.home]?.short || m.home} vs {teamMap[m.away]?.short || m.away}
          </li>
        ))}
      </ul>

      <div>
        <label htmlFor="team" className="mr-2">Equipo:</label>
        <select
          id="team"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="border rounded px-2 py-1 text-black"
        >
          <option value="">-- Selecciona --</option>
          {TEAMS_25_26.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      {message && <p>{message}</p>}
      <button
        onClick={handleSubmitPick}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 disabled:opacity-50"
        disabled={!teamId || sending}
      >
        {sending ? "Enviando..." : "Enviar Pick"}
      </button>
    </section>
  );
}

