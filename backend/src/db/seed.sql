-- =============================================================================
-- BASE DE DATOS: Constructora Del Valle S.A.
-- ARCHIVO: seed.sql
-- DESCRIPCIÓN: Estructura y datos semilla de materiales, bodegas, movimientos
--              de inventario y órdenes de compra de octubre (incluye compras
--              duplicadas de la Parte A: OC-1041 y OC-1042 con Proveedor A).
-- =============================================================================

CREATE DATABASE IF NOT EXISTS constructora_del_valle;
USE constructora_del_valle;

-- Desactivar temporalmente revisión de llaves foráneas para reinicialización limpia
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS movimientos_inventario;
DROP TABLE IF EXISTS orden_compra_detalles;
DROP TABLE IF EXISTS ordenes_compra;
DROP TABLE IF EXISTS inventario_stock;
DROP TABLE IF EXISTS proveedores;
DROP TABLE IF EXISTS materiales;
DROP TABLE IF EXISTS bodegas;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 1. TABLA: materiales
-- -----------------------------------------------------------------------------
CREATE TABLE materiales (
    id_material INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    unidad_medida VARCHAR(30) NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock_minimo INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. TABLA: bodegas (Bodega Central y Obras)
-- -----------------------------------------------------------------------------
CREATE TABLE bodegas (
    id_bodega INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('Bodega Central', 'Obra') NOT NULL,
    ubicacion VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. TABLA: proveedores
-- -----------------------------------------------------------------------------
CREATE TABLE proveedores (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    contacto VARCHAR(100),
    telefono VARCHAR(30),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 4. TABLA: ordenes_compra
-- -----------------------------------------------------------------------------
CREATE TABLE ordenes_compra (
    id_orden INT AUTO_INCREMENT PRIMARY KEY,
    numero_orden VARCHAR(30) NOT NULL UNIQUE,
    id_proveedor INT NOT NULL,
    fecha_emision DATE NOT NULL,
    estado ENUM('PENDIENTE', 'APROBADA', 'PAGADA', 'CANCELADA') DEFAULT 'APROBADA',
    total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor)
);

-- -----------------------------------------------------------------------------
-- 5. TABLA: orden_compra_detalles
-- -----------------------------------------------------------------------------
CREATE TABLE orden_compra_detalles (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_orden INT NOT NULL,
    id_material INT NOT NULL,
    cantidad DECIMAL(10, 2) NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (id_orden) REFERENCES ordenes_compra(id_orden) ON DELETE CASCADE,
    FOREIGN KEY (id_material) REFERENCES materiales(id_material)
);

-- -----------------------------------------------------------------------------
-- 6. TABLA: movimientos_inventario (Entradas, Salidas y Transferencias)
-- -----------------------------------------------------------------------------
CREATE TABLE movimientos_inventario (
    id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    tipo_movimiento ENUM('ENTRADA', 'SALIDA', 'TRANSFERENCIA') NOT NULL,
    id_material INT NOT NULL,
    id_bodega_origen INT NULL,
    id_bodega_destino INT NULL,
    cantidad DECIMAL(10, 2) NOT NULL,
    fecha DATETIME NOT NULL,
    documento_referencia VARCHAR(100),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_material) REFERENCES materiales(id_material),
    FOREIGN KEY (id_bodega_origen) REFERENCES bodegas(id_bodega),
    FOREIGN KEY (id_bodega_destino) REFERENCES bodegas(id_bodega)
);

-- -----------------------------------------------------------------------------
-- 7. TABLA: inventario_stock (Existencias por Bodega/Obra)
-- -----------------------------------------------------------------------------
CREATE TABLE inventario_stock (
    id_stock INT AUTO_INCREMENT PRIMARY KEY,
    id_material INT NOT NULL,
    id_bodega INT NOT NULL,
    cantidad_actual DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    actualizado_al TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_material_bodega (id_material, id_bodega),
    FOREIGN KEY (id_material) REFERENCES materiales(id_material) ON DELETE CASCADE,
    FOREIGN KEY (id_bodega) REFERENCES bodegas(id_bodega) ON DELETE CASCADE
);

-- =============================================================================
-- INSERCIÓN DE DATOS SEMILLA (SEED DATA)
-- =============================================================================

-- 1. MATERIALES DE CONSTRUCTORA DEL VALLE S.A.
INSERT INTO materiales (id_material, codigo, nombre, descripcion, unidad_medida, precio_unitario, stock_minimo) VALUES
(1, 'MAT-CEM-01', 'Cemento gris 50 kg', 'Cemento Portland tipo uso general saco de 50 kg', 'Saco 50 kg', 185.00, 100),
(2, 'MAT-VAR-03', 'Varilla #3 grado 40', 'Varilla corrugada de acero 3/8 pulgada grado 40', 'Pieza (6m)', 125.50, 150),
(3, 'MAT-BLK-12', 'Block 12x20x40', 'Block de concreto pesado estándar 12x20x40 cm', 'Pieza', 14.50, 500),
(4, 'MAT-ARE-01', 'Arena', 'Arena de río lavada para mortero y colado', 'm3', 380.00, 20);

-- 2. BODEGAS Y OBRAS
INSERT INTO bodegas (id_bodega, codigo, nombre, tipo, ubicacion) VALUES
(1, 'BOD-CENTRAL', 'Bodega Central', 'Bodega Central', 'Parque Industrial Valle, Nave 4'),
(2, 'OBR-TORRE-N', 'Obra Torre Norte', 'Obra', 'Av. De las Américas #1450'),
(3, 'OBR-RES-PAL', 'Obra Residencial Las Palmas', 'Obra', 'Carretera al Valle Km 8.5');

-- 3. PROVEEDORES
INSERT INTO proveedores (id_proveedor, codigo, nombre, contacto, telefono, email) VALUES
(1, 'PRV-001', 'Proveedor A (Distribuidora de Cemento y Acero del Norte)', 'Ing. Roberto Méndez', '+52 81 8300-1122', 'ventas@proveedora-materiales.com'),
(2, 'PRV-002', 'Proveedor B (Agregados y Triturados del Valle)', 'Lic. Laura Salinas', '+52 81 8400-3344', 'contacto@agregadosvalle.com'),
(3, 'PRV-003', 'Proveedor C (Prefabricados y Concretos Industriales)', 'Arq. Carlos Garza', '+52 81 8500-5566', 'pedidos@prefabricadosgarza.com');

-- 4. ÓRDENES DE COMPRA DE OCTUBRE
-- CASOS DE COMPRAS DUPLICADAS DE LA PARTE A:
-- OC-1041 y OC-1042 emitidas a Proveedor A con los mismos materiales y cantidades duplicadas.
INSERT INTO ordenes_compra (id_orden, numero_orden, id_proveedor, fecha_emision, estado, total, observaciones) VALUES
(1, 'OC-1038', 2, '2026-10-02', 'PAGADA', 22800.00, 'Suministro quincenal de arena para Bodega Central'),
(2, 'OC-1039', 3, '2026-10-06', 'PAGADA', 58000.00, 'Lote de 4,000 blocks para inventario central'),
(3, 'OC-1040', 1, '2026-10-10', 'PAGADA', 55500.00, '300 sacos de cemento gris requerimiento regular'),
(4, 'OC-1041', 1, '2026-10-15', 'PAGADA', 130250.00, 'Parte A: Orden regular de 500 sacos de cemento y 300 varillas #3 para abastecimiento'),
(5, 'OC-1042', 1, '2026-10-15', 'PAGADA', 130250.00, 'Parte A (DUPLICADA): Orden duplicada idéntica a OC-1041 generada por error administrativo al Proveedor A'),
(6, 'OC-1043', 2, '2026-10-22', 'APROBADA', 17100.00, 'Suministro de 45 m3 de arena para Obra Torre Norte'),
(7, 'OC-1044', 3, '2026-10-27', 'APROBADA', 36250.00, '2,500 piezas de block para Obra Residencial Las Palmas');

-- 5. DETALLE DE LAS ÓRDENES DE COMPRA
-- Detalles de OC-1038: 60 m3 de Arena
INSERT INTO orden_compra_detalles (id_orden, id_material, cantidad, precio_unitario, subtotal) VALUES
(1, 4, 60.00, 380.00, 22800.00);

-- Detalles de OC-1039: 4,000 blocks
INSERT INTO orden_compra_detalles (id_orden, id_material, cantidad, precio_unitario, subtotal) VALUES
(2, 3, 4000.00, 14.50, 58000.00);

-- Detalles de OC-1040: 300 sacos de Cemento
INSERT INTO orden_compra_detalles (id_orden, id_material, cantidad, precio_unitario, subtotal) VALUES
(3, 1, 300.00, 185.00, 55500.00);

-- Detalles de OC-1041 (Orden original de Parte A con Proveedor A)
INSERT INTO orden_compra_detalles (id_orden, id_material, cantidad, precio_unitario, subtotal) VALUES
(4, 1, 500.00, 185.00, 92500.00),
(4, 2, 300.00, 125.50, 37750.00);

-- Detalles de OC-1042 (Orden DUPLICADA idéntica a OC-1041 de Parte A con Proveedor A)
INSERT INTO orden_compra_detalles (id_orden, id_material, cantidad, precio_unitario, subtotal) VALUES
(5, 1, 500.00, 185.00, 92500.00),
(5, 2, 300.00, 125.50, 37750.00);

-- Detalles de OC-1043: 45 m3 de Arena
INSERT INTO orden_compra_detalles (id_orden, id_material, cantidad, precio_unitario, subtotal) VALUES
(6, 4, 45.00, 380.00, 17100.00);

-- Detalles de OC-1044: 2,500 blocks
INSERT INTO orden_compra_detalles (id_orden, id_material, cantidad, precio_unitario, subtotal) VALUES
(7, 3, 2500.00, 14.50, 36250.00);

-- 6. MOVIMIENTOS INICIALES DE INVENTARIO
-- (Entradas a Bodega Central, Transferencias y Salidas hacia Obras)
INSERT INTO movimientos_inventario (id_movimiento, tipo_movimiento, id_material, id_bodega_origen, id_bodega_destino, cantidad, fecha, documento_referencia, observaciones) VALUES
-- Entradas iniciales a Bodega Central
(1, 'ENTRADA', 1, NULL, 1, 1000.00, '2026-10-01 08:00:00', 'INV-INI-001', 'Inventario inicial de Cemento gris 50 kg en Bodega Central'),
(2, 'ENTRADA', 2, NULL, 1, 800.00,  '2026-10-01 08:30:00', 'INV-INI-001', 'Inventario inicial de Varilla #3 grado 40 en Bodega Central'),
(3, 'ENTRADA', 3, NULL, 1, 8000.00, '2026-10-01 09:00:00', 'INV-INI-001', 'Inventario inicial de Block 12x20x40 en Bodega Central'),
(4, 'ENTRADA', 4, NULL, 1, 150.00,  '2026-10-01 09:30:00', 'INV-INI-001', 'Inventario inicial de Arena en Bodega Central'),

-- Transferencias / Despachos desde Bodega Central hacia Obra Torre Norte
(5, 'TRANSFERENCIA', 1, 1, 2, 350.00,  '2026-10-08 10:00:00', 'DESP-OBR-101', 'Envío de cemento a Obra Torre Norte para colado losa nivel 3'),
(6, 'TRANSFERENCIA', 2, 1, 2, 250.00,  '2026-10-08 10:30:00', 'DESP-OBR-101', 'Envío de varilla #3 a Obra Torre Norte para armado de columnas'),
(7, 'TRANSFERENCIA', 3, 1, 2, 2000.00, '2026-10-09 11:00:00', 'DESP-OBR-102', 'Envío de block a Obra Torre Norte para levantamiento muros'),
(8, 'TRANSFERENCIA', 4, 1, 2, 40.00,   '2026-10-09 11:30:00', 'DESP-OBR-102', 'Envío de arena a Obra Torre Norte'),

-- Transferencias / Despachos desde Bodega Central hacia Obra Residencial Las Palmas
(9,  'TRANSFERENCIA', 1, 1, 3, 200.00,  '2026-10-12 14:00:00', 'DESP-OBR-201', 'Envío de cemento a Obra Residencial Las Palmas'),
(10, 'TRANSFERENCIA', 2, 1, 3, 180.00,  '2026-10-12 14:30:00', 'DESP-OBR-201', 'Envío de varilla a Obra Residencial Las Palmas'),
(11, 'TRANSFERENCIA', 3, 1, 3, 1500.00, '2026-10-13 15:00:00', 'DESP-OBR-202', 'Envío de block a Obra Residencial Las Palmas'),
(12, 'TRANSFERENCIA', 4, 1, 3, 30.00,   '2026-10-13 15:30:00', 'DESP-OBR-202', 'Envío de arena a Obra Residencial Las Palmas'),

-- Salidas por Consumo directo en Obras
(13, 'SALIDA', 1, 2, NULL, 280.00, '2026-10-18 17:00:00', 'VALE-CON-051', 'Consumo de cemento en Obra Torre Norte'),
(14, 'SALIDA', 2, 2, NULL, 200.00, '2026-10-18 17:00:00', 'VALE-CON-052', 'Consumo de varilla en Obra Torre Norte'),
(15, 'SALIDA', 1, 3, NULL, 150.00, '2026-10-20 16:30:00', 'VALE-CON-080', 'Consumo de cemento en Obra Las Palmas');

-- 7. EXISTENCIAS INICIALES / ACTUALES (STOCK CALCULADO)
INSERT INTO inventario_stock (id_material, id_bodega, cantidad_actual) VALUES
-- Bodega Central (Entradas - Transferencias a obras)
(1, 1, 450.00),   -- Cemento: 1000 - 350 - 200 = 450
(2, 1, 370.00),   -- Varilla: 800 - 250 - 180 = 370
(3, 1, 4500.00),  -- Block: 8000 - 2000 - 1500 = 4500
(4, 1, 80.00),    -- Arena: 150 - 40 - 30 = 80

-- Obra Torre Norte (Recibido - Consumido)
(1, 2, 70.00),    -- Cemento: 350 - 280 = 70
(2, 2, 50.00),    -- Varilla: 250 - 200 = 50
(3, 2, 2000.00),  -- Block: 2000 - 0 = 2000
(4, 2, 40.00),    -- Arena: 40 - 0 = 40

-- Obra Residencial Las Palmas (Recibido - Consumido)
(1, 3, 50.00),    -- Cemento: 200 - 150 = 50
(2, 3, 180.00),   -- Varilla: 180 - 0 = 180
(3, 3, 1500.00),  -- Block: 1500 - 0 = 1500
(4, 3, 30.00);    -- Arena: 30 - 0 = 30

