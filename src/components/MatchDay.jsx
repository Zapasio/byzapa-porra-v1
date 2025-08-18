import React from "react";

const MatchDay = ({ jornada, partidos, onPick }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-white text-xl font-bold text-center">Jornada {jornada} - ByZaPa Porra</h2>
      {partidos.map((match, index) => (
        <div key={index} className="bg-[#1a1b3a] p-4 rounded-lg flex flex-col items-center space-y-2 shadow-lg">
          <div className="text-white font-semibold">
            {match.local} <span className="text-orange-400 font-bold">vs</span> {match.visitante}
          </div>
          <div className="flex space-x-4">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
              onClick={() => onPick(match.local)}
            >
              {match.local}
            </button>
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded"
              onClick={() => onPick(match.visitante)}
            >
              {match.visitante}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MatchDay;
