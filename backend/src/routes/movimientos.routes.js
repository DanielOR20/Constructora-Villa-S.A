const { Router } = require('express');
const {
  getMovimientos,
  getMovimientoById,
  createMovimiento,
  getStockPorUbicacion
} = require('../controllers/movimientos.controller');

const router = Router();

/**
 * Rutas de Transacciones de Inventario
 */
router.get('/', getMovimientos);
router.get('/stock/ubicaciones', getStockPorUbicacion);
router.get('/:id', getMovimientoById);
router.post('/', createMovimiento);

module.exports = router;
