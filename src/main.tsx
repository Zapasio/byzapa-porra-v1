import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";   // 👈 Importa Tailwind aquí
import './userCreate';
import PicksPage from "./pages/PicksPage";
import MyHistoryPage from "./pages/MyHistoryPage";
import LoginPage from "./pages/LoginPage";
import AllPicksPage from "./pages/AllPicksPage";
import StandingsPage from "./pages/StandingsPage";
import AdminPage from "./pages/AdminPage";
import Dashboard from "./pages/Dashboard";
import Diagnostics from "./pages/Diagnostics";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/picks" element={<PicksPage />} />
        <Route path="/history" element={<MyHistoryPage />} />
        <Route path="/all-picks" element={<AllPicksPage />} />
        <Route path="/standings" element={<StandingsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/diagnostics" element={<Diagnostics />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);