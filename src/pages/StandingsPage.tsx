import { useEffect, useState } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { safeGetDocs } from '../lib/queryUtils';

export default function Standings() {
  const [standings, setStandings] = useState([]);

  useEffect(() => {
    async function loadStandings() {
      const q = query(collection(db, 'leaderboards'), orderBy('points', 'desc'));
      const snapshot = await safeGetDocs(q);
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        pick: '' // Placeholder, fetch pick abajo
      }));
      // Fetch picks for each user
      for (let item of data) {
        const pickQ = query(collection(db, 'picks_user'), where('user', '==', item.uid), orderBy('matchdayNumber', 'desc'));
        const pickSnapshot = await safeGetDocs(pickQ);
        if (pickSnapshot.docs.length > 0) {
          item.pick = pickSnapshot.docs[0].data().teamId.toUpperCase();
        }
      }
      setStandings(data);
    }
    loadStandings();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Clasificación General</h1>
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-blue-800 text-white">
            <th className="p-2">#</th>
            <th className="p-2">Jugador</th>
            <th className="p-2">Puntos</th>
            <th className="p-2">Pick Actual</th>
            <th className="p-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((item, index) => (
            <tr key={item.id} className="border-t">
              <td className="p-2">{index + 1}</td>
              <td className="p-2">{item.displayName || 'Sin nombre'}</td>
              <td className="p-2">{item.points}</td>
              <td className="p-2">{item.pick || 'Ninguno'}</td>
              <td className="p-2 text-green-500">Activo</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}