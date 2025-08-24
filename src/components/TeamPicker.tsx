// src/components/TeamPicker.tsx
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, getDocs, collection, query, where, setDoc, serverTimestamp,
} from "firebase/firestore";

type Team = { id:string; name:string; short?:string; crest?:string };
type Match = { id:string; homeId:string; awayId:string; kickoff:number; status:"SCHEDULED"|"LIVE"|"FINISHED" };

export default function TeamPicker({ season="2025-26", matchday=1 }: { season?:string; matchday?:number }) {
  const [uid, setUid] = useState<string>();
  const [approved, setApproved] = useState<boolean>();
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [matches, setMatches] = useState<Match[]>([]);
  const [usedTeams, setUsedTeams] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string>("");

  // auth + approved
  useEffect(() => {
    const off = onAuthStateChanged(auth, async (user)=>{
      if (!user) { setUid(undefined); setApproved(undefined); return; }
      setUid(user.uid);
      const uref = doc(db, "users", user.uid);
      const usnap = await getDoc(uref);
      setApproved(Boolean(usnap.exists() && usnap.data().approved));
    });
    return ()=>off();
  }, []);

  // equipos
  useEffect(() => {
    (async ()=>{
      const snap = await getDocs(collection(db, "teams"));
      const m: Record<string, Team> = {};
      snap.forEach(d => { const t = d.data() as Team; if (t?.id) m[t.id]=t; });
      setTeams(m);
    })();
  }, []);

  // partidos
  useEffect(() => {
    (async ()=>{
      const matchesCol = collection(db, "fixtures", `MD${matchday}`, "matches");
      const snap = await getDocs(matchesCol);
      const arr: Match[] = [];
      snap.forEach(d => arr.push(d.data() as Match));
      arr.sort((a,b)=>a.kickoff-b.kickoff);
      setMatches(arr);
    })();
  }, [matchday]);

  // equipos ya usados por el usuario esta temporada
  useEffect(() => {
    if (!uid) return;
    (async ()=>{
      const qy = query(collection(db,"picks"), where("uid","==",uid), where("season","==",season));
      const snap = await getDocs(qy);
      const set = new Set<string>();
      snap.forEach(d => { const p = d.data() as any; if (p?.team) set.add(p.team); });
      setUsedTeams(set);
    })();
  }, [uid, season]);

  const now = Date.now();
  const teamsArray = useMemo(()=>Object.values(teams), [teams]);

  async function chooseTeam(match: Match, teamId: string) {
    if (!uid) return alert("Inicia sesión primero.");
    if (!approved) return alert("Tu cuenta aún no está aprobada por Zapa.");
    if (usedTeams.has(teamId)) return alert("Ese equipo ya lo usaste.");
    if (match.kickoff <= now || match.status !== "SCHEDULED") return alert("Partido empezado o cerrado.");

    const pickId = `${uid}_MD${matchday}_${match.id}`;
    setSavingId(pickId);
    try {
      await setDoc(doc(db,"picks", pickId), {
        uid, season, matchday, matchId: match.id, team: teamId,
        createdAt: serverTimestamp()
      }, { merge: true });

      const newSet = new Set(usedTeams); newSet.add(teamId); setUsedTeams(newSet);
    } finally { setSavingId(""); }
  }

  if (uid === undefined) return <div className="p-4">Inicia sesión para jugar.</div>;
  if (approved === false) return <div className="p-4">Tu usuario está pendiente de aprobación.</div>;
  if (!matches.length) return <div className="p-4">No hay partidos para MD{matchday}. Revisa Firestore: <code>fixtures/MD{matchday}/matches</code>.</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-3">Jornada {matchday} — Elige tu equipo (no se repite)</h2>
      <ul className="space-y-3">
        {matches.map(m => {
          const home = teams[m.homeId]; const away = teams[m.awayId];
          const started = m.kickoff <= now || m.status !== "SCHEDULED";
          const pickKey = savingId === `${uid}_MD${matchday}_${m.id}`;
          return (
            <li key={m.id} className="border rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{home?.short || home?.name || m.homeId} vs {away?.short || away?.name || m.awayId}</div>
                <div className="text-sm opacity-70">{new Date(m.kickoff).toLocaleString()}</div>
              </div>
              <div className="mt-2 flex gap-3">
                <button
                  disabled={started || usedTeams.has(m.homeId) || pickKey}
                  onClick={()=>chooseTeam(m, m.homeId)}
                  className={`px-3 py-2 border rounded-lg ${started || usedTeams.has(m.homeId) ? "opacity-40 cursor-not-allowed" : "hover:bg-black/5"}`}
                >
                  {home?.short || m.homeId}{usedTeams.has(m.homeId) ? " (USADO)" : ""}
                </button>
                <button
                  disabled={started || usedTeams.has(m.awayId) || pickKey}
                  onClick={()=>chooseTeam(m, m.awayId)}
                  className={`px-3 py-2 border rounded-lg ${started || usedTeams.has(m.awayId) ? "opacity-40 cursor-not-allowed" : "hover:bg-black/5"}`}
                >
                  {away?.short || m.awayId}{usedTeams.has(m.awayId) ? " (USADO)" : ""}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs opacity-60">ByZapa — si un botón sale apagado, ese equipo ya lo usaste o el partido está cerrado.</p>
    </div>
  );
}
