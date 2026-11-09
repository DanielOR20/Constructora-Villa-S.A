const { Router } = require('express');
const {
  getOrdenes,
  getOrdenById,
  getOrdenesDuplicadas
} = require('../controllers/ordenes.controller');

const router = Router();

/**
 * Rutas de Órdenes de Compra y Auditoría de Compras Duplicadas
 */
router.get('/duplicadas', getOrdenesDuplicadas);
router.get('/', getOrdenes);
router.get('/:id', getOrdenById);

module.exports = router;
