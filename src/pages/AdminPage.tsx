import React from 'react';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-lg p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold text-primary mb-4">Panel Admin</h1>
        <p className="text-gray-700">Esta es la página placeholder para admin. Agrega botones para procesar jornadas, ingresar resultados o gestión de users.</p>
        <button className="bg-red-500 text-white p-2 rounded mt-4">Procesar Jornada (Placeholder)</button>
      </div>
    </div>
  );
}