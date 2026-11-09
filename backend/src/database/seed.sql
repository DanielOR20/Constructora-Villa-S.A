-- =============================================================================
-- DATOS SEMILLA EMPRESARIALES (SEED DATA)
-- Constructora Del Valle S.A.
-- Caso de Estudio: Auditoría de Inventarios y Compras (Quiz Barry Vega)
-- Administración de Base de Datos MySQL
-- =============================================================================

USE constructora_del_valle;

-- -----------------------------------------------------------------------------
-- 1. TABLA: usuarios
-- Roles: 'jefatura_area', 'jefatura_compras', 'gerencia_financiera', 'gerencia_general'
-- Contraseña común hasheada con bcryptjs (salt 10): Password123!
-- Hash: $2b$10$Sl5lKIuHxWM61eKhOOSVn.MQSILTDNhmbJfg2aMVJ6k9DLsDVKrPe
-- -----------------------------------------------------------------------------
INSERT INTO usuarios (id_usuario, nombre, email, password_hash, rol, activo) VALUES
(1, 'Juan Pérez', 'juan.perez@constructoradelvalle.com', '$2b$10$Sl5lKIuHxWM61eKhOOSVn.MQSILTDNhmbJfg2aMVJ6k9DLsDVKrPe', 'jefatura_area', TRUE),
(2, 'Carlos Mora', 'carlos.mora@constructoradelvalle.com', '$2b$10$Sl5lKIuHxWM61eKhOOSVn.MQSILTDNhmbJfg2aMVJ6k9DLsDVKrPe', 'jefatura_compras', TRUE),
(3, 'Ana Gómez', 'ana.gomez@constructoradelvalle.com', '$2b$10$Sl5lKIuHxWM61eKhOOSVn.MQSILTDNhmbJfg2aMVJ6k9DLsDVKrPe', 'gerencia_financiera', TRUE),
(4, 'Luis Rojas', 'luis.rojas@constructoradelvalle.com', '$2b$10$Sl5lKIuHxWM61eKhOOSVn.MQSILTDNhmbJfg2aMVJ6k9DLsDVKrPe', 'gerencia_general', TRUE);

-- -----------------------------------------------------------------------------
-- 2. TABLA: proveedores
-- Registro de proveedores comerciales evaluados en auditoría
-- Incluye Proveedor A (duplicados), Proveedor B (sobreprecios) y Proveedor D (sobreprecio)
-- -----------------------------------------------------------------------------
INSERT INTO proveedores (id_proveedor, codigo, nombre, contacto, telefono, email) VALUES
(1, 'PRV-001', 'Proveedor A (Distribuidora de Cemento y Acero del Norte)', 'Ing. Roberto Méndez', '+52 81 8300-1122', 'ventas@proveedora-materiales.com'),
(2, 'PRV-002', 'Proveedor B (Agregados y Triturados del Valle)', 'Lic. Laura Salinas', '+52 81 8400-3344', 'contacto@agregadosvalle.com'),
(3, 'PRV-003', 'Proveedor C (Bloquera y Prefabricados Garza)', 'Arq. Carlos Garza', '+52 81 8500-5566', 'pedidos@prefabricadosgarza.com'),
(4, 'PRV-004', 'Proveedor D (Materiales y Acabados de Occidente)', 'Ing. Sergio Vega', '+52 81 8600-7788', 'ventas@materialesoccidente.com');

-- -----------------------------------------------------------------------------
-- 3. TABLA: materiales
-- Insumos reales del caso con parámetros de demanda diaria y lead time
-- -----------------------------------------------------------------------------
INSERT INTO materiales (
  id_material, codigo, nombre, descripcion, unidad_medida, precio_unitario, 
  stock_minimo, lead_time_dias, demanda_promedio_diaria, demanda_maxima_diaria
) VALUES
(1, 'MAT-CEM-01', 'Cemento gris 50 kg', 'Cemento Portland tipo uso general en saco de 50 kg', 'Saco 50 kg', 185.00, 100, 3, 35.00, 50.00),
(2, 'MAT-VAR-03', 'Varilla #3 grado 40', 'Varilla corrugada de acero 3/8 pulgada grado 40 (tramo 6m)', 'Pieza (6m)', 125.50, 150, 4, 25.00, 40.00),
(3, 'MAT-BLK-12', 'Block 12x20x40', 'Block de concreto pesado estándar 12x20x40 cm para muros', 'Pieza', 14.50, 500, 5, 250.00, 400.00),
(4, 'MAT-ARE-01', 'Arena', 'Arena de río lavada y cribada para morteros y colados', 'm3', 380.00, 20, 2, 10.00, 18.00);

-- -----------------------------------------------------------------------------
-- 4. TABLA: ordenes_compra
-- Las 7 órdenes de compra de octubre de 2026 del caso Barry Vega
-- * Casos de compras duplicadas: OC-1041 y OC-1042 con Proveedor A (₡130,250.00 c/u)
-- * Casos de sobreprecios: OC-1038 y OC-1043 con Proveedor B; OC-1044 con Proveedor D
-- -----------------------------------------------------------------------------
INSERT INTO ordenes_compra (
  id_orden, numero_orden, id_proveedor, fecha_emision, estado, total, 
  estado_aprobacion, rol_aprobador_requerido, aprobado_por_id, fecha_aprobacion, motivo_rechazo, observaciones
) VALUES
-- OC-1038: 60 m3 Arena @ ₡420.00 (Sobreprecio de ₡40.00 vs Contrato ₡380.00)
(1, 'OC-1038', 2, '2026-10-02', 'PAGADA', 25200.00, 'aprobada', 'jefatura_area', 1, '2026-10-02 09:15:00', NULL, 'Suministro quincenal de arena para Bodega Central (Proveedor B)'),

-- OC-1039: 4,000 blocks @ ₡14.50 (Precio contractual)
(2, 'OC-1039', 3, '2026-10-06', 'PAGADA', 58000.00, 'aprobada', 'jefatura_area', 1, '2026-10-06 10:20:00', NULL, 'Lote de 4,000 blocks para inventario central (Proveedor C)'),

-- OC-1040: 300 sacos de cemento gris @ ₡185.00 (Precio contractual)
(3, 'OC-1040', 1, '2026-10-10', 'PAGADA', 55500.00, 'aprobada', 'jefatura_area', 1, '2026-10-10 11:00:00', NULL, '300 sacos de cemento gris requerimiento regular (Proveedor A)'),

-- OC-1041: Orden regular autorizada (500 cemento @ ₡185.00 + 300 varillas @ ₡125.50)
(4, 'OC-1041', 1, '2026-10-15', 'PAGADA', 130250.00, 'aprobada', 'jefatura_area', 1, '2026-10-15 08:30:00', NULL, 'Parte A (Quiz Barry Vega): Orden regular de 500 sacos de cemento y 300 varillas #3 para abastecimiento'),

-- OC-1042: COMPRA DUPLICADA EXACTA DE OC-1041 (Mismo proveedor, mismos insumos y misma fecha)
(5, 'OC-1042', 1, '2026-10-15', 'CANCELADA', 130250.00, 'rechazada', 'jefatura_area', 2, '2026-10-15 16:45:00', 'Auditoría Barry Vega: Orden duplicada idéntica a OC-1041 emitida al mismo Proveedor A sin justificación de obra', 'Parte A (Quiz Barry Vega - DUPLICADA): Rechazada por Carlos Mora (Jefatura de Compras)'),

-- OC-1043: 45 m3 Arena @ ₡415.00 (Sobreprecio de ₡35.00 vs Contrato ₡380.00)
(6, 'OC-1043', 2, '2026-10-22', 'APROBADA', 18675.00, 'aprobada', 'jefatura_area', 1, '2026-10-22 14:00:00', NULL, 'Suministro de 45 m3 de arena para Obra Torre Norte (Proveedor B con sobreprecio)'),

-- OC-1044: 200 sacos cemento @ ₡198.00 (Sobreprecio de ₡13.00 vs Contrato ₡185.00)
(7, 'OC-1044', 4, '2026-10-27', 'APROBADA', 39600.00, 'aprobada', 'jefatura_area', 1, '2026-10-27 15:30:00', NULL, 'Suministro urgente de 200 sacos de cemento por Proveedor D con sobreprecio');

-- -----------------------------------------------------------------------------
-- 5. TABLA: orden_compra_detalles
-- Desglose de partidas de cada orden de compra
-- -----------------------------------------------------------------------------
-- OC-1038: 60 m3 de Arena @ ₡420.00 = ₡25,200.00 (Fuga por sobreprecio: 60 * ₡40 = ₡2,400.00)
INSERT INTO orden_compra_detalles (id_orden, id_material, cantidad, precio_unitario, subtotal) VALUES
(1, 4, 60.00, 420.00, 25200.00);

-- OC-1039: 4,000 blocks @ ₡14.50 = ₡58,000.00
INSERT INTO orden_compra_detalles (id_orden, id_material, cantidad, precio_unitario, subtotal) VALUES
(2, 3, 4000.00, 14.50, 58000.00);

-- OC-1040: 300 sacos de cemento @ ₡185.00 = ₡55,500.00
INSERT INTO orden_compra_detalles (id_orden, id_material, cantidad, precio_unitario, subtotal) VALUES
(3, 1, 300.00, 185.00, 55500.00);

-- OC-1041: 500 sacos cemento (₡92,500) y 300 varillas (₡37,750) = ₡130,250.00
INSERT INTO orden_compra_detalles (id_orden, id_material, cantidad, precio_unitario, subtotal) VALUES
(4, 1, 500.00, 185.00, 92500.00),
(4, 2, 300.00, 125.50, 37750.00);

-- OC-1042: DUPLICADO EXACTO DE OC-1041 (Fuga evitada: ₡130,250.00)
INSERT INTO orden_compra_detalles (id_orden, id_material, cantidad, precio_unitario, subtotal) VALUES
(5, 1, 500.00, 185.00, 92500.00),
(5, 2, 300.00, 125.50, 37750.00);

-- OC-1043: 45 m3 de Arena @ ₡415.00 = ₡18,675.00 (Fuga por sobreprecio: 45 * ₡35 = ₡1,575.00)
INSERT INTO orden_compra_detalles (id_orden, id_material, cantidad, precio_unitario, subtotal) VALUES
(6, 4, 45.00, 415.00, 18675.00);

-- OC-1044: 200 sacos de cemento @ ₡198.00 = ₡39,600.00 (Fuga por sobreprecio: 200 * ₡13 = ₡2,600.00)
INSERT INTO orden_compra_detalles (id_orden, id_material, cantidad, precio_unitario, subtotal) VALUES
(7, 1, 200.00, 198.00, 39600.00);

-- -----------------------------------------------------------------------------
-- 6. TABLA: movimientos
-- Registro cronológico de transacciones (entradas en Bodega Central y salidas a Obras)
-- -----------------------------------------------------------------------------
INSERT INTO movimientos (
  id_movimiento, tipo_movimiento, id_material, cantidad, 
  ubicacion_origen, ubicacion_destino, documento_referencia, observaciones, fecha
) VALUES
-- Entradas iniciales de recepción a Bodega Central
(1, 'ENTRADA', 1, 1000.00, 'Proveedor A', 'Bodega Central', 'INV-INI-001', 'Recepción inicial de Cemento gris 50 kg en Bodega Central', '2026-10-01 08:00:00'),
(2, 'ENTRADA', 2, 800.00,  'Proveedor A', 'Bodega Central', 'INV-INI-001', 'Recepción inicial de Varilla #3 grado 40 en Bodega Central', '2026-10-01 08:30:00'),
(3, 'ENTRADA', 3, 8000.00, 'Proveedor C', 'Bodega Central', 'INV-INI-001', 'Recepción inicial de Block 12x20x40 en Bodega Central', '2026-10-01 09:00:00'),
(4, 'ENTRADA', 4, 150.00,  'Proveedor B', 'Bodega Central', 'INV-INI-001', 'Recepción inicial de Arena en Bodega Central', '2026-10-01 09:30:00'),

-- Despachos y salidas de Bodega Central hacia Obra Torre Norte
(5, 'TRANSFERENCIA', 1, 350.00,  'Bodega Central', 'Obra Torre Norte', 'DESP-OBR-101', 'Despacho de cemento para losa nivel 3 en Obra Torre Norte', '2026-10-08 10:00:00'),
(6, 'TRANSFERENCIA', 2, 250.00,  'Bodega Central', 'Obra Torre Norte', 'DESP-OBR-101', 'Despacho de varilla #3 para columnas en Obra Torre Norte', '2026-10-08 10:30:00'),
(7, 'TRANSFERENCIA', 3, 2000.00, 'Bodega Central', 'Obra Torre Norte', 'DESP-OBR-102', 'Despacho de block para muros en Obra Torre Norte', '2026-10-09 11:00:00'),
(8, 'TRANSFERENCIA', 4, 40.00,   'Bodega Central', 'Obra Torre Norte', 'DESP-OBR-102', 'Despacho de arena para mezcla en Obra Torre Norte', '2026-10-09 11:30:00'),

-- Despachos y salidas de Bodega Central hacia Obra Residencial Las Palmas
(9,  'TRANSFERENCIA', 1, 200.00,  'Bodega Central', 'Obra Residencial Las Palmas', 'DESP-OBR-201', 'Despacho de cemento para cimentación en Obra Las Palmas', '2026-10-12 14:00:00'),
(10, 'TRANSFERENCIA', 2, 180.00,  'Bodega Central', 'Obra Residencial Las Palmas', 'DESP-OBR-201', 'Despacho de varilla para zapatas en Obra Las Palmas', '2026-10-12 14:30:00'),
(11, 'TRANSFERENCIA', 3, 1500.00, 'Bodega Central', 'Obra Residencial Las Palmas', 'DESP-OBR-202', 'Despacho de block para barda perimetral en Obra Las Palmas', '2026-10-13 15:00:00'),
(12, 'TRANSFERENCIA', 4, 30.00,   'Bodega Central', 'Obra Residencial Las Palmas', 'DESP-OBR-202', 'Despacho de arena para morteros en Obra Las Palmas', '2026-10-13 15:30:00'),

-- Salidas por consumo directo en los frentes de obra
(13, 'SALIDA', 1, 280.00, 'Obra Torre Norte', NULL, 'VALE-CON-051', 'Consumo físico de cemento en colado nivel 3', '2026-10-18 17:00:00'),
(14, 'SALIDA', 2, 200.00, 'Obra Torre Norte', NULL, 'VALE-CON-052', 'Consumo físico de varilla en armaduras nivel 3', '2026-10-18 17:00:00'),
(15, 'SALIDA', 1, 150.00, 'Obra Residencial Las Palmas', NULL, 'VALE-CON-080', 'Consumo físico de cemento en cimentación', '2026-10-20 16:30:00');

-- -----------------------------------------------------------------------------
-- 7. TABLA: inventario_stock
-- Saldo consolidado de existencias físicas por ubicación
-- -----------------------------------------------------------------------------
INSERT INTO inventario_stock (id_material, ubicacion, cantidad_actual) VALUES
-- Bodega Central (1000 - 350 - 200 = 450; 800 - 250 - 180 = 370; 8000 - 2000 - 1500 = 4500; 150 - 40 - 30 = 80)
(1, 'Bodega Central', 450.00),
(2, 'Bodega Central', 370.00),
(3, 'Bodega Central', 4500.00),
(4, 'Bodega Central', 80.00),

-- Obra Torre Norte (350 - 280 = 70; 250 - 200 = 50; 2000; 40)
(1, 'Obra Torre Norte', 70.00),
(2, 'Obra Torre Norte', 50.00),
(3, 'Obra Torre Norte', 2000.00),
(4, 'Obra Torre Norte', 40.00),

-- Obra Residencial Las Palmas (200 - 150 = 50; 180; 1500; 30)
(1, 'Obra Residencial Las Palmas', 50.00),
(2, 'Obra Residencial Las Palmas', 180.00),
(3, 'Obra Residencial Las Palmas', 1500.00),
(4, 'Obra Residencial Las Palmas', 30.00);
