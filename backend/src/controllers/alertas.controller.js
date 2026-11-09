const {
  obtenerMaterialesEnStockCritico,
  obtenerMaterialesEnAdvertencia,
  obtenerAnalisisReordenCompleto,
  obtenerReordenPorMaterialId,
  obtenerResumenEjecutivoAlertas
} = require('../services/alertas.service');
const { auditarComprasDuplicadasYFugas } = require('../services/duplicados.service');

/**
 * =============================================================================
 * CONTROLADOR DE ALERTAS - NIVEL EMPRESARIAL
 * =============================================================================
 */

const getAlertasReorden = async (req, res, next) => {
  try {
    const analisis = await obtenerAnalisisReordenCompleto();
    return res.status(200).json({
      success: true,
      formulas_aplicadas: {
        stock_seguridad: 'SS = Math.ceil((Demanda Máxima - Demanda Promedio) * Lead Time)',
        punto_reorden: 'PR = Math.ceil(Demanda Promedio * Lead Time) + SS',
        criterio_evaluacion: 'CRITICO si stockActual <= PR | ADVERTENCIA si stockActual <= PR * 1.25 | ESTABLE si stockActual > PR * 1.25'
      },
      total_evaluados: analisis.length,
      data: analisis
    });
  } catch (error) {
    next(error);
  }
};

const getAlertasCriticos = async (req, res, next) => {
  try {
    const criticos = await obtenerMaterialesEnStockCritico();
    return res.status(200).json({
      success: true,
      alerta: 'Insumos prioritarios en nivel crítico de reposición (Stock Actual <= PR)',
      total_criticos: criticos.length,
      data: criticos
    });
  } catch (error) {
    next(error);
  }
};

const getAlertasAdvertencias = async (req, res, next) => {
  try {
    const advertencias = await obtenerMaterialesEnAdvertencia();
    return res.status(200).json({
      success: true,
      alerta: 'Insumos en zona preventiva de advertencia (Stock Actual <= PR * 1.25)',
      total_advertencias: advertencias.length,
      data: advertencias
    });
  } catch (error) {
    next(error);
  }
};

const getReordenMaterialById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const materialId = Number(id);

    if (isNaN(materialId) || materialId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          codigo: 'ID_INVALIDO',
          mensaje: 'El parámetro ID debe ser un número entero positivo.'
        }
      });
    }

    const calculo = await obtenerReordenPorMaterialId(materialId);

    if (!calculo) {
      return res.status(404).json({
        success: false,
        error: {
          codigo: 'MATERIAL_NO_ENCONTRADO',
          mensaje: `No se encontró ningún material con el ID ${id} para calcular el reorden.`
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: calculo
    });
  } catch (error) {
    next(error);
  }
};

const getAlertasResumen = async (req, res, next) => {
  try {
    const resumen = await obtenerResumenEjecutivoAlertas();
    return res.status(200).json({
      success: true,
      data: resumen
    });
  } catch (error) {
    next(error);
  }
};

const getAlertasDuplicados = async (req, res, next) => {
  try {
    const { dias, tolerancia } = req.query;

    let parsedDias = 3;
    if (dias !== undefined) {
      parsedDias = Number(dias);
      if (isNaN(parsedDias) || parsedDias < 0) {
        return res.status(400).json({
          success: false,
          error: {
            codigo: 'PARAMETRO_INVALIDO',
            mensaje: 'El parámetro "dias" debe ser un número entero mayor o igual a 0.'
          }
        });
      }
    }

    let parsedTolerancia = 0.10;
    if (tolerancia !== undefined) {
      parsedTolerancia = Number(tolerancia);
      if (isNaN(parsedTolerancia) || parsedTolerancia < 0 || parsedTolerancia > 1) {
        return res.status(400).json({
          success: false,
          error: {
            codigo: 'PARAMETRO_INVALIDO',
            mensaje: 'El parámetro "tolerancia" debe ser un decimal entre 0 y 1 (Ej: 0.10 para 10%).'
          }
        });
      }
    }

    const reporte = await auditarComprasDuplicadasYFugas({
      maxDiasDiferencia: parsedDias,
      margenVariacionCantidad: parsedTolerancia
    });

    return res.status(200).json({
      success: true,
      data: reporte
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAlertasReorden,
  getAlertasCriticos,
  getAlertasAdvertencias,
  getReordenMaterialById,
  getAlertasResumen,
  getAlertasDuplicados
};
