require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const redisClient = require('./config/redis');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares globales
app.use(express.json());
app.use(cookieParser());

// Middleware de CORS (para desarrollo)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta de prueba de Redis
app.get('/api/redis-test', async (req, res) => {
  try {
    await redisClient.set('test', 'Hola desde Redis');
    const value = await redisClient.get('test');
    await redisClient.del('test');
    
    res.json({ 
      status: 'ok', 
      message: 'Redis funcionando correctamente',
      testValue: value
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Error conectando a Redis',
      error: error.message
    });
  }
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error no capturado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Rutas disponibles:`);
  console.log(`   GET  /api/health - Verificar estado del servidor`);
  console.log(`   GET  /api/redis-test - Verificar conexión Redis`);
  console.log(`   POST /api/auth/login - Iniciar sesión`);
  console.log(`   POST /api/auth/refresh-token - Renovar token`);
  console.log(`   POST /api/auth/logout - Cerrar sesión`);
  console.log(`   GET  /api/auth/me - Obtener usuario actual`);
  console.log(`   GET  /api/auth/reservations - Ver reservas`);
  console.log(`   POST /api/auth/admin/change-role - Cambiar rol (admin)`);
});

// Cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await redisClient.quit();
  process.exit(0);
});
