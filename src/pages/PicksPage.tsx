// src/pages/PicksPage.tsx
import React from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase";
import { useAppConfig } from "../hooks/useAppConfig";
import { TEAMS_25_26 } from "../lib/constants";
import { submitPick } from "../lib/functions";

export default function PicksPage() {
  const [authReady, setAuthReady] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [selectedTeamId, setSelectedTeamId] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);
  const { config, loading: loadingConfig, error: configError } = useAppConfig();

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  if (!authReady) return <p className="p-4">Cargando sesión…</p>;

  if (!user) {
    const to = `/login?from=${encodeURIComponent(location.pathname)}`;
    window.location.replace(to);
    return null;
  }

  if (loadingConfig) return <p className="p-4">Cargando configuración…</p>;
  if (configError) return <p className="p-4 text-red-600">Error: {configError}</p>;
  if (!config) return <p className="p-4">Sin configuración</p>;

  const onSave = async () => {
    if (!selectedTeamId) {
      alert("Elige un equipo primero");
      return;
    }
    try {
      setSaving(true);
      await submitPick({
        uid: user.uid,
        seasonId: config.seasonId,
        matchdayNumber: config.matchdayNumber,
        teamId: selectedTeamId,
      });
      alert("¡Pick guardado!");
    } catch (e: any) {
      alert(`Error al enviar pick: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">
        Jornada {config.matchdayNumber} · {config.seasonId}
      </h1>

      <label className="block mb-2 text-sm">Elige tu equipo</label>
      <select
        className="w-full border rounded-lg p-2 mb-4"
        value={selectedTeamId}
        onChange={(e) => setSelectedTeamId(e.target.value)}
      >
        <option value="">— Selecciona —</option>
        {TEAMS_25_26.map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      <button
        onClick={onSave}
        disabled={saving || !selectedTeamId}
        className="rounded-lg px-4 py-2 bg-blue-600 text-white disabled:opacity-50"
      >
        {saving ? "Guardando…" : "Enviar pick"}
      </button>

      <p className="mt-6 text-xs opacity-60">
        Conectado como <b>{user.email}</b>
      </p>
    </div>
  );
}
