import { useState } from 'react';
import { collection, addDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { safeGetDocs } from '../lib/queryUtils';

export default function Partidas() {
  const [code, setCode] = useState('');
  const [partidas, setPartidas] = useState([]);

  const createPartida = async () => {
    const newCode = Math.random().toString(36).substring(7); // Code random
    await addDoc(collection(db, 'partidas'), {
      code: newCode,
      creator: auth.currentUser.uid,
      members: [auth.currentUser.uid],
      picks: []
    });
    alert(`Partida creada con code: ${newCode}`);
  };

  const joinPartida = async () => {
    const q = query(collection(db, 'partidas'), where('code', '==', code));
    const snapshot = await safeGetDocs(q);
    if (snapshot.docs.length > 0) {
      // Agrega user a members (usa updateDoc en código real)
      alert('Unido a partida!');
    } else {
      alert('Code inválido');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Partidas con Amigos</h1>
      <button onClick={createPartida} className="bg-blue-500 text-white p-2 mb-4">Crear Partida Privada</button>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Ingresa code para unirte"
        className="border p-2 mr-2"
      />
      <button onClick={joinPartida} className="bg-green-500 text-white p-2">Unirse</button>
    </div>
  );
}