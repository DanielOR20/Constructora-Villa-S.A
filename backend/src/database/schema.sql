-- =============================================================================
-- ESQUEMA DE BASE DE DATOS DDL NORMALIZADO CON CLAVES FORÁNEAS ESTRICTAS (CASCADE)
-- Constructora Del Valle S.A.
-- Caso de Estudio: Quiz Barry Vega - Parte A & B
-- Seguridad: Autenticación JWT, RBAC y Matriz de Aprobación de Compras
-- =============================================================================

CREATE DATABASE IF NOT EXISTS constructora_del_valle
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE constructora_del_valle;

-- Deshabilitar restricciones temporalmente para permitir recreación limpia
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS inventario_stock;
DROP TABLE IF EXISTS movimientos;
DROP TABLE IF EXISTS orden_compra_detalles;
DROP TABLE IF EXISTS ordenes_compra;
DROP TABLE IF EXISTS proveedores;
DROP TABLE IF EXISTS materiales;
DROP TABLE IF EXISTS usuarios;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 1. TABLA: usuarios
-- Roles: 'jefatura_area', 'jefatura_compras', 'gerencia_financiera', 'gerencia_general'
-- -----------------------------------------------------------------------------
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NULL,
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
-- 2. TABLA: materiales
-- Insumos con parámetros de demanda diaria y tiempo de entrega (Lead Time)
-- -----------------------------------------------------------------------------
CREATE TABLE materiales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_material INT NULL,
  codigo_interno VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  categoria VARCHAR(100) NOT NULL DEFAULT 'Materiales Básicos',
  subcategoria VARCHAR(100) NOT NULL DEFAULT 'Estructural',
  stock_minimo INT NOT NULL DEFAULT 10,
  stock_maximo INT NOT NULL DEFAULT 1000,
  demanda_promedio_dia DECIMAL(10, 2) NOT NULL DEFAULT 20.00,
  demanda_maxima_dia DECIMAL(10, 2) NOT NULL DEFAULT 35.00,
  tiempo_entrega_dias INT NOT NULL DEFAULT 3,
  
  -- Campos complementarios para costeo y almacén
  unidad_medida VARCHAR(30) NOT NULL DEFAULT 'Unidad',
  precio_unitario DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Columnas virtuales generadas automáticamente
  codigo VARCHAR(50) GENERATED ALWAYS AS (codigo_interno) VIRTUAL,
  lead_time_dias INT GENERATED ALWAYS AS (tiempo_entrega_dias) VIRTUAL,
  demanda_promedio_diaria DECIMAL(10, 2) GENERATED ALWAYS AS (demanda_promedio_dia) VIRTUAL,
  demanda_maxima_diaria DECIMAL(10, 2) GENERATED ALWAYS AS (demanda_maxima_dia) VIRTUAL,

  INDEX idx_material_codigo (codigo_interno),
  INDEX idx_material_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. TABLA: proveedores
-- Directorio de proveedores para auditoría de compras
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
-- 4. TABLA: ordenes_compra
-- Órdenes con Matriz de Aprobación Jerárquica y llaves foráneas estrictas
-- -----------------------------------------------------------------------------
CREATE TABLE ordenes_compra (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_orden INT NULL,
  oc_codigo VARCHAR(40) NOT NULL UNIQUE,
  fecha DATE NOT NULL,
  area VARCHAR(100) NOT NULL DEFAULT 'Obras Civiles',
  proveedor VARCHAR(150) NOT NULL,
  material_id INT NOT NULL,
  cantidad DECIMAL(12, 2) NOT NULL,
  precio_unitario DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  estado_aprobacion ENUM('pendiente', 'aprobada', 'rechazada') NOT NULL DEFAULT 'pendiente',
  aprobado_por_id INT NULL,
  
  -- Campos complementarios de auditoría y trazabilidad
  id_proveedor INT NULL,
  estado ENUM('PENDIENTE', 'APROBADA', 'PAGADA', 'CANCELADA') DEFAULT 'PENDIENTE',
  rol_aprobador_requerido ENUM('jefatura_area', 'jefatura_compras', 'gerencia_financiera', 'gerencia_general') NOT NULL DEFAULT 'jefatura_area',
  fecha_aprobacion DATETIME NULL,
  motivo_rechazo TEXT NULL,
  observaciones TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Columnas virtuales generadas automáticamente
  numero_orden VARCHAR(40) GENERATED ALWAYS AS (oc_codigo) VIRTUAL,
  fecha_emision DATE GENERATED ALWAYS AS (fecha) VIRTUAL,
  id_material INT GENERATED ALWAYS AS (material_id) VIRTUAL,

  CONSTRAINT fk_oc_material 
    FOREIGN KEY (material_id) REFERENCES materiales(id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_oc_aprobador 
    FOREIGN KEY (aprobado_por_id) REFERENCES usuarios(id) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_oc_proveedor 
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor) 
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_oc_codigo (oc_codigo),
  INDEX idx_oc_fecha (fecha),
  INDEX idx_oc_material (material_id),
  INDEX idx_oc_aprobacion (estado_aprobacion),
  INDEX idx_oc_rol_requerido (rol_aprobador_requerido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. TABLA: orden_compra_detalles
-- Tabla de desglose de partidas para trazabilidad analítica
-- -----------------------------------------------------------------------------
CREATE TABLE orden_compra_detalles (
  id_detalle INT AUTO_INCREMENT PRIMARY KEY,
  id_orden INT NOT NULL,
  id_material INT NOT NULL,
  cantidad DECIMAL(12, 2) NOT NULL,
  precio_unitario DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  CONSTRAINT fk_detalles_orden 
    FOREIGN KEY (id_orden) REFERENCES ordenes_compra(id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_detalles_material 
    FOREIGN KEY (id_material) REFERENCES materiales(id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_detalles_orden (id_orden),
  INDEX idx_detalles_material (id_material)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. TABLA: movimientos
-- Transacciones de inventario (entradas, salidas, traslados, ajustes)
-- -----------------------------------------------------------------------------
CREATE TABLE movimientos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_movimiento INT NULL,
  material_id INT NOT NULL,
  tipo ENUM('entrada', 'salida', 'traslado', 'ajuste') NOT NULL,
  cantidad DECIMAL(12, 2) NOT NULL,
  ubicacion VARCHAR(100) NOT NULL DEFAULT 'Bodega Central',
  usuario VARCHAR(100) NOT NULL DEFAULT 'Juan Pérez',
  documento_origen VARCHAR(100) NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Campos complementarios para trazabilidad de obras
  ubicacion_origen VARCHAR(100) NULL,
  ubicacion_destino VARCHAR(100) NULL,
  observaciones TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Columnas virtuales generadas automáticamente
  id_material INT GENERATED ALWAYS AS (material_id) VIRTUAL,
  tipo_movimiento VARCHAR(20) GENERATED ALWAYS AS (UPPER(tipo)) VIRTUAL,
  documento_referencia VARCHAR(100) GENERATED ALWAYS AS (documento_origen) VIRTUAL,

  CONSTRAINT fk_movimientos_material 
    FOREIGN KEY (material_id) REFERENCES materiales(id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_movimientos_material (material_id),
  INDEX idx_movimientos_tipo (tipo),
  INDEX idx_movimientos_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. TABLA: inventario_stock
-- Saldo de existencias físicas consolidadas por material y ubicación
-- -----------------------------------------------------------------------------
CREATE TABLE inventario_stock (
  id_stock INT AUTO_INCREMENT PRIMARY KEY,
  id_material INT NOT NULL,
  ubicacion VARCHAR(100) NOT NULL DEFAULT 'Bodega Central',
  cantidad_actual DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  actualizado_al TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_material_ubicacion (id_material, ubicacion),
  CONSTRAINT fk_stock_material 
    FOREIGN KEY (id_material) REFERENCES materiales(id) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
