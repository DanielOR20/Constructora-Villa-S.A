const { pool } = require('../config/db');

/**
 * =============================================================================
 * SERVICIO DE MOVIMIENTOS DE INVENTARIO - NIVEL EMPRESARIAL
 * Gestión Transaccional ACID con mysql2/promise (beginTransaction, commit, rollback)
 * =============================================================================
 */

/**
 * Obtiene el historial completo de movimientos con soporte para filtros
 * @param {Object} options
 * @param {number} options.limit Límite de registros a recuperar
 * @param {string|null} options.tipo Tipo de movimiento (ENTRADA, SALIDA, TRASLADO, AJUSTE)
 * @param {number|null} options.idMaterial ID específico de material
 * @returns {Promise<Array<Object>>}
 */
const getMovimientos = async ({ limit = 50, tipo = null, idMaterial = null } = {}) => {
  let query = `
    SELECT 
      mov.id_movimiento,
      mov.tipo_movimiento,
      mov.id_material,
      m.codigo AS material_codigo,
      m.nombre AS material_nombre,
      m.unidad_medida,
      mov.cantidad,
      mov.ubicacion_origen,
      mov.ubicacion_destino,
      mov.documento_referencia,
      mov.observaciones,
      mov.fecha,
      mov.created_at
    FROM movimientos mov
    INNER JOIN materiales m ON mov.id_material = m.id_material
    WHERE 1=1
  `;
  const params = [];

  if (tipo) {
    const tipoMap = {
      'ENTRADA': 'ENTRADA',
      'SALIDA': 'SALIDA',
      'TRANSFERENCIA': 'TRANSFERENCIA',
      'TRASLADO': 'TRANSFERENCIA',
      'AJUSTE': 'AJUSTE'
    };
    const tipoNormalizado = tipoMap[tipo.trim().toUpperCase()] || tipo.trim().toUpperCase();
    query += ' AND mov.tipo_movimiento = ?';
    params.push(tipoNormalizado);
  }

  if (idMaterial) {
    query += ' AND mov.id_material = ?';
    params.push(Number(idMaterial));
  }

  query += ' ORDER BY mov.fecha DESC, mov.id_movimiento DESC LIMIT ?';
  params.push(Number(limit) || 50);

  const [rows] = await pool.query(query, params);
  return rows.map((r) => ({
    ...r,
    cantidad: Number(r.cantidad)
  }));
};

/**
 * Obtiene un movimiento de inventario por su ID
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const getMovimientoById = async (id) => {
  const query = `
    SELECT 
      mov.id_movimiento,
      mov.tipo_movimiento,
      mov.id_material,
      m.codigo AS material_codigo,
      m.nombre AS material_nombre,
      m.unidad_medida,
      mov.cantidad,
      mov.ubicacion_origen,
      mov.ubicacion_destino,
      mov.documento_referencia,
      mov.observaciones,
      mov.fecha,
      mov.created_at
    FROM movimientos mov
    INNER JOIN materiales m ON mov.id_material = m.id_material
    WHERE mov.id_movimiento = ?
  `;
  const [rows] = await pool.query(query, [id]);
  if (rows.length === 0) return null;
  return {
    ...rows[0],
    cantidad: Number(rows[0].cantidad)
  };
};

/**
 * Registra una transacción de inventario bajo un control ACID estricto.
 * Bloquea y valida en tiempo real que una SALIDA o TRASLADO jamás deje el stock por debajo de 0.
 * En caso de saldo insuficiente, revierte la transacción con rollback y lanza error con statusCode 400.
 * 
 * @param {Object} data
 * @param {string} data.tipo_movimiento ENTRADA | SALIDA | TRANSFERENCIA | TRASLADO | AJUSTE
 * @param {number} data.id_material
 * @param {number} data.cantidad
 * @param {string} [data.ubicacion_origen]
 * @param {string} [data.ubicacion_destino]
 * @param {string} [data.documento_referencia]
 * @param {string} [data.observaciones]
 * @param {string|Date} [data.fecha]
 * @returns {Promise<Object>} Registro del movimiento y saldo actualizado
 */
const registrarMovimientoTransaccional = async (data) => {
  const {
    tipo_movimiento,
    id_material,
    cantidad,
    ubicacion_origen,
    ubicacion_destino,
    documento_referencia,
    observaciones,
    fecha
  } = data;

  const rawTipo = String(tipo_movimiento || '').trim().toUpperCase();
  const tipo = rawTipo === 'TRASLADO' ? 'TRANSFERENCIA' : rawTipo;
  const cant = Number(cantidad);

  if (isNaN(cant) || cant <= 0) {
    const error = new Error('La cantidad a registrar debe ser un valor numérico estrictamente mayor a 0');
    error.statusCode = 400;
    error.code = 'CANTIDAD_INVALIDA';
    throw error;
  }

  // Adquirir una conexión dedicada del Pool para la transacción
  const connection = await pool.getConnection();

  try {
    // 1. INICIAR TRANSACCIÓN ESTRICTA
    await connection.beginTransaction();

    // 2. Verificar existencia del material dentro de la transacción
    const [materialRows] = await connection.query(
      'SELECT id_material, codigo, nombre, unidad_medida FROM materiales WHERE id_material = ? FOR UPDATE',
      [id_material]
    );

    if (materialRows.length === 0) {
      const error = new Error(`El material con ID ${id_material} no existe en la base de datos.`);
      error.statusCode = 404;
      error.code = 'MATERIAL_NO_ENCONTRADO';
      await connection.rollback();
      throw error;
    }

    const materialInfo = materialRows[0];

    // 3. Consultar y bloquear el stock neto actual en tiempo real
    const [stockCalculadoRows] = await connection.query(
      `SELECT COALESCE(
        SUM(
          CASE 
            WHEN tipo_movimiento = 'ENTRADA' THEN cantidad
            WHEN tipo_movimiento = 'SALIDA' THEN -cantidad
            WHEN tipo_movimiento = 'AJUSTE' THEN cantidad
            ELSE 0
          END
        ), 0
      ) AS stock_actual_disponible
      FROM movimientos
      WHERE id_material = ?
      FOR UPDATE`,
      [id_material]
    );

    const stockActual = Number(stockCalculadoRows[0]?.stock_actual_disponible || 0);

    // 4. VALIDACIÓN CRÍTICA: Impedir que una salida deje el stock por debajo de 0
    if (tipo === 'SALIDA' || tipo === 'TRANSFERENCIA') {
      const stockResultante = stockActual - cant;

      if (stockResultante < 0) {
        // Ejecución inmediata de ROLLBACK
        await connection.rollback();

        const error = new Error(
          `Operación rechazada por falta de existencias: El material "${materialInfo.nombre}" (${materialInfo.codigo}) tiene únicamente ${stockActual} ${materialInfo.unidad_medida} disponibles. Intentaste retirar ${cant} ${materialInfo.unidad_medida}, lo que dejaría el stock en ${stockResultante} ${materialInfo.unidad_medida} (saldo negativo no permitido).`
        );
        error.statusCode = 400; // HTTP 400 Bad Request
        error.code = 'STOCK_INSUFICIENTE';
        error.detalles = {
          id_material,
          material: materialInfo.nombre,
          unidad_medida: materialInfo.unidad_medida,
          stock_actual: stockActual,
          cantidad_solicitada: cant,
          saldo_resultante_proyectado: stockResultante
        };
        throw error;
      }
    }

    // 5. INSERTAR EL MOVIMIENTO EN LA TABLA HISTÓRICA
    const fechaMovimiento = fecha ? new Date(fecha) : new Date();
    const docRef = documento_referencia ? documento_referencia.trim() : `MOV-${Date.now().toString().slice(-6)}`;
    const obs = observaciones ? observaciones.trim() : '';

    const insertQuery = `
      INSERT INTO movimientos (
        tipo_movimiento, id_material, cantidad,
        ubicacion_origen, ubicacion_destino, documento_referencia,
        observaciones, fecha
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [insertResult] = await connection.query(insertQuery, [
      tipo,
      id_material,
      cant,
      ubicacion_origen || null,
      ubicacion_destino || null,
      docRef,
      obs,
      fechaMovimiento
    ]);

    // 6. ACTUALIZAR O INSERTAR EN LA TABLA inventario_stock
    const ubiDestino = ubicacion_destino ? ubicacion_destino.trim() : 'Bodega Central';
    const ubiOrigen = ubicacion_origen ? ubicacion_origen.trim() : 'Bodega Central';

    if (tipo === 'ENTRADA') {
      await connection.query(
        `INSERT INTO inventario_stock (id_material, ubicacion, cantidad_actual)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE cantidad_actual = cantidad_actual + VALUES(cantidad_actual)`,
        [id_material, ubiDestino, cant]
      );
    } else if (tipo === 'SALIDA') {
      await connection.query(
        `UPDATE inventario_stock 
         SET cantidad_actual = GREATEST(0, cantidad_actual - ?)
         WHERE id_material = ? AND ubicacion = ?`,
        [cant, id_material, ubiOrigen]
      );
    } else if (tipo === 'TRANSFERENCIA') {
      await connection.query(
        `UPDATE inventario_stock 
         SET cantidad_actual = GREATEST(0, cantidad_actual - ?)
         WHERE id_material = ? AND ubicacion = ?`,
        [cant, id_material, ubiOrigen]
      );
      await connection.query(
        `INSERT INTO inventario_stock (id_material, ubicacion, cantidad_actual)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE cantidad_actual = cantidad_actual + VALUES(cantidad_actual)`,
        [id_material, ubiDestino, cant]
      );
    } else if (tipo === 'AJUSTE') {
      await connection.query(
        `INSERT INTO inventario_stock (id_material, ubicacion, cantidad_actual)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE cantidad_actual = cantidad_actual + VALUES(cantidad_actual)`,
        [id_material, ubiDestino, cant]
      );
    }

    // 7. CONFIRMACIÓN (COMMIT) DE LA TRANSACCIÓN
    await connection.commit();

    // Calcular el nuevo saldo neto tras el commit
    const nuevoSaldo = tipo === 'ENTRADA' || tipo === 'AJUSTE'
      ? stockActual + cant
      : stockActual - cant;

    return {
      id_movimiento: insertResult.insertId,
      tipo_movimiento: tipo,
      id_material,
      material_nombre: materialInfo.nombre,
      material_codigo: materialInfo.codigo,
      cantidad: cant,
      unidad_medida: materialInfo.unidad_medida,
      ubicacion_origen: ubicacion_origen || null,
      ubicacion_destino: ubicacion_destino || null,
      documento_referencia: docRef,
      observaciones: obs,
      fecha: fechaMovimiento,
      transaccion: {
        stock_anterior: stockActual,
        cantidad_movida: cant,
        stock_nuevo_calculado: nuevoSaldo,
        estado: 'COMMIT_EXITOSO'
      }
    };
  } catch (error) {
    // Si la conexión sigue abierta en transacción y ocurrió un fallo imprevisto, rollback
    try {
      await connection.rollback();
    } catch (rbErr) {
      console.error('[MovimientosService] Error ejecutando rollback secundario:', rbErr.message);
    }
    throw error;
  } finally {
    // SIEMPRE liberar la conexión al pool
    connection.release();
  }
};

/**
 * Obtiene las existencias desglosadas por ubicación
 * @returns {Promise<Array<Object>>}
 */
const getStockPorUbicacion = async () => {
  const query = `
    SELECT 
      s.id_stock,
      s.ubicacion,
      s.id_material,
      m.codigo AS material_codigo,
      m.nombre AS material_nombre,
      m.unidad_medida,
      s.cantidad_actual,
      m.stock_minimo,
      s.actualizado_al
    FROM inventario_stock s
    INNER JOIN materiales m ON s.id_material = m.id_material
    ORDER BY s.ubicacion ASC, m.id_material ASC
  `;
  const [rows] = await pool.query(query);
  return rows.map((r) => ({
    ...r,
    cantidad_actual: Number(r.cantidad_actual)
  }));
};

module.exports = {
  getMovimientos,
  getMovimientoById,
  registrarMovimiento: registrarMovimientoTransaccional,
  registrarMovimientoTransaccional,
  getStockPorUbicacion
};
