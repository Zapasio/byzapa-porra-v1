const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Servir archivos estáticos desde /dist
app.use(express.static(path.join(__dirname, 'dist')));

// ✅ CORREGIDO: Ruta con parámetro con nombre
app.get('/matchday/:day', async (req, res) => {
  const day = req.params.day;
  res.send(`Estás viendo la jornada: ${day}`);
});

// Ruta para servir siempre index.html (para SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
