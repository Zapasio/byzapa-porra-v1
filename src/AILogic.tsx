// src/AILogic.tsx
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "./firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { explainPickIA, testIA } from "./ai";
import type { Fixture } from "./ai";

export default function AILogic() {
  const [userEmail, setUserEmail] = useState<string>("");
  const [matchday, setMatchday] = useState<number>(1);
  const [usedTeamsInput, setUsedTeamsInput] = useState<string>("");
  const [fixtureInput, setFixtureInput] = useState<string>(
    "Real Madrid - Barcelona; Sevilla - Betis; Valencia - Villarreal"
  );
  const [loading, setLoading] = useState(false);
  const [aiText, setAiText] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) await signInAnonymously(auth).catch(console.error);
      setUserEmail(u?.email || u?.uid || "invitado");
    });
    return () => unsub();
  }, []);

  const fixture: Fixture[] = useMemo(() => {
    return fixtureInput
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((pair) => {
        const [home, away] = pair.split("-").map((x) => x.trim());
        return { home: home || "", away: away || "" };
      })
      .filter((m) => m.home && m.away);
  }, [fixtureInput]);

  const usedTeams = useMemo(
    () => usedTeamsInput.split(",").map(t => t.trim()).filter(Boolean),
    [usedTeamsInput]
  );

  async function handleSuggest() {
    setError(""); setAiText(""); setLoading(true);
    try {
      const username = userEmail || "invitado";
      const text = await explainPickIA({ username, matchday, usedTeams, fixture });
      setAiText(text);
      await addDoc(collection(db, "picks_ai_explanations"), {
        user: username, matchday, usedTeams, fixture, text, createdAt: serverTimestamp(),
      });
    } catch (e: any) {
      setError("AI: " + (e?.message || "Error generando explicación."));
    } finally { setLoading(false); }
  }

  async function handleTestIA() {
    try { alert(await testIA()); }
    catch (e: any) { alert("Error al probar IA: " + e?.message); }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">ByZapa Porra · IA Logic</h1>
          <button onClick={handleTestIA}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 font-semibold">
            Probar IA
          </button>
        </div>

        <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
          <label className="block text-sm opacity-80">
            Jornada
            <input type="number" value={matchday}
              onChange={e => setMatchday(parseInt(e.target.value || "1"))}
              className="mt-1 w-full rounded-xl bg-slate-700 p-2 outline-none" min={1}/>
          </label>

          <label className="block text-sm opacity-80">
            Equipos ya usados (coma)
            <input type="text" value={usedTeamsInput}
              onChange={e => setUsedTeamsInput(e.target.value)}
              placeholder="Real Madrid, Valencia, Betis..."
              className="mt-1 w-full rounded-xl bg-slate-700 p-2 outline-none"/>
          </label>

          <label className="block text-sm opacity-80">
            Partidos (Local - Visitante; …)
            <textarea value={fixtureInput} onChange={e => setFixtureInput(e.target.value)}
              rows={3} className="mt-1 w-full rounded-xl bg-slate-700 p-2 outline-none"/>
          </label>

          <button onClick={handleSuggest} disabled={loading || fixture.length === 0}
            className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] py-3 font-semibold">
            {loading ? "Generando…" : "Sugerir pick (IA)"}
          </button>
        </div>

        {error && (
          <div className="bg-red-700/60 rounded-xl p-3">
            <p className="font-semibold">Error</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        )}

        {aiText && (
          <div className="bg-slate-800 rounded-2xl p-4">
            <p className="text-sm opacity-70 mb-2">Explicación IA</p>
            <pre className="whitespace-pre-wrap">{aiText}</pre>
          </div>
        )}

        <p className="text-xs opacity-60">
          Aviso: texto generado por IA. No es consejo de apuesta.
        </p>
      </div>
    </div>
  );
}
