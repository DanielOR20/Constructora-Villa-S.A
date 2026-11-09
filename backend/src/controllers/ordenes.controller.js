const ordenesService = require('../services/ordenes.service');
const { auditarComprasDuplicadasYFugas } = require('../services/duplicados.service');

/**
 * =============================================================================
 * CONTROLADOR DE ÓRDENES DE COMPRA Y MATRIZ DE APROBACIÓN JERÁRQUICA
 * Constructora Del Valle S.A.
 * =============================================================================
 */

const getOrdenes = async (req, res, next) => {
  try {
    const { estado_aprobacion } = req.query;
    const ordenes = await ordenesService.getAllOrdenes({ estado_aprobacion });
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

const crearOrden = async (req, res, next) => {
  try {
    const { numero_orden, id_proveedor, fecha_emision, partidas, observaciones } = req.body;

    const nuevaOrden = await ordenesService.crearOrdenCompra({
      numero_orden,
      id_proveedor,
      fecha_emision,
      partidas,
      observaciones
    });

    return res.status(201).json({
      success: true,
      mensaje: 'Orden de compra registrada exitosamente y catalogada bajo la Matriz de Aprobación.',
      data: nuevaOrden
    });
  } catch (error) {
    next(error);
  }
};

const aprobarOrden = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { accion, motivo } = req.body;

    if (!accion) {
      return res.status(400).json({
        success: false,
        error: {
          codigo: 'ACCION_REQUERIDA',
          mensaje: "Debe especificar la acción a ejecutar ('aprobada' o 'rechazada') en el cuerpo de la petición."
        }
      });
    }

    const resultado = await ordenesService.gestionarAprobacionOrden({
      id_orden: id,
      accion,
      motivo,
      usuarioAutenticado: req.user
    });

    return res.status(200).json({
      success: true,
      data: resultado
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
  crearOrden,
  aprobarOrden,
  getOrdenesDuplicadas
};
