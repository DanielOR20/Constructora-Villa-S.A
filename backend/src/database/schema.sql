-- =============================================================================
-- ESQUEMA DE BASE DE DATOS DDL
-- Sistema de Gestión de Inventarios - Constructora Del Valle S.A.
-- Caso de Estudio: Quiz Barry Vega - Parte A & B
-- Seguridad: Autenticación JWT, RBAC y Matriz de Aprobación de Compras
-- =============================================================================

CREATE DATABASE IF NOT EXISTS constructora_del_valle
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE constructora_del_valle;

-- Deshabilitar restricciones temporalmente para permitir recreación limpia
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS movimientos;
DROP TABLE IF EXISTS orden_compra_detalles;
DROP TABLE IF EXISTS ordenes_compra;
DROP TABLE IF EXISTS inventario_stock;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS proveedores;
DROP TABLE IF EXISTS materiales;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 1. TABLA: materiales
-- Catálogo oficial de insumos de construcción de Constructora Del Valle S.A.
-- -----------------------------------------------------------------------------
CREATE TABLE materiales (
  id_material INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  unidad_medida VARCHAR(30) NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  stock_minimo INT NOT NULL DEFAULT 10,
  lead_time_dias INT NOT NULL DEFAULT 3,
  demanda_promedio_diaria DECIMAL(10, 2) NOT NULL DEFAULT 20.00,
  demanda_maxima_diaria DECIMAL(10, 2) NOT NULL DEFAULT 35.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_material_codigo (codigo),
  INDEX idx_material_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. TABLA: proveedores
-- Registro de proveedores comerciales evaluados en auditoría
-- -----------------------------------------------------------------------------
CREATE TABLE proveedores (
  id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(30) NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  contacto VARCHAR(100),
  telefono VARCHAR(30),
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_proveedor_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. TABLA: usuarios
-- Sistema de Autenticación, JWT y Control de Acceso Basado en Roles (RBAC)
-- Roles: 'jefatura_area', 'jefatura_compras', 'gerencia_financiera', 'gerencia_general'
-- -----------------------------------------------------------------------------
CREATE TABLE usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('jefatura_area', 'jefatura_compras', 'gerencia_financiera', 'gerencia_general') NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_usuario_email (email),
  INDEX idx_usuario_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. TABLA: ordenes_compra
-- Cabecera de órdenes de compra con Matriz de Aprobación Jerárquica y Fugas de Valor
-- -----------------------------------------------------------------------------
CREATE TABLE ordenes_compra (
  id_orden INT AUTO_INCREMENT PRIMARY KEY,
  numero_orden VARCHAR(40) NOT NULL UNIQUE,
  id_proveedor INT NOT NULL,
  fecha_emision DATE NOT NULL,
  estado ENUM('PENDIENTE', 'APROBADA', 'PAGADA', 'CANCELADA') DEFAULT 'PENDIENTE',
  total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  estado_aprobacion ENUM('pendiente', 'aprobada', 'rechazada') NOT NULL DEFAULT 'pendiente',
  rol_aprobador_requerido ENUM('jefatura_area', 'jefatura_compras', 'gerencia_financiera', 'gerencia_general') NOT NULL DEFAULT 'jefatura_area',
  aprobado_por_id INT NULL,
  fecha_aprobacion DATETIME NULL,
  motivo_rechazo TEXT NULL,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ordenes_proveedor 
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ordenes_aprobador
    FOREIGN KEY (aprobado_por_id) REFERENCES usuarios(id_usuario)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_orden_fecha (fecha_emision),
  INDEX idx_orden_proveedor (id_proveedor),
  INDEX idx_orden_aprobacion (estado_aprobacion),
  INDEX idx_orden_rol_requerido (rol_aprobador_requerido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. TABLA: orden_compra_detalles
-- Partidas y renglones de insumos adquiridos en cada orden de compra
-- -----------------------------------------------------------------------------
CREATE TABLE orden_compra_detalles (
  id_detalle INT AUTO_INCREMENT PRIMARY KEY,
  id_orden INT NOT NULL,
  id_material INT NOT NULL,
  cantidad DECIMAL(10, 2) NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  CONSTRAINT fk_detalles_orden 
    FOREIGN KEY (id_orden) REFERENCES ordenes_compra(id_orden) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_detalles_material 
    FOREIGN KEY (id_material) REFERENCES materiales(id_material) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_detalle_material (id_material),
  INDEX idx_detalle_orden (id_orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. TABLA: movimientos
-- Registro cronológico de transacciones (entradas, salidas, ajustes, traslados)
-- -----------------------------------------------------------------------------
CREATE TABLE movimientos (
  id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
  tipo_movimiento ENUM('ENTRADA', 'SALIDA', 'AJUSTE', 'TRANSFERENCIA') NOT NULL,
  id_material INT NOT NULL,
  cantidad DECIMAL(10, 2) NOT NULL,
  ubicacion_origen VARCHAR(100),
  ubicacion_destino VARCHAR(100),
  documento_referencia VARCHAR(100),
  observaciones TEXT,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_movimientos_material 
    FOREIGN KEY (id_material) REFERENCES materiales(id_material) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_movimientos_material (id_material),
  INDEX idx_movimientos_tipo (tipo_movimiento),
  INDEX idx_movimientos_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. TABLA: inventario_stock
-- Saldo de existencias por material y ubicación
-- -----------------------------------------------------------------------------
CREATE TABLE inventario_stock (
  id_stock INT AUTO_INCREMENT PRIMARY KEY,
  id_material INT NOT NULL,
  ubicacion VARCHAR(100) NOT NULL DEFAULT 'Bodega Central',
  cantidad_actual DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  actualizado_al TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_material_ubicacion (id_material, ubicacion),
  CONSTRAINT fk_stock_material 
    FOREIGN KEY (id_material) REFERENCES materiales(id_material) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
