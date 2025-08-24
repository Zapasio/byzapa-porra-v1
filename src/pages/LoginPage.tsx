// src/pages/LoginPage.tsx
import React, { useEffect, useState } from "react";
import { auth, provider } from "../firebase";
import {
<<<<<<< HEAD
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { useLocation, useNavigate } from "react-router-dom";
=======
  signInWithPopup, signInWithRedirect, getRedirectResult,
  setPersistence, browserLocalPersistence, onAuthStateChanged
} from 'firebase/auth'
import { useLocation, useNavigate } from 'react-router-dom'
>>>>>>> 496467e90d1421968c67b385a4ffa581addbbbcc

const ua = navigator.userAgent || "";
const inApp = /(FBAN|FBAV|Instagram|Line|WhatsApp|MicroMessenger)/i.test(ua);
const ios = /iPhone|iPad|iPod/i.test(ua);

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
<<<<<<< HEAD
    getRedirectResult(auth).then(() => {
      const to = (location.state as any)?.from?.pathname || "/picks";
      navigate(to, { replace: true });
    }).catch(() => {
      /* ignoramos si no viene de redirect */
    }).finally(() => setLoading(false));
  }, [navigate, location.state]);
=======
    const unsub = onAuthStateChanged(auth, user => {
      if (user) {
        const to = (loc.state?.from?.pathname as string) || '/picks'
        nav(to, { replace: true })
      }
    })
    getRedirectResult(auth).catch(() => {})
    return unsub
  }, [])
>>>>>>> 496467e90d1421968c67b385a4ffa581addbbbcc

  const login = async () => {
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);

      const shouldUseRedirect =
        inApp || ios || new URLSearchParams(location.search).get("redirect") === "1";

      if (shouldUseRedirect) {
        await signInWithRedirect(auth, provider);
        return;
      }

      await signInWithPopup(auth, provider);
      const to = (location.state as any)?.from?.pathname || "/picks";
      navigate(to, { replace: true });
    } catch (err: any) {
      const code = err?.code || "";
      // si popup bloqueado o cerrado → probamos redirect
      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/popup-blocked" ||
        code === "auth/cancelled-popup-request"
      ) {
        await signInWithRedirect(auth, provider);
        return;
      }
      alert(err?.message || "Error de autenticación");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] grid place-items-center p-6">
      <button
        onClick={login}
        disabled={loading}
        className="rounded-lg px-4 py-2 bg-emerald-600 text-white disabled:opacity-50"
      >
        {loading ? "Cargando…" : "Entrar con Google"}
      </button>

      <p className="mt-3 text-xs opacity-70">
        ¿Problemas con el popup?{" "}
        <a className="underline" href="/login?redirect=1">Forzar redirect</a>
      </p>
    </div>
  );
}
