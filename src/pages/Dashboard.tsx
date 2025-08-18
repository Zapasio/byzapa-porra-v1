import React, { useState } from 'react';

const partidos = [
  { id: 1, equipoLocal: 'Real Madrid', equipoVisitante: 'Sevilla' },
  { id: 2, equipoLocal: 'Barcelona', equipoVisitante: 'Valencia' },
  { id: 3, equipoLocal: 'Betis', equipoVisitante: 'Atleti' },
];

export default function Dashboard() {
  const [eleccion, setEleccion] = useState<{ partidoId: number; equipo: string } | null>(null);

  const elegirEquipo = (partidoId: number, equipo: string) => {
    setEleccion({ partidoId, equipo });
    alert(`Has elegido: ${equipo}`);
  };

  return (
    <div className="text-white p-4 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Jornada 1 - ByZaPa Porra</h1>

      <div className="space-y-6">
        {partidos.map((partido) => (
          <div key={partido.id} className="bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="text-xl font-semibold mb-2 text-center">
              {partido.equipoLocal} 🆚 {partido.equipoVisitante}
            </div>

            <div className="flex justify-around mt-3">
              <button
                onClick={() => elegirEquipo(partido.id, partido.equipoLocal)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
              >
                {partido.equipoLocal}
              </button>
              <button
                onClick={() => elegirEquipo(partido.id, partido.equipoVisitante)}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
              >
                {partido.equipoVisitante}
              </button>
            </div>
          </div>
        ))}
      </div>

      {eleccion && (
        <div className="mt-6 p-4 bg-green-800 text-center rounded-lg">
          <strong>Has elegido:</strong> {eleccion.equipo}
        </div>
      )}
    </div>
  );
}
