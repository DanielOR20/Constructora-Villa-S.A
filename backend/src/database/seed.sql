-- =============================================================================
-- DATOS SEMILLA (SEED DATA)
-- Sistema de Gestión de Inventarios - Constructora Del Valle S.A.
-- Caso de Estudio: Auditoría de Inventarios y Compras (Quiz Barry Vega)
-- =============================================================================

USE constructora_del_valle;

-- -----------------------------------------------------------------------------
-- 1. INSERCIÓN DE MATERIALES OFICIALES
-- Cemento gris 50 kg, Varilla #3 grado 40, Block 12x20x40, Arena
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
-- 2. INSERCIÓN DE PROVEEDORES
-- Proveedor A, Proveedor B, Proveedor C
-- -----------------------------------------------------------------------------
INSERT INTO proveedores (id_proveedor, codigo, nombre, contacto, telefono, email) VALUES
(1, 'PRV-001', 'Proveedor A (Distribuidora de Cemento y Acero del Norte)', 'Ing. Roberto Méndez', '+52 81 8300-1122', 'ventas@proveedora-materiales.com'),
(2, 'PRV-002', 'Proveedor B (Agregados y Triturados del Valle)', 'Lic. Laura Salinas', '+52 81 8400-3344', 'contacto@agregadosvalle.com'),
(3, 'PRV-003', 'Proveedor C (Bloquera y Prefabricados Garza)', 'Arq. Carlos Garza', '+52 81 8500-5566', 'pedidos@prefabricadosgarza.com');

-- -----------------------------------------------------------------------------
-- 3. INSERCIÓN DE ÓRDENES DE COMPRA (OCTUBRE 2026)
-- Incluye el caso de duplicados de la Parte A (OC-1041 y OC-1042 con Proveedor A)
-- -----------------------------------------------------------------------------
INSERT INTO ordenes_compra (id_orden, numero_orden, id_proveedor, fecha_emision, estado, total, observaciones) VALUES
(1, 'OC-1038', 2, '2026-10-02', 'PAGADA', 22800.00, 'Suministro quincenal de arena para Bodega Central'),
(2, 'OC-1039', 3, '2026-10-06', 'PAGADA', 58000.00, 'Lote de 4,000 blocks para inventario central'),
(3, 'OC-1040', 1, '2026-10-10', 'PAGADA', 55500.00, '300 sacos de cemento gris requerimiento regular'),
(4, 'OC-1041', 1, '2026-10-15', 'PAGADA', 130250.00, 'Parte A (Quiz Barry Vega): Orden regular de 500 sacos de cemento y 300 varillas #3 para abastecimiento'),
(5, 'OC-1042', 1, '2026-10-15', 'PAGADA', 130250.00, 'Parte A (Quiz Barry Vega - DUPLICADA): Orden duplicada idéntica a OC-1041 emitida por error administrativo al Proveedor A'),
(6, 'OC-1043', 2, '2026-10-22', 'APROBADA', 17100.00, 'Suministro de 45 m3 de arena para Obra Torre Norte'),
(7, 'OC-1044', 3, '2026-10-27', 'APROBADA', 36250.00, '2,500 piezas de block para Obra Residencial Las Palmas');

-- -----------------------------------------------------------------------------
-- 4. INSERCIÓN DE DETALLES DE ÓRDENES DE COMPRA
-- -----------------------------------------------------------------------------
-- OC-1038: 60 m3 de Arena @ $380.00
INSERT INTO orden_compra_detalles (id_orden, id_material, cantidad, precio_unitario, subtotal) VALUES
(1, 4, 60.00, 380.00, 22800.00);

-- OC-1039: 4,000 blocks @ $14.50
INSERT INTO orden_compra_detalles (id_orden, id_material, cantidad, precio_unitario, subtotal) VALUES
(2, 3, 4000.00, 14.50, 58000.00);

-- OC-1040: 300 sacos de cemento @ $185.00
INSERT INTO orden_compra_detalles (id_orden, id_material, cantidad, precio_unitario, subtotal) VALUES
(3, 1, 300.00, 185.00, 55500.00);

-- OC-1041: 500 sacos cemento ($92,500) y 300 varillas ($37,750) = $130,250
INSERT INTO orden_compra_detalles (id_orden, id_material, cantidad, precio_unitario, subtotal) VALUES
(4, 1, 500.00, 185.00, 92500.00),
(4, 2, 300.00, 125.50, 37750.00);

-- OC-1042: DUPLICADO EXACTO DE OC-1041 (Mismo proveedor, mismos materiales y cantidades)
INSERT INTO orden_compra_detalles (id_orden, id_material, cantidad, precio_unitario, subtotal) VALUES
(5, 1, 500.00, 185.00, 92500.00),
(5, 2, 300.00, 125.50, 37750.00);

-- OC-1043: 45 m3 de Arena @ $380.00
INSERT INTO orden_compra_detalles (id_orden, id_material, cantidad, precio_unitario, subtotal) VALUES
(6, 4, 45.00, 380.00, 17100.00);

-- OC-1044: 2,500 blocks @ $14.50
INSERT INTO orden_compra_detalles (id_orden, id_material, cantidad, precio_unitario, subtotal) VALUES
(7, 3, 2500.00, 14.50, 36250.00);

-- -----------------------------------------------------------------------------
-- 5. MOVIMIENTOS HISTÓRICOS DE INVENTARIO
-- Entradas, salidas, consumos y traslados
-- -----------------------------------------------------------------------------
INSERT INTO movimientos (
  id_movimiento, tipo_movimiento, id_material, cantidad, 
  ubicacion_origen, ubicacion_destino, documento_referencia, observaciones, fecha
) VALUES
-- Entradas de inventario inicial
(1, 'ENTRADA', 1, 1000.00, 'Proveedor A', 'Bodega Central', 'INV-INI-001', 'Recepción inicial de Cemento gris 50 kg', '2026-10-01 08:00:00'),
(2, 'ENTRADA', 2, 800.00,  'Proveedor A', 'Bodega Central', 'INV-INI-001', 'Recepción inicial de Varilla #3 grado 40', '2026-10-01 08:30:00'),
(3, 'ENTRADA', 3, 8000.00, 'Proveedor C', 'Bodega Central', 'INV-INI-001', 'Recepción inicial de Block 12x20x40', '2026-10-01 09:00:00'),
(4, 'ENTRADA', 4, 150.00,  'Proveedor B', 'Bodega Central', 'INV-INI-001', 'Recepción inicial de Arena', '2026-10-01 09:30:00'),

-- Salidas / Traslados de Bodega Central a Obra Torre Norte
(5, 'TRANSFERENCIA', 1, 350.00,  'Bodega Central', 'Obra Torre Norte', 'DESP-OBR-101', 'Despacho de cemento para colado de losa nivel 3', '2026-10-08 10:00:00'),
(6, 'TRANSFERENCIA', 2, 250.00,  'Bodega Central', 'Obra Torre Norte', 'DESP-OBR-101', 'Despacho de varilla #3 para armado de columnas', '2026-10-08 10:30:00'),
(7, 'TRANSFERENCIA', 3, 2000.00, 'Bodega Central', 'Obra Torre Norte', 'DESP-OBR-102', 'Despacho de block para levantamiento de muros', '2026-10-09 11:00:00'),
(8, 'TRANSFERENCIA', 4, 40.00,   'Bodega Central', 'Obra Torre Norte', 'DESP-OBR-102', 'Despacho de arena para mezcla', '2026-10-09 11:30:00'),

-- Salidas / Traslados de Bodega Central a Obra Residencial Las Palmas
(9,  'TRANSFERENCIA', 1, 200.00,  'Bodega Central', 'Obra Residencial Las Palmas', 'DESP-OBR-201', 'Despacho de cemento para cimentación', '2026-10-12 14:00:00'),
(10, 'TRANSFERENCIA', 2, 180.00,  'Bodega Central', 'Obra Residencial Las Palmas', 'DESP-OBR-201', 'Despacho de varilla para zapatas', '2026-10-12 14:30:00'),
(11, 'TRANSFERENCIA', 3, 1500.00, 'Bodega Central', 'Obra Residencial Las Palmas', 'DESP-OBR-202', 'Despacho de block para barda perimetral', '2026-10-13 15:00:00'),
(12, 'TRANSFERENCIA', 4, 30.00,   'Bodega Central', 'Obra Residencial Las Palmas', 'DESP-OBR-202', 'Despacho de arena', '2026-10-13 15:30:00'),

-- Salidas por consumo directo en obras
(13, 'SALIDA', 1, 280.00, 'Obra Torre Norte', NULL, 'VALE-CON-051', 'Consumo de cemento en colado nivel 3', '2026-10-18 17:00:00'),
(14, 'SALIDA', 2, 200.00, 'Obra Torre Norte', NULL, 'VALE-CON-052', 'Consumo de varilla en columnas nivel 3', '2026-10-18 17:00:00'),
(15, 'SALIDA', 1, 150.00, 'Obra Residencial Las Palmas', NULL, 'VALE-CON-080', 'Consumo de cemento en cimentación', '2026-10-20 16:30:00');

-- -----------------------------------------------------------------------------
-- 6. STOCK ACTUAL CONSOLIDADO POR UBICACIÓN
-- -----------------------------------------------------------------------------
INSERT INTO inventario_stock (id_material, ubicacion, cantidad_actual) VALUES
-- Bodega Central
(1, 'Bodega Central', 450.00),   -- 1000 - 350 - 200 = 450
(2, 'Bodega Central', 370.00),   -- 800 - 250 - 180 = 370
(3, 'Bodega Central', 4500.00),  -- 8000 - 2000 - 1500 = 4500
(4, 'Bodega Central', 80.00),    -- 150 - 40 - 30 = 80

-- Obra Torre Norte
(1, 'Obra Torre Norte', 70.00),    -- 350 - 280 = 70
(2, 'Obra Torre Norte', 50.00),    -- 250 - 200 = 50
(3, 'Obra Torre Norte', 2000.00),  -- 2000
(4, 'Obra Torre Norte', 40.00),    -- 40

-- Obra Residencial Las Palmas
(1, 'Obra Residencial Las Palmas', 50.00),    -- 200 - 150 = 50
(2, 'Obra Residencial Las Palmas', 180.00),   -- 180
(3, 'Obra Residencial Las Palmas', 1500.00),  -- 1500
(4, 'Obra Residencial Las Palmas', 30.00);    -- 30
