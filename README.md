# Sistema de Reservas para Restaurante

Proyecto en **HTML, CSS y JavaScript puro (ES Modules)** que simula un sistema
de reservas de mesas, pedidos y gestión administrativa, usando **localStorage**
como base de datos del navegador (sin backend).

## Características principales

- 🔐 **Sistema de autenticación** con roles (admin, mesero, cocina, despacho)
- 🛡️ **Encriptación de contraseñas** usando Web Crypto API (PBKDF2)
- 📅 **Reservas con fecha y hora** con validación de fechas futuras
- 🔄 **Flujo de pedidos** en tiempo real (preparacion → listo → entregado)
- 📊 **Panel administrativo** con métricas de ventas y propinas
- 📱 **Diseño responsive** con mobile-first
- 🔒 **Bloqueo de cuentas** tras múltiples intentos fallidos

## Estructura de carpetas

```
restaurante-reservas/
├── index.html          # Vista Mesero (reservas + pedidos)
├── login.html          # Vista de inicio de sesión
├── cocina.html         # Vista Cocina
├── despacho.html       # Vista Despacho
├── admin.html          # Vista Admin (dashboard)
├── css/
│   └── styles.css      # Estilos globales, responsive, variables CSS
├── js/
│   ├── app.js           # Bootstrap: seed inicial + navbar activo + toast
│   ├── auth.js          # Sistema de autenticación y gestión de sesiones
│   ├── data/
│   │   ├── seed.js      # Datos iniciales (mesas, meseros, platos, usuarios)
│   │   └── models.js    # Fábricas (crearPedido) y helpers (subtotal)
│   ├── utils/
│   │   ├── storage.js   # Wrapper centralizado de localStorage
│   │   ├── crypto.js    # Utilidades de encriptación (PBKDF2)
│   │   └── validaciones.js # Validaciones de usuario y contraseña
│   └── views/
│       ├── login.js     # Lógica de inicio de sesión
│       ├── mesero.js    # Gestión de mesas y pedidos
│       ├── cocina.js    # Gestión de pedidos en cocina
│       ├── despacho.js  # Gestión de entregas y propinas
│       └── admin.js     # Dashboard administrativo
└── assets/
    ├── icons/
    └── img/
```

## Flujo de datos (localStorage)

| Clave         | Contenido                                  | Quién escribe               |
|---------------|---------------------------------------------|------------------------------|
| `rr_mesas`    | Estado de cada mesa (libre/ocupada)         | Mesero, Despacho            |
| `rr_meseros`  | Catálogo de meseros                          | Seed (fijo)                  |
| `rr_platos`   | Catálogo de platos y precios                 | Seed (fijo)                  |
| `rr_pedidos`  | Pedidos con items, estado, propina, fechaReserva | Mesero (crea), Cocina (listo), Despacho (entregado) |
| `rr_usuarios` | Usuarios con contraseñas encriptadas         | Seed (fijo)                  |
| `rr_sesion`   | Sesión activa del usuario actual              | Auth (login/logout)         |

### Ciclo de un pedido
1. **Mesero**: selecciona mesa libre + mesero + platos + fecha/hora → crea pedido `preparacion`, mesa pasa a `ocupada`.
2. **Cocina**: ve pedidos `preparacion`, los marca `listo`.
3. **Despacho**: ve pedidos `listo`, registra propina y marca `entregado` → mesa vuelve a `libre`.
4. **Admin**: consolida métricas en tiempo real (recalcula sobre pedidos `entregado`).

### Estados de pedidos
- `preparacion`: Pedido creado por el mesero, visible en cocina
- `listo`: Pedido preparado por cocina, visible en despacho
- `entregado`: Pedido entregado al cliente, mesa liberada

### Estados de mesas
- `libre`: Mesa disponible para reservas
- `ocupada`: Mesa con pedido activo

## Buenas prácticas aplicadas
- Separación de responsabilidades (data / utils / views / auth).
- Módulos ES6 (`import`/`export`), sin variables globales salvo `showToast`.
- Wrapper único de `localStorage` (`Storage.get/set`) con manejo de errores y `JSON.stringify/parse`.
- Nomenclatura en español consistente con el dominio del negocio.
- CSS con variables, mobile-first y layout con Grid/Flexbox responsive.
- Sincronización entre pestañas usando el evento `storage`.
- Encriptación segura de contraseñas usando Web Crypto API (PBKDF2).
- Validación de elementos DOM para prevenir errores de referencia nula.
- Sistema de roles y permisos granular para cada vista.
- Bloqueo de cuentas tras múltiples intentos fallidos de login.

## Cómo ejecutar
Abre `index.html` con un servidor local (por ejemplo, extensión "Live Server" de VS Code)
para que los módulos ES6 funcionen correctamente (no abrir con `file://` directo).

## Usuarios demo
El sistema incluye usuarios de prueba para facilitar el desarrollo:

| Usuario   | Contraseña | Rol      | Permisos                       |
|-----------|------------|----------|--------------------------------|
| admin     | Admin123   | admin    | Todas las vistas               |
| mesero    | Mesero123  | mesero   | Mesero, Despacho               |
| cocina    | Cocina123  | cocina   | Cocina                         |
| despacho  | Despacho123| despacho | Despacho                       |

## Características de seguridad
- Contraseñas encriptadas usando PBKDF2 con 100,000 iteraciones
- Bloqueo temporal tras 5 intentos fallidos (30 segundos)
- Sesiones con expiración de 8 horas
- Validación de contraseñas (mínimo 8 caracteres, mayúscula, minúscula, número)
- Sanitización de entradas de usuario para prevenir XSS

## Mejoras recientes
- ✅ Sistema de autenticación completo con encriptación
- ✅ Validación de fechas futuras para reservas (mínimo 5 minutos)
- ✅ Bloqueo de fechas y horas anteriores en el selector
- ✅ Validación de elementos DOM para prevenir errores
- ✅ Capitalización automática del nombre de usuario
- ✅ Validación de formularios en tiempo real
- ✅ Manejo robusto de errores en localStorage
- ✅ Marcado de navegación activa en todas las vistas
- ✅ Permisos granulares por rol en el navbar

## Tecnologías utilizadas
- **HTML5**: Estructura semántica
- **CSS3**: Variables CSS, Grid, Flexbox, animaciones
- **JavaScript ES6+**: Módulos, async/await, Web Crypto API
- **LocalStorage**: Persistencia de datos en el navegador
- **Web Crypto API**: Encriptación de contraseñas

## Notas de desarrollo
- El sistema usa módulos ES6, por lo que requiere un servidor local
- Los datos persisten en localStorage del navegador
- La sincronización entre pestañas usa el evento `storage`
- Las sesiones expiran después de 8 horas de inactividad
