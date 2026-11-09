const ordenesService = require('../services/ordenes.service');
const { auditarComprasDuplicadasYFugas } = require('../services/duplicados.service');

/**
 * =============================================================================
 * CONTROLADOR DE ÓRDENES DE COMPRA Y AUDITORÍA DE FUGAS DE VALOR
 * =============================================================================
 */

const getOrdenes = async (req, res, next) => {
  try {
    const ordenes = await ordenesService.getAllOrdenes();
    return res.status(200).json({
      success: true,
      total: ordenes.length,
      data: ordenes
    });
  } catch (error) {
    next(error);
  }
};

const getOrdenById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ordenId = Number(id);

    if (isNaN(ordenId) || ordenId <= 0 || !Number.isInteger(ordenId)) {
      return res.status(400).json({
        success: false,
        error: {
          codigo: 'ID_INVALIDO',
          mensaje: 'El identificador de orden debe ser un número entero positivo válido.'
        }
      });
    }

    const orden = await ordenesService.getOrdenById(ordenId);

    if (!orden) {
      return res.status(404).json({
        success: false,
        error: {
          codigo: 'ORDEN_NO_ENCONTRADA',
          mensaje: `No se encontró ninguna orden de compra con el ID ${id}.`
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: orden
    });
  } catch (error) {
    next(error);
  }
};

const getOrdenesDuplicadas = async (req, res, next) => {
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
  getOrdenes,
  getOrdenById,
  getOrdenesDuplicadas
};
