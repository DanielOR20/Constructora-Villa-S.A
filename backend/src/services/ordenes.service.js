const { pool } = require('../config/db');
const { auditarComprasDuplicadas, formatearColones } = require('./duplicados.service');
const { JERARQUIA_ROLES } = require('../middlewares/auth.middleware');

/**
 * =============================================================================
 * SERVICIO DE ÓRDENES DE COMPRA & MOTOR DE LA MATRIZ DE APROBACIÓN
 * Constructora Del Valle S.A.
 * Caso de Estudio: Quiz Barry Vega - Parte A (Rúbrica de Seguridad y Aprobaciones)
 * =============================================================================
 */

/**
 * Matriz Oficial de Aprobación Jerárquica según el Monto de la Requisición:
 * * Hasta ₡250,000                 -> Requiere aprobación de Jefatura de Área (jefatura_area)
 * * De ₡250,001 a ₡2,000,000       -> Requiere Jefatura de Compras (jefatura_compras)
 * * De ₡2,000,001 a ₡10,000,000    -> Requiere Gerencia Financiera (gerencia_financiera)
 * * Más de ₡10,000,000             -> Requiere Gerencia General + Comité (gerencia_general)
 * 
 * @param {number} montoTotal 
 * @returns {Object} Rol requerido y descripción del umbral
 */
const determinarRolAprobadorRequerido = (montoTotal) => {
  const monto = Number(montoTotal) || 0;

  if (monto <= 250000) {
    return {
      rol_requerido: 'jefatura_area',
      nivel_jerarquico: 1,
      rango_descripcion: 'Hasta ₡250,000.00',
      autoridad: 'Jefatura de Área',
      requiere_comite: false
    };
  }

  if (monto <= 2000000) {
    return {
      rol_requerido: 'jefatura_compras',
      nivel_jerarquico: 2,
      rango_descripcion: 'De ₡250,001.00 a ₡2,000,000.00',
      autoridad: 'Jefatura de Compras',
      requiere_comite: false
    };
  }

  if (monto <= 10000000) {
    return {
      rol_requerido: 'gerencia_financiera',
      nivel_jerarquico: 3,
      rango_descripcion: 'De ₡2,000,001.00 a ₡10,000,000.00',
      autoridad: 'Gerencia Financiera',
      requiere_comite: false
    };
  }

  return {
    rol_requerido: 'gerencia_general',
    nivel_jerarquico: 4,
    rango_descripcion: 'Superior a ₡10,000,000.00',
    autoridad: 'Gerencia General + Comité de Adquisiciones',
    requiere_comite: true
  };
};

/**
 * Obtiene todas las órdenes de compra emitidas con datos de proveedores y aprobación
 * @param {Object} [filtros]
 * @param {string} [filtros.estado_aprobacion] 'pendiente' | 'aprobada' | 'rechazada'
 * @returns {Promise<Array<Object>>}
 */
const getAllOrdenes = async (filtros = {}) => {
  let query = `
    SELECT 
      oc.id_orden,
      oc.numero_orden,
      oc.fecha_emision,
      oc.estado,
      oc.total,
      oc.estado_aprobacion,
      oc.rol_aprobador_requerido,
      oc.aprobado_por_id,
      u.nombre AS nombre_aprobador,
      u.rol AS rol_aprobador,
      oc.fecha_aprobacion,
      oc.motivo_rechazo,
      oc.observaciones,
      oc.created_at,
      p.id_proveedor,
      p.nombre AS nombre_proveedor,
      p.codigo AS codigo_proveedor
    FROM ordenes_compra oc
    INNER JOIN proveedores p ON oc.id_proveedor = p.id_proveedor
    LEFT JOIN usuarios u ON oc.aprobado_por_id = u.id_usuario
  `;

  const params = [];
  if (filtros.estado_aprobacion) {
    query += ` WHERE oc.estado_aprobacion = ?`;
    params.push(filtros.estado_aprobacion);
  }

  query += ` ORDER BY oc.fecha_emision DESC, oc.id_orden DESC`;

  const [rows] = await pool.query(query, params);

  return rows.map(r => {
    const matriz = determinarRolAprobadorRequerido(r.total);
    return {
      ...r,
      total: Number(r.total),
      total_formateado: formatearColones(r.total),
      matriz_aprobacion: {
        rol_requerido: r.rol_aprobador_requerido,
        autoridad: matriz.autoridad,
        rango_descripcion: matriz.rango_descripcion
      }
    };
  });
};

/**
 * Obtiene una orden de compra detallada por su ID con partidas y trazabilidad de aprobación
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const getOrdenById = async (id) => {
  const headerQuery = `
    SELECT 
      oc.id_orden,
      oc.numero_orden,
      oc.fecha_emision,
      oc.estado,
      oc.total,
      oc.estado_aprobacion,
      oc.rol_aprobador_requerido,
      oc.aprobado_por_id,
      u.nombre AS nombre_aprobador,
      u.rol AS rol_aprobador,
      u.email AS email_aprobador,
      oc.fecha_aprobacion,
      oc.motivo_rechazo,
      oc.observaciones,
      oc.created_at,
      p.id_proveedor,
      p.nombre AS nombre_proveedor,
      p.codigo AS codigo_proveedor,
      p.contacto AS contacto_proveedor,
      p.telefono AS telefono_proveedor,
      p.email AS email_proveedor
    FROM ordenes_compra oc
    INNER JOIN proveedores p ON oc.id_proveedor = p.id_proveedor
    LEFT JOIN usuarios u ON oc.aprobado_por_id = u.id_usuario
    WHERE oc.id_orden = ?
  `;
  const [headers] = await pool.query(headerQuery, [id]);
  if (headers.length === 0) return null;

  const header = headers[0];
  const matriz = determinarRolAprobadorRequerido(header.total);

  const detailsQuery = `
    SELECT 
      d.id_detalle,
      d.id_material,
      m.codigo AS codigo_material,
      m.nombre AS nombre_material,
      m.unidad_medida,
      d.cantidad,
      d.precio_unitario,
      d.subtotal
    FROM orden_compra_detalles d
    INNER JOIN materiales m ON d.id_material = m.id_material
    WHERE d.id_orden = ?
    ORDER BY d.id_detalle ASC
  `;
  const [details] = await pool.query(detailsQuery, [id]);

  return {
    ...header,
    total: Number(header.total),
    total_formateado: formatearColones(header.total),
    matriz_aprobacion: {
      rol_requerido: header.rol_aprobador_requerido,
      autoridad_requerida: matriz.autoridad,
      rango_monto: matriz.rango_descripcion,
      requiere_comite: matriz.requiere_comite
    },
    detalles: details.map(d => ({
      ...d,
      cantidad: Number(d.cantidad),
      precio_unitario: Number(d.precio_unitario),
      subtotal: Number(d.subtotal),
      subtotal_formateado: formatearColones(d.subtotal)
    }))
  };
};

/**
 * Registra una nueva orden de compra calculando automáticamente su nivel requerido en la matriz
 * @param {Object} datos
 * @returns {Promise<Object>}
 */
const crearOrdenCompra = async ({
  numero_orden,
  id_proveedor,
  fecha_emision,
  partidas = [],
  observaciones = ''
}) => {
  if (!id_proveedor || isNaN(Number(id_proveedor))) {
    const error = new Error('El ID del proveedor es obligatorio y debe ser numérico.');
    error.status = 400;
    error.codigo = 'PROVEEDOR_INVALIDO';
    throw error;
  }

  if (!partidas || !Array.isArray(partidas) || partidas.length === 0) {
    const error = new Error('La orden de compra debe incluir al menos una partida de material.');
    error.status = 400;
    error.codigo = 'PARTIDAS_REQUERIDAS';
    throw error;
  }

  const [provRows] = await pool.query(
    'SELECT id_proveedor, nombre FROM proveedores WHERE id_proveedor = ?',
    [Number(id_proveedor)]
  );

  if (provRows.length === 0) {
    const error = new Error(`El proveedor con ID ${id_proveedor} no existe.`);
    error.status = 404;
    error.codigo = 'PROVEEDOR_NO_ENCONTRADO';
    throw error;
  }

  // Generar o validar número de orden
  const numOrden = numero_orden ? numero_orden.trim().toUpperCase() : `OC-${Date.now().toString().slice(-6)}`;

  const [ocExistente] = await pool.query(
    'SELECT id_orden FROM ordenes_compra WHERE numero_orden = ?',
    [numOrden]
  );

  if (ocExistente.length > 0) {
    const error = new Error(`Ya existe una orden de compra registrada con el folio: ${numOrden}.`);
    error.status = 409;
    error.codigo = 'NUMERO_ORDEN_DUPLICADO';
    throw error;
  }

  // Calcular el total y validar partidas
  let totalOrden = 0;
  const partidasProcesadas = [];

  for (const p of partidas) {
    const idMat = Number(p.id_material);
    const cant = Number(p.cantidad);

    if (!idMat || isNaN(idMat) || !cant || cant <= 0) {
      const error = new Error('Cada partida debe incluir id_material válido y cantidad mayor a 0.');
      error.status = 400;
      error.codigo = 'PARTIDA_INVALIDA';
      throw error;
    }

    const [matRows] = await pool.query(
      'SELECT id_material, nombre, precio_unitario FROM materiales WHERE id_material = ?',
      [idMat]
    );

    if (matRows.length === 0) {
      const error = new Error(`El material con ID ${idMat} no existe.`);
      error.status = 404;
      error.codigo = 'MATERIAL_NO_ENCONTRADO';
      throw error;
    }

    const precioUnitario = p.precio_unitario !== undefined ? Number(p.precio_unitario) : Number(matRows[0].precio_unitario);
    const subtotal = Number((cant * precioUnitario).toFixed(2));
    totalOrden += subtotal;

    partidasProcesadas.push({
      id_material: idMat,
      cantidad: cant,
      precio_unitario: precioUnitario,
      subtotal
    });
  }

  totalOrden = Number(totalOrden.toFixed(2));

  // Aplicar Matriz de Aprobación Jerárquica
  const matriz = determinarRolAprobadorRequerido(totalOrden);
  const fecha = fecha_emision || new Date().toISOString().slice(0, 10);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const insertHeaderQuery = `
      INSERT INTO ordenes_compra (
        numero_orden, id_proveedor, fecha_emision, estado, total,
        estado_aprobacion, rol_aprobador_requerido, observaciones
      ) VALUES (?, ?, ?, 'PENDIENTE', ?, 'pendiente', ?, ?)
    `;

    const [headerResult] = await connection.query(insertHeaderQuery, [
      numOrden,
      Number(id_proveedor),
      fecha,
      totalOrden,
      matriz.rol_requerido,
      observaciones || `Requisición de materiales por ${formatearColones(totalOrden)}`
    ]);

    const idOrdenCreada = headerResult.insertId;

    const insertDetailQuery = `
      INSERT INTO orden_compra_detalles (id_orden, id_material, cantidad, precio_unitario, subtotal)
      VALUES (?, ?, ?, ?, ?)
    `;

    for (const partida of partidasProcesadas) {
      await connection.query(insertDetailQuery, [
        idOrdenCreada,
        partida.id_material,
        partida.cantidad,
        partida.precio_unitario,
        partida.subtotal
      ]);
    }

    await connection.commit();

    return {
      id_orden: idOrdenCreada,
      numero_orden: numOrden,
      id_proveedor: Number(id_proveedor),
      proveedor: provRows[0].nombre,
      fecha_emision: fecha,
      total: totalOrden,
      total_formateado: formatearColones(totalOrden),
      estado: 'PENDIENTE',
      estado_aprobacion: 'pendiente',
      matriz_aprobacion: {
        rol_requerido: matriz.rol_requerido,
        autoridad: matriz.autoridad,
        rango_monto: matriz.rango_descripcion,
        requiere_comite: matriz.requiere_comite,
        instruccion: `Esta orden requiere ser revisada y firmada digitalmente por un usuario con rol '${matriz.rol_requerido}' o superior en la jerarquía corporativa.`
      },
      partidas: partidasProcesadas
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

/**
 * Valida y procesa la aprobación o rechazo de una orden de compra según la Matriz Jerárquica
 * @param {Object} params
 * @param {number} params.id_orden
 * @param {string} params.accion 'aprobada' | 'rechazada'
 * @param {string} [params.motivo]
 * @param {Object} params.usuarioAutenticado { id_usuario, nombre, email, rol }
 * @returns {Promise<Object>}
 */
const gestionarAprobacionOrden = async ({ id_orden, accion, motivo, usuarioAutenticado }) => {
  const id = Number(id_orden);
  if (!id || isNaN(id)) {
    const error = new Error('El ID de la orden de compra debe ser un número entero válido.');
    error.status = 400;
    error.codigo = 'ID_ORDEN_INVALIDO';
    throw error;
  }

  const accionNormalizada = (accion || '').toLowerCase().trim();
  if (!['aprobada', 'rechazada'].includes(accionNormalizada)) {
    const error = new Error("La acción de aprobación debe ser 'aprobada' o 'rechazada'.");
    error.status = 400;
    error.codigo = 'ACCION_INVALIDA';
    throw error;
  }

  if (accionNormalizada === 'rechazada' && (!motivo || !motivo.trim())) {
    const error = new Error('Al rechazar una orden de compra es obligatorio consignar el motivo o justificación técnica.');
    error.status = 400;
    error.codigo = 'MOTIVO_RECHAZO_REQUERIDO';
    throw error;
  }

  // 1. Obtener la orden existente
  const [rows] = await pool.query(
    'SELECT id_orden, numero_orden, total, estado, estado_aprobacion, rol_aprobador_requerido FROM ordenes_compra WHERE id_orden = ?',
    [id]
  );

  if (rows.length === 0) {
    const error = new Error(`No se encontró la orden de compra con ID ${id}.`);
    error.status = 404;
    error.codigo = 'ORDEN_NO_ENCONTRADA';
    throw error;
  }

  const orden = rows[0];

  if (orden.estado_aprobacion !== 'pendiente') {
    const error = new Error(
      `La orden de compra #${orden.numero_orden} ya fue procesada anteriormente con estado: '${orden.estado_aprobacion}'. No se puede modificar su dictamen.`
    );
    error.status = 400;
    error.codigo = 'ORDEN_YA_PROCESADA';
    throw error;
  }

  // 2. VALIDACIÓN ESTRICTA DE LA MATRIZ DE APROBACIÓN POR ROL JERÁRQUICO
  const nivelUsuario = JERARQUIA_ROLES[usuarioAutenticado.rol] || 0;
  const nivelRequerido = JERARQUIA_ROLES[orden.rol_aprobador_requerido] || 999;
  const matriz = determinarRolAprobadorRequerido(orden.total);

  if (nivelUsuario < nivelRequerido) {
    const error = new Error(
      `Acceso Denegado por Matriz de Aprobación: La orden #${orden.numero_orden} tiene un monto de ${formatearColones(orden.total)}, perteneciente al rango '${matriz.rango_descripcion}', por lo que requiere autorización mínima de '${matriz.autoridad}' (${orden.rol_aprobador_requerido}). Su rol actual '${usuarioAutenticado.rol}' (Nivel ${nivelUsuario}) no cuenta con jerarquía suficiente (Nivel Requerido: ${nivelRequerido}).`
    );
    error.status = 403;
    error.codigo = 'JERARQUIA_INSUFICIENTE';
    throw error;
  }

  // 3. Aplicar la actualización de estado
  const nuevoEstadoGeneral = accionNormalizada === 'aprobada' ? 'APROBADA' : 'CANCELADA';
  const queryUpdate = `
    UPDATE ordenes_compra
    SET 
      estado_aprobacion = ?,
      estado = ?,
      aprobado_por_id = ?,
      fecha_aprobacion = NOW(),
      motivo_rechazo = ?
    WHERE id_orden = ?
  `;

  await pool.query(queryUpdate, [
    accionNormalizada,
    nuevoEstadoGeneral,
    usuarioAutenticado.id_usuario,
    accionNormalizada === 'rechazada' ? motivo.trim() : null,
    id
  ]);

  return {
    id_orden: id,
    numero_orden: orden.numero_orden,
    total: Number(orden.total),
    total_formateado: formatearColones(orden.total),
    estado_aprobacion: accionNormalizada,
    estado_general: nuevoEstadoGeneral,
    aprobado_por: {
      id_usuario: usuarioAutenticado.id_usuario,
      nombre: usuarioAutenticado.nombre,
      rol: usuarioAutenticado.rol
    },
    fecha_aprobacion: new Date().toISOString(),
    motivo_rechazo: accionNormalizada === 'rechazada' ? motivo.trim() : null,
    matriz_cumplida: {
      rol_requerido: orden.rol_aprobador_requerido,
      autoridad: matriz.autoridad,
      rol_firmante: usuarioAutenticado.rol,
      jerarquia_valida: true
    },
    mensaje: `La orden de compra #${orden.numero_orden} ha sido ${accionNormalizada.toUpperCase()} exitosamente por ${usuarioAutenticado.nombre} (${usuarioAutenticado.rol}).`
  };
};

module.exports = {
  getAllOrdenes,
  getOrdenById,
  crearOrdenCompra,
  gestionarAprobacionOrden,
  determinarRolAprobadorRequerido,
  auditarComprasDuplicadas
};
