# Sistema de Reservas - Guía de Instalación y Ejecución

## 📋 Requisitos Previos

- **Node.js** (v18 o superior) - [Descargar aquí](https://nodejs.org/)
- **Navegador web** moderno (Chrome, Firefox, Edge)
- **Redis** (opcional, el sistema funciona sin él)

---

## 🚀 Instalación Paso a Paso

### 1. Obtener el Proyecto

Si tienes el proyecto en tu computadora, ve a la carpeta:
```
F:\Stiven\FRONT\Sistema-de-reservas
```

O clona el repositorio si está en GitHub:
```bash
git clone https://github.com/StivenVega28/Sistema-de-reservas.git
cd Sistema-de-reservas
```

### 2. Instalar Dependencias

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
npm install
```

Esto instalará todas las dependencias necesarias:
- express (servidor backend)
- jsonwebtoken (autenticación JWT)
- bcryptjs (encriptación de passwords)
- redis (cliente de Redis)
- cookie-parser (manejo de cookies)
- dotenv (variables de entorno)
- uuid (generación de tokens únicos)
- nodemon (reinicio automático del servidor)

### 3. Verificar Variables de Entorno

El archivo `.env` ya debería estar configurado. Verifica que contenga:

```env
PORT=4000
JWT_SECRET=clave_super_secreta_cambiarla_en_produccion
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

---

## 🏃 Ejecutar el Proyecto

### Opción A: Desarrollo (Recomendado)

```bash
npm run dev
```

Esto iniciará el servidor con **nodemon** que se reinicia automáticamente cuando haces cambios en el código.

### Opción B: Producción

```bash
npm start
```

Esto iniciará el servidor sin reinicio automático.

---

## 🌐 Abrir el Frontend

Una vez que el servidor esté corriendo, abre tu navegador y navega a:

```
file:///F:/Stiven/FRONT/Sistema-de-reservas/login.html
```

O simplemente haz doble clic en el archivo `login.html` en tu carpeta del proyecto.

---

## 🔑 Credenciales de Acceso

| Rol | Usuario | Email | Password |
|-----|---------|-------|----------|
| **Admin** | `admin` | `admin@restaurante.com` | `admin123` |
| **Mesero** | `mesero` | `mesero@restaurante.com` | `mesero123` |
| **Cocina** | `cocina` | `cocina@restaurante.com` | `cocina123` |
| **Despacho** | `despacho` | `despacho@restaurante.com` | `despacho123` |

**Puedes usar el usuario simple o el email completo para iniciar sesión.**

---

## 📁 Estructura del Proyecto

```
Sistema-de-reservas/
├── backend/                    # Servidor backend
│   ├── config/
│   │   └── redis.js           # Configuración de Redis
│   ├── controllers/
│   │   └── authController.js  # Lógica de autenticación
│   ├── middlewares/
│   │   ├── auth.js           # Middleware de autenticación
│   │   └── roleGuard.js      # Middleware de roles
│   ├── routes/
│   │   └── authRoutes.js     # Rutas de la API
│   ├── services/
│   │   └── tokenService.js   # Servicio de tokens JWT
│   └── server.js            # Servidor Express principal
├── js/                        # Frontend JavaScript
│   ├── services/
│   │   └── api.js           # Servicio de API
│   ├── views/
│   │   ├── login.js         # Vista de login
│   │   ├── mesero.js        # Vista de mesero
│   │   ├── cocina.js        # Vista de cocina
│   │   └── despacho.js      # Vista de despacho
│   ├── auth.js              # Lógica de autenticación
│   ├── app.js               # Aplicación principal
│   └── utils/               # Utilidades
├── css/                       # Estilos
│   └── styles.css
├── *.html                     # Páginas HTML
├── .env                       # Variables de entorno
├── package.json              # Dependencias de Node.js
└── README.md                 # Este archivo
```

---

## 🔧 Configuración Opcional: Redis

El sistema funciona sin Redis (usa un cliente mock), pero para producción puedes instalar Redis:

### Windows:
1. Descarga Redis para Windows desde [GitHub](https://github.com/microsoftarchive/redis/releases)
2. O usa Docker: `docker run -d -p 6379:6379 redis`

### Linux/Mac:
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# Mac
brew install redis
```

Una vez instalado, Redis se conectará automáticamente usando la configuración del `.env`.

---

## 🛠️ Comandos Disponibles

```bash
# Instalar dependencias
npm install

# Iniciar servidor en desarrollo
npm run dev

# Iniciar servidor en producción
npm start

# Instalar nueva dependencia
npm install <nombre-paquete>

# Instalar dependencia de desarrollo
npm install --save-dev <nombre-paquete>
```

---

## 📡 Endpoints de la API

Una vez que el servidor esté corriendo en `http://localhost:4000`, estos endpoints estarán disponibles:

### Públicos:
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/refresh-token` - Renovar token
- `POST /api/auth/logout` - Cerrar sesión

### Protegidos (requieren token):
- `GET /api/auth/me` - Obtener usuario actual
- `GET /api/auth/reservations` - Ver reservas
- `POST /api/auth/reservations` - Crear reserva
- `PUT /api/auth/reservations/:id/status` - Cambiar estado
- `POST /api/auth/admin/change-role` - Cambiar rol (solo admin)

### Sistema:
- `GET /api/health` - Verificar estado del servidor
- `GET /api/redis-test` - Verificar conexión Redis

---

## 🐛 Solución de Problemas

### El servidor no inicia:
- Verifica que Node.js esté instalado: `node --version`
- Verifica que las dependencias estén instaladas: `npm install`
- Verifica que el puerto 4000 no esté en uso

### El login no funciona:
- Verifica que el servidor backend esté corriendo
- Revisa las credenciales en la tabla de arriba
- Abre la consola del navegador (F12) para ver errores

### Error de conexión Redis:
- Es normal si no tienes Redis instalado
- El sistema usará automáticamente el cliente mock
- Redis es opcional para el funcionamiento básico

---

## 🎯 Próximos Pasos

Una vez que el proyecto esté funcionando:

1. **Probar diferentes roles** para ver las diferentes vistas
2. **Verificar el control de acceso** por rol
3. **Probar el refresh token** (dejar la sesión abierta 15 min)
4. **Instalar Redis** para producción (opcional)

---

## 📝 Notas de Desarrollo

- El servidor se reinicia automáticamente con `npm run dev`
- Los cambios en el frontend requieren recargar la página
- Las contraseñas están hasheadas con bcryptjs
- Los tokens JWT expiran en 15 minutos
- Los refresh tokens duran 7 días

---

## 🤝 Soporte

Si encuentras algún problema:
1. Revisa la consola del navegador (F12)
2. Revisa la terminal donde corre el servidor
3. Verifica que todas las dependencias estén instaladas

---

**¡Disfruta usando el Sistema de Reservas!** 🎉
