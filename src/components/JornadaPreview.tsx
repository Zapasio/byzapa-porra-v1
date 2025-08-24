import { useEffect, useState } from "react";
import { collection, getDocs, query, where, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { generarPreviaJornada } from "../ai";

export default function JornadaPreview({ matchdayId }: { matchdayId: string }) {
  const [texto, setTexto] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);

      const prevRef = doc(db, "aiPreviews", matchdayId);
      const prevSnap = await getDoc(prevRef);
      if (prevSnap.exists()) {
        const t = prevSnap.get("text");
        if (t && alive) {
          setTexto(t);
          setLoading(false);
          return;
        }
      }

      const q = query(collection(db, "matches"), where("matchdayId", "==", matchdayId));
      const qs = await getDocs(q);
      const matches = qs.docs.map(d => ({
        homeTeam: d.get("homeTeam"),
        awayTeam: d.get("awayTeam"),
      }));

      if (matches.length === 0) {
        if (alive) setTexto("");
        setLoading(false);
        return;
      }

      const text = await generarPreviaJornada(matches);
      await setDoc(prevRef, { matchdayId, text, updatedAt: new Date() }, { merge: true });

      if (alive) {
        setTexto(text);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [matchdayId]);

  if (loading || !texto) return null;

  return (
    <div className="mt-4 p-3 rounded border border-yellow-400 bg-gray-800">
      <h3 className="font-bold text-yellow-300 mb-1">Previa AI</h3>
      <p className="text-sm leading-relaxed">{texto}</p>
    </div>
  );
}
