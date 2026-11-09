const { calcularReordenTodosLosMateriales, calcularReordenPorMaterialId } = require('./reorden.service');
const { auditarComprasDuplicadasYFugas, formatearColones } = require('./duplicados.service');

/**
 * =============================================================================
 * SERVICIO CENTRALIZADO DE ALERTAS Y GESTIÓN DE RIESGO
 * =============================================================================
 */

/**
 * Filtra y devuelve todos los materiales en estado CRÍTICO (Stock <= PR)
 * @returns {Promise<Array<Object>>}
 */
const obtenerMaterialesEnStockCritico = async () => {
  const todos = await calcularReordenTodosLosMateriales();
  return todos.filter((item) => item.estadoReposicion === 'CRITICO');
};

/**
 * Filtra los materiales que se encuentran en estado de ADVERTENCIA (zona preventiva)
 * @returns {Promise<Array<Object>>}
 */
const obtenerMaterialesEnAdvertencia = async () => {
  const todos = await calcularReordenTodosLosMateriales();
  return todos.filter((item) => item.estadoReposicion === 'ADVERTENCIA');
};

/**
 * Retorna el análisis completo de reorden de todos los materiales
 * @returns {Promise<Array<Object>>}
 */
const obtenerAnalisisReordenCompleto = async () => {
  return calcularReordenTodosLosMateriales();
};

/**
 * Retorna el cálculo de punto de reorden para un material por su ID
 * @param {number} idMaterial
 * @returns {Promise<Object|null>}
 */
const obtenerReordenPorMaterialId = async (idMaterial) => {
  return calcularReordenPorMaterialId(idMaterial);
};

/**
 * Genera el resumen ejecutivo integral con métricas de reorden y fugas de valor en colones (₡)
 * @returns {Promise<Object>}
 */
const obtenerResumenEjecutivoAlertas = async () => {
  const todosMateriales = await calcularReordenTodosLosMateriales();
  const criticos = todosMateriales.filter((item) => item.estadoReposicion === 'CRITICO');
  const advertencias = todosMateriales.filter((item) => item.estadoReposicion === 'ADVERTENCIA');
  const estables = todosMateriales.filter((item) => item.estadoReposicion === 'ESTABLE');

  const auditoria = await auditarComprasDuplicadasYFugas();

  return {
    fecha_generacion: new Date().toISOString(),
    moneda_reporte: 'Colones (₡)',
    inventario: {
      total_materiales_catalogo: todosMateriales.length,
      total_criticos: criticos.length,
      total_advertencias: advertencias.length,
      total_estables: estables.length,
      materiales_criticos_compra_urgente: criticos.map((c) => ({
        id_material: c.material.id_material,
        codigo: c.material.codigo,
        nombre: c.material.nombre,
        unidad_medida: c.material.unidad_medida,
        stock_actual: c.stockActual,
        punto_reorden_pr: c.puntoReorden,
        stock_seguridad_ss: c.stockSeguridad,
        deficit_unidades: c.deficit,
        cantidad_sugerida_compra: c.analitica.cantidadSugeridaCompra
      }))
    },
    auditoria_fugas_valor: {
      total_casos_duplicados: auditoria.resumen_ejecutivo.total_casos_duplicados,
      fuga_valor_duplicados: auditoria.cuantificacion_consolidada.fuga_valor_por_duplicacion,
      fuga_valor_duplicados_formateada: auditoria.cuantificacion_consolidada.fuga_valor_por_duplicacion_formateada,
      total_sobreprecios: auditoria.resumen_ejecutivo.total_renglones_con_sobreprecio,
      fuga_valor_sobreprecios: auditoria.cuantificacion_consolidada.fuga_valor_por_sobreprecios,
      fuga_valor_sobreprecios_formateada: auditoria.cuantificacion_consolidada.fuga_valor_por_sobreprecios_formateada,
      fuga_valor_total_consolidada: auditoria.cuantificacion_consolidada.fuga_valor_total,
      fuga_valor_total_consolidada_formateada: auditoria.cuantificacion_consolidada.fuga_valor_total_formateada,
      alerta_caso_barry_vega: auditoria.resumen_ejecutivo.alerta_caso_barry_vega
    }
  };
};

module.exports = {
  obtenerMaterialesEnStockCritico,
  obtenerMaterialesEnAdvertencia,
  obtenerAnalisisReordenCompleto,
  obtenerReordenPorMaterialId,
  obtenerResumenEjecutivoAlertas
};
