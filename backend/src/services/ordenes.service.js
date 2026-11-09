const { pool } = require('../config/db');
const { auditarComprasDuplicadas } = require('./duplicados.service');

/**
 * =============================================================================
 * SERVICIO DE ÓRDENES DE COMPRA
 * Consultas de adquisiciones y enlace a la auditoría de compras duplicadas
 * =============================================================================
 */

/**
 * Obtiene todas las órdenes de compra emitidas con datos de sus proveedores
 * @returns {Promise<Array<Object>>}
 */
const getAllOrdenes = async () => {
  const query = `
    SELECT 
      oc.id_orden,
      oc.numero_orden,
      oc.fecha_emision,
      oc.estado,
      oc.total,
      oc.observaciones,
      oc.created_at,
      p.id_proveedor,
      p.nombre AS nombre_proveedor,
      p.codigo AS codigo_proveedor
    FROM ordenes_compra oc
    INNER JOIN proveedores p ON oc.id_proveedor = p.id_proveedor
    ORDER BY oc.fecha_emision DESC, oc.id_orden DESC
  `;
  const [rows] = await pool.query(query);
  return rows.map(r => ({
    ...r,
    total: Number(r.total)
  }));
};

/**
 * Obtiene una orden de compra detallada por su ID con todas sus partidas
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
    WHERE oc.id_orden = ?
  `;
  const [headers] = await pool.query(headerQuery, [id]);
  if (headers.length === 0) return null;

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
    ...headers[0],
    total: Number(headers[0].total),
    detalles: details.map(d => ({
      ...d,
      cantidad: Number(d.cantidad),
      precio_unitario: Number(d.precio_unitario),
      subtotal: Number(d.subtotal)
    }))
  };
};

module.exports = {
  getAllOrdenes,
  getOrdenById,
  auditarComprasDuplicadas
};
