const { pool } = require('../config/db');

/**
 * =============================================================================
 * MOTOR AVANZADO DE AUDITORÍA: COMPRAS DUPLICADAS Y FUGAS DE VALOR
 * Caso de Estudio: Quiz Barry Vega - Parte B
 * Moneda oficial del informe: Colones costarricenses (₡)
 * =============================================================================
 */

/**
 * Función utilitaria para dar formato en colones (₡)
 * @param {number} valor
 * @returns {string} Ej: "₡130,250.00"
 */
const formatearColones = (valor) => {
  const monto = Number(valor) || 0;
  return `₡${monto.toLocaleString('es-CR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Detecta compras duplicadas (exactas o con margen < 10% en ventana de <= 3 días)
 * y evalúa sobreprecios frente al precio contractual de catálogo de materiales.
 * 
 * @param {Object} options
 * @param {number} [options.maxDiasDiferencia=3] Ventana máxima de días entre órdenes
 * @param {number} [options.margenVariacionCantidad=0.10] Margen máximo de variación (10%)
 * @returns {Promise<Object>} Reporte analítico con cuantificación en colones (₡)
 */
const auditarComprasDuplicadasYFugas = async ({
  maxDiasDiferencia = 3,
  margenVariacionCantidad = 0.10
} = {}) => {
  const maxDias = Number(maxDiasDiferencia) || 3;
  const margen = Number(margenVariacionCantidad) || 0.10;

  // 1. DETECCIÓN DE COMPRAS DUPLICADAS EXACTAS O SIMILARES
  const queryDuplicados = `
    SELECT 
      oc1.id_orden AS id_orden_1,
      oc1.numero_orden AS orden_1,
      oc1.fecha_emision AS fecha_orden_1,
      oc1.total AS total_orden_1,
      oc1.estado AS estado_orden_1,
      oc1.observaciones AS observaciones_orden_1,

      oc2.id_orden AS id_orden_2,
      oc2.numero_orden AS orden_2,
      oc2.fecha_emision AS fecha_orden_2,
      oc2.total AS total_orden_2,
      oc2.estado AS estado_orden_2,
      oc2.observaciones AS observaciones_orden_2,

      ABS(DATEDIFF(oc1.fecha_emision, oc2.fecha_emision)) AS dias_diferencia,

      p.id_proveedor,
      p.nombre AS nombre_proveedor,
      p.codigo AS codigo_proveedor,
      p.email AS email_proveedor,
      p.telefono AS telefono_proveedor,

      d1.id_material,
      m.codigo AS material_codigo,
      m.nombre AS material_nombre,
      m.unidad_medida,
      m.precio_unitario AS precio_contrato,
      d1.cantidad AS cantidad_orden_1,
      d2.cantidad AS cantidad_orden_2,
      d1.precio_unitario AS precio_orden_1,
      d2.precio_unitario AS precio_orden_2,
      d1.subtotal AS subtotal_orden_1,
      d2.subtotal AS subtotal_orden_2

    FROM ordenes_compra oc1
    INNER JOIN ordenes_compra oc2 
      ON oc1.id_proveedor = oc2.id_proveedor 
      AND oc1.id_orden < oc2.id_orden
      AND ABS(DATEDIFF(oc1.fecha_emision, oc2.fecha_emision)) <= ?

    INNER JOIN proveedores p 
      ON oc1.id_proveedor = p.id_proveedor

    INNER JOIN orden_compra_detalles d1 
      ON oc1.id_orden = d1.id_orden

    INNER JOIN orden_compra_detalles d2 
      ON oc2.id_orden = d2.id_orden 
      AND d1.id_material = d2.id_material
      AND ABS(d1.cantidad - d2.cantidad) <= (d1.cantidad * ?)

    INNER JOIN materiales m 
      ON d1.id_material = m.id_material

    ORDER BY oc1.fecha_emision DESC, oc1.id_orden ASC, d1.id_material ASC
  `;

  const [duplicadosRows] = await pool.query(queryDuplicados, [maxDias, margen]);

  const mapaCasosDuplicados = new Map();

  for (const row of duplicadosRows) {
    const key = `${row.id_orden_1}_${row.id_orden_2}`;

    if (!mapaCasosDuplicados.has(key)) {
      const montosIdenticos = Math.abs(Number(row.total_orden_1) - Number(row.total_orden_2)) < 0.01;
      const fechasIdenticas = Number(row.dias_diferencia) === 0;

      let severidad = 'ALTA';
      let clasificacion = 'POSIBLE_COMPRA_DUPLICADA';

      if (montosIdenticos && fechasIdenticas) {
        severidad = 'CRITICA';
        clasificacion = 'DUPLICADO_EXACTO_CONFIRMADO';
      }

      mapaCasosDuplicados.set(key, {
        alerta: {
          clasificacion,
          severidad,
          dias_diferencia: Number(row.dias_diferencia),
          ventana_max_dias: maxDias,
          diagnostico: `Órdenes al mismo proveedor con ${row.dias_diferencia} día(s) de diferencia y partidas con variación < ${(margen * 100).toFixed(0)}%.`
        },
        proveedor: {
          id_proveedor: row.id_proveedor,
          codigo: row.codigo_proveedor,
          nombre: row.nombre_proveedor,
          email: row.email_proveedor,
          telefono: row.telefono_proveedor
        },
        orden_original: {
          id_orden: row.id_orden_1,
          numero_orden: row.orden_1,
          fecha_emision: row.fecha_orden_1,
          total: Number(row.total_orden_1),
          total_formateado: formatearColones(row.total_orden_1),
          estado: row.estado_orden_1,
          observaciones: row.observaciones_orden_1
        },
        orden_duplicada: {
          id_orden: row.id_orden_2,
          numero_orden: row.orden_2,
          fecha_emision: row.fecha_orden_2,
          total: Number(row.total_orden_2),
          total_formateado: formatearColones(row.total_orden_2),
          estado: row.estado_orden_2,
          observaciones: row.observaciones_orden_2
        },
        fuga_valor_duplicacion: Number(row.total_orden_2),
        fuga_valor_duplicacion_formateada: formatearColones(row.total_orden_2),
        partidas_coincidentes: []
      });
    }

    const item = mapaCasosDuplicados.get(key);
    item.partidas_coincidentes.push({
      id_material: row.id_material,
      codigo: row.material_codigo,
      nombre: row.material_nombre,
      unidad_medida: row.unidad_medida,
      precio_contrato: Number(row.precio_contrato),
      precio_contrato_formateado: formatearColones(row.precio_contrato),
      cantidad_orden_original: Number(row.cantidad_orden_1),
      cantidad_orden_duplicada: Number(row.cantidad_orden_2),
      diferencia_cantidades: Number(Math.abs(Number(row.cantidad_orden_1) - Number(row.cantidad_orden_2)).toFixed(2)),
      precio_pagado_orden_1: Number(row.precio_orden_1),
      precio_pagado_orden_2: Number(row.precio_orden_2),
      subtotal_duplicado: Number(row.subtotal_orden_2),
      subtotal_duplicado_formateado: formatearColones(row.subtotal_orden_2)
    });
  }

  const casosDuplicados = Array.from(mapaCasosDuplicados.values());
  const fugaTotalDuplicados = casosDuplicados.reduce((acc, c) => acc + c.fuga_valor_duplicacion, 0);

  // 2. AUDITORÍA DE SOBREPRECIOS Y COMPRAS FUERA DE CONTRATO
  const querySobreprecios = `
    SELECT 
      oc.id_orden,
      oc.numero_orden,
      oc.fecha_emision,
      p.id_proveedor,
      p.nombre AS nombre_proveedor,
      d.id_detalle,
      d.id_material,
      m.codigo AS material_codigo,
      m.nombre AS material_nombre,
      m.unidad_medida,
      m.precio_unitario AS precio_contrato,
      d.precio_unitario AS precio_pagado,
      d.cantidad,
      (d.precio_unitario - m.precio_unitario) AS sobreprecio_unitario,
      ((d.precio_unitario - m.precio_unitario) * d.cantidad) AS fuga_sobreprecio
    FROM orden_compra_detalles d
    INNER JOIN ordenes_compra oc ON d.id_orden = oc.id_orden
    INNER JOIN proveedores p ON oc.id_proveedor = p.id_proveedor
    INNER JOIN materiales m ON d.id_material = m.id_material
    WHERE d.precio_unitario > m.precio_unitario
    ORDER BY fuga_sobreprecio DESC
  `;

  const [sobrepreciosRows] = await pool.query(querySobreprecios);

  const hallazgosSobreprecios = sobrepreciosRows.map((sp) => ({
    id_orden: sp.id_orden,
    numero_orden: sp.numero_orden,
    fecha_emision: sp.fecha_emision,
    proveedor: sp.nombre_proveedor,
    material: {
      id_material: sp.id_material,
      codigo: sp.material_codigo,
      nombre: sp.material_nombre,
      unidad_medida: sp.unidad_medida
    },
    cantidad: Number(sp.cantidad),
    precio_contrato: Number(sp.precio_contrato),
    precio_contrato_formateado: formatearColones(sp.precio_contrato),
    precio_pagado: Number(sp.precio_pagado),
    precio_pagado_formateado: formatearColones(sp.precio_pagado),
    sobreprecio_unitario: Number(sp.sobreprecio_unitario),
    sobreprecio_unitario_formateado: formatearColones(sp.sobreprecio_unitario),
    fuga_por_sobreprecio: Number(sp.fuga_sobreprecio),
    fuga_por_sobreprecio_formateada: formatearColones(sp.fuga_sobreprecio)
  }));

  const fugaTotalSobreprecios = hallazgosSobreprecios.reduce((acc, sp) => acc + sp.fuga_por_sobreprecio, 0);

  // 3. CUANTIFICACIÓN CONSOLIDADA DE LA FUGA DE VALOR TOTAL EN COLONES (₡)
  const fugaValorTotal = fugaTotalDuplicados + fugaTotalSobreprecios;

  return {
    titulo_informe: 'Reporte Analítico de Fugas de Valor y Compras Duplicadas (Auditoría Parte B)',
    entidad: 'Constructora Del Valle S.A.',
    fecha_emision_reporte: new Date().toISOString(),
    moneda_oficial: 'Colones costarricenses (₡)',
    cuantificacion_consolidada: {
      fuga_valor_por_duplicacion: fugaTotalDuplicados,
      fuga_valor_por_duplicacion_formateada: formatearColones(fugaTotalDuplicados),
      fuga_valor_por_sobreprecios: fugaTotalSobreprecios,
      fuga_valor_por_sobreprecios_formateada: formatearColones(fugaTotalSobreprecios),
      fuga_valor_total: fugaValorTotal,
      fuga_valor_total_formateada: formatearColones(fugaValorTotal)
    },
    resumen_ejecutivo: {
      total_casos_duplicados: casosDuplicados.length,
      total_renglones_con_sobreprecio: hallazgosSobreprecios.length,
      alerta_caso_barry_vega: casosDuplicados.some(
        (c) =>
          (c.orden_original.numero_orden === 'OC-1041' && c.orden_duplicada.numero_orden === 'OC-1042') ||
          (c.orden_original.numero_orden === 'OC-1042' && c.orden_duplicada.numero_orden === 'OC-1041')
      )
    },
    auditoria_compras_duplicadas: casosDuplicados,
    auditoria_sobreprecios: hallazgosSobreprecios
  };
};

module.exports = {
  auditarComprasDuplicadas: auditarComprasDuplicadasYFugas,
  auditarComprasDuplicadasYFugas,
  formatearColones
};
