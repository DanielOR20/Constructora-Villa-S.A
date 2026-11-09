const movimientosService = require('../services/movimientos.service');

/**
 * =============================================================================
 * CONTROLADOR DE MOVIMIENTOS DE INVENTARIO - NIVEL EMPRESARIAL
 * Validaciones exhaustivas de entrada y códigos de respuesta estandarizados
 * =============================================================================
 */

const getMovimientos = async (req, res, next) => {
  try {
    const { limit, tipo, id_material } = req.query;

    let parsedLimit = 50;
    if (limit !== undefined) {
      parsedLimit = Number(limit);
      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            codigo: 'PARAMETRO_INVALIDO',
            mensaje: 'El parámetro "limit" debe ser un número entero positivo mayor a cero.'
          }
        });
      }
    }

    let parsedIdMaterial = null;
    if (id_material !== undefined) {
      parsedIdMaterial = Number(id_material);
      if (isNaN(parsedIdMaterial) || parsedIdMaterial <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            codigo: 'PARAMETRO_INVALIDO',
            mensaje: 'El parámetro "id_material" debe ser un número entero positivo válido.'
          }
        });
      }
    }

    const movimientos = await movimientosService.getMovimientos({
      limit: parsedLimit,
      tipo: tipo || null,
      idMaterial: parsedIdMaterial
    });

    return res.status(200).json({
      success: true,
      total: movimientos.length,
      data: movimientos
    });
  } catch (error) {
    next(error);
  }
};

const getMovimientoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movId = Number(id);

    if (isNaN(movId) || movId <= 0 || !Number.isInteger(movId)) {
      return res.status(400).json({
        success: false,
        error: {
          codigo: 'ID_INVALIDO',
          mensaje: 'El parámetro ID de movimiento debe ser un número entero positivo válido.'
        }
      });
    }

    const movimiento = await movimientosService.getMovimientoById(movId);

    if (!movimiento) {
      return res.status(404).json({
        success: false,
        error: {
          codigo: 'MOVIMIENTO_NO_ENCONTRADO',
          mensaje: `No se encontró ningún movimiento registrado con el ID ${id}.`
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: movimiento
    });
  } catch (error) {
    next(error);
  }
};

const createMovimiento = async (req, res, next) => {
  try {
    const {
      tipo_movimiento,
      id_material,
      cantidad,
      ubicacion_origen,
      ubicacion_destino,
      documento_referencia,
      observaciones,
      fecha
    } = req.body;

    // 1. Validación de obligatoriedad de tipo_movimiento
    if (!tipo_movimiento || typeof tipo_movimiento !== 'string' || !tipo_movimiento.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          codigo: 'CAMPO_FALTANTE',
          mensaje: 'El campo "tipo_movimiento" es obligatorio (Valores permitidos: entrada, salida, traslado, ajuste).'
        }
      });
    }

    const tipoNormalizado = tipo_movimiento.trim().toUpperCase();
    const tiposPermitidos = ['ENTRADA', 'SALIDA', 'TRANSFERENCIA', 'TRASLADO', 'AJUSTE'];

    if (!tiposPermitidos.includes(tipoNormalizado)) {
      return res.status(400).json({
        success: false,
        error: {
          codigo: 'TIPO_MOVIMIENTO_INVALIDO',
          mensaje: `El tipo de movimiento "${tipo_movimiento}" es inválido. Valores aceptados: entrada, salida, traslado, transferencia, ajuste.`
        }
      });
    }

    // 2. Validación de id_material
    if (id_material === undefined || id_material === null) {
      return res.status(400).json({
        success: false,
        error: {
          codigo: 'CAMPO_FALTANTE',
          mensaje: 'El campo "id_material" es obligatorio.'
        }
      });
    }

    const materialId = Number(id_material);
    if (isNaN(materialId) || materialId <= 0 || !Number.isInteger(materialId)) {
      return res.status(400).json({
        success: false,
        error: {
          codigo: 'MATERIAL_ID_INVALIDO',
          mensaje: 'El campo "id_material" debe ser un número entero positivo correspondiente a un insumo existente.'
        }
      });
    }

    // 3. Validación de cantidad
    if (cantidad === undefined || cantidad === null) {
      return res.status(400).json({
        success: false,
        error: {
          codigo: 'CAMPO_FALTANTE',
          mensaje: 'El campo "cantidad" es obligatorio.'
        }
      });
    }

    const cantNum = Number(cantidad);
    if (isNaN(cantNum) || cantNum <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          codigo: 'CANTIDAD_INVALIDA',
          mensaje: 'El campo "cantidad" debe ser un valor numérico estrictamente mayor a 0.'
        }
      });
    }

    // 4. Validación de fecha opcional
    if (fecha !== undefined && fecha !== null) {
      const parsedDate = new Date(fecha);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            codigo: 'FECHA_INVALIDA',
            mensaje: 'El campo "fecha" no cuenta con un formato de fecha válido (ISO-8601 o YYYY-MM-DD).'
          }
        });
      }
    }

    // 5. Validaciones de ubicaciones según tipo
    const esEntrada = tipoNormalizado === 'ENTRADA';
    const esSalida = tipoNormalizado === 'SALIDA';
    const esTraslado = tipoNormalizado === 'TRANSFERENCIA' || tipoNormalizado === 'TRASLADO';

    if (esEntrada && (!ubicacion_destino || !String(ubicacion_destino).trim())) {
      return res.status(400).json({
        success: false,
        error: {
          codigo: 'UBICACION_FALTANTE',
          mensaje: 'Para transacciones de ENTRADA se debe especificar la "ubicacion_destino" (Ej: Bodega Central, Nave 1).'
        }
      });
    }

    if (esSalida && (!ubicacion_origen || !String(ubicacion_origen).trim())) {
      return res.status(400).json({
        success: false,
        error: {
          codigo: 'UBICACION_FALTANTE',
          mensaje: 'Para transacciones de SALIDA se debe especificar la "ubicacion_origen" del consumo.'
        }
      });
    }

    if (esTraslado) {
      if (!ubicacion_origen || !String(ubicacion_origen).trim() || !ubicacion_destino || !String(ubicacion_destino).trim()) {
        return res.status(400).json({
          success: false,
          error: {
            codigo: 'UBICACIONES_FALTANTES',
            mensaje: 'Para TRASLADOS se debe especificar tanto "ubicacion_origen" como "ubicacion_destino".'
          }
        });
      }

      if (String(ubicacion_origen).trim().toLowerCase() === String(ubicacion_destino).trim().toLowerCase()) {
        return res.status(400).json({
          success: false,
          error: {
            codigo: 'UBICACIONES_IDENTICAS',
            mensaje: 'La ubicación de origen y destino no pueden ser iguales en un traslado.'
          }
        });
      }
    }

    // Ejecución del servicio transaccional
    const resultado = await movimientosService.registrarMovimientoTransaccional({
      tipo_movimiento: tipoNormalizado,
      id_material: materialId,
      cantidad: cantNum,
      ubicacion_origen: ubicacion_origen ? String(ubicacion_origen).trim() : null,
      ubicacion_destino: ubicacion_destino ? String(ubicacion_destino).trim() : null,
      documento_referencia: documento_referencia ? String(documento_referencia).trim() : null,
      observaciones: observaciones ? String(observaciones).trim() : null,
      fecha
    });

    return res.status(201).json({
      success: true,
      mensaje: `Transacción de ${tipoNormalizado} procesada y confirmada en base de datos.`,
      data: resultado
    });
  } catch (error) {
    next(error);
  }
};

const getStockPorUbicacion = async (req, res, next) => {
  try {
    const stock = await movimientosService.getStockPorUbicacion();
    return res.status(200).json({
      success: true,
      total: stock.length,
      data: stock
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMovimientos,
  getMovimientoById,
  createMovimiento,
  getStockPorUbicacion
};
