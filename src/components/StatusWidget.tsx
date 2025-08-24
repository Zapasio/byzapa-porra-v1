// src/components/StatusWidget.tsx
import { useEffect, useState } from "react";
import { listenUserStatus } from "../data/picks";

export default function StatusWidget() {
  const [alive, setAlive] = useState<boolean | null>(null);
  const [used, setUsed] = useState<string[]>([]);

  useEffect(() => {
    const off = listenUserStatus(({ alive, usedTeams }) => {
      setAlive(alive); setUsed(usedTeams);
    });
    return () => off && off();
  }, []);

  return (
    <div className="bg-slate-800 rounded-2xl p-4">
      <p className="text-sm opacity-70">Tu estado</p>
      <div className="mt-1 text-lg">
        {alive === null ? "—" : alive ? "🟢 Sigues en juego" : "🔴 Eliminado"}
      </div>
      <p className="text-sm opacity-70 mt-2">Equipos ya usados</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {used.length === 0 ? (
          <span className="opacity-60">Ninguno</span>
        ) : (
          used.map((t) => (
            <span key={t} className="px-2 py-1 rounded-xl bg-white/10 text-sm">
              {t}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
