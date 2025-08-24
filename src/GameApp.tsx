// src/GameApp.tsx
import { useEffect, useMemo, useState } from "react";
import StatusWidget from "./components/StatusWidget";
import { Fixture, listenMyPicks, savePick } from "./data/picks";

export default function GameApp() {
  const [matchday, setMatchday] = useState<number>(1);
  const [fixtureInput, setFixtureInput] = useState(
    "Real Madrid - Barcelona; Sevilla - Betis; Valencia - Villarreal"
  );
  const [selectedMatch, setSelectedMatch] = useState<number>(0);
  const [side, setSide] = useState<"home"|"away">("home");
  const [error, setError] = useState<string>("");
  const [ok, setOk] = useState<string>("");
  const [myPicks, setMyPicks] = useState<any[]>([]);

  const fixtures: Fixture[] = useMemo(() =>
    fixtureInput.split(";").map(s => s.trim()).filter(Boolean).map(pair => {
      const [h, a] = pair.split("-").map(x => x.trim());
      return { home: h ?? "", away: a ?? "" };
    }).filter(m => m.home && m.away)
  , [fixtureInput]);

  useEffect(() => {
    const off = listenMyPicks(matchday, setMyPicks);
    return () => off && off();
  }, [matchday]);

  async function submit() {
    setError(""); setOk("");
    const fx = fixtures[selectedMatch];
    if (!fx) { setError("Selecciona un partido."); return; }
    try {
      await savePick({ matchday, fixture: fx, side });
      setOk(`¡Pick guardado! ${side === "home" ? fx.home : fx.away}`);
    } catch (e: any) {
      setError(e?.message || "Error guardando el pick.");
    }
  }

  const fx = fixtures[selectedMatch];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">ByZapa Porra · Juego</h1>
        </header>

        <div className="grid md:grid-cols-3 gap-4 items-end bg-slate-800 p-4 rounded-2xl">
          <label className="text-sm opacity-80">
            Jornada
            <input
              type="number" min={1} value={matchday}
              onChange={e => setMatchday(parseInt(e.target.value || "1"))}
              className="mt-1 w-full rounded-xl bg-slate-700 p-2 outline-none"
            />
          </label>

          <label className="text-sm opacity-80 md:col-span-2">
            Partidos (Local - Visitante; …)
            <textarea
              rows={2}
              value={fixtureInput}
              onChange={e => setFixtureInput(e.target.value)}
              className="mt-1 w-full rounded-xl bg-slate-700 p-2 outline-none"
            />
          </label>

          <label className="text-sm opacity-80 md:col-span-2">
            Partido
            <select
              value={selectedMatch}
              onChange={e => setSelectedMatch(parseInt(e.target.value))}
              className="mt-1 w-full rounded-xl bg-slate-700 p-2 outline-none"
            >
              {fixtures.map((m, i) => (
                <option value={i} key={`${m.home}-${m.away}-${i}`}>
                  {m.home} vs {m.away}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm opacity-80">
            Equipo
            <select
              value={side}
              onChange={e => setSide(e.target.value as "home"|"away")}
              className="mt-1 w-full rounded-xl bg-slate-700 p-2 outline-none"
            >
              <option value="home">{fx?.home || "Local"}</option>
              <option value="away">{fx?.away || "Visitante"}</option>
            </select>
          </label>

          <div className="md:col-span-3">
            <button
              onClick={submit}
              className="w-full rounded-2xl py-3 font-semibold bg-indigo-600 hover:bg-indigo-500"
            >
              Enviar pick
            </button>
          </div>
        </div>

        {error && <div className="bg-red-700/60 rounded-xl p-3">{error}</div>}
        {ok && <div className="bg-emerald-700/60 rounded-xl p-3">{ok}</div>}

        <div className="bg-slate-800 rounded-2xl p-4">
          <p className="text-sm opacity-70 mb-2">Tus picks (jornada {matchday})</p>
          {myPicks.length === 0 ? (
            <p className="opacity-70">Aún no hay picks guardados.</p>
          ) : (
            <ul className="space-y-2">
              {myPicks.map((p, i) => (
                <li key={i} className="rounded-xl border border-slate-700 p-3 bg-slate-900/40">
                  <div className="text-sm">
                    <span className="font-semibold">{p.team}</span> vs {p.opponent}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <StatusWidget />
      </div>
    </div>
  );
}
