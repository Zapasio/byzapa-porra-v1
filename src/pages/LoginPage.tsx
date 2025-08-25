import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      nav("/");
    } catch (err: any) {
      alert(err?.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      nav("/");
    } catch (err: any) {
      alert(err?.message || "Error de autenticación");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={submit} className="w-full max-w-xs space-y-4">
        <input
          type="email"
          className="w-full border rounded px-3 py-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded px-4 py-2 bg-emerald-600 text-white disabled:opacity-50"
        >
          {loading ? "Cargando…" : "Entrar"}
        </button>
      </form>
      <button
        onClick={google}
        disabled={loading}
        className="mt-4 w-full max-w-xs rounded px-4 py-2 bg-blue-600 text-white disabled:opacity-50"
      >
        {loading ? "Cargando…" : "Entrar con Google"}
      </button>
    </div>
  );
}
