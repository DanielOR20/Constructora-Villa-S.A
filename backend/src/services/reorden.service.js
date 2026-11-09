const { getAllMateriales } = require('./materiales.service');

/**
 * =============================================================================
 * MOTOR MATEMÁTICO DE REORDEN RIGUROSO (QUIZ BARRY VEGA)
 * Fórmulas exactas con redondeo hacia arriba (Math.ceil) y análisis de reposición
 * =============================================================================
 */

/**
 * Función matemática pura que calcula el Stock de Seguridad y Punto de Reorden
 * aplicando redondeo hacia arriba (Math.ceil) según los estándares del quiz.
 * 
 * Fórmulas:
 * 1. Stock de Seguridad (SS) = Math.ceil((Demanda Máxima - Demanda Promedio) * Lead Time)
 * 2. Punto de Reorden (PR)   = Math.ceil(Demanda Promedio * Lead Time) + SS
 * 
 * @param {Object} params
 * @param {number} params.dMax Demanda Máxima Diaria
 * @param {number} params.dProm Demanda Promedio Diaria
 * @param {number} params.leadTime Tiempo de Entrega en Días (Lead Time)
 * @param {number} params.stockActual Saldo de existencias disponibles
 * @returns {Object} Objeto analítico completo
 */
const calcularPuntoReordenMatematico = ({ dMax, dProm, leadTime, stockActual }) => {
  const d_max = Number(dMax) || 0;
  const d_prom = Number(dProm) || 0;
  const L = Number(leadTime) || 1;
  const stock = Number(stockActual) || 0;

  // 1. Stock de Seguridad (SS) con redondeo hacia arriba Math.ceil
  const stockSeguridad = Math.ceil((d_max - d_prom) * L);

  // 2. Consumo proyectado durante el Lead Time con Math.ceil
  const consumoLeadTime = Math.ceil(d_prom * L);

  // 3. Punto de Reorden (PR) = Consumo Lead Time + Stock de Seguridad
  const puntoReorden = consumoLeadTime + stockSeguridad;

  // 4. Déficit de stock: Unidades que faltan para alcanzar el Punto de Reorden
  const deficit = Math.max(0, puntoReorden - stock);

  // 5. Margen neto con respecto al Punto de Reorden (positivo = superávit, negativo = déficit)
  const margenNeto = stock - puntoReorden;

  // 6. Evaluación analítica de tres estados:
  // - CRITICO: Stock actual <= PR (requiere compra inmediata para evitar quiebre de stock)
  // - ADVERTENCIA: Stock actual está entre PR y PR * 1.25 (zona preventiva de precaución)
  // - ESTABLE: Stock actual supera holgadamente el punto de reorden (> PR * 1.25)
  let estadoReposicion = 'ESTABLE';
  if (stock <= puntoReorden) {
    estadoReposicion = 'CRITICO';
  } else if (stock <= Math.ceil(puntoReorden * 1.25)) {
    estadoReposicion = 'ADVERTENCIA';
  }

  // 7. Cantidad sugerida a ordenar para reponer el nivel de inventario a un nivel de cobertura óptimo (PR * 1.5)
  const cantidadSugerida = estadoReposicion === 'CRITICO' 
    ? Math.ceil(Math.max(0, (puntoReorden * 1.5) - stock))
    : 0;

  return {
    parametros: {
      demanda_maxima_diaria: d_max,
      demanda_promedio_diaria: d_prom,
      lead_time_dias: L,
      redondeo_aplicado: 'Math.ceil'
    },
    stockActual: stock,
    stockSeguridad,
    puntoReorden,
    deficit,
    margenNeto,
    estadoReposicion, // 'CRITICO' | 'ADVERTENCIA' | 'ESTABLE'
    analitica: {
      requiereCompraInmediata: estadoReposicion === 'CRITICO',
      alertaPreventiva: estadoReposicion === 'ADVERTENCIA',
      cantidadSugeridaCompra: cantidadSugerida,
      porcentajeCoberturaPR: puntoReorden > 0 ? Number(((stock / puntoReorden) * 100).toFixed(1)) : 100
    }
  };
};

/**
 * Evalúa el reorden riguroso de todos los materiales del catálogo
 * calculando el stock actual dinámico (suma de entradas menos suma de salidas).
 * @returns {Promise<Array<Object>>}
 */
const calcularReordenTodosLosMateriales = async () => {
  const materiales = await getAllMateriales();

  return materiales.map((m) => {
    const analiticaReorden = calcularPuntoReordenMatematico({
      dMax: m.demanda_maxima_diaria,
      dProm: m.demanda_promedio_diaria,
      leadTime: m.lead_time_dias,
      stockActual: m.stock_actual_calculado
    });

    return {
      material: {
        id_material: m.id_material,
        codigo: m.codigo,
        nombre: m.nombre,
        descripcion: m.descripcion,
        unidad_medida: m.unidad_medida,
        precio_unitario: m.precio_unitario,
        stock_minimo_referencial: m.stock_minimo
      },
      stockActual: analiticaReorden.stockActual,
      stockSeguridad: analiticaReorden.stockSeguridad,
      puntoReorden: analiticaReorden.puntoReorden,
      deficit: analiticaReorden.deficit,
      margenNeto: analiticaReorden.margenNeto,
      estadoReposicion: analiticaReorden.estadoReposicion,
      parametros: analiticaReorden.parametros,
      analitica: analiticaReorden.analitica
    };
  });
};

/**
 * Evalúa el reorden riguroso para un material específico por su ID
 * @param {number} idMaterial
 * @returns {Promise<Object|null>}
 */
const calcularReordenPorMaterialId = async (idMaterial) => {
  const todos = await calcularReordenTodosLosMateriales();
  return todos.find((item) => item.material.id_material === Number(idMaterial)) || null;
};

module.exports = {
  calcularPuntoReordenMatematico,
  calcularReordenTodosLosMateriales,
  calcularReordenPorMaterialId
};
