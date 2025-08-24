import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense, useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Navigate } from 'react-router-dom';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const PicksPage = lazy(() => import('./pages/PicksPage'));
const Picks = lazy(() => import('./pages/Picks'));
const StandingsPage = lazy(() => import('./pages/StandingsPage'));
const Live = lazy(() => import('./pages/Live'));
const Partidas = lazy(() => import('./pages/Partidas'));
const AllPicksPage = lazy(() => import('./pages/AllPicksPage'));
const MyHistoryPage = lazy(() => import('./pages/MyHistoryPage'));
const Diagnostics = lazy(() => import('./pages/Diagnostics'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const porrahime = lazy(() => import('./pages/porrahime'));  // Nombre en minús para match
const byzapaonepage = lazy(() => import('./pages/byzapaonepage'));  // Nombre en minús
const adminpage = lazy(() => import('./pages/adminpage'));  // Nombre en minús

function PrivateRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <div>Cargando...</div>;
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Cargando...</div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/picks-page" element={<PrivateRoute><PicksPage /></PrivateRoute>} />
          <Route path="/picks" element={<PrivateRoute><Picks /></PrivateRoute>} />
          <Route path="/standings" element={<PrivateRoute><StandingsPage /></PrivateRoute>} />
          <Route path="/live" element={<PrivateRoute><Live /></PrivateRoute>} />
          <Route path="/partidas" element={<PrivateRoute><Partidas /></PrivateRoute>} />
          <Route path="/all-picks" element={<PrivateRoute><AllPicksPage /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><MyHistoryPage /></PrivateRoute>} />
          <Route path="/diagnostics" element={<PrivateRoute><Diagnostics /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/porrahime" element={<PrivateRoute><porrahime /></PrivateRoute>} />
          <Route path="/home" element={<PrivateRoute><byzapaonepage /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><adminpage /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/picks" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;