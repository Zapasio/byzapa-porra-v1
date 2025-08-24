// src/ai.ts
import { app } from "./firebase";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

// 🔑 Lee tu clave de la Developer API (Gemini) desde .env.local
const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
if (!apiKey) {
  throw new Error("Falta VITE_GEMINI_API_KEY en .env.local");
}

// Usamos Developer API (GoogleAIBackend) con API key explícita
const ai = getAI(app, { backend: new GoogleAIBackend({ apiKey }) });
const model = getGenerativeModel(ai, { model: "gemini-1.5-flash" });

export type Fixture = {
  home: string;
  away: string;
  odds?: { home: number; draw: number; away: number };
};

// 🧠 Extractor robusto de texto para distintas formas de respuesta
function extractText(res: any): string {
  try {
    // Caso 1: SDK de Google GenAI habitual: res.response.text()
    if (res?.response && typeof res.response.text === "function") {
      return res.response.text();
    }
    // Caso 2: algunos wrappers exponen .text()
    if (typeof res?.text === "function") {
      return res.text();
    }
    // Caso 3: formato con candidates -> content.parts[].text
    const parts =
      res?.response?.candidates?.[0]?.content?.parts ??
      res?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      const joined = parts
        .map((p: any) => p?.text ?? p?.inline_data?.data ?? "")
        .join("")
        .trim();
      if (joined) return joined;
    }
    // Caso 4: output/content plano
    const maybe =
      res?.output ??
      res?.content ??
      res?.response ??
      res?.candidates ??
      res;
    return typeof maybe === "string" ? maybe : JSON.stringify(maybe);
  } catch {
    return String(res ?? "");
  }
}

export async function explainPickIA(params: {
  username: string;
  matchday: number;
  usedTeams: string[];
  fixture: Fixture[];
}) {
  const { username, matchday, usedTeams, fixture } = params;

  const prompt = `
Eres el asistente de ByZapa Porra (VSLE). Da 1-2 recomendaciones de equipo para la jornada ${matchday},
respetando que NO se pueden repetir equipos ya usados: [${usedTeams.join(", ") || "ninguno"}].
Muestra pros y contras breves por cada opción, con lenguaje claro y tono andaluz cercano.
Incluye al final: "No es consejo de apuesta. Juega con responsabilidad."
Partidos:
${fixture
  .map(
    (m, i) =>
      `${i + 1}. ${m.home} vs ${m.away}${
        m.odds ? ` (H ${m.odds.home} / X ${m.odds.draw} / A ${m.odds.away})` : ""
      }`
  )
  .join("\n")}
Usuario: ${username}
`.trim();

  const res = await model.generateContent(prompt);
  return extractText(res);
}

export async function testIA() {
  const res = await model.generateContent(
    "Dame un consejo corto para elegir un pick, tono andaluz."
  );
  return extractText(res);
}
