// src/hooks/useAppConfig.ts
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

type AppConfig = {
  seasonId: string;
  matchdayNumber: number;
};

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const snap = await getDoc(doc(db, "appConfig", "current"));
        if (!snap.exists()) throw new Error("appConfig/current no existe");
        const data = snap.data() as AppConfig;
        setConfig(data);
      } catch (e: any) {
        setError(e.message ?? "Error cargando configuración");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return { config, loading, error };
}
