// Re-exportación para retrocompatibilidad con la nueva arquitectura en movimientos.service.js
const {
  getMovimientos,
  getMovimientoById,
  registrarMovimiento,
  registrarMovimientoTransaccional,
  getStockPorUbicacion
} = require('./movimientos.service');
const { getAllMateriales } = require('./materiales.service');

module.exports = {
  getMovimientos,
  getMovimientoById,
  registrarMovimiento,
  registrarMovimientoTransaccional,
  getStockPorBodega: getStockPorUbicacion,
  getStockPorUbicacion,
  getStockConsolidado: getAllMateriales
};
