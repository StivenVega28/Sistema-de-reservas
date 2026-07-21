# Sistema de Reservas para Restaurante

Proyecto en **HTML, CSS y JavaScript puro (ES Modules)** que simula un sistema
de reservas de mesas, pedidos y gestión administrativa, usando **localStorage**
como base de datos del navegador (sin backend).

## Estructura de carpetas

```
restaurante-reservas/
├── index.html          # Vista Mesero (reservas + pedidos)
├── cocina.html         # Vista Cocina
├── despacho.html       # Vista Despacho
├── admin.html          # Vista Admin (dashboard)
├── css/
│   └── styles.css      # Estilos globales, responsive, variables CSS
├── js/
│   ├── app.js           # Bootstrap: seed inicial + navbar activo + toast
│   ├── data/
│   │   ├── seed.js      # Datos iniciales (mesas, meseros, platos, pedidos)
│   │   └── models.js    # Fábricas (crearPedido) y helpers (subtotal)
│   ├── utils/
│   │   └── storage.js   # Wrapper centralizado de localStorage
│   └── views/
│       ├── mesero.js
│       ├── cocina.js
│       ├── despacho.js
│       └── admin.js
└── assets/
    └── icons/
```

## Flujo de datos (localStorage)

| Clave         | Contenido                                  | Quién escribe               |
|---------------|---------------------------------------------|------------------------------|
| `rr_mesas`    | Estado de cada mesa (libre/reservada/ocupada) | Mesero, Despacho            |
| `rr_meseros`  | Catálogo de meseros                          | Seed (fijo)                  |
| `rr_platos`   | Catálogo de platos y precios                 | Seed (fijo)                  |
| `rr_pedidos`  | Pedidos con items, estado, propina           | Mesero (crea), Cocina (listo), Despacho (entregado) |

### Ciclo de un pedido
1. **Mesero**: selecciona mesa libre + mesero + platos → crea pedido `pendiente`, mesa pasa a `ocupada`.
2. **Cocina**: ve pedidos `pendiente`/`cocina`, los marca `listo`.
3. **Despacho**: ve pedidos `listo`, registra propina y marca `entregado` → mesa vuelve a `libre`.
4. **Admin**: consolida métricas en tiempo real (recalcula sobre pedidos `entregado`).

## Buenas prácticas aplicadas
- Separación de responsabilidades (data / utils / views).
- Módulos ES6 (`import`/`export`), sin variables globales salvo `showToast`.
- Wrapper único de `localStorage` (`Storage.get/set`) con manejo de errores y `JSON.stringify/parse`.
- Nomenclatura en español consistente con el dominio del negocio.
- CSS con variables, mobile-first y layout con Grid/Flexbox responsive.
- Sincronización entre pestañas usando el evento `storage`.

## Cómo ejecutar
Abre `index.html` con un servidor local (por ejemplo, extensión "Live Server" de VS Code)
para que los módulos ES6 funcionen correctamente (no abrir con `file://` directo).

## Próximos pasos sugeridos
- Agregar un módulo `js/utils/validaciones.js` para validar formularios.
- Persistir un histórico de pedidos cancelados.
- Exportar reportes del Admin a CSV.
