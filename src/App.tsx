import { useEffect, useState } from 'react';
import './index.css';
import matches from './matches.json';

type Partido = {
  id: number;
  local: string;
  visitante: string;
  fecha: string;
  hora: string;
};

export default function App() {
  const [partidos, setPartidos] = useState<Partido[]>([]);

  useEffect(() => {
    setPartidos(matches);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0c2a] to-[#1a1a40] text-white font-sans">
      <header className="p-8 text-center bg-[#1f2235] shadow-lg">
        <h1 className="text-5xl font-extrabold text-yellow-400 tracking-wide drop-shadow-md">
          ByZapa Porra
        </h1>
        <p className="text-base text-gray-300 mt-3">
          Primera División 2025/26 - ¡Elige tu equipo, avanza jornada a jornada y gana el bote!
        </p>
      </header>

      <main className="px-6 md:px-16 lg:px-32">
        <section className="bg-white bg-opacity-5 p-6 mt-8 rounded-2xl shadow-2xl border border-yellow-400">
          <h2 className="text-3xl font-semibold text-yellow-300 mb-6 text-center">
            🗓️ Jornadas Reales
          </h2>

          {partidos.length === 0 ? (
            <p className="text-center text-gray-400 animate-pulse">Cargando partidos...</p>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {partidos.map((partido) => (
                <li
                  key={partido.id}
                  className="bg-[#121430] p-5 rounded-xl border border-gray-700 hover:scale-105 transform transition duration-300 shadow-lg hover:shadow-yellow-400"
                >
                  <p className="text-xl font-semibold text-white mb-1">
                    {partido.local} 🇺 {partido.visitante}
                  </p>
                  <p className="text-sm text-gray-400 mb-3">
                    {partido.fecha} - {partido.hora}
                  </p>
                  <button className="w-full py-2 bg-yellow-400 text-black font-bold rounded hover:bg-yellow-300 transition">
                    Elegir ganador
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12 text-center">
          <p className="text-sm text-gray-500 italic">
            Calendario oficial temporada 25/26 • Marca registrada: <span className="text-yellow-300 font-bold">ByZaPa</span>
          </p>
        </section>
      </main>
    </div>
  );
}