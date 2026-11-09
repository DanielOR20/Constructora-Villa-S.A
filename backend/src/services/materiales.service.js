const { pool } = require('../config/db');

/**
 * =============================================================================
 * SERVICIO DE MATERIALES (CRUD Y CÁLCULO DINÁMICO DE STOCK)
 * =============================================================================
 */

/**
 * Calcula el stock actual de un material sumando todas las entradas
 * y restando todas las salidas registradas en la tabla de movimientos.
 * @param {number} idMaterial ID del material a evaluar
 * @returns {Promise<number>} Cantidad neta de stock disponible
 */
const calcularStockActual = async (idMaterial) => {
  const query = `
    SELECT 
      COALESCE(
        SUM(
          CASE 
            WHEN tipo_movimiento = 'ENTRADA' THEN cantidad
            WHEN tipo_movimiento = 'SALIDA' THEN -cantidad
            WHEN tipo_movimiento = 'AJUSTE' THEN cantidad
            ELSE 0
          END
        ), 0
      ) AS stock_calculado
    FROM movimientos
    WHERE id_material = ?
  `;
  const [rows] = await pool.query(query, [idMaterial]);
  return Number(rows[0]?.stock_calculado || 0);
};

/**
 * Obtiene todos los materiales del catálogo acompañados de su stock actual calculado
 * a partir de la suma de entradas y resta de salidas.
 * @returns {Promise<Array<Object>>}
 */
const getAllMateriales = async () => {
  const query = `
    SELECT 
      m.id_material,
      m.codigo,
      m.nombre,
      m.descripcion,
      m.unidad_medida,
      m.precio_unitario,
      m.stock_minimo,
      m.lead_time_dias,
      m.demanda_promedio_diaria,
      m.demanda_maxima_diaria,
      m.created_at,
      m.updated_at,
      COALESCE(
        (
          SELECT SUM(
            CASE 
              WHEN mov.tipo_movimiento = 'ENTRADA' THEN mov.cantidad
              WHEN mov.tipo_movimiento = 'SALIDA' THEN -mov.cantidad
              WHEN mov.tipo_movimiento = 'AJUSTE' THEN mov.cantidad
              ELSE 0
            END
          )
          FROM movimientos mov
          WHERE mov.id_material = m.id_material
        ), 0
      ) AS stock_actual_calculado
    FROM materiales m
    ORDER BY m.id_material ASC
  `;
  const [rows] = await pool.query(query);
  return rows.map(r => ({
    ...r,
    precio_unitario: Number(r.precio_unitario),
    demanda_promedio_diaria: Number(r.demanda_promedio_diaria),
    demanda_maxima_diaria: Number(r.demanda_maxima_diaria),
    stock_actual_calculado: Number(r.stock_actual_calculado)
  }));
};

/**
 * Obtiene un material por su ID incluyendo su stock actual calculado
 * @param {number} id ID del material
 * @returns {Promise<Object|null>}
 */
const getMaterialById = async (id) => {
  const query = `
    SELECT 
      m.id_material,
      m.codigo,
      m.nombre,
      m.descripcion,
      m.unidad_medida,
      m.precio_unitario,
      m.stock_minimo,
      m.lead_time_dias,
      m.demanda_promedio_diaria,
      m.demanda_maxima_diaria,
      m.created_at,
      m.updated_at
    FROM materiales m
    WHERE m.id_material = ?
  `;
  const [rows] = await pool.query(query, [id]);
  if (rows.length === 0) return null;

  const stockActual = await calcularStockActual(id);

  return {
    ...rows[0],
    precio_unitario: Number(rows[0].precio_unitario),
    demanda_promedio_diaria: Number(rows[0].demanda_promedio_diaria),
    demanda_maxima_diaria: Number(rows[0].demanda_maxima_diaria),
    stock_actual_calculado: stockActual
  };
};

/**
 * Crea un nuevo material en el catálogo oficial
 * @param {Object} data Datos del material
 * @returns {Promise<Object>}
 */
const createMaterial = async (data) => {
  const {
    codigo,
    nombre,
    descripcion,
    unidad_medida,
    precio_unitario,
    stock_minimo,
    lead_time_dias,
    demanda_promedio_diaria,
    demanda_maxima_diaria
  } = data;

  const query = `
    INSERT INTO materiales (
      codigo, nombre, descripcion, unidad_medida, precio_unitario,
      stock_minimo, lead_time_dias, demanda_promedio_diaria, demanda_maxima_diaria
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.query(query, [
    codigo.trim().toUpperCase(),
    nombre.trim(),
    descripcion ? descripcion.trim() : '',
    unidad_medida.trim(),
    Number(precio_unitario) || 0.00,
    Number(stock_minimo) || 10,
    Number(lead_time_dias) || 3,
    Number(demanda_promedio_diaria) || 20.00,
    Number(demanda_maxima_diaria) || 35.00
  ]);

  return getMaterialById(result.insertId);
};

/**
 * Actualiza los datos de un material existente
 * @param {number} id ID del material
 * @param {Object} data Datos actualizados
 * @returns {Promise<Object|null>}
 */
const updateMaterial = async (id, data) => {
  const {
    nombre,
    descripcion,
    unidad_medida,
    precio_unitario,
    stock_minimo,
    lead_time_dias,
    demanda_promedio_diaria,
    demanda_maxima_diaria
  } = data;

  const query = `
    UPDATE materiales SET
      nombre = COALESCE(?, nombre),
      descripcion = COALESCE(?, descripcion),
      unidad_medida = COALESCE(?, unidad_medida),
      precio_unitario = COALESCE(?, precio_unitario),
      stock_minimo = COALESCE(?, stock_minimo),
      lead_time_dias = COALESCE(?, lead_time_dias),
      demanda_promedio_diaria = COALESCE(?, demanda_promedio_diaria),
      demanda_maxima_diaria = COALESCE(?, demanda_maxima_diaria)
    WHERE id_material = ?
  `;

  const [result] = await pool.query(query, [
    nombre ? nombre.trim() : null,
    descripcion !== undefined ? descripcion.trim() : null,
    unidad_medida ? unidad_medida.trim() : null,
    precio_unitario !== undefined ? Number(precio_unitario) : null,
    stock_minimo !== undefined ? Number(stock_minimo) : null,
    lead_time_dias !== undefined ? Number(lead_time_dias) : null,
    demanda_promedio_diaria !== undefined ? Number(demanda_promedio_diaria) : null,
    demanda_maxima_diaria !== undefined ? Number(demanda_maxima_diaria) : null,
    id
  ]);

  if (result.affectedRows === 0) return null;
  return getMaterialById(id);
};

/**
 * Elimina un material del catálogo (las restricciones CASCADE removerán movimientos asociados)
 * @param {number} id ID del material a eliminar
 * @returns {Promise<boolean>}
 */
const deleteMaterial = async (id) => {
  const query = `DELETE FROM materiales WHERE id_material = ?`;
  const [result] = await pool.query(query, [id]);
  return result.affectedRows > 0;
};

module.exports = {
  calcularStockActual,
  getAllMateriales,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial
};
