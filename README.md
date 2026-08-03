# Sistema de Reservas para Restaurante

Sistema web para administrar reservas, mesas, pedidos, cocina, despachos, facturacion, caja, menu, usuarios, reportes y auditoria de un restaurante.

El proyecto usa frontend vanilla y backend con Node.js, Express y MySQL.

## Tecnologias

- HTML5
- CSS3
- JavaScript vanilla
- Node.js
- Express
- MySQL
- JWT para autenticacion
- bcryptjs para contrasenas

## Funcionalidades

- Inicio de sesion por roles.
- Panel de administrador.
- Panel de mesero.
- Panel de cocina.
- Panel de despacho.
- Gestion de mesas.
- Creacion y seguimiento de reservas.
- Creacion, edicion y cancelacion de pedidos.
- Cola de cocina con estados de preparacion.
- Despacho de pedidos listos.
- Facturacion de pedidos entregados o listos.
- Caja diaria calculada desde facturas pagadas.
- Gestion de menu, categorias, platos, insumos y modificadores.
- Reportes de ventas, platos vendidos, rotacion de mesas y auditoria.
- Auditoria de acciones importantes del sistema.
- Datos demo mediante script de seed.

## Roles del sistema

| Rol | Panel | Descripcion |
| --- | --- | --- |
| Administrador | `/admin` | Gestion completa del sistema |
| Mesero | `/mesero` | Mesas, reservas, pedidos, facturacion y despachos |
| Cocina | `/cocina` | Cola de platos y cambios de estado |
| Despachador | `/despacho` | Gestion de entregas a mesa |

## Requisitos

- Node.js 18 o superior
- MySQL 8 o compatible
- npm

## Instalacion

1. Clonar el repositorio:

```bash
git clone <url-del-repositorio>
cd Sistema-de-reservas
```

2. Instalar dependencias:

```bash
npm install
```

3. Crear el archivo de variables de entorno:

```bash
cp .env.example .env
```

En Windows PowerShell tambien puedes usar:

```powershell
Copy-Item .env.example .env
```

4. Editar `.env` con tus credenciales de MySQL:

```env
PORT=4000
NODE_ENV=development

JWT_SECRET=cambia_esta_clave_en_tu_entorno
JWT_EXPIRES_IN=8h

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=restaurante_db

NOSHOW_MINUTES=30
```

## Base de datos

El proyecto incluye el archivo `schema.sql`, que crea la base de datos `restaurante_db` y todas las tablas necesarias.

Para crear la base de datos y cargar datos demo, ejecuta:

```bash
npm run seed
```

El seed crea:

- Usuarios demo.
- Mesas demo.
- Categorias.
- Platos.
- Modificadores.
- Insumos basicos.

## Ejecutar el proyecto

Modo desarrollo:

```bash
npm run dev
```

Modo normal:

```bash
npm start
```

Luego abre en el navegador:

```text
http://localhost:4000
```

La ruta raiz redirige automaticamente a `/login`.

## Usuarios demo

| Usuario | Contrasena | Rol |
| --- | --- | --- |
| `admin` | `admin123` | Administrador |
| `mesero` | `mesero123` | Mesero |
| `cocina` | `cocina123` | Cocina |
| `despacho` | `despacho123` | Despachador |

## Flujo principal del sistema

1. El administrador o mesero crea reservas y administra mesas.
2. El mesero crea un pedido para una mesa.
3. Los platos del pedido llegan a cocina como pendientes.
4. Cocina cambia cada plato de `pendiente` a `en_preparacion` y luego a `listo`.
5. Cuando el pedido tiene platos listos, se puede crear un despacho.
6. El despacho pasa de `pendiente` a `en_ruta` y luego a `entregado`.
7. El pedido entregado o listo puede facturarse.
8. Las facturas pagadas suman automaticamente a ventas y caja diaria.

## Estructura del proyecto

```text
Sistema-de-reservas/
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── img/
│   │   └── FondoLogin.jpg
│   ├── js/
│   │   └── api.js
│   └── pages/
│       ├── admin.html
│       ├── cocina.html
│       ├── despacho.html
│       ├── login.html
│       └── mesero.html
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   ├── seed.js
│   └── server.js
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── schema.sql
└── README.md
```

## Scripts disponibles

| Comando | Descripcion |
| --- | --- |
| `npm install` | Instala dependencias |
| `npm run seed` | Crea la base de datos y datos demo |
| `npm run dev` | Ejecuta con nodemon |
| `npm start` | Ejecuta el servidor |

## Variables de entorno

| Variable | Descripcion |
| --- | --- |
| `PORT` | Puerto del servidor Express |
| `NODE_ENV` | Entorno de ejecucion |
| `JWT_SECRET` | Clave privada para firmar tokens JWT |
| `JWT_EXPIRES_IN` | Duracion del token JWT |
| `DB_HOST` | Host de MySQL |
| `DB_USER` | Usuario de MySQL |
| `DB_PASSWORD` | Contrasena de MySQL |
| `DB_NAME` | Nombre de la base de datos |
| `NOSHOW_MINUTES` | Minutos para marcar reservas como no-show |

