import { useEffect, useState } from "react";
import { submitPickFn } from "../lib/functions";
import { auth } from "../firebase";

export default function PicksPage() {
  const [userEmail, setUserEmail] = useState("");
  const [pickStatus, setPickStatus] = useState("esperando");

  useEffect(() => {
    const u = auth.currentUser;
    if (u && u.email) {
      setUserEmail(u.email);
    }
  }, []);

  const handleSubmitPick = async () => {
    try {
      const result = await submitPickFn({
        teamId: "RMA", // ejemplo
        matchdayId: "2025-26__1"
      });

      console.log("Respuesta:", result);
      setPickStatus("enviado");
    } catch (error: any) {
      console.error("Error al enviar pick:", error.message);
      setPickStatus("error");
    }
  };

  return (
    <section style={{ padding: "2rem" }}>
      <h1>ByZapa Porra: Selección de Equipo</h1>
      <p>Usuario: {userEmail || "no identificado"}</p>
      <p>Estado del pick: {pickStatus}</p>
      <button onClick={handleSubmitPick} className="bg-blue-600 text-white px-4 py-2 rounded mt-4 hover:bg-blue-500">
        Enviar Pick
      </button>
    </section>
  );
}
