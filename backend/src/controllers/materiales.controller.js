const materialesService = require('../services/materiales.service');
const { calcularReordenPorMaterialId } = require('../services/reorden.service');

/**
 * =============================================================================
 * CONTROLADOR DE MATERIALES - NIVEL EMPRESARIAL
 * =============================================================================
 */

const getMateriales = async (req, res, next) => {
  try {
    const materiales = await materialesService.getAllMateriales();
    return res.status(200).json({
      success: true,
      total: materiales.length,
      data: materiales
    });
  } catch (error) {
    next(error);
  }
};

const getMaterialById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const materialId = Number(id);

    if (isNaN(materialId) || materialId <= 0 || !Number.isInteger(materialId)) {
      return res.status(400).json({
        success: false,
        error: {
          codigo: 'ID_INVALIDO',
          mensaje: 'El identificador de material debe ser un número entero positivo válido.'
        }
      });
    }

    const material = await materialesService.getMaterialById(materialId);

    if (!material) {
      return res.status(404).json({
        success: false,
        error: {
          codigo: 'MATERIAL_NO_ENCONTRADO',
          mensaje: `No se encontró ningún material con el ID ${id} en el catálogo.`
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: material
    });
  } catch (error) {
    next(error);
  }
};

const getStockIndividual = async (req, res, next) => {
  try {
    const { id } = req.params;
    const materialId = Number(id);

    if (isNaN(materialId) || materialId <= 0 || !Number.isInteger(materialId)) {
      return res.status(400).json({
        success: false,
        error: {
          codigo: 'ID_INVALIDO',
          mensaje: 'El identificador de material debe ser un número entero positivo.'
        }
      });
    }

    const material = await materialesService.getMaterialById(materialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        error: {
          codigo: 'MATERIAL_NO_ENCONTRADO',
          mensaje: `Material con ID ${id} no encontrado.`
        }
      });
    }

    const stockActual = await materialesService.calcularStockActual(materialId);

    return res.status(200).json({
      success: true,
      data: {
        id_material: material.id_material,
        codigo: material.codigo,
        nombre: material.nombre,
        unidad_medida: material.unidad_medida,
        stock_actual: stockActual
      }
    });
  } catch (error) {
    next(error);
  }
};

const getReordenMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const materialId = Number(id);

    if (isNaN(materialId) || materialId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          codigo: 'ID_INVALIDO',
          mensaje: 'El identificador de material debe ser un número entero positivo.'
        }
      });
    }

    const calculo = await calcularReordenPorMaterialId(materialId);

    if (!calculo) {
      return res.status(404).json({
        success: false,
        error: {
          codigo: 'MATERIAL_NO_ENCONTRADO',
          mensaje: `Material con ID ${id} no encontrado para cálculo de reorden.`
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

const createMaterial = async (req, res, next) => {
  try {
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
    } = req.body;

    // Validación de obligatoriedad de campos de texto
    if (!codigo || typeof codigo !== 'string' || !codigo.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          codigo: 'CAMPO_OBLIGATORIO',
          mensaje: 'El campo "codigo" es obligatorio y debe ser una cadena no vacía (Ej: MAT-CEM-02).'
        }
      });
    }

    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          codigo: 'CAMPO_OBLIGATORIO',
          mensaje: 'El campo "nombre" es obligatorio y debe ser una cadena no vacía.'
        }
      });
    }

    if (!unidad_medida || typeof unidad_medida !== 'string' || !unidad_medida.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          codigo: 'CAMPO_OBLIGATORIO',
          mensaje: 'El campo "unidad_medida" es obligatorio (Ej: Saco 50 kg, Pieza, m3).'
        }
      });
    }

    // Validación de campos numéricos (positivos)
    if (precio_unitario !== undefined) {
      const p = Number(precio_unitario);
      if (isNaN(p) || p < 0) {
        return res.status(400).json({
          success: false,
          error: {
            codigo: 'PRECIO_INVALIDO',
            mensaje: 'El campo "precio_unitario" debe ser un número igual o mayor a 0.'
          }
        });
      }
    }

    if (stock_minimo !== undefined) {
      const sm = Number(stock_minimo);
      if (isNaN(sm) || sm < 0) {
        return res.status(400).json({
          success: false,
          error: {
            codigo: 'STOCK_MINIMO_INVALIDO',
            mensaje: 'El campo "stock_minimo" debe ser un número mayor o igual a 0.'
          }
        });
      }
    }

    if (lead_time_dias !== undefined) {
      const lt = Number(lead_time_dias);
      if (isNaN(lt) || lt <= 0 || !Number.isInteger(lt)) {
        return res.status(400).json({
          success: false,
          error: {
            codigo: 'LEAD_TIME_INVALIDO',
            mensaje: 'El campo "lead_time_dias" debe ser un número entero mayor a 0.'
          }
        });
      }
    }

    if (demanda_promedio_diaria !== undefined) {
      const dp = Number(demanda_promedio_diaria);
      if (isNaN(dp) || dp < 0) {
        return res.status(400).json({
          success: false,
          error: {
            codigo: 'DEMANDA_PROMEDIO_INVALIDA',
            mensaje: 'La "demanda_promedio_diaria" debe ser un número mayor o igual a 0.'
          }
        });
      }
    }

    if (demanda_maxima_diaria !== undefined) {
      const dm = Number(demanda_maxima_diaria);
      if (isNaN(dm) || dm < 0) {
        return res.status(400).json({
          success: false,
          error: {
            codigo: 'DEMANDA_MAXIMA_INVALIDA',
            mensaje: 'La "demanda_maxima_diaria" debe ser un número mayor o igual a 0.'
          }
        });
      }
    }

    const nuevoMaterial = await materialesService.createMaterial(req.body);

    return res.status(201).json({
      success: true,
      mensaje: 'Material registrado exitosamente en el catálogo oficial de Constructora Del Valle S.A.',
      data: nuevoMaterial
    });
  } catch (error) {
    next(error);
  }
};

const updateMaterial = async (req, res, next) => {
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

    const materialActualizado = await materialesService.updateMaterial(materialId, req.body);

    if (!materialActualizado) {
      return res.status(404).json({
        success: false,
        error: {
          codigo: 'MATERIAL_NO_ENCONTRADO',
          mensaje: `No se encontró ningún material con el ID ${id} para actualizar.`
        }
      });
    }

    return res.status(200).json({
      success: true,
      mensaje: 'Material actualizado exitosamente.',
      data: materialActualizado
    });
  } catch (error) {
    next(error);
  }
};

const deleteMaterial = async (req, res, next) => {
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

    const eliminado = await materialesService.deleteMaterial(materialId);

    if (!eliminado) {
      return res.status(404).json({
        success: false,
        error: {
          codigo: 'MATERIAL_NO_ENCONTRADO',
          mensaje: `No se encontró ningún material con el ID ${id} para eliminar.`
        }
      });
    }

    return res.status(200).json({
      success: true,
      mensaje: `El material con ID ${id} ha sido eliminado exitosamente del catálogo.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMateriales,
  getMaterialById,
  getStockIndividual,
  getReordenMaterial,
  createMaterial,
  updateMaterial,
  deleteMaterial
};
