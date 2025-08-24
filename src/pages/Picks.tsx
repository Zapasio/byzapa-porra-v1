import { useState } from 'react';
import { submitPickFn } from '../lib/functions';
import { useAppConfig } from '../lib/config';
import { TEAMS_25_26 } from '../lib/teams';
import { auth } from '../lib/firebase';

export default function Picks() {
  const { seasonId, matchdayNumber } = useAppConfig();
  const [teamId, setTeamId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!auth.currentUser) return alert('Inicia sesión primero');
    setLoading(true);
    try {
      await submitPickFn({ seasonId, matchdayNumber, teamId });
      alert('Pick enviado! Explicación AI generada via Gemini.');
    } catch (error) {
      console.error(error);
      alert('Error al enviar pick');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-lg p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold text-primary mb-4">Elige tu equipo para Jornada {matchdayNumber}</h1>
        <select
          value={teamId}
          onChange={(e) => setTeamId(e.target.value.toLowerCase())}  // Lowercase para match DB
          className="w-full border border-gray-300 rounded p-2 mb-4"
        >
          <option value="">Selecciona un equipo</option>
          {TEAMS_25_26.map(team => (
            <option key={team.id} value={team.id.toLowerCase()}>{team.name} ({team.short})</option>
          ))}
        </select>
        <button
          onClick={handleSubmit}
          disabled={loading || !teamId}
          className="w-full bg-accent text-white p-3 rounded font-semibold disabled:bg-gray-400"
        >
          {loading ? 'Enviando...' : 'Enviar Pick'}
        </button>
      </div>
    </div>
  );
}