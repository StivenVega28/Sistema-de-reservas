-- ============================================================
-- Sistema de Reservas de Restaurante - Schema MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS restaurante_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE restaurante_db;

-- ============================================================
-- USUARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  rol ENUM('administrador','mesero','cocina','despachador') NOT NULL,
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- REFRESH TOKENS (en lugar de Redis)
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- CATEGORIAS DE PLATOS
-- ============================================================
CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255),
  activa TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- PLATOS / MENU
-- ============================================================
CREATE TABLE IF NOT EXISTS platos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(12,2) NOT NULL,
  categoria_id INT,
  imagen_url VARCHAR(500),
  disponible TINYINT(1) DEFAULT 1,
  agotado TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- INSUMOS (inventario basico)
-- ============================================================
CREATE TABLE IF NOT EXISTS insumos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  unidad VARCHAR(50) NOT NULL DEFAULT 'unidad',
  stock_actual DECIMAL(10,2) DEFAULT 0,
  stock_minimo DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- RECETAS (relacion platos <-> insumos)
-- ============================================================
CREATE TABLE IF NOT EXISTS recetas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plato_id INT NOT NULL,
  insumo_id INT NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (plato_id) REFERENCES platos(id) ON DELETE CASCADE,
  FOREIGN KEY (insumo_id) REFERENCES insumos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- MODIFICADORES (catalogo reutilizable)
-- ============================================================
CREATE TABLE IF NOT EXISTS modificadores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  tipo ENUM('nota','preparacion','ingrediente') DEFAULT 'nota',
  activo TINYINT(1) DEFAULT 1
) ENGINE=InnoDB;

-- ============================================================
-- MESAS
-- ============================================================
CREATE TABLE IF NOT EXISTS mesas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero INT NOT NULL UNIQUE,
  capacidad INT NOT NULL DEFAULT 4,
  estado ENUM('disponible','reservada','ocupada') DEFAULT 'disponible',
  pos_x INT DEFAULT 0,
  pos_y INT DEFAULT 0,
  mesero_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (mesero_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- RESERVAS
-- ============================================================
CREATE TABLE IF NOT EXISTS reservas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mesa_id INT NOT NULL,
  cliente_nombre VARCHAR(150) NOT NULL,
  cliente_telefono VARCHAR(30),
  personas INT NOT NULL DEFAULT 1,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  estado ENUM('pendiente','confirmada','en_mesa','completada','cancelada','no_show') DEFAULT 'pendiente',
  notas TEXT,
  creada_por INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE CASCADE,
  FOREIGN KEY (creada_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- PEDIDOS
-- ============================================================
CREATE TABLE IF NOT EXISTS pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mesa_id INT NOT NULL,
  mesero_id INT,
  estado ENUM('abierto','en_preparacion','listo','entregado','cerrado','cancelado') DEFAULT 'abierto',
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE CASCADE,
  FOREIGN KEY (mesero_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- DETALLE DE PEDIDO (platos dentro de un pedido)
-- ============================================================
CREATE TABLE IF NOT EXISTS pedido_detalle (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  plato_id INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(12,2) NOT NULL,
  notas TEXT,
  estado ENUM('pendiente','en_preparacion','listo','entregado','cancelado') DEFAULT 'pendiente',
  cuenta_numero INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (plato_id) REFERENCES platos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- MODIFICADORES APLICADOS A DETALLE
-- ============================================================
CREATE TABLE IF NOT EXISTS detalle_modificadores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  detalle_id INT NOT NULL,
  modificador_id INT,
  texto_libre VARCHAR(255),
  FOREIGN KEY (detalle_id) REFERENCES pedido_detalle(id) ON DELETE CASCADE,
  FOREIGN KEY (modificador_id) REFERENCES modificadores(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- DESPACHOS
-- ============================================================
CREATE TABLE IF NOT EXISTS despachos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  mesa_id INT NOT NULL,
  estado ENUM('pendiente','en_ruta','entregado') DEFAULT 'pendiente',
  despachador_id INT,
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE CASCADE,
  FOREIGN KEY (despachador_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- FACTURAS (cuenta de mesa)
-- ============================================================
CREATE TABLE IF NOT EXISTS facturas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  mesa_id INT NOT NULL,
  mesero_id INT,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  impuesto_porcentaje DECIMAL(5,2) DEFAULT 8.00,
  impuesto_valor DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  metodo_pago ENUM('efectivo','tarjeta','mixto') DEFAULT 'efectivo',
  monto_efectivo DECIMAL(12,2) DEFAULT 0,
  monto_tarjeta DECIMAL(12,2) DEFAULT 0,
  cambio DECIMAL(12,2) DEFAULT 0,
  propina DECIMAL(12,2) DEFAULT 0,
  num_comensales_division INT DEFAULT 1,
  -- Campos para facturacion electronica futura
  cliente_nit VARCHAR(20),
  cliente_razon_social VARCHAR(200),
  consecutivo_factura VARCHAR(30),
  estado ENUM('abierta','pagada','anulada') DEFAULT 'abierta',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE CASCADE,
  FOREIGN KEY (mesero_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- CIERRES DE CAJA
-- ============================================================
CREATE TABLE IF NOT EXISTS cierres_caja (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  fecha DATE NOT NULL,
  turno VARCHAR(50),
  total_efectivo DECIMAL(12,2) DEFAULT 0,
  total_tarjeta DECIMAL(12,2) DEFAULT 0,
  total_propinas DECIMAL(12,2) DEFAULT 0,
  total_ventas DECIMAL(12,2) DEFAULT 0,
  num_facturas INT DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- AUDITORIA
-- ============================================================
CREATE TABLE IF NOT EXISTS auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  accion VARCHAR(100) NOT NULL,
  entidad VARCHAR(50) NOT NULL,
  entidad_id INT,
  datos_anteriores JSON,
  datos_nuevos JSON,
  ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- INDICES
-- ============================================================
ALTER TABLE reservas ADD INDEX idx_reservas_fecha (fecha);
ALTER TABLE reservas ADD INDEX idx_reservas_estado (estado);
ALTER TABLE pedidos ADD INDEX idx_pedidos_estado (estado);
ALTER TABLE pedido_detalle ADD INDEX idx_detalle_estado (estado);
ALTER TABLE despachos ADD INDEX idx_despachos_estado (estado);
ALTER TABLE facturas ADD INDEX idx_facturas_estado (estado);
ALTER TABLE facturas ADD INDEX idx_facturas_fecha (created_at);
ALTER TABLE auditoria ADD INDEX idx_auditoria_entidad (entidad, entidad_id);
ALTER TABLE auditoria ADD INDEX idx_auditoria_fecha (created_at);
