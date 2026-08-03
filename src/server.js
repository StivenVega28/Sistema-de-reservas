require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Archivos estáticos
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/mesas', require('./routes/mesasRoutes'));
app.use('/api/reservas', require('./routes/reservasRoutes'));
app.use('/api/pedidos', require('./routes/pedidosRoutes'));
app.use('/api/cocina', require('./routes/cocinaRoutes'));
app.use('/api/despachos', require('./routes/despachosRoutes'));
app.use('/api/facturacion', require('./routes/facturacionRoutes'));
app.use('/api/caja', require('./routes/cajaRoutes'));
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/reportes', require('./routes/reportesRoutes'));
app.use('/api/usuarios', require('./routes/usuariosRoutes'));

// SPA fallback — servir paginas HTML segun ruta
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'login.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'admin.html'));
});
app.get('/mesero', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'mesero.html'));
});
app.get('/cocina', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'cocina.html'));
});
app.get('/despacho', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'despacho.html'));
});

// Redirigir raiz a login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Verificar no-shows cada 5 minutos
const { verificarNoShows } = require('./controllers/reservasController');
setInterval(verificarNoShows, 5 * 60 * 1000);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
