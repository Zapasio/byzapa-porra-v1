import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Live() {
  const [jornadas, setJornadas] = useState([]);
  const [livePartidos, setLivePartidos] = useState([]);

  const fetchJornadas = async () => {
    try {
      const res = await axios.get(`https://www.thesportsdb.com/api/v1/json/${import.meta.env.VITE_TSD_API_KEY}/eventsseason.php?id=${import.meta.env.VITE_TSD_LEAGUE_ID}&s=${import.meta.env.VITE_TSD_SEASON}`);
      setJornadas(res.data.events || []);
    } catch (error) {
      console.error('Error fetching jornadas:', error);
    }
  };

  const fetchLive = async () => {
    try {
      const res = await axios.get(`https://www.thesportsdb.com/api/v1/json/${import.meta.env.VITE_TSD_API_KEY}/livescore.php?l=${import.meta.env.VITE_TSD_LEAGUE_ID}`);
      setLivePartidos(res.data.events || []);
    } catch (error) {
      console.error('Error fetching live:', error);
    }
  };

  useEffect(() => {
    fetchJornadas();
    fetchLive();
    const interval = setInterval(fetchLive, 30000); // Update live cada 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Jornadas y Partidos Live</h1>
      <h2 className="text-xl mb-2">Jornadas Completas</h2>
      <ul>
        {jornadas.map((j: any) => (
          <li key={j.idEvent} className="mb-2">
            {j.strHomeTeam} vs {j.strAwayTeam} - {j.dateEvent} - Score: {j.intHomeScore}:{j.intAwayScore}
          </li>
        ))}
      </ul>
      <h2 className="text-xl mb-2 mt-4">Partidos Live</h2>
      <ul>
        {livePartidos.map((p: any) => (
          <li key={p.idEvent} className="mb-2 text-green-500">
            {p.strHomeTeam} {p.intHomeScore} - {p.strAwayTeam} {p.intAwayScore} (Minuto {p.strProgress})
          </li>
        ))}
      </ul>
    </div>
  );
}