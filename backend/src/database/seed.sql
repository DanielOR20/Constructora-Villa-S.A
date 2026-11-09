-- =============================================================================
-- DATOS SEMILLA REALISTAS Y COMPLETOS (SEED DATA)
-- Constructora Del Valle S.A.
-- Caso de Estudio: Auditoría de Inventarios y Compras (Quiz Barry Vega - Partes A & B)
-- =============================================================================

USE constructora_del_valle;

-- -----------------------------------------------------------------------------
-- 1. TABLA: usuarios
-- Usuarios reales del equipo con contraseñas hasheadas en bcryptjs (Password123!)
-- Hash: $2b$10$Sl5lKIuHxWM61eKhOOSVn.MQSILTDNhmbJfg2aMVJ6k9DLsDVKrPe
-- -----------------------------------------------------------------------------
INSERT INTO usuarios (id, id_usuario, nombre, email, password_hash, rol, activo) VALUES
(1, 1, 'Juan Pérez', 'juan.perez@constructoradelvalle.com', '$2b$10$Sl5lKIuHxWM61eKhOOSVn.MQSILTDNhmbJfg2aMVJ6k9DLsDVKrPe', 'jefatura_area', TRUE),
(2, 2, 'Carlos Mora', 'carlos.mora@constructoradelvalle.com', '$2b$10$Sl5lKIuHxWM61eKhOOSVn.MQSILTDNhmbJfg2aMVJ6k9DLsDVKrPe', 'jefatura_compras', TRUE),
(3, 3, 'Ana Gómez', 'ana.gomez@constructoradelvalle.com', '$2b$10$Sl5lKIuHxWM61eKhOOSVn.MQSILTDNhmbJfg2aMVJ6k9DLsDVKrPe', 'gerencia_financiera', TRUE),
(4, 4, 'Luis Rojas', 'luis.rojas@constructoradelvalle.com', '$2b$10$Sl5lKIuHxWM61eKhOOSVn.MQSILTDNhmbJfg2aMVJ6k9DLsDVKrPe', 'gerencia_general', TRUE);

-- -----------------------------------------------------------------------------
-- 2. TABLA: materiales
-- Los 4 insumos exactos del caso de estudio con parámetros rigurosos de demanda
-- -----------------------------------------------------------------------------
INSERT INTO materiales (
  id, id_material, codigo_interno, nombre, categoria, subcategoria,
  stock_minimo, stock_maximo, demanda_promedio_dia, demanda_maxima_dia, tiempo_entrega_dias,
  unidad_medida, precio_unitario, descripcion
) VALUES
(1, 1, 'MAT-CEM-01', 'Cemento gris 50 kg', 'Materiales Básicos', 'Cementos y Conglomerantes', 100, 500, 35.00, 50.00, 3, 'Saco 50 kg', 6300.00, 'Cemento Portland tipo uso general en saco de 50 kg'),
(2, 2, 'MAT-VAR-03', 'Varilla #3 grado 40', 'Acero Estructural', 'Varilla Corrugada', 150, 800, 25.00, 40.00, 4, 'Pieza (6m)', 2350.00, 'Varilla corrugada de acero 3/8 pulgada grado 40 (tramo 6m)'),
(3, 3, 'MAT-BLK-12', 'Block 12x20x40', 'Mampostería', 'Blocks de Concreto', 500, 3000, 250.00, 400.00, 5, 'Pieza', 650.00, 'Block de concreto pesado estándar 12x20x40 cm para muros'),
(4, 4, 'MAT-ARE-01', 'Arena', 'Agregados', 'Arena de Río Lavada', 20, 150, 10.00, 18.00, 2, 'm3', 18500.00, 'Arena de río lavada y cribada para morteros y colados');

-- -----------------------------------------------------------------------------
-- 3. TABLA: proveedores
-- Directorio de proveedores para trazabilidad de compras y auditoría
-- -----------------------------------------------------------------------------
INSERT INTO proveedores (id_proveedor, codigo, nombre, contacto, telefono, email) VALUES
(1, 'PRV-001', 'Proveedor A (Distribuidora de Cemento y Acero del Norte)', 'Ing. Roberto Méndez', '+506 2200-1122', 'ventas@proveedora.cr'),
(2, 'PRV-002', 'Proveedor B (Agregados y Triturados del Valle)', 'Lic. Laura Salinas', '+506 2200-3344', 'contacto@agregadosvalle.cr'),
(3, 'PRV-003', 'Proveedor C (Bloquera y Prefabricados Garza)', 'Arq. Carlos Garza', '+506 2200-5566', 'pedidos@prefabricados.cr'),
(4, 'PRV-004', 'Proveedor D (Materiales y Acabados de Occidente)', 'Ing. Sergio Vega', '+506 2200-7788', 'ventas@materialesoccidente.cr');

-- -----------------------------------------------------------------------------
-- 4. TABLA: ordenes_compra
-- Órdenes de compra de octubre de 2026 de la auditoría (Parte A del quiz)
-- Casos explícitos:
-- * OC-1041 y OC-1042: Cemento gris 50 kg, 200 sacos c/u, Proveedor A, 02/10, ₡6,450 c/u (Duplicado)
-- * OC-1047: Cemento gris, Proveedor B, ₡7,100 (Sobreprecio vs contrato ₡6,300)
-- * OC-1050 y OC-1053: Varilla #3, Proveedor C, ₡2,350 c/u (Precio normal)
-- * OC-1058: Varilla #3, Proveedor D, ₡2,600 (Sobreprecio vs contrato ₡2,350)
-- * OC-1061: Cemento gris, Proveedor A, ₡6,300 (Precio contractual correcto)
-- -----------------------------------------------------------------------------
INSERT INTO ordenes_compra (
  id, id_orden, oc_codigo, fecha, area, proveedor, material_id, cantidad, precio_unitario, total,
  estado_aprobacion, aprobado_por_id, id_proveedor, estado, rol_aprobador_requerido,
  fecha_aprobacion, motivo_rechazo, observaciones
) VALUES
-- OC-1041: 200 sacos Cemento @ ₡6,450 (Proveedor A, 02/10/2026) -> Duplicada original
(1, 1, 'OC-1041', '2026-10-02', 'Bodega Central', 'Proveedor A (Distribuidora de Cemento y Acero del Norte)', 1, 200.00, 6450.00, 1290000.00,
 'aprobada', 2, 1, 'PAGADA', 'jefatura_compras', '2026-10-02 08:30:00', NULL, 'Suministro quincenal de 200 sacos de cemento gris 50 kg (Proveedor A)'),

-- OC-1042: 200 sacos Cemento @ ₡6,450 (Proveedor A, 02/10/2026) -> DUPLICADO SOSPECHOSO
(2, 2, 'OC-1042', '2026-10-02', 'Bodega Central', 'Proveedor A (Distribuidora de Cemento y Acero del Norte)', 1, 200.00, 6450.00, 1290000.00,
 'pendiente', NULL, 1, 'PENDIENTE', 'jefatura_compras', NULL, NULL, 'ALERTA AUDITORÍA: Requisición duplicada idéntica a OC-1041 emitida el mismo día al Proveedor A'),

-- OC-1047: 150 sacos Cemento @ ₡7,100 (Proveedor B, 08/10/2026) -> SOBREPRECIO FUERA DE CONTRATO (₡7,100 vs ₡6,300)
(3, 3, 'OC-1047', '2026-10-08', 'Obras Civiles', 'Proveedor B (Agregados y Triturados del Valle)', 1, 150.00, 7100.00, 1065000.00,
 'aprobada', 2, 2, 'PAGADA', 'jefatura_compras', '2026-10-08 09:15:00', NULL, 'ALERTA AUDITORÍA: Sobreprecio detectado en Cemento gris (₡7,100 vs precio contrato ₡6,300 de Proveedor B)'),

-- OC-1050: 300 piezas Varilla #3 @ ₡2,350 (Proveedor C, 12/10/2026) -> Precio contractual correcto
(4, 4, 'OC-1050', '2026-10-12', 'Estructuras y Acero', 'Proveedor C (Bloquera y Prefabricados Garza)', 2, 300.00, 2350.00, 705000.00,
 'aprobada', 2, 3, 'PAGADA', 'jefatura_compras', '2026-10-12 10:00:00', NULL, 'Suministro quincenal de varilla corrugada para estructura (Proveedor C)'),

-- OC-1053: 250 piezas Varilla #3 @ ₡2,350 (Proveedor C, 16/10/2026) -> Precio contractual correcto
(5, 5, 'OC-1053', '2026-10-16', 'Estructuras y Acero', 'Proveedor C (Bloquera y Prefabricados Garza)', 2, 250.00, 2350.00, 587500.00,
 'aprobada', 2, 3, 'PAGADA', 'jefatura_compras', '2026-10-16 11:30:00', NULL, 'Lote adicional de varilla grado 40 para refuerzo de losas (Proveedor C)'),

-- OC-1058: 200 piezas Varilla #3 @ ₡2,600 (Proveedor D, 22/10/2026) -> SOBREPRECIO (₡2,600 vs contrato ₡2,350)
(6, 6, 'OC-1058', '2026-10-22', 'Estructuras y Acero', 'Proveedor D (Materiales y Acabados de Occidente)', 2, 200.00, 2600.00, 520000.00,
 'aprobada', 2, 4, 'PAGADA', 'jefatura_compras', '2026-10-22 14:00:00', NULL, 'ALERTA AUDITORÍA: Sobreprecio detectado en Varilla #3 (₡2,600 vs contrato ₡2,350 de Proveedor D)'),

-- OC-1061: 300 sacos Cemento @ ₡6,300 (Proveedor A, 28/10/2026) -> PRECIO CONTRACTUAL OFICIAL
(7, 7, 'OC-1061', '2026-10-28', 'Obras Civiles', 'Proveedor A (Distribuidora de Cemento y Acero del Norte)', 1, 300.00, 6300.00, 1890000.00,
 'aprobada', 2, 1, 'PAGADA', 'jefatura_compras', '2026-10-28 15:45:00', NULL, 'Compra a precio contractual oficial de Cemento gris 50 kg (₡6,300/saco con Proveedor A)'),

-- OC-1038: 60 m3 Arena @ ₡18,500 (Proveedor B, 02/10/2026)
(8, 8, 'OC-1038', '2026-10-02', 'Agregados y Concretos', 'Proveedor B (Agregados y Triturados del Valle)', 4, 60.00, 18500.00, 1110000.00,
 'aprobada', 2, 2, 'PAGADA', 'jefatura_compras', '2026-10-02 09:15:00', NULL, 'Suministro quincenal de arena para Bodega Central (Proveedor B)'),

-- OC-1039: 4,000 blocks @ ₡650 (Proveedor C, 06/10/2026)
(9, 9, 'OC-1039', '2026-10-06', 'Mampostería', 'Proveedor C (Bloquera y Prefabricados Garza)', 3, 4000.00, 650.00, 2600000.00,
 'aprobada', 3, 3, 'PAGADA', 'gerencia_financiera', '2026-10-06 10:20:00', NULL, 'Lote mayorista de 4,000 blocks pesados para edificación principal (Proveedor C)');

-- -----------------------------------------------------------------------------
-- 5. TABLA: orden_compra_detalles
-- Partidas detalladas de las órdenes de compra para análisis por insumo
-- -----------------------------------------------------------------------------
INSERT INTO orden_compra_detalles (id_detalle, id_orden, id_material, cantidad, precio_unitario, subtotal) VALUES
(1, 1, 1, 200.00, 6450.00, 1290000.00),
(2, 2, 1, 200.00, 6450.00, 1290000.00),
(3, 3, 1, 150.00, 7100.00, 1065000.00),
(4, 4, 2, 300.00, 2350.00, 705000.00),
(5, 5, 2, 250.00, 2350.00, 587500.00),
(6, 6, 2, 200.00, 2600.00, 520000.00),
(7, 7, 1, 300.00, 6300.00, 1890000.00),
(8, 8, 4, 60.00, 18500.00, 1110000.00),
(9, 9, 3, 4000.00, 650.00, 2600000.00);

-- -----------------------------------------------------------------------------
-- 6. TABLA: movimientos
-- Entradas en Bodega Central y salidas a Obras reales de Constructora Del Valle
-- -----------------------------------------------------------------------------
INSERT INTO movimientos (
  id, id_movimiento, material_id, tipo, cantidad, ubicacion, usuario, documento_origen, fecha,
  ubicacion_origen, ubicacion_destino, observaciones
) VALUES
-- Cemento gris 50 kg (Entradas y Salidas a Obras)
(1, 1, 1, 'entrada', 350.00, 'Bodega Central', 'Juan Pérez', 'DOC-ENT-001', '2026-10-01 08:00:00', NULL, 'Bodega Central', 'Recepción de lote inicial mensual de cemento gris'),
(2, 2, 1, 'salida', 120.00, 'Obra Torre Norte', 'Juan Pérez', 'DOC-SAL-001', '2026-10-05 09:30:00', 'Bodega Central', 'Obra Torre Norte', 'Despacho para colado de cimientos Obra Torre Norte'),
(3, 3, 1, 'salida', 100.00, 'Obra Residencial Los Álamos', 'Juan Pérez', 'DOC-SAL-002', '2026-10-10 14:15:00', 'Bodega Central', 'Obra Residencial Los Álamos', 'Despacho para losa de entrepiso en Los Álamos'),
(4, 4, 1, 'traslado', 30.00, 'Obra Torre Norte', 'Carlos Mora', 'DOC-TRA-001', '2026-10-18 11:00:00', 'Bodega Central', 'Obra Torre Norte', 'Traslado de emergencia de 30 sacos a Torre Norte'),

-- Varilla #3 grado 40 (Entradas y Salidas a Obras)
(5, 5, 2, 'entrada', 450.00, 'Bodega Central', 'Juan Pérez', 'DOC-ENT-002', '2026-10-01 08:30:00', NULL, 'Bodega Central', 'Ingreso de atados de varilla 3/8 grado 40'),
(6, 6, 2, 'salida', 150.00, 'Obra Torre Norte', 'Juan Pérez', 'DOC-SAL-003', '2026-10-07 10:00:00', 'Bodega Central', 'Obra Torre Norte', 'Habilitado de armados de columnas para Torre Norte'),
(7, 7, 2, 'salida', 120.00, 'Obra Puente Río Seco', 'Juan Pérez', 'DOC-SAL-004', '2026-10-14 16:20:00', 'Bodega Central', 'Obra Puente Río Seco', 'Acero para estribos y contratrabes en Puente Río Seco'),

-- Block 12x20x40 (Entradas y Salidas a Obras)
(8, 8, 3, 'entrada', 4000.00, 'Bodega Central', 'Juan Pérez', 'DOC-ENT-003', '2026-10-03 09:00:00', NULL, 'Bodega Central', 'Descarga de tarimas de block pesado en patio central'),
(9, 9, 3, 'salida', 1200.00, 'Obra Residencial Los Álamos', 'Juan Pérez', 'DOC-SAL-005', '2026-10-09 11:45:00', 'Bodega Central', 'Obra Residencial Los Álamos', 'Levantamiento de muros perimetrales en Los Álamos'),
(10, 10, 3, 'salida', 800.00, 'Obra Hospital Central', 'Juan Pérez', 'DOC-SAL-006', '2026-10-15 13:10:00', 'Bodega Central', 'Obra Hospital Central', 'Muros de división en zona de consultorios Hospital'),

-- Arena (Entradas y Salidas a Obras)
(11, 11, 4, 'entrada', 60.00, 'Bodega Central', 'Juan Pérez', 'DOC-ENT-004', '2026-10-02 10:00:00', NULL, 'Bodega Central', 'Recepción de viajes de góndola de arena de río lavada'),
(12, 12, 4, 'salida', 25.00, 'Obra Torre Norte', 'Juan Pérez', 'DOC-SAL-007', '2026-10-08 15:30:00', 'Bodega Central', 'Obra Torre Norte', 'Mezcla de concreto para zapatas aisladas en Torre Norte');

-- -----------------------------------------------------------------------------
-- 7. TABLA: inventario_stock
-- Saldos físicos consolidados en Bodega Central y Obras
-- -----------------------------------------------------------------------------
INSERT INTO inventario_stock (id_stock, id_material, ubicacion, cantidad_actual) VALUES
(1, 1, 'Bodega Central', 100.00),
(2, 1, 'Obra Torre Norte', 30.00),
(3, 2, 'Bodega Central', 180.00),
(4, 3, 'Bodega Central', 2000.00),
(5, 4, 'Bodega Central', 35.00);
