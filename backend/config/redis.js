const redis = require('redis');

let redisClient = null;

function createMockRedisClient() {
  // Cliente mock para cuando Redis no está disponible
  const mockClient = {
    async set() { return 'OK'; },
    async setEx() { return 'OK'; },
    async get() { return null; },
    async del() { return 1; },
    async keys() { return []; },
    async quit() { return 'OK'; },
    isMock: true
  };
  return mockClient;
}

async function createRedisClient() {
  try {
    const client = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: false // Desactivar reconexión automática
      }
    });

    let connected = false;
    
    client.on('error', () => {
      if (!connected) {
        // Solo mostrar error una vez durante la conexión inicial
      }
    });
    
    client.on('connect', () => {
      connected = true;
      console.log('✅ Redis conectado');
    });

    // Timeout de 2 segundos para la conexión
    await Promise.race([
      client.connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 2000)
      )
    ]);
    
    return client;
  } catch (error) {
    console.warn('⚠️  Redis no disponible - El servidor funcionará sin cache');
    console.warn('   Para usar Redis, instálalo y configúralo correctamente');
    return createMockRedisClient();
  }
}

// Inicializar cliente de Redis
redisClient = createMockRedisClient(); // Por defecto usar mock

createRedisClient().then(client => {
  if (!client.isMock) {
    redisClient = client;
  } else {
    console.log('🔄 Usando cliente mock de Redis (sin persistencia)');
  }
}).catch(err => {
  console.warn('⚠️  Error inicializando Redis, usando mock:', err.message);
});

module.exports = redisClient;
