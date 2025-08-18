import { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  addDoc,
} from "firebase/firestore";

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  jornada: number;
  matchdayId: string;
}

interface MatchdayViewerProps {
  userId: string;
  username: string;
}

export function MatchdayViewer({ userId, username }: MatchdayViewerProps) {
  const db = getFirestore();
  const [matchdays, setMatchdays] = useState<{ [key: string]: Match[] }>({});
  const [picks, setPicks] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const q = query(collection(db, "matches"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const days: { [key: string]: Match[] } = {};
      querySnapshot.forEach((doc) => {
        const match = { id: doc.id, ...doc.data() } as Match;
        if (!days[match.matchdayId]) days[match.matchdayId] = [];
        days[match.matchdayId].push(match);
      });

      // Ordenar jornadas por número (si el nombre es 2025-26_1, 2025-26_2, etc.)
      const sortedKeys = Object.keys(days).sort((a, b) => {
        const aNum = parseInt(a.split("_")[1]);
        const bNum = parseInt(b.split("_")[1]);
        return aNum - bNum;
      });

      const sorted: { [key: string]: Match[] } = {};
      for (const key of sortedKeys) {
        sorted[key] = days[key];
      }

      setMatchdays(sorted);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "picks"),
      where("userId", "==", userId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const picksData: { [key: string]: string } = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        picksData[data.matchdayId] = data.team;
      });
      setPicks(picksData);
    });

    return () => unsubscribe();
  }, [userId]);

  const handlePick = async (
    matchdayId: string,
    team: string
  ) => {
    await addDoc(collection(db, "picks"), {
      userId,
      username,
      team,
      matchdayId,
      timestamp: new Date(),
    });
  };

  return (
    <div className="text-white p-4">
      <h1 className="text-3xl font-bold text-center text-yellow-400 mb-6">
        ByZapa Porra VSLE
      </h1>
      <h2 className="text-xl text-center mb-6">Jugador: {username}</h2>

      {Object.entries(matchdays).map(([matchdayId, matches]) => (
        <div key={matchdayId} className="bg-gray-900 mb-6 p-4 rounded border border-gray-700">
          <h3 className="text-lg font-bold text-yellow-300 mb-2">
            Jornada {matchdayId.split("_")[1]}
          </h3>
          {matches.map((match) => (
            <div key={match.id} className="flex justify-between items-center mb-2">
              <span>{match.homeTeam} vs {match.awayTeam}</span>
              <div className="space-x-2">
                <button
                  className={`px-3 py-1 rounded font-semibold ${
                    picks[matchdayId] === match.homeTeam
                      ? "bg-yellow-400 text-black"
                      : "bg-yellow-200 text-black"
                  }`}
                  onClick={() => handlePick(matchdayId, match.homeTeam)}
                >
                  {match.homeTeam}
                </button>
                <button
                  className={`px-3 py-1 rounded font-semibold ${
                    picks[matchdayId] === match.awayTeam
                      ? "bg-yellow-400 text-black"
                      : "bg-yellow-200 text-black"
                  }`}
                  onClick={() => handlePick(matchdayId, match.awayTeam)}
                >
                  {match.awayTeam}
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}

      <div className="mt-8 p-4 border border-yellow-400 rounded bg-gray-800">
        <h2 className="text-xl font-bold text-yellow-400 mb-2">
          Elecciones de {username}
        </h2>
        {Object.entries(picks).map(([matchdayId, team]) => (
          <p key={matchdayId}>
            Jornada {matchdayId.split("_")[1]}: <span className="text-yellow-300">{team}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
