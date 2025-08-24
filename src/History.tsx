// src/History.tsx
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "./firebase";

type PickDoc = {
  user: string;
  matchday: number;
  usedTeams: string[];
  fixture: { home: string; away: string }[];
  text: string;
  createdAt?: { seconds: number; nanoseconds: number };
  _id?: string;
};

export default function History({
  email,
  matchday,
}: {
  email: string;
  matchday: number;
}) {
  const [items, setItems] = useState<PickDoc[]>([]);
  const canQuery = useMemo(() => Boolean(email && matchday > 0), [email, matchday]);

  useEffect(() => {
    if (!canQuery) return;
    const col = collection(db, "picks_ai_explanations");
    const q = query(
      col,
      where("user", "==", email),
      where("matchday", "==", matchday),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(q, (snap) => {
      const data: PickDoc[] = [];
      snap.forEach((d) => data.push({ ...(d.data() as any), _id: d.id }));
      setItems(data);
    }, (err) => {
      console.error("History onSnapshot error:", err);
    });

    return () => unsub();
  }, [email, matchday, canQuery]);

  if (!email) {
    return (
      <div className="bg-slate-800 rounded-2xl p-4">
        <p className="text-sm opacity-80">Inicia sesión para ver tu historial.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
      <h2 className="text-lg font-semibold">Historial de explicaciones (Jornada {matchday})</h2>
      {items.length === 0 ? (
        <p className="text-sm opacity-70">Aún no hay explicaciones guardadas para esta jornada.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it._id} className="rounded-xl border border-slate-700 p-3 bg-slate-900/40">
              <p className="text-xs opacity-60">
                {it.createdAt?.seconds
                  ? new Date(it.createdAt.seconds * 1000).toLocaleString()
                  : "pendiente de timestamp"}
              </p>
              <pre className="whitespace-pre-wrap mt-2 text-sm">{it.text}</pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
