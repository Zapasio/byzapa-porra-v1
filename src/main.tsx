import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Asegúrate que el nombre y la ruta sean correctos
import './index.css'; // Si usas Tailwind u otros estilos globales

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
